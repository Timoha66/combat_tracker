import { create } from 'zustand'
import { npcDb } from '../data/npcDb'
import seedFactions from '../data/seedFactions.json'
import seedNpcs from '../data/seedNpcs.json'

export const useNpcStore = create((set, get) => ({
  factions:      [],
  npcs:          [],
  loading:       false,
  search:        '',
  filterStatus:  'all',
  selectedFactionId: null,

  async loadAll() {
    set({ loading: true })
    const [factions, npcs] = await Promise.all([
      npcDb.factions.toArray(),
      npcDb.npcs.toArray(),
    ])
    set({ factions, npcs, loading: false })
  },

  // ── ФРАКЦИИ ─────────────────────────────────────────────────────────────────
  async addFaction(data) {
    const id = await npcDb.factions.add({ ...data, createdAt: new Date() })
    const faction = await npcDb.factions.get(id)
    set(s => ({ factions: [...s.factions, faction] }))
    return faction
  },

  async updateFaction(id, data) {
    await npcDb.factions.update(id, { ...data, updatedAt: new Date() })
    const updated = await npcDb.factions.get(id)
    set(s => ({ factions: s.factions.map(f => f.id === id ? updated : f) }))
    return updated
  },

  async deleteFaction(id) {
    await npcDb.factions.delete(id)
    await npcDb.npcs.where('factionId').equals(id).delete()
    set(s => ({
      factions: s.factions.filter(f => f.id !== id),
      npcs:     s.npcs.filter(n => n.factionId !== id),
      selectedFactionId: s.selectedFactionId === id ? null : s.selectedFactionId,
    }))
  },

  async updateFactionStatus(id, status) {
    await npcDb.factions.update(id, { status })
    set(s => ({ factions: s.factions.map(f => f.id === id ? { ...f, status } : f) }))
  },

  // ── НПС ─────────────────────────────────────────────────────────────────────
  async addNpc(data) {
    const id = await npcDb.npcs.add({ ...data, createdAt: new Date() })
    const npc = await npcDb.npcs.get(id)
    set(s => ({ npcs: [...s.npcs, npc] }))
    return npc
  },

  async updateNpc(id, data) {
    await npcDb.npcs.update(id, { ...data, updatedAt: new Date() })
    const updated = await npcDb.npcs.get(id)
    set(s => ({ npcs: s.npcs.map(n => n.id === id ? updated : n) }))
    return updated
  },

  async deleteNpc(id) {
    await npcDb.npcs.delete(id)
    set(s => ({ npcs: s.npcs.filter(n => n.id !== id) }))
  },

  getNpcsForFaction(factionId) {
    return get().npcs.filter(n => n.factionId === factionId)
  },

  // ── ФИЛЬТРЫ ─────────────────────────────────────────────────────────────────
  setSearch(v)         { set({ search: v }) },
  setFilterStatus(v)   { set({ filterStatus: v }) },
  setSelectedFaction(id) { set({ selectedFactionId: id }) },

  getFilteredFactions() {
    const { factions, search, filterStatus } = get()
    return factions.filter(f => {
      if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus !== 'all' && f.status !== filterStatus) return false
      return true
    })
  },

  // ── ЭКСПОРТ / ИМПОРТ ────────────────────────────────────────────────────────
  async exportJSON() {
    const [factions, npcs] = await Promise.all([
      npcDb.factions.toArray(),
      npcDb.npcs.toArray(),
    ])
    const blob = new Blob([JSON.stringify({ factions, npcs }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dm-npcs-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  async resetToSeed() {
    await npcDb.factions.clear()
    await npcDb.npcs.clear()
    const factionIds = await npcDb.factions.bulkAdd(seedFactions, { allKeys: true })
    const slugToId = {}
    seedFactions.forEach((f, i) => { slugToId[f.slug] = factionIds[i] })
    const npcsWithIds = seedNpcs.map(n => ({ ...n, factionId: slugToId[n.factionSlug] ?? null }))
    await npcDb.npcs.bulkAdd(npcsWithIds)
    await get().loadAll()
  },
}))
