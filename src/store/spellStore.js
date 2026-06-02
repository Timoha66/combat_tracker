import { create } from 'zustand'
import { spellDb } from '../data/spellDb'

export const useSpellStore = create((set, get) => ({
  spells:  [],
  loading: false,

  async loadAll() {
    set({ loading: true })
    const spells = await spellDb.spells.toArray()
    set({ spells, loading: false })
  },

  async addSpell(data) {
    const id    = await spellDb.spells.add({ ...data, createdAt: new Date() })
    const spell = await spellDb.spells.get(id)
    set(s => ({ spells: [...s.spells, spell] }))
    return spell
  },

  async updateSpell(id, data) {
    await spellDb.spells.update(id, { ...data, updatedAt: new Date() })
    const updated = await spellDb.spells.get(id)
    set(s => ({ spells: s.spells.map(x => x.id === id ? updated : x) }))
    return updated
  },

  async deleteSpell(id) {
    await spellDb.spells.delete(id)
    set(s => ({ spells: s.spells.filter(x => x.id !== id) }))
  },

  async exportJSON() {
    const all  = await spellDb.spells.toArray()
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `dm-spells-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  async clearAll() {
    if (!confirm('Удалить все заклинания? Это действие нельзя отменить.')) return
    await spellDb.spells.clear()
    set({ spells: [] })
  },

  async importJSON(file) {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('Неверный формат файла')
    const toImport = data.map(({ id, ...rest }) => rest)
    await spellDb.spells.bulkAdd(toImport)
    await get().loadAll()
  },
}))
