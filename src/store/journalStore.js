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
}))
