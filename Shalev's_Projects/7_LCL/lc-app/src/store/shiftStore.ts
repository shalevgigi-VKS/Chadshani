import { create } from 'zustand'

interface ShiftStore {
  activeInstanceId: string | null
  setActiveInstance: (id: string | null) => void
}

export const useShiftStore = create<ShiftStore>((set) => ({
  activeInstanceId: null,
  setActiveInstance: (id) => set({ activeInstanceId: id }),
}))
