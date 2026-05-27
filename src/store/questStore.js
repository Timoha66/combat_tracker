import { create } from 'zustand'
import { questDb } from '../data/questDb'

export const useQuestStore = create((set, get) => ({
  quests:  [],
  loading: false,

  async loadAll() {
    set({ loading: true })
    const quests = await questDb.quests.toArray()
    set({ quests, loading: false })
  },

  async addQuest(data) {
    const id    = await questDb.quests.add({ ...data, createdAt: new Date() })
    const quest = await questDb.quests.get(id)
    set(s => ({ quests: [...s.quests, quest] }))
    return quest
  },

  async updateQuest(id, data) {
    await questDb.quests.update(id, { ...data, updatedAt: new Date() })
    const updated = await questDb.quests.get(id)
    set(s => ({ quests: s.quests.map(q => q.id === id ? updated : q) }))
    return updated
  },

  async deleteQuest(id) {
    await questDb.quests.delete(id)
    set(s => ({ quests: s.quests.filter(q => q.id !== id) }))
  },

  async updateStatus(id, status) {
    await questDb.quests.update(id, { status })
    set(s => ({ quests: s.quests.map(q => q.id === id ? { ...q, status } : q) }))
  },

  getById(id) {
    return get().quests.find(q => q.id === id) ?? null
  },

  getByIds(ids) {
    if (!ids?.length) return []
    return get().quests.filter(q => ids.includes(q.id))
  },

  async exportJSON() {
    const all  = await questDb.quests.toArray()
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `dm-quests-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  async importJSON(file) {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('Неверный формат')
    await questDb.quests.clear()
    const toImport = data.map(({ id, ...rest }) => rest)
    await questDb.quests.bulkAdd(toImport)
    await get().loadAll()
  },
}))
