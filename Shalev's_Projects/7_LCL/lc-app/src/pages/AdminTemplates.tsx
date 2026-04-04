import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { Template } from '../types'
import { Plus, Trash2, Edit, ToggleLeft, ToggleRight, Loader2, LogOut } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

export function AdminTemplates() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<Template[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadTemplates = async () => {
    const snap = await getDocs(collection(db, 'templates'))
    setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Template)))
    setLoading(false)
  }

  useEffect(() => { loadTemplates() }, [])

  const addTemplate = async () => {
    if (!newTitle.trim() || !profile) return
    setAdding(true)
    await addDoc(collection(db, 'templates'), {
      title: newTitle.trim(),
      description: newDesc.trim(),
      createdBy: profile.id,
      isPublished: false,
      createdAt: serverTimestamp(),
    })
    setNewTitle('')
    setNewDesc('')
    await loadTemplates()
    setAdding(false)
  }

  const togglePublish = async (t: Template) => {
    await updateDoc(doc(db, 'templates', t.id), { isPublished: !t.isPublished })
    await loadTemplates()
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('למחוק את הפרוטוקול?')) return
    await deleteDoc(doc(db, 'templates', id))
    await loadTemplates()
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-bold">ניהול פרוטוקולים</h1>
          <p className="text-slate-400 text-sm">מנהל: {profile?.fullName}</p>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Add new template */}
      <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 mb-6">
        <h2 className="text-white font-semibold mb-3">פרוטוקול חדש</h2>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="שם הפרוטוקול..."
          className="w-full h-11 rounded-xl bg-slate-700 border border-slate-600 text-white px-4 mb-2 outline-none focus:border-blue-500 placeholder-slate-400"
        />
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="תיאור (אופציונלי)..."
          className="w-full h-11 rounded-xl bg-slate-700 border border-slate-600 text-white px-4 mb-3 outline-none focus:border-blue-500 placeholder-slate-400"
        />
        <button
          onClick={addTemplate}
          disabled={!newTitle.trim() || adding}
          className="w-full h-11 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          הוסף פרוטוקול
        </button>
      </div>

      {/* Templates list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <p className="text-slate-500 text-center py-8">אין פרוטוקולים עדיין</p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl bg-slate-800 border border-slate-700 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{t.title}</p>
                  {t.description && <p className="text-slate-400 text-sm mt-0.5">{t.description}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg shrink-0 ${
                  t.isPublished ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {t.isPublished ? 'פורסם' : 'טיוטה'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/templates/${t.id}`)}
                  className="flex-1 h-10 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center gap-1 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  ערוך שלבים
                </button>
                <button
                  onClick={() => togglePublish(t)}
                  className={`h-10 px-3 rounded-xl flex items-center gap-1 text-sm ${
                    t.isPublished ? 'bg-amber-900/50 text-amber-300' : 'bg-green-900/50 text-green-300'
                  }`}
                >
                  {t.isPublished ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  {t.isPublished ? 'בטל פרסום' : 'פרסם'}
                </button>
                <button
                  onClick={() => deleteTemplate(t.id)}
                  className="h-10 w-10 rounded-xl bg-red-900/40 text-red-400 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
