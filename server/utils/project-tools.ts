import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, basename } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const ALWAYS_INCLUDE_DIRS = new Set(['.claude', '.github', '.cursor', '.codeium', '.cx'])
const ALWAYS_INCLUDE_FILES = new Set([
  'CONTEXT.md', 'claude.md', 'memory.md', '.cursorrules', 'AGENTS.md',
  'README.md', 'README.MD', 'readme.md', 'CLAUDE.md',
])

const MAX_FILE_SIZE = 50_000
const MAX_TREE_DEPTH = 4
const MAX_TREE_ENTRIES = 200

function isAllowed(name: string, isDir: boolean, alwaysInclude: boolean): boolean {
  if (alwaysInclude) return true
  if (name.startsWith('.') && !ALWAYS_INCLUDE_DIRS.has(name)) return false
  const skipDirs = new Set([
    'node_modules', '.git', '__pycache__', '.next', '.nuxt', '.output',
    'dist', 'build', '.turso', 'vendor', 'target', '.gradle', '.idea',
    'coverage', '.cache', '.vscode', 'Pods', '.DerivedData',
  ])
  if (isDir && skipDirs.has(name)) return false
  const skipExts = new Set([
    '.lock', '.map', '.pyc', '.pyo', '.exe', '.dll', '.so', '.dylib',
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.mp3', '.mp4',
    '.zip', '.tar', '.gz', '.rar', '.7z', '.woff', '.woff2', '.ttf', '.eot',
  ])
  if (!isDir) {
    for (const ext of skipExts) {
      if (name.endsWith(ext)) return false
    }
  }
  return true
}

async function readGitignore(rootPath: string): Promise<Set<string>> {
  const patterns = new Set<string>()
  try {
    const content = await readFile(join(rootPath, '.gitignore'), 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      patterns.add(trimmed)
    }
  } catch {}
  return patterns
}

function matchesGitignore(name: string, patterns: Set<string>): boolean {
  for (const pattern of patterns) {
    if (pattern === name || pattern === `/${name}`) return true
    if (pattern.endsWith('/') && pattern.slice(0, -1) === name) return true
    if (pattern.startsWith('*.') && name.endsWith(pattern.slice(1))) return true
  }
  return false
}

export async function toolListFiles(
  projectPath: string,
  subPath: string = '',
  maxDepth: number = MAX_TREE_DEPTH,
): Promise<string> {
  const targetPath = join(projectPath, subPath)

  try {
    const realProject = await stat(projectPath)
    if (!realProject.isDirectory()) return 'Error: project path is not a directory'
  } catch {
    return 'Error: project path does not exist'
  }

  try {
    const gitignore = await readGitignore(projectPath)
    const entries: string[] = []
    let count = 0

    async function walk(dir: string, depth: number, prefix: string) {
      if (depth > maxDepth || count > MAX_TREE_ENTRIES) return
      let items
      try {
        items = await readdir(dir, { withFileTypes: true })
      } catch { return }

      items.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1
        if (!a.isDirectory() && b.isDirectory()) return 1
        return a.name.localeCompare(b.name)
      })

      for (const item of items) {
        if (count > MAX_TREE_ENTRIES) break
        const alwaysInclude = ALWAYS_INCLUDE_DIRS.has(item.name) || ALWAYS_INCLUDE_FILES.has(item.name)
        if (!isAllowed(item.name, item.isDirectory(), alwaysInclude)) continue
        if (!alwaysInclude && matchesGitignore(item.name, gitignore)) continue

        const rel = relative(projectPath, join(dir, item.name))
        if (item.isDirectory()) {
          entries.push(`${prefix}${item.name}/`)
          count++
          await walk(join(dir, item.name), depth + 1, `${prefix}  `)
        } else {
          entries.push(`${prefix}${item.name}`)
          count++
        }
      }
    }

    await walk(targetPath, 0, '')
    return entries.length > 0 ? entries.join('\n') : '(empty directory)'
  } catch (err: any) {
    return `Error: ${err.message}`
  }
}

