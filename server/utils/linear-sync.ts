import { LinearClient } from '@linear/sdk'
import type { TaskStatus } from '~/types'

const DEFAULT_STATE_MAP: Record<TaskStatus, string> = {
  TRIAGE: 'triage',
  TODO: 'unstarted',
  IN_PROGRESS: 'started',
  DONE: 'completed',
}

function getStateMap(): Record<TaskStatus, string> {
  try {
    const db = useDB()
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('linearStateMap') as { value: string } | undefined
    if (row?.value) {
      return { ...DEFAULT_STATE_MAP, ...JSON.parse(row.value) }
    }
  } catch {
    // fallback to default
  }
  return DEFAULT_STATE_MAP
}

export async function syncTaskStatusToLinear(linearIssueId: string, taskStatus: TaskStatus): Promise<void> {
  const config = useRuntimeConfig()

  if (!config.linearApiKey || !linearIssueId) {
    return
  }

  try {
    const stateMap = getStateMap()
    const client = new LinearClient({ apiKey: config.linearApiKey })
    const issue = await client.issue(linearIssueId)
    const team = await issue.team

    if (!team) return

    const states = await team.states()
    const targetType = stateMap[taskStatus]
    const targetState = states.nodes.find((s: any) => s.type === targetType)

    if (!targetState) return

    await client.updateIssue(linearIssueId, { stateId: targetState.id })
  } catch (error) {
    console.error(`[linear-sync] Failed to sync status for issue ${linearIssueId}:`, error)
  }
}
