import { LinearClient } from '@linear/sdk'
import { ensureDB } from './db'
import type { TaskStatus } from '~/types'

const DEFAULT_STATE_MAP: Record<TaskStatus, string> = {
  TRIAGE: 'triage',
  TODO: 'unstarted',
  IN_PROGRESS: 'started',
  DONE: 'completed',
}

async function getStateMap(userEmail: string): Promise<Record<TaskStatus, string>> {
  try {
    const db = await ensureDB()
    const { rows } = await db.execute({
      sql: 'SELECT value FROM user_settings WHERE user_email = ? AND key = ?',
      args: [userEmail, 'linearStateMap'],
    })
    const row = rows[0] as unknown as { value: string } | undefined
    if (row?.value) {
      return { ...DEFAULT_STATE_MAP, ...JSON.parse(row.value) }
    }
  } catch {
    // fallback to default
  }
  return DEFAULT_STATE_MAP
}

export async function syncTaskStatusToLinear(linearApiKey: string, linearIssueId: string, taskStatus: TaskStatus, userEmail: string): Promise<void> {
  if (!linearApiKey || !linearIssueId) {
    return
  }

  try {
    const stateMap = await getStateMap(userEmail)
    const client = new LinearClient({ apiKey: linearApiKey })
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
