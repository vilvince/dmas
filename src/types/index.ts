export type UserRole = 'super_admin' | 'office_head' | 'client'

export type DocumentStatus = 
  | 'pending'
  | 'approved'
  | 'denied'
  | 'recommended_approval'
  | 'released'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  phone?: string
  role: UserRole
  department_id: string
  created_at: string
}

export interface Document {
  id: string
  title: string
  type: string
  status: DocumentStatus
  submitted_by: string
  department_id: string
  corresponding_office?: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  document_id: string
  message: string
  is_read: boolean
  created_at: string
}

export interface ActivityLog {
  id: string
  document_id: string
  performed_by: string
  action: string
  previous_status?: DocumentStatus
  new_status?: DocumentStatus
  created_at: string
}