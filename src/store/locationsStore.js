import { create } from 'zustand'
import { locDb } from '../data/locationsDb'
import seedData from '../data/seedLocations.json'

export const useLocationsStore = create((set, get) => ({
  locations: [],
  loading:   false,
  search:    '',
  filterCat: 'all',
  filterTag: '',

  async loadAll() {
    set({ loading: true })
    const locations = await locDb.locations.toArray()
    set({ locations, loading: false })
  },

  async addLocation(data) {
    const id = await locDb.locations.add({ ...data, createdAt: new Date() })
    const loc = await locDb.locations.get(id)
    set(s => ({ locations: [...s.locations, loc] }))
    return loc
  },

  async updateLocation(id, data) {
    await locDb.locations.update(id, { ...data, updatedAt: new Date() })
    const updated = await locDb.locations.get(id)
    set(s => ({ locations: s.locations.map(l => l.id === id ? updated : l) }))
    return updated
  },

  async deleteLocation(id) {
    await locDb.locations.delete(id)
    set(s => ({ locations: s.locations.filter(l => l.id !== id) }))
  },

  setSearch(v)    { set({ search: v }) },
  setFilterCat(v) { set({ filterCat: v }) },
  setFilterTag(v) { set({ filterTag: v }) },

  getFiltered() {
    const { locations, search, filterCat, filterTag } = get()
    return locations.filter(l => {
      if (search && !l.title.toLowerCase().includes(search.toLowerCase()) &&
          !l.en?.toLowerCase().includes(search.toLowerCase())) return false
      if (filterCat !== 'all' && l.cat !== filterCat) return false
      if (filterTag && !(l.tags ?? []).includes(filterTag)) return false
      return true
    })
  },

  async exportJSON() {
    const all = await locDb.locations.toArray()
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dm-locations-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  async importJSON(file) {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('Неверный формат')
    const toImport = data.map(({ id, ...rest }) => rest)
    await locDb.locations.bulkAdd(toImport)
    await get().loadAll()
  },

  async resetToSeed() {
    await locDb.locations.clear()
    await locDb.locations.bulkAdd(seedData)
    await get().loadAll()
  },
}))