export async function toolReadFile(
  projectPath: string,
  filePath: string,
  startLine?: number,
  endLine?: number,
): Promise<string> {
  const fullPath = join(projectPath, filePath)
  const resolved = fullPath.startsWith(projectPath) ? fullPath : join(projectPath, filePath)

  try {
    const s = await stat(resolved)
    let content: string
    if (s.size > MAX_FILE_SIZE) {
      content = (await readFile(resolved, 'utf-8')).slice(0, MAX_FILE_SIZE)
    } else {
      content = await readFile(resolved, 'utf-8')
    }

    if (startLine || endLine) {
      const lines = content.split('\n')
      const start = Math.max(1, startLine || 1) - 1
      const end = Math.min(lines.length, endLine || lines.length)
      return lines.slice(start, end).join('\n')
    }

    if (s.size > MAX_FILE_SIZE) {
      return content + '\n\n... (truncated, file is too large)'
    }
    return content
  } catch (err: any) {
    return `Error reading file: ${err.message}`
  }
}

export async function toolGitLog(projectPath: string, count: number = 15): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', [
      'log', `--max-count=${count}`, '--pretty=format:%h %s (%cr) <%an>', '--no-color',
    ], { cwd: projectPath, timeout: 10000 })
    return stdout || '(no commits)'
  } catch (err: any) {
    return `Error: ${err.message}`
  }
}

export async function toolGitDiff(projectPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', ['diff', '--stat', '--no-color'], {
      cwd: projectPath, timeout: 10000,
    })
    return stdout || '(no uncommitted changes)'
  } catch (err: any) {
    return `Error: ${err.message}`
  }
}

export async function toolGitBranch(projectPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', ['branch', '--show-current'], {
      cwd: projectPath, timeout: 10000,
    })
    return stdout.trim() || '(detached HEAD)'
  } catch (err: any) {
    return `Error: ${err.message}`
  }
}

export async function toolSearchFiles(
  projectPath: string,
  query: string,
  filePattern?: string,
  caseInsensitive: boolean = true,
): Promise<string> {
  try {
    const grepArgs = ['-rn', '--max-count=5']
    if (caseInsensitive) grepArgs.push('-i')
    if (filePattern) {
      grepArgs.push('--include', filePattern)
    } else {
      grepArgs.push('--include=*.{ts,tsx,js,jsx,vue,py,rs,go,java,md,json,yaml,yml,toml,css,html,sh,sql}')
    }
    grepArgs.push('-E', query, projectPath)

    const { stdout } = await execFileAsync('grep', grepArgs, {
      cwd: projectPath, timeout: 15000, maxBuffer: 500 * 1024,
    })
    const lines = stdout.split('\n').filter(Boolean).slice(0, 80)
    return lines.join('\n') || '(no matches found)'
  } catch {
    return '(no matches found)'
  }
}

export async function discoverContextFiles(projectPath: string): Promise<Record<string, string>> {
  const results: Record<string, string> = {}
  const candidates = [
    'CONTEXT.md', 'claude.md', 'CLAUDE.md', 'memory.md', 'AGENTS.md',
    '.cursorrules', 'README.md', '.github/copilot-instructions.md',
    '.claude/memory.md', '.claude/instructions.md',
  ]

  for (const file of candidates) {
    try {
      const content = await readFile(join(projectPath, file), 'utf-8')
      if (content.trim()) {
        results[file] = content.slice(0, 10000)
      }
    } catch {}
  }

  return results
}


export async function toolGrepCode(projectPath: string, pattern: string, glob?: string): Promise<string> {
  try {
    const args = ['-rn', '--max-count=10', '-E', pattern, projectPath]
    if (glob) {
      args.splice(0, 0, '--include', glob)
    } else {
      args.splice(0, 0, '--include', '*.{ts,tsx,js,jsx,vue,py,rs,go,java,css,html,sh}')
    }
    const { stdout } = await execFileAsync('grep', args, {
      cwd: projectPath, timeout: 15000, maxBuffer: 500 * 1024,
    })
    const lines = stdout.split('\n').filter(Boolean).slice(0, 60)
    return lines.join('\n') || '(no matches found)'
  } catch {
    return '(no matches found)'
  }
}

