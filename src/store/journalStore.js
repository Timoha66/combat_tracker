import { create } from 'zustand'
import { journalDb } from '../data/journalDb'

export const useJournalStore = create((set, get) => ({
  sessions:          [],
  loading:           false,
  selectedSessionId: null,

  async loadAll() {
    set({ loading: true })
    const sessions = await journalDb.sessions.orderBy('createdAt').reverse().toArray()
    set({ sessions, loading: false })
  },

  async addSession(data) {
    const id = await journalDb.sessions.add({ ...data, createdAt: new Date() })
    const session = await journalDb.sessions.get(id)
    set(s => ({ sessions: [session, ...s.sessions], selectedSessionId: id }))
    return session
  },

  async updateSession(id, data) {
    await journalDb.sessions.update(id, { ...data, updatedAt: new Date() })
    set(s => ({ sessions: s.sessions.map(s => s.id === id ? { ...s, ...data } : s) }))
  },

  async deleteSession(id) {
    await journalDb.sessions.delete(id)
    set(s => ({
      sessions: s.sessions.filter(s => s.id !== id),
      selectedSessionId: s.selectedSessionId === id ? null : s.selectedSessionId,
    }))
  },

  setSelectedSession(id) { set({ selectedSessionId: id }) },

  getSelectedSession() {
    const { sessions, selectedSessionId } = get()
    return sessions.find(s => s.id === selectedSessionId) ?? null
  },

  async exportJournal() {
    const all  = await journalDb.sessions.toArray()
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `dm-journal-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  async importJournal(file) {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('Неверный формат файла')
    const toImport = data.map(({ id, ...rest }) => rest)
    await journalDb.sessions.bulkAdd(toImport)
    await get().loadAll()
  },
}))
