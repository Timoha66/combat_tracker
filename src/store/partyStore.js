import { create } from 'zustand'
import { partyDb } from '../data/partyDb'

export const usePartyStore = create((set, get) => ({
  players: [],
  loading: false,

  async loadAll() {
    set({ loading: true })
    const players = await partyDb.players.toArray()
    set({ players, loading: false })
  },

  async addPlayer(data) {
    const id = await partyDb.players.add({ ...data, createdAt: new Date() })
    const player = await partyDb.players.get(id)
    set(s => ({ players: [...s.players, player] }))
    return player
  },

  async updatePlayer(id, data) {
    await partyDb.players.update(id, { ...data, updatedAt: new Date() })
    const updated = await partyDb.players.get(id)
    set(s => ({ players: s.players.map(p => p.id === id ? updated : p) }))
    return updated
  },

  async deletePlayer(id) {
    await partyDb.players.delete(id)
    set(s => ({ players: s.players.filter(p => p.id !== id) }))
  },
}))
