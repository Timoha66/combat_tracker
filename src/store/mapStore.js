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
      transformX:     0,
      transformY:     20,
      transformScale: 0.35,

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
      setMapTransform(x, y, scale) { set({ transformX: x, transformY: y, transformScale: scale }) },
      togglePins()       { set(s => ({ showPins: !s.showPins })) },

      async exportMap() {
        const pins = await mapDb.pins.toArray()
        const { tokenX, tokenY } = get()
        const data = { pins, tokenX, tokenY, exportedAt: new Date().toISOString() }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `dm-map-${new Date().toISOString().slice(0,10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      },

      async importMap(file) {
        const text = await file.text()
        const data = JSON.parse(text)
        if (!Array.isArray(data.pins)) throw new Error('Неверный формат файла')
        await mapDb.pins.clear()
        const toImport = data.pins.map(({ id, ...rest }) => rest)
        await mapDb.pins.bulkAdd(toImport)
        set({ tokenX: data.tokenX ?? 0.35, tokenY: data.tokenY ?? 0.25 })
        await get().loadPins()
      },
    }),
    {
      name: 'dm-map',
      partialize: s => ({ tokenX: s.tokenX, tokenY: s.tokenY, showPins: s.showPins, transformX: s.transformX, transformY: s.transformY, transformScale: s.transformScale }),
    }
  )
)
