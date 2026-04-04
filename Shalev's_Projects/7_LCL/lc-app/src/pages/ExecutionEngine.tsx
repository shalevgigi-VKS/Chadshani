import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, getDocs, query,
  orderBy, updateDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { StepRenderer } from '../components/StepRenderer'
import type { Instance, TemplateStep } from '../types'
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react'

export function ExecutionEngine() {
  const { instanceId } = useParams<{ instanceId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [instance, setInstance] = useState<Instance | null>(null)
  const [steps, setSteps] = useState<TemplateStep[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [finishing, setFinishing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!instanceId) return

    const load = async () => {
      const instSnap = await getDoc(doc(db, 'instances', instanceId))
      if (!instSnap.exists()) return
      const inst = { id: instSnap.id, ...instSnap.data() } as Instance
      setInstance(inst)

      const stepsSnap = await getDocs(
        query(
          collection(db, 'templates', inst.templateId, 'steps'),
          orderBy('stepOrder')
        )
      )
      setSteps(stepsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as TemplateStep)))
      setLoading(false)
    }

    load()
  }, [instanceId])

  const markCompleted = (stepId: string) => {
    setCompleted((prev) => new Set(prev).add(stepId))
  }

  const allRequiredDone = steps
    .filter((s) => s.isRequired)
    .every((s) => completed.has(s.id))

  const finishInstance = async () => {
    if (!instanceId || !allRequiredDone) return
    setFinishing(true)
    await updateDoc(doc(db, 'instances', instanceId), {
      status: 'completed',
      completedAt: serverTimestamp(),
    })
    navigate('/shift')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900" dir="rtl">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/shift')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold truncate">{instance?.templateTitle}</h1>
          <p className="text-slate-400 text-xs">
            {completed.size}/{steps.length} שלבים הושלמו
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 pb-32">
        {steps.map((step) => (
          <StepRenderer
            key={step.id}
            step={step}
            instanceId={instanceId!}
            userId={profile!.id}
            onCompleted={markCompleted}
            isCompleted={completed.has(step.id)}
          />
        ))}
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800">
        <button
          onClick={finishInstance}
          disabled={!allRequiredDone || finishing}
          className="w-full h-14 rounded-2xl bg-green-600 active:bg-green-700 text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {finishing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <CheckCircle className="w-6 h-6" />
          )}
          סיים פרוטוקול
        </button>
        {!allRequiredDone && (
          <p className="text-center text-red-400 text-xs mt-2">
            יש להשלים את כל השדות המסומנים כחובה
          </p>
        )}
      </div>
    </div>
  )
}
