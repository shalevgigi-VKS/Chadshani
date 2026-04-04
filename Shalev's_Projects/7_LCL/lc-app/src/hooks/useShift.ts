import { useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function useShift() {
  const { firebaseUser, profile } = useAuth()
  const [loading, setLoading] = useState(false)

  const toggleShift = async () => {
    if (!firebaseUser) return
    setLoading(true)
    try {
      const newState = !profile?.isActiveShift
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        isActiveShift: newState,
        lastActive: serverTimestamp(),
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    isActiveShift: profile?.isActiveShift ?? false,
    toggleShift,
    loading,
  }
}
