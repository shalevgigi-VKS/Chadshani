// ============================================================
// types.ts — Shared TypeScript types across the app
// ============================================================

export type UserRole = 'admin' | 'manager' | 'user'
export type StepType = 'checkbox' | 'text_input' | 'photo'
export type InstanceStatus = 'in_progress' | 'completed'

export interface UserProfile {
  id: string
  fullName: string
  role: UserRole
  isActiveShift: boolean
  lastActive: Date | null
}

export interface TemplateStep {
  id: string
  templateId: string
  stepOrder: number
  content: string
  stepType: StepType
  isRequired: boolean
}

export interface Template {
  id: string
  title: string
  description: string
  createdBy: string
  isPublished: boolean
  createdAt: Date
}

export interface Instance {
  id: string
  templateId: string
  templateTitle: string
  initiatedBy: string
  initiatedByName: string
  status: InstanceStatus
  startedAt: Date
  completedAt: Date | null
}

export interface AuditLog {
  id: string
  instanceId: string
  stepId: string
  executedBy: string
  value: string | boolean
  timestamp: Date
  locationLat: number | null
  locationLng: number | null
}
