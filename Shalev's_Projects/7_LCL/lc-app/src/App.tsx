import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { ShiftDashboard } from './pages/ShiftDashboard'
import { ExecutionEngine } from './pages/ExecutionEngine'
import { AdminTemplates } from './pages/AdminTemplates'
import { TemplateBuilder } from './pages/TemplateBuilder'
import { ManagerDashboard } from './pages/ManagerDashboard'
import { Loader2 } from 'lucide-react'

function RoleRouter() {
  const { firebaseUser, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (!firebaseUser) return <Navigate to="/login" replace />

  if (!profile) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <p className="text-slate-400 text-sm">אין הרשאות — פנה למנהל המערכת</p>
    </div>
  )

  if (profile.role === 'admin') return <Navigate to="/admin/templates" replace />
  if (profile.role === 'manager') return <Navigate to="/manager" replace />
  return <Navigate to="/shift" replace />
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth()
  if (loading) return null
  if (!firebaseUser) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RoleRouter />} />

      <Route path="/shift" element={<RequireAuth><ShiftDashboard /></RequireAuth>} />
      <Route path="/shift/:instanceId" element={<RequireAuth><ExecutionEngine /></RequireAuth>} />

      <Route path="/admin/templates" element={<RequireAuth><AdminTemplates /></RequireAuth>} />
      <Route path="/admin/templates/:templateId" element={<RequireAuth><TemplateBuilder /></RequireAuth>} />

      <Route path="/manager" element={<RequireAuth><ManagerDashboard /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
