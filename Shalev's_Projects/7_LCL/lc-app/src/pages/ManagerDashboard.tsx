import { useEffect, useRef, useState } from 'react'
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import type { UserProfile, Instance } from '../types'
import { Activity, Users, LogOut, Clock, Bell, BellOff } from 'lucide-react'
import { requestNotificationPermission, sendLocalNotification } from '../hooks/useNotifications'

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}ש׳`
  if (diff < 3600) return `${Math.floor(diff / 60)}ד׳`
  return `${Math.floor(diff / 3600)}ש׳`
}

const STEP_TYPE_LABELS: Record<string, string> = {
  checkbox: 'סימון',
  text_input: 'טקסט',
  photo: 'תמונה',
}

export function ManagerDashboard() {
  const { profile } = useAuth()
  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([])
  const [activeInstances, setActiveInstances] = useState<Instance[]>([])
  const [notifEnabled, setNotifEnabled] = useState(Notification.permission === 'granted')
  const [recentActions, setRecentActions] = useState<{ id: string; text: string; time: Date }[]>([])
  const isFirstLoad = useRef(true)

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotifEnabled(granted)
  }

  useEffect(() => {
    // Live active officers
    const usersUnsub = onSnapshot(
      query(collection(db, 'users'), where('isActiveShift', '==', true)),
      (snap) => {
        setActiveUsers(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            lastActive: d.data().lastActive?.toDate() ?? null,
          } as UserProfile))
        )
      }
    )

    // Live active instances
    const instUnsub = onSnapshot(
      query(
        collection(db, 'instances'),
        where('status', '==', 'in_progress'),
        orderBy('startedAt', 'desc')
      ),
      (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added' && !isFirstLoad.current) {
            const data = change.doc.data()
            sendLocalNotification(
              'פרוטוקול חדש התחיל',
              `${data.initiatedByName} התחיל: ${data.templateTitle}`
            )
          }
        })
        setActiveInstances(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            startedAt: d.data().startedAt?.toDate() ?? new Date(),
            completedAt: null,
          } as Instance))
        )
      }
    )

    // Live audit log — notify on every new action
    const auditUnsub = onSnapshot(
      query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(1)
      ),
      (snap) => {
        if (isFirstLoad.current) {
          isFirstLoad.current = false
          return
        }
        snap.docChanges().forEach((change) => {
          if (change.type !== 'added') return
          const data = change.doc.data()
          const stepType: string = data.stepType ?? ''
          const typeLabel = STEP_TYPE_LABELS[stepType] ?? 'פעולה'
          const ts: Date = data.timestamp?.toDate() ?? new Date()

          const text = `פעולה חדשה בוצעה — ${typeLabel}`

          setRecentActions((prev) => [
            { id: change.doc.id, text, time: ts },
            ...prev.slice(0, 9),
          ])

          sendLocalNotification('פרוטוקולים — פעולה חדשה', text)
        })
      }
    )

    return () => {
      usersUnsub()
      instUnsub()
      auditUnsub()
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-bold">מרכז שליטה</h1>
          <p className="text-slate-400 text-sm">{profile?.fullName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={notifEnabled ? undefined : enableNotifications}
            className={`w-11 h-11 flex items-center justify-center rounded-xl ${
              notifEnabled ? 'bg-green-900/40 text-green-400' : 'bg-slate-800 text-slate-400'
            }`}
            title={notifEnabled ? 'התראות פעילות' : 'הפעל התראות'}
          >
            {notifEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => signOut(auth)}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4">
          <Users className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-3xl font-bold text-white">{activeUsers.length}</p>
          <p className="text-slate-400 text-sm">קצינים פעילים</p>
        </div>
        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4">
          <Activity className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-3xl font-bold text-white">{activeInstances.length}</p>
          <p className="text-slate-400 text-sm">פרוטוקולים פעילים</p>
        </div>
      </div>

      {/* Recent Actions Feed */}
      {recentActions.length > 0 && (
        <>
          <h2 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            פעולות אחרונות
          </h2>
          <div className="space-y-2 mb-6">
            {recentActions.map((a) => (
              <div
                key={a.id}
                className="rounded-xl bg-amber-900/20 border border-amber-900/40 px-4 py-3 flex items-center justify-between"
              >
                <p className="text-amber-200 text-sm">{a.text}</p>
                <span className="text-slate-500 text-xs">{timeAgo(a.time)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Active Officers */}
      <h2 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
        <Users className="w-4 h-4" />
        קצינים במשמרת
      </h2>
      {activeUsers.length === 0 ? (
        <p className="text-slate-500 text-sm mb-6">אין קצינים פעילים כרגע</p>
      ) : (
        <div className="space-y-2 mb-6">
          {activeUsers.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl bg-slate-800 border border-green-900 p-4 flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-white font-medium">{u.fullName}</p>
                {u.lastActive && (
                  <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    פעיל לפני {timeAgo(u.lastActive)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Instances */}
      <h2 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        פרוטוקולים בביצוע
      </h2>
      {activeInstances.length === 0 ? (
        <p className="text-slate-500 text-sm">אין פרוטוקולים פעילים</p>
      ) : (
        <div className="space-y-2">
          {activeInstances.map((inst) => (
            <div
              key={inst.id}
              className="rounded-2xl bg-slate-800 border border-amber-900/50 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-white font-medium">{inst.templateTitle}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{inst.initiatedByName}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-xs shrink-0">
                  <Clock className="w-3 h-3" />
                  {timeAgo(inst.startedAt)}
                </div>
              </div>
              <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
                <div className="h-full bg-amber-500 w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