export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'list_files',
      description: 'List files and directories in a project path. Use max_depth=1 for a quick overview before diving deeper. Respects .gitignore but always includes .claude/, .github/, .cursor/ and key config files.',
      parameters: {
        type: 'object' as const,
        properties: {
          path: {
            type: 'string' as const,
            description: 'Subdirectory path relative to the project root. Use empty string or "." for root.',
          },
          max_depth: {
            type: 'number' as const,
            description: 'Maximum directory depth to traverse (default 4, use 1-2 for quick overview).',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'read_file',
      description: 'Read file contents. Use start_line/end_line to read specific sections instead of the whole file — this saves tokens. First use search_files to find relevant line numbers, then read only the needed range.',
      parameters: {
        type: 'object' as const,
        properties: {
          path: {
            type: 'string' as const,
            description: 'File path relative to the project root.',
          },
          start_line: {
            type: 'number' as const,
            description: 'Start line number (1-based). Omit to read from the beginning.',
          },
          end_line: {
            type: 'number' as const,
            description: 'End line number inclusive (1-based). Omit to read to the end.',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'git_log',
      description: 'Show recent git commit history with author and relative date.',
      parameters: {
        type: 'object' as const,
        properties: {
          count: {
            type: 'number' as const,
            description: 'Number of recent commits to show (default 15).',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'git_diff',
      description: 'Show uncommitted changes (files modified, added, or deleted).',
      parameters: {
        type: 'object' as const,
        properties: {},
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'git_branch',
      description: 'Show the current git branch name.',
      parameters: {
        type: 'object' as const,
        properties: {},
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_files',
      description: 'Search for text or regex pattern across project files via grep -E. ALWAYS prefer this over reading multiple files. One search saves many read_file calls. Use file_pattern to narrow scope.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string' as const,
            description: 'Extended regex pattern to search for. Supports full ERE syntax: | for alternation, () for groups, \\b for word boundaries, etc.',
          },
          file_pattern: {
            type: 'string' as const,
            description: 'Glob to filter files, e.g. "*.vue", "*.ts", "*.{js,ts}". Defaults to common code files.',
          },
          case_insensitive: {
            type: 'boolean' as const,
            description: 'Case-insensitive search (default true).',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'grep_code',
      description: 'Fast targeted search for symbol definitions, references, or patterns in code. Use this BEFORE read_file to locate relevant code. Supports regex. Much more efficient than reading files blindly.',
      parameters: {
        type: 'object' as const,
        properties: {
          pattern: {
            type: 'string' as const,
            description: 'Regex pattern to search for. Examples: "class MyComponent", "export function handleAuth", "router\\.(get|post)"',
          },
          glob: {
            type: 'string' as const,
            description: 'File glob to search in. Defaults to all code files. Examples: "*.vue", "*.ts", "*.{js,jsx}"',
          },
        },
        required: ['pattern'],
      },
    },
  },
] as const

export type ToolName = typeof TOOL_DEFINITIONS[number]['function']['name']

export async function executeTool(
  toolName: ToolName,
  args: Record<string, any>,
  projectPath: string,
): Promise<string> {
  switch (toolName) {
    case 'list_files':
      return toolListFiles(projectPath, args.path || '', args.max_depth)
    case 'read_file':
      return toolReadFile(projectPath, args.path || '', args.start_line, args.end_line)
    case 'git_log':
      return toolGitLog(projectPath, args.count || 15)
    case 'git_diff':
      return toolGitDiff(projectPath)
    case 'git_branch':
      return toolGitBranch(projectPath)
    case 'search_files':
      return toolSearchFiles(projectPath, args.query || '', args.file_pattern, args.case_insensitive !== false)
    case 'grep_code':
      return toolGrepCode(projectPath, args.pattern || '', args.glob)
    default:
      return `Unknown tool: ${toolName}`
  }
}
