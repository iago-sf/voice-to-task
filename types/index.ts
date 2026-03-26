export type TaskStatus = 'TRIAGE' | 'TODO' | 'IN_PROGRESS' | 'DONE'

export interface Entry {
  id: number
  text: string
  linear_issue_id: string | null
  linear_issue_key: string | null
  linear_issue_url: string | null
  status: 'draft' | 'sent'
  task_status: TaskStatus
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  text: string
  task_status: TaskStatus
  assigned_to: string | null
  linear_issue_key: string | null
  linear_issue_url: string | null
  created_at: string
  updated_at: string
}

export type LinearStateType = 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled'

export interface AppConfig {
  teamId: string
  teamName: string
  assigneeId: string
  assigneeName: string
  language: string
  sttEngine: 'browser' | 'groq' | 'zai'
  groqModel: string
  zaiModel: string
  autoMode: boolean
  activeContextIds: number[]
  uiLanguage: 'en' | 'es'
  theme: 'system' | 'light' | 'dark'
  audioDeviceId: string
  linearStateMap: Record<TaskStatus, LinearStateType>
  lastSendAction?: 'linear' | 'copy' | 'save'
}

export interface Context {
  id: number
  name: string
  content: string
  created_at: string
  updated_at: string
}

export interface LinearTeam {
  id: string
  name: string
  key: string
}

export interface LinearUser {
  id: string
  name: string
  email: string
}

export interface Toast {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
  link?: { url: string; label: string }
  duration?: number
}
