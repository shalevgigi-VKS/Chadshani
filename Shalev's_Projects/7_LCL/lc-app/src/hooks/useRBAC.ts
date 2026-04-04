import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../types'

export function useRBAC() {
  const { profile } = useAuth()
  const role = profile?.role ?? null

  return {
    role,
    isAdmin: role === 'admin',
    isManager: role === 'manager' || role === 'admin',
    isUser: role === 'user',
    can: (requiredRole: UserRole) => {
      if (requiredRole === 'user') return role !== null
      if (requiredRole === 'manager') return role === 'manager' || role === 'admin'
      if (requiredRole === 'admin') return role === 'admin'
      return false
    },
  }
}
