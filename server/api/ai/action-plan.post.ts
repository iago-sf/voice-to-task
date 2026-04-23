import { ensureDB } from '~/server/utils/db'
import { streamGroq, streamZai, streamMinimax, callGroqWithTools, callZaiWithTools, callMinimaxWithTools, type ToolUseResponse, type ToolCall } from '~/server/utils/llm'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'
import { TOOL_DEFINITIONS, executeTool, discoverContextFiles, type ToolName } from '~/server/utils/project-tools'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const body = await readBody(event)

  if (!body.text || typeof body.text !== 'string') {
    throw createError({ statusCode: 400, message: 'text is required' })
  }

  const language = body.language || 'es'
  const model = body.model || 'openai/gpt-oss-120b'
  const engine = body.engine || 'groq'
  const contextIds: number[] = body.contextIds || []
  const customPrompt: string = body.customPrompt || ''
  const conversationSummary: string = body.conversationSummary || ''
  const projectContextIds: number[] = body.projectContextIds || []

  let contextBlock = ''
  if (contextIds.length > 0) {
    const db = await ensureDB()
    const placeholders = contextIds.map(() => '?').join(',')
    const { rows } = await db.execute({
      sql: `SELECT name, content FROM contexts WHERE id IN (${placeholders}) AND user_email = ?`,
      args: [...contextIds, userEmail],
    })

    if (rows.length > 0) {
      contextBlock = (rows as any[])
        .map(r => `--- Context: ${r.name} ---\n${r.content}`)
        .join('\n\n')
    }
  }

  const defaultBasePrompt = `You are a senior task planning assistant. Given a raw task description (often from voice transcription), produce a thorough, actionable plan.

Reply in the same language as the input. Use this exact format:

TITLE: <concise task title, max 100 chars, imperative form>

CONTEXT NEEDED:
Before writing the plan, assess whether the task description has enough detail. If information is missing or ambiguous, list specific questions for the developer. Examples of useful questions:
- Which files or modules should be touched?
- What is the expected behavior in edge case X?
- Are there existing patterns or utilities to reuse?
- What is the acceptance criteria?
- Should this be behind a feature flag?
If the task is fully clear, skip this section entirely.

PLAN:
- [ ] Step 1 — be specific: mention file paths, function names, API endpoints, or component names when possible
- [ ] Step 2 — each step should be independently verifiable
- [ ] Step 3 — include testing or validation steps when relevant
...

Rules for the plan:
- Be specific, not generic. Mention concrete files, functions, endpoints, or components when context allows it.
- Each step must be independently actionable — a developer should know exactly what to do without guessing.
- Include edge cases, error handling, or validation steps when relevant.
- If the task involves multiple areas (backend + frontend, or multiple modules), group steps logically.
- Between 4 and 12 steps. More complex tasks get more steps.
- When a step involves creating or modifying something, describe WHAT changes and WHY, not just "do it".

QUESTIONS:
If the task description lacks critical information, list 1-5 concrete questions for the developer here. Formulate them as specific, answerable questions — not vague requests for "more details". If the task is clear enough, write "None — task is clear."

GENERATED CONTEXT:
After completing the plan, generate a brief context document (2-10 lines of bullet points) summarizing the key domain knowledge, patterns, or decisions involved in this task. This context can be uploaded to the app and reused for future tasks in the same area. Write it in third person, as a reference document. Example format:
- Area: <area/module name>
- Key files: <list>
- Patterns used: <brief description>
- Dependencies: <libraries, APIs, services>
- Notes: <any non-obvious decisions or constraints>

If the task is too trivial to warrant a context, write "None."`

  const basePrompt = customPrompt && customPrompt !== '__DEFAULT__' ? customPrompt : defaultBasePrompt

  let systemPrompt = basePrompt

  if (contextBlock) {
    systemPrompt = `${basePrompt}

IMPORTANT — The user has provided context documents that define the project, its conventions, technologies, and constraints. These documents take PRIORITY over any generic assumptions. You MUST use them to:
- Frame the task title using the project's domain and terminology
- Define steps that align with the project's stack, tools, and workflows
- Follow any conventions or guidelines specified in the context (naming, testing, deployment, etc.)
- Reference specific technologies, libraries, or patterns mentioned in the context
- Skip QUESTIONS that are already answered by the context documents
- Enrich the GENERATED CONTEXT with knowledge from the provided context documents

Context documents:

${contextBlock}`
  }

  const messages: { role: string; content: string | null }[] = [
    { role: 'system', content: systemPrompt },
  ]

  if (conversationSummary) {
    messages.push({
      role: 'system',
      content: `CONVERSATION HISTORY SUMMARY (previous turns of this conversation):\n${conversationSummary}\n\nUse this summary to maintain context continuity. The user's new message below continues from this conversation.`,
    })
  }

  messages.push({ role: 'user', content: body.text })

  // ── SSE setup ──
  event.node.res.statusCode = 200
  event.node.res.setHeader('Content-Type', 'text/event-stream')
  event.node.res.setHeader('Cache-Control', 'no-cache')
  event.node.res.setHeader('Connection', 'keep-alive')
  event.node.res.setHeader('X-Accel-Buffering', 'no')
  event.node.res.flushHeaders()

  const send = (data: string) => {
    event.node.res.write(`data: ${data}\n\n`)
  }

  // ── Route: project context tool-use loop vs regular streaming ──
  const hasProjects = projectContextIds.length > 0 && process.env.NUXT_DESKTOP_MODE === 'true'

  if (hasProjects) {
    try {
      const db = await ensureDB()
      const placeholders = projectContextIds.map(() => '?').join(',')
      const { rows } = await db.execute({
        sql: `SELECT id, name, folder_path FROM project_contexts WHERE id IN (${placeholders}) AND user_email = ?`,
        args: [...projectContextIds, userEmail],
      })
      const projects = rows as unknown as { id: number; name: string; folder_path: string }[]

      if (projects.length === 0) {
        send(JSON.stringify({ error: 'No valid project contexts found' }))
        event.node.res.end()
        return
      }

      // Build project-aware system prompt
      let projectPrompt = systemPrompt

      projectPrompt += '\n\n' + `You have access to local project files via tools. The following projects are available:\n`
      for (const p of projects) {
        projectPrompt += `\n- Project "${p.name}" at path: ${p.folder_path}`
      }
      projectPrompt += `\n\nTOOL USAGE RULES:\n`
      projectPrompt += `- You have a LIMITED number of tool calls. Be efficient — aim for 5-8 tool calls total.\n`
      projectPrompt += `- Start with list_files to understand the project structure, then use search_files strategically to find relevant code.\n`
      projectPrompt += `- Only read_file for files that are clearly relevant to the user's request.\n`
      projectPrompt += `- Avoid repeating similar searches. If a search returns no results, try a different approach instead of slight variations.\n`
      projectPrompt += `- Always call git_branch and git_log once to understand the current state.\n`
      projectPrompt += `- After gathering context, immediately produce your final answer. Do NOT keep searching.\n`
      projectPrompt += `- Tool results may be truncated. Work with what you have.\n`
      projectPrompt += `\nThe tool paths are relative to the project root folder. Do NOT include the project folder path in tool arguments — use paths relative to the project root.`

      // Discover auto-context files
      for (const p of projects) {
        const contextFiles = await discoverContextFiles(p.folder_path)
        if (Object.keys(contextFiles).length > 0) {
          projectPrompt += `\n\n--- Auto-discovered context for "${p.name}" ---\n`
          for (const [file, content] of Object.entries(contextFiles)) {
            projectPrompt += `\n[${file}]:\n${content}\n`
          }
        }
      }

      messages[0] = { role: 'system', content: projectPrompt }

      // Get API key
      let apiKey: string
      let callWithTools: (apiKey: string, model: string, messages: { role: string; content: string | null }[], tools: any[]) => Promise<ToolUseResponse>

      if (engine === 'zai') {
        apiKey = await requireUserApiKey(event, 'zai_api_key')
        callWithTools = callZaiWithTools
      } else if (engine === 'minimax') {
        apiKey = await requireUserApiKey(event, 'minimax_api_key')
        callWithTools = callMinimaxWithTools
      } else {
        apiKey = await requireUserApiKey(event, 'groq_api_key')
        callWithTools = callGroqWithTools
      }

      const MAX_TOOL_CALLS = 25
      const toolMessages: any[] = [...messages]
      let totalUsage = { prompt: 0, completion: 0, total: 0 }
      let totalToolCalls = 0
      let accumulatedContent = ''

      function streamContent(text: string) {
        const chunkSize = 20
        for (let j = 0; j < text.length; j += chunkSize) {
          send(JSON.stringify({ chunk: text.slice(j, j + chunkSize) }))
        }
      }

      for (let iteration = 0; iteration < 20; iteration++) {
        const useTools = totalToolCalls < MAX_TOOL_CALLS
        const result = await callWithTools(
          apiKey, model, toolMessages,
          useTools ? [...TOOL_DEFINITIONS] : [],
        )

        if (result.usage) {
          totalUsage.prompt += result.usage.prompt
          totalUsage.completion += result.usage.completion
          totalUsage.total += result.usage.total
        }

        if (result.content) {
          accumulatedContent += result.content
        }

        if (result.toolCalls.length === 0 || !useTools) {
          if (accumulatedContent) {
            streamContent(accumulatedContent)
          }
          send(JSON.stringify({ usage: totalUsage }))
          break
        }

        totalToolCalls += result.toolCalls.length

        toolMessages.push({ role: 'assistant', content: result.content || null, tool_calls: result.toolCalls as any })

        for (const tc of result.toolCalls) {
          const toolName = tc.function.name as ToolName
          let args: Record<string, any> = {}
          try {
            args = JSON.parse(tc.function.arguments)
          } catch {
            args = {}
          }

          const project = projects[0]!
          const toolResult = await executeTool(toolName, args, project.folder_path)

          const shortResult = toolResult.length > 3000 ? toolResult.slice(0, 3000) + '\n... (truncated)' : toolResult
          send(JSON.stringify({ tool: { name: toolName, args, preview: shortResult.split('\n').slice(0, 5).join('\n') } }))

          toolMessages.push({
            role: 'tool' as any,
            content: toolResult.length > 8000 ? toolResult.slice(0, 8000) + '\n... (truncated)' : toolResult,
            tool_call_id: tc.id,
          } as any)
        }

        if (totalToolCalls >= MAX_TOOL_CALLS) {
          toolMessages.push({
            role: 'system' as any,
            content: 'You have reached the maximum number of tool calls. Now provide your final answer based on all the information gathered. Do not make any more tool calls.',
          })
        }
      }

      if (!accumulatedContent) {
        const forceResult = await callWithTools(apiKey, model, toolMessages, [])
        if (forceResult.content) {
          streamContent(forceResult.content)
          accumulatedContent = forceResult.content
        }
        if (forceResult.usage) {
          totalUsage.prompt += forceResult.usage.prompt
          totalUsage.completion += forceResult.usage.completion
          totalUsage.total += forceResult.usage.total
        }
        send(JSON.stringify({ usage: totalUsage }))
      }

      send('[DONE]')
    } catch (err: any) {
      send(JSON.stringify({ error: err.message || 'Tool-use error' }))
    } finally {
      event.node.res.end()
    }
    return
  }

  // ── Regular streaming (no project tools) ──
  let stream: AsyncGenerator<import('~/server/utils/llm').StreamChunk>
  if (engine === 'zai') {
    const apiKey = await requireUserApiKey(event, 'zai_api_key')
    stream = streamZai(apiKey, model, messages as any)
  } else if (engine === 'minimax') {
    const apiKey = await requireUserApiKey(event, 'minimax_api_key')
    stream = streamMinimax(apiKey, model, messages as any)
  } else {
    const apiKey = await requireUserApiKey(event, 'groq_api_key')
    stream = streamGroq(apiKey, model, messages as any)
  }

  try {
    for await (const chunk of stream) {
      if (chunk.type === 'content' && chunk.content) {
        send(JSON.stringify({ chunk: chunk.content }))
      } else if (chunk.type === 'usage' && chunk.usage) {
        send(JSON.stringify({ usage: chunk.usage }))
      }
    }
    send('[DONE]')
  } catch (err: any) {
    send(JSON.stringify({ error: err.message || 'Stream error' }))
  } finally {
    event.node.res.end()
  }
})
