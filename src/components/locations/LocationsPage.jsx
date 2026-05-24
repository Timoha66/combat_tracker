import { useEffect, useState } from 'react'
import { IconSearch, IconPlus, IconPencil, IconTrash, IconDownload, IconUpload, IconRefresh } from '@tabler/icons-react'
import { useLocationsStore } from '../../store/locationsStore'
import { LOCATION_CATEGORIES, CAT_MAP } from '../../data/locationsDb'
import LocationView from './LocationView'
import LocationForm from './LocationForm'

export default function LocationsPage() {
  const loadAll      = useLocationsStore(s => s.loadAll)
  const loading      = useLocationsStore(s => s.loading)
  const search       = useLocationsStore(s => s.search)
  const setSearch    = useLocationsStore(s => s.setSearch)
  const filterCat    = useLocationsStore(s => s.filterCat)
  const setFilterCat = useLocationsStore(s => s.setFilterCat)
  const deleteLocation = useLocationsStore(s => s.deleteLocation)
  const exportJSON   = useLocationsStore(s => s.exportJSON)
  const importJSON   = useLocationsStore(s => s.importJSON)
  const resetToSeed  = useLocationsStore(s => s.resetToSeed)
  const locations    = useLocationsStore(s => s.locations)
  const [viewTarget, setViewTarget] = useState(null)
  const [formOpen,   setFormOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  useEffect(() => { loadAll() }, [])

  // Всегда берём актуальную версию из стора
  const liveLocation = viewTarget ? locations.find(l => l.id === viewTarget.id) ?? viewTarget : null


  const [localSearch, setLocalSearch] = useState('')

  function handleSearchChange(e) {
    setLocalSearch(e.target.value)
  }

  const filtered = locations.filter(l => {
    if (localSearch && !l.title.toLowerCase().includes(localSearch.toLowerCase()) &&
        !l.en?.toLowerCase().includes(localSearch.toLowerCase())) return false
    if (filterCat !== 'all' && l.cat !== filterCat) return false
    return true
  })

  // Группируем по категориям для отображения
  const byCat = {}
  filtered.forEach(l => {
    if (!byCat[l.cat]) byCat[l.cat] = []
    byCat[l.cat].push(l)
  })

  function handleEdit(loc, e) {
    e?.stopPropagation()
    setEditTarget(loc)
    setFormOpen(true)
  }

  async function handleDelete(loc, e) {
    e?.stopPropagation()
    if (confirm(`Удалить «${loc.title}»?`)) {
      await deleteLocation(loc.id)
      if (viewTarget?.id === loc.id) setViewTarget(null)
    }
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    importJSON(file).catch(err => alert('Ошибка: ' + err.message))
    e.target.value = ''
  }

  async function handleReset() {
    if (confirm('Сбросить к базовому списку локаций?\n\nВсе данные будут заменены. Это нельзя отменить.')) {
      await resetToSeed()
      setViewTarget(null)
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── ЛЕВАЯ ПАНЕЛЬ ── */}
      <div className="flex flex-col overflow-hidden shrink-0" style={{ width: 300, borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}>

        {/* Поиск */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)' }}>
            <IconSearch size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text)' }}
              placeholder="Поиск..."
              value={localSearch} onChange={handleSearchChange} />
          </div>
        </div>

        {/* Фильтр по категории */}
        <div className="px-3 py-2 border-b flex flex-wrap gap-1" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setFilterCat('all')}
            className="font-cinzel text-[10px] px-2 py-1 rounded-md transition-all cursor-pointer"
            style={{
              background: filterCat === 'all' ? 'var(--gold-dim)' : 'var(--bg-row)',
              color: filterCat === 'all' ? 'var(--gold)' : 'var(--text-muted)',
              border: `1px solid ${filterCat === 'all' ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
            }}>Все</button>
          {LOCATION_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)}
              className="font-cinzel text-[10px] px-2 py-1 rounded-md transition-all cursor-pointer"
              style={{
                background: filterCat === c.id ? 'var(--gold-dim)' : 'var(--bg-row)',
                color: filterCat === c.id ? 'var(--gold)' : 'var(--text-muted)',
                border: `1px solid ${filterCat === c.id ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
              }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Кнопка добавления */}
        <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-add w-full justify-center" style={{ fontSize: 12 }}
            onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <IconPlus size={13} /> Добавить локацию
          </button>
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && <div className="text-center py-8 font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <div className="font-cinzel text-sm mb-1">Пусто</div>
              <div className="text-xs">Добавь первую локацию</div>
            </div>
          )}

          {/* Группы по категориям */}
          {LOCATION_CATEGORIES.filter(c => byCat[c.id]?.length > 0).map(cat => (
            <div key={cat.id} className="mb-3">
              {filterCat === 'all' && (
                <div className="font-cinzel text-[10px] uppercase tracking-widest px-2 py-1 mb-1" style={{ color: 'var(--text-muted)' }}>
                  {cat.icon} {cat.label}
                </div>
              )}
              {byCat[cat.id]?.map(loc => (
                <div key={loc.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1 cursor-pointer transition-all"
                  style={{
                    background: viewTarget?.id === loc.id ? 'var(--gold-dim)' : 'var(--bg-row)',
                    border: `1px solid ${viewTarget?.id === loc.id ? 'rgba(226,201,126,0.35)' : 'var(--border)'}`,
                  }}
                  onClick={() => setViewTarget(loc)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-cinzel text-sm font-semibold truncate" style={{ color: viewTarget?.id === loc.id ? 'var(--gold)' : 'var(--text)' }}>
                      {loc.title}
                    </div>
                    {loc.type && (
                      <div className="font-cinzel text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{loc.type}</div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="icon-btn" style={{ width: 22, height: 22 }}
                      onClick={e => handleEdit(loc, e)} title="Редактировать">
                      <IconPencil size={11} />
                    </button>
                    <button className="icon-btn" style={{ width: 22, height: 22 }}
                      onClick={e => handleDelete(loc, e)} title="Удалить"
                      onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = '' }}>
                      <IconTrash size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Экспорт / Импорт / Сброс */}
        <div className="px-3 py-2 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-ghost flex-1 justify-center" style={{ fontSize: 11 }} onClick={exportJSON}>
            <IconDownload size={13} /> Экспорт
          </button>
          <label className="btn btn-ghost flex-1 justify-center cursor-pointer" style={{ fontSize: 11 }}>
            <IconUpload size={13} /> Импорт
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
        <div className="px-3 pb-3">
          <button className="btn w-full justify-center" style={{ fontSize: 11, background: 'none', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
            onClick={handleReset}>
            <IconRefresh size={13} /> Сбросить к базовому
          </button>
        </div>
      </div>

      {/* ── ПРАВАЯ ПАНЕЛЬ ── */}
      <div className="flex-1 overflow-hidden">
        {liveLocation
          ? <LocationView
              location={liveLocation}
              onEdit={() => { setEditTarget(liveLocation); setFormOpen(true) }}
            />
          : (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
              <div className="text-center">
                <div className="text-4xl mb-3">🗺</div>
                <div className="font-cinzel text-sm">Выбери локацию из списка</div>
              </div>
            </div>
          )
        }
      </div>

      {/* Форма */}
      {formOpen && (
        <LocationForm
          initial={editTarget ?? {}}
          onClose={() => { setFormOpen(false); setEditTarget(null) }}
          onSaved={loc => {
            setViewTarget(loc)
            setFormOpen(false)
            setEditTarget(null)
          }}
        />
      )}
    </div>
  )
}
