export interface Entry {
  id: number
  text: string
  linear_issue_id: string | null
  linear_issue_key: string | null
  linear_issue_url: string | null
  status: 'draft' | 'sent'
  created_at: string
  updated_at: string
}

export interface AppConfig {
  teamId: string
  teamName: string
  assigneeId: string
  assigneeName: string
  language: string
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
