import { create } from 'zustand'
import { db } from '../data/bestiaryDb'

export const useBestiaryStore = create((set, get) => ({
  creatures:  [],
  loading:    false,
  search:     '',
  filterType: 'all',   // 'all' | 'player' | 'enemy' | 'npc' | 'companion' | 'pet'
  filterSource: 'all', // 'all' | 'official' | 'HB'
  filterTag:  '',

  // ── ЗАГРУЗКА ────────────────────────────────────────────────────────────────
  async loadAll() {
    set({ loading: true })
    const creatures = await db.creatures.toArray()
    set({ creatures, loading: false })
  },

  // ── CRUD ────────────────────────────────────────────────────────────────────
  async addCreature(data) {
    const id = await db.creatures.add({ ...data, createdAt: new Date() })
    const creature = await db.creatures.get(id)
    set(s => ({ creatures: [...s.creatures, creature] }))
    return creature
  },

  async updateCreature(id, data) {
    await db.creatures.update(id, { ...data, updatedAt: new Date() })
    const updated = await db.creatures.get(id)
    set(s => ({ creatures: s.creatures.map(c => c.id === id ? updated : c) }))
  },

  async deleteCreature(id) {
    await db.creatures.delete(id)
    set(s => ({ creatures: s.creatures.filter(c => c.id !== id) }))
  },

  // ── ФИЛЬТРЫ ─────────────────────────────────────────────────────────────────
  setSearch(v)       { set({ search: v }) },
  setFilterType(v)   { set({ filterType: v }) },
  setFilterSource(v) { set({ filterSource: v }) },
  setFilterTag(v)    { set({ filterTag: v }) },

  getFiltered() {
    const { creatures, search, filterType, filterSource, filterTag } = get()
    return creatures.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterType !== 'all' && c.type !== filterType) return false
      if (filterSource !== 'all') {
        const isHB = c.source === 'HB' || c.source === 'homebrew'
        if (filterSource === 'HB'       && !isHB) return false
        if (filterSource === 'official' &&  isHB) return false
      }
      if (filterTag && !(c.tags ?? []).includes(filterTag)) return false
      return true
    })
  },

  // ── ЭКСПОРТ / ИМПОРТ ────────────────────────────────────────────────────────
  async exportJSON() {
    const all = await db.creatures.toArray()
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dm-bestiary-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  async importJSON(file) {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('Неверный формат файла')
    // Очищаем id чтобы Dexie сам присвоил новые
    const toImport = data.map(({ id, ...rest }) => rest)
    await db.creatures.bulkAdd(toImport)
    await get().loadAll()
  },
}))
