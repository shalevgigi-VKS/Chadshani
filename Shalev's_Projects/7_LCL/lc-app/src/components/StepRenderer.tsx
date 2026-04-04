import { useState, useRef } from 'react'
import { logAction } from './AuditLogger'
import type { TemplateStep } from '../types'
import { CheckCircle, Camera, AlignRight, Loader2 } from 'lucide-react'

interface Props {
  step: TemplateStep
  instanceId: string
  userId: string
  onCompleted: (stepId: string) => void
  isCompleted: boolean
}

// Compress image to JPEG, max 800px, ~80KB — fits in Firestore doc (1MB limit)
function compressImage(file: File, maxPx = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export function StepRenderer({ step, instanceId, userId, onCompleted, isCompleted }: Props) {
  const [textValue, setTextValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCheckbox = async () => {
    if (isCompleted) return
    setLoading(true)
    await logAction({ instanceId, stepId: step.id, executedBy: userId, value: true })
    onCompleted(step.id)
    setLoading(false)
  }

  const handleText = async () => {
    if (!textValue.trim()) return
    setLoading(true)
    await logAction({ instanceId, stepId: step.id, executedBy: userId, value: textValue.trim() })
    onCompleted(step.id)
    setLoading(false)
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const base64 = await compressImage(file)
    setPhotoPreview(base64)
    await logAction({ instanceId, stepId: step.id, executedBy: userId, value: base64 })
    onCompleted(step.id)
    setLoading(false)
  }

  const baseCard = `rounded-2xl p-5 mb-4 border transition-all ${
    isCompleted
      ? 'border-green-600 bg-green-950/40 opacity-70'
      : 'border-slate-700 bg-slate-800'
  }`

  return (
    <div className={baseCard}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-slate-400 text-sm font-bold w-6 shrink-0 pt-0.5">
          {step.stepOrder}.
        </span>
        <p className="text-white text-base leading-relaxed flex-1">{step.content}</p>
        {step.isRequired && !isCompleted && (
          <span className="text-xs text-red-400 shrink-0 pt-0.5">חובה</span>
        )}
        {isCompleted && <CheckCircle className="text-green-500 shrink-0 w-5 h-5" />}
      </div>

      {isCompleted && photoPreview && (
        <img src={photoPreview} alt="תמונה" className="rounded-xl w-full max-h-40 object-cover mb-2" />
      )}

      {!isCompleted && (
        <>
          {step.stepType === 'checkbox' && (
            <button
              onClick={handleCheckbox}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-blue-600 active:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              אשר ביצוע
            </button>
          )}

          {step.stepType === 'text_input' && (
            <div className="flex gap-2">
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="הזן ערך..."
                className="flex-1 h-12 rounded-xl bg-slate-700 border border-slate-600 text-white px-4 placeholder-slate-400 outline-none focus:border-blue-500"
                dir="rtl"
              />
              <button
                onClick={handleText}
                disabled={loading || !textValue.trim()}
                className="h-12 px-5 rounded-xl bg-blue-600 active:bg-blue-700 text-white font-semibold flex items-center gap-1 disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlignRight className="w-4 h-4" />}
                שמור
              </button>
            </div>
          )}

          {step.stepType === 'photo' && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhoto}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-amber-600 active:bg-amber-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                צלם תמונה
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
