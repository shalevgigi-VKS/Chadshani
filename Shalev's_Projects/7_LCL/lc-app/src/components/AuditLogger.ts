import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

interface LogEntry {
  instanceId: string
  stepId: string
  executedBy: string
  value: string | boolean
}

async function getGpsCoords(): Promise<{ lat: number | null; lng: number | null }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: null, lng: null })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 4000 }
    )
  })
}

export async function logAction(entry: LogEntry): Promise<void> {
  const { lat, lng } = await getGpsCoords()
  await addDoc(collection(db, 'auditLogs'), {
    instanceId: entry.instanceId,
    stepId: entry.stepId,
    executedBy: entry.executedBy,
    value: entry.value,
    timestamp: serverTimestamp(),
    locationLat: lat,
    locationLng: lng,
  })
}
