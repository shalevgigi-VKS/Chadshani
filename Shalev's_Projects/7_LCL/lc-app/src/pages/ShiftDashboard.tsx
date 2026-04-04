import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, addDoc, collection as col, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useShift } from '../hooks/useShift'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import type { Template } from '../types'
import { Power, LogOut, ClipboardList, Loader2 } from 'lucide-react'

export function ShiftDashboard() {
  const { profile } = useAuth()
  const { isActiveShift, toggleShift, loading: shiftLoading } = useShift()
  const [templates, setTemplates] = useState<Template[]>([])
  const [startingId, setStartingId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isActiveShift) return
    const q = query(collection(db, 'templates'), where('isPublished', '==', true))
    getDocs(q).then((snap) => {
      setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Template)))
    })
  }, [isActiveShift])

  const startInstance = async (template: Template) => {
    if (!profile) return
    setStartingId(template.id)
    const ref = await addDoc(col(db, 'instances'), {
      templateId: template.id,
      templateTitle: template.title,
      initiatedBy: profile.id,
      initiatedByName: profile.fullName,
      status: 'in_progress',
      startedAt: serverTimestamp(),
      completedAt: null,
    })
    navigate(`/shift/${ref.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-bold">שלום, {profile?.fullName}</h1>
          <p className="text-slate-400 text-sm">
            {isActiveShift ? 'משמרת פעילה' : 'מחוץ למשמרת'}
          </p>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 active:bg-slate-700"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Shift Toggle */}
      <button
        onClick={toggleShift}
        disabled={shiftLoading}
        className={`w-full h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 mb-6 transition-colors ${
          isActiveShift
            ? 'bg-red-700 active:bg-red-800 text-white'
            : 'bg-green-700 active:bg-green-800 text-white'
        } disabled:opacity-50`}
      >
        {shiftLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Power className="w-6 h-6" />
        )}
        {isActiveShift ? 'סיים משמרת' : 'התחל משמרת'}
      </button>

      {/* Templates */}
      {isActiveShift && (
        <>
          <h2 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            פרוטוקולים זמינים
          </h2>
          {templates.length === 0 ? (
            <p className="text-slate-500 text-center py-8">אין פרוטוקולים פעילים</p>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => startInstance(t)}
                  disabled={startingId === t.id}
                  className="w-full rounded-2xl bg-slate-800 border border-slate-700 p-5 text-right active:bg-slate-750 disabled:opacity-50 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-semibold">{t.title}</p>
                    {t.description && <p className="text-slate-400 text-sm mt-1">{t.description}</p>}
                  </div>
                  {startingId === t.id && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
