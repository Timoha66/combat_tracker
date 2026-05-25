import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mapDb } from '../data/mapDb'

export const useMapStore = create(
  persist(
    (set, get) => ({
      pins:       [],
      showPins:   true,
      tokenX:     0.35,
      tokenY:     0.25,

      async loadPins() {
        const pins = await mapDb.pins.toArray()
        set({ pins })
      },

      async addPin(data) {
        const id = await mapDb.pins.add({ ...data, createdAt: new Date() })
        const pin = await mapDb.pins.get(id)
        set(s => ({ pins: [...s.pins, pin] }))
        return pin
      },

      async updatePin(id, data) {
        await mapDb.pins.update(id, data)
        const updated = await mapDb.pins.get(id)
        set(s => ({ pins: s.pins.map(p => p.id === id ? updated : p) }))
      },

      async deletePin(id) {
        await mapDb.pins.delete(id)
        set(s => ({ pins: s.pins.filter(p => p.id !== id) }))
      },

      setTokenPos(x, y) { set({ tokenX: x, tokenY: y }) },
      togglePins()       { set(s => ({ showPins: !s.showPins })) },
    }),
    {
      name: 'dm-map',
      partialize: s => ({ tokenX: s.tokenX, tokenY: s.tokenY, showPins: s.showPins }),
    }
  )
)
