import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, getDocs, addDoc, deleteDoc,
  query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Template, TemplateStep, StepType } from '../types'
import { ArrowRight, Plus, Trash2, Loader2, CheckSquare, Type, Camera } from 'lucide-react'

const STEP_TYPES: { type: StepType; label: string; icon: React.ReactNode }[] = [
  { type: 'checkbox', label: 'סימון', icon: <CheckSquare className="w-4 h-4" /> },
  { type: 'text_input', label: 'טקסט', icon: <Type className="w-4 h-4" /> },
  { type: 'photo', label: 'תמונה', icon: <Camera className="w-4 h-4" /> },
]

export function TemplateBuilder() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()

  const [template, setTemplate] = useState<Template | null>(null)
  const [steps, setSteps] = useState<TemplateStep[]>([])
  const [content, setContent] = useState('')
  const [stepType, setStepType] = useState<StepType>('checkbox')
  const [isRequired, setIsRequired] = useState(false)
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!templateId) return
    const tSnap = await getDoc(doc(db, 'templates', templateId))
    if (!tSnap.exists()) return
    setTemplate({ id: tSnap.id, ...tSnap.data() } as Template)

    const stepsSnap = await getDocs(
      query(collection(db, 'templates', templateId, 'steps'), orderBy('stepOrder'))
    )
    setSteps(stepsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as TemplateStep)))
    setLoading(false)
  }

  useEffect(() => { loadData() }, [templateId])

  const addStep = async () => {
    if (!content.trim() || !templateId) return
    setAdding(true)
    await addDoc(collection(db, 'templates', templateId, 'steps'), {
      templateId,
      stepOrder: steps.length + 1,
      content: content.trim(),
      stepType,
      isRequired,
    })
    setContent('')
    setIsRequired(false)
    await loadData()
    setAdding(false)
  }

  const deleteStep = async (stepId: string) => {
    if (!templateId) return
    await deleteDoc(doc(db, 'templates', templateId, 'steps', stepId))
    await loadData()
  }

  const stepTypeIcon = (type: StepType) => {
    switch (type) {
      case 'checkbox': return <CheckSquare className="w-4 h-4 text-blue-400" />
      case 'text_input': return <Type className="w-4 h-4 text-amber-400" />
      case 'photo': return <Camera className="w-4 h-4 text-purple-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-32" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/templates')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white font-bold">{template?.title}</h1>
          <p className="text-slate-400 text-sm">{steps.length} שלבים</p>
        </div>
      </div>

      {/* Add step */}
      <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 mb-6">
        <h2 className="text-white font-semibold mb-3">הוסף שלב</h2>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="תוכן השלב..."
          rows={2}
          className="w-full rounded-xl bg-slate-700 border border-slate-600 text-white px-4 py-3 mb-3 outline-none focus:border-blue-500 placeholder-slate-400 resize-none"
        />

        {/* Step type */}
        <div className="flex gap-2 mb-3">
          {STEP_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => setStepType(type)}
              className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium ${
                stepType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Required toggle */}
        <button
          onClick={() => setIsRequired(!isRequired)}
          className={`w-full h-10 rounded-xl mb-3 text-sm font-medium ${
            isRequired
              ? 'bg-red-900/60 border border-red-700 text-red-300'
              : 'bg-slate-700 text-slate-400'
          }`}
        >
          {isRequired ? '⚠️ שדה חובה — פעיל' : 'שדה חובה (לא פעיל)'}
        </button>

        <button
          onClick={addStep}
          disabled={!content.trim() || adding}
          className="w-full h-11 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          הוסף שלב
        </button>
      </div>

      {/* Steps list */}
      {steps.length === 0 ? (
        <p className="text-slate-500 text-center py-8">אין שלבים עדיין</p>
      ) : (
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className="rounded-2xl bg-slate-800 border border-slate-700 p-4 flex items-start gap-3"
            >
              <span className="text-slate-500 text-sm font-bold w-5 shrink-0 pt-0.5">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{step.content}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {stepTypeIcon(step.stepType)}
                  <span className="text-slate-400 text-xs">
                    {STEP_TYPES.find((s) => s.type === step.stepType)?.label}
                  </span>
                  {step.isRequired && (
                    <span className="text-red-400 text-xs">• חובה</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteStep(step.id)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-900/30 text-red-400 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
