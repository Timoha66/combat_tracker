import { useEffect, useState, useRef } from 'react'
import {
  IconPlus, IconSearch, IconUpload, IconDownload,
  IconPencil, IconTrash, IconSword, IconUser, IconRefresh,
  IconFilter, IconX, IconChevronDown,
} from '@tabler/icons-react'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { ENTITY_TYPES, CREATURE_TYPES, CR_VALUES } from '../../data/gameData'
import { db } from '../../data/bestiaryDb'
import seedData from '../../data/seedBestiary.json'
import CreatureForm from './CreatureForm'
import StatblockView from './StatblockView'

const SOURCES = [
  'HB','DMG','MM','VGM','XGE','MTF','TCE','MPMM','UA','TOA','OoTA','PoTA',
]

export default function BestiaryPage() {
  const { loadAll, loading, getFiltered, search, setSearch,
          filterType, setFilterType, filterSource, setFilterSource,
          filterSources, setFilterSources,
          filterCRs, setFilterCRs,
          filterCreatureTypes, setFilterCreatureTypes,
          deleteCreature, exportJSON, importJSON } = useBestiaryStore()

  const [formOpen,    setFormOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [viewTarget,  setViewTarget]  = useState(null)
  const [addType,     setAddType]     = useState('enemy')
  const [sortBy,      setSortBy]      = useState('name')
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = filterSources.length > 0 || filterCRs.length > 0 || filterCreatureTypes.length > 0

  function toggleArr(arr, setArr, val) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  function clearAllFilters() {
    setFilterSources([])
    setFilterCRs([])
    setFilterCreatureTypes([])
  }

  useEffect(() => { loadAll() }, [])

  const filtered = getFiltered()

  function handleEdit(c, e) {
    e.stopPropagation()
    setEditTarget(c)
    setFormOpen(true)
  }

  async function handleDelete(c, e) {
    e.stopPropagation()
    if (confirm(`Удалить «${c.name}»?`)) {
      await deleteCreature(c.id)
      if (viewTarget?.id === c.id) setViewTarget(null)
    }
  }

  async function handleReset() {
    if (!confirm('Сбросить бестиарий к базовому списку?\n\nВсе твои существа будут УДАЛЕНЫ и заменены базовыми. Это действие нельзя отменить.')) return
    await db.creatures.clear()
    await db.creatures.bulkAdd(seedData)
    await loadAll()
    setViewTarget(null)
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    importJSON(file).catch(err => alert('Ошибка импорта: ' + err.message))
    e.target.value = ''
  }

  function openAdd(type = 'enemy') {
    setEditTarget(null)
    setAddType(type)
    setFormOpen(true)
  }

  const typeColors = {
    player:    'type-player',
    enemy:     'type-enemy',
    npc:       'type-npc',
    companion: 'type-ally',
    pet:       'type-ally',
  }
  const typeLabels = {
    player: 'Игрок', enemy: 'Враг', npc: 'НПС',
    companion: 'Компаньон', pet: 'Питомец',
  }

  const CR_ORDER = ['0','1/8','1/4','1/2','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30']

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'ru')
    if (sortBy === 'type') return (a.type ?? '').localeCompare(b.type ?? '', 'ru')
    if (sortBy === 'cr') return (CR_ORDER.indexOf(a.cr ?? '0')) - (CR_ORDER.indexOf(b.cr ?? '0'))
    return 0
  })

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── ЛЕВАЯ ПАНЕЛЬ: список ── */}
      <div className="flex flex-col overflow-hidden" style={{ width: 340, borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}>

        {/* Поиск */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)' }}>
            <IconSearch size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text)' }}
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Тип участника */}
        <div className="px-3 py-2 border-b flex flex-wrap gap-1" style={{ borderColor: 'var(--border)' }}>
          {[{ id: 'all', label: 'Все' }, ...ENTITY_TYPES].map(t => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className="font-cinzel text-[10px] px-2 py-1 rounded-md transition-all cursor-pointer"
              style={{
                background: filterType === t.id ? 'var(--gold-dim)' : 'var(--bg-row)',
                color: filterType === t.id ? 'var(--gold)' : 'var(--text-muted)',
                border: `1px solid ${filterType === t.id ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Расширенные фильтры */}
        <div className="border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="px-3 py-2 flex items-center gap-2">
            <button
              className="btn btn-ghost flex items-center gap-1.5"
              style={{ fontSize: 11, color: hasActiveFilters ? 'var(--gold)' : 'var(--text-muted)', borderColor: hasActiveFilters ? 'rgba(226,201,126,0.4)' : 'var(--border)', background: hasActiveFilters ? 'var(--gold-dim)' : 'transparent' }}
              onClick={() => setShowFilters(s => !s)}
            >
              <IconFilter size={12} />
              Фильтры
              {hasActiveFilters && (
                <span className="font-cinzel text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--gold)', color: '#1a1208' }}>
                  {filterSources.length + filterCRs.length + filterCreatureTypes.length}
                </span>
              )}
              <IconChevronDown size={11} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {hasActiveFilters && (
              <button className="btn btn-ghost" style={{ fontSize: 10, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={clearAllFilters}>
                <IconX size={11} /> Сбросить
              </button>
            )}
          </div>
          {showFilters && (
            <div className="px-3 pb-3 flex flex-col gap-3">
              <div>
                <div className="font-cinzel text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Источник</div>
                <div className="flex flex-wrap gap-1">
                  {SOURCES.map(src => {
                    const active = filterSources.includes(src)
                    return (
                      <button key={src}
                        className="font-cinzel text-[10px] px-2 py-0.5 rounded-md cursor-pointer transition-all"
                        style={{ background: active ? 'var(--gold-dim)' : 'var(--bg-row)', color: active ? 'var(--gold)' : 'var(--text-muted)', border: `1px solid ${active ? 'rgba(226,201,126,0.4)' : 'var(--border)'}` }}
                        onClick={() => toggleArr(filterSources, setFilterSources, src)}>
                        {src}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <MultiSelect label="CR" options={CR_VALUES} selected={filterCRs} onChange={setFilterCRs} />
                <MultiSelect label="Тип существа" options={CREATURE_TYPES} selected={filterCreatureTypes} onChange={setFilterCreatureTypes} />
              </div>
            </div>
          )}
        </div>

        {/* Кнопки добавления */}
        <div className="px-3 py-2 flex gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-add flex-1 justify-center" style={{ fontSize: 11 }} onClick={() => openAdd('enemy')}>
            <IconSword size={13} /> Существо
          </button>
          <button className="btn btn-blue flex-1 justify-center" style={{ fontSize: 11 }} onClick={() => openAdd('player')}>
            <IconUser size={13} /> Игрок
          </button>
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && (
            <div className="text-center py-8 font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>
              Загрузка...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <div className="font-cinzel text-sm mb-1">Пусто</div>
              <div className="text-xs">Добавь первое существо</div>
            </div>
          )}
          {sorted.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-all"
              style={{
                background: viewTarget?.id === c.id ? 'var(--gold-dim)' : 'var(--bg-row)',
                border: `1px solid ${viewTarget?.id === c.id ? 'rgba(226,201,126,0.35)' : 'var(--border)'}`,
              }}
              onClick={() => setViewTarget(c)}
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-cinzel text-sm font-semibold truncate" style={{ color: viewTarget?.id === c.id ? 'var(--gold)' : 'var(--text)' }}>
                    {c.name}
                  </span>
                  <span className={`type-badge ${typeColors[c.type] ?? 'type-npc'} shrink-0`}>
                    {typeLabels[c.type] ?? c.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {c.type !== 'player' && c.cr !== undefined && <span>CR {c.cr}</span>}
                  {c.type !== 'player' && <span>·</span>}
                  <span>HP {c.type === 'player' ? c.hp?.max : c.hp?.average}</span>
                  <span>·</span>
                  <span>КД {c.type === 'player' ? c.ac : c.ac?.value}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                <button
                  className="icon-btn"
                  onClick={e => handleEdit(c, e)}
                  title="Редактировать"
                  style={{ width: 24, height: 24 }}
                >
                  <IconPencil size={12} />
                </button>
                <button
                  className="icon-btn"
                  onClick={e => handleDelete(c, e)}
                  title="Удалить"
                  style={{ width: 24, height: 24, borderColor: 'rgba(248,113,113,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)' }}
                >
                  <IconTrash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Экспорт / импорт */}
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
          <button
            className="btn w-full justify-center"
            style={{ fontSize: 11, background: 'none', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
            onClick={handleReset}
          >
            <IconRefresh size={13} /> Сбросить к базовому
          </button>
        </div>
      </div>

      {/* ── ПРАВАЯ ПАНЕЛЬ: статблок ── */}
      <div className="flex-1 overflow-hidden">
        {viewTarget
          ? <StatblockView
              creature={viewTarget}
              onEdit={() => { setEditTarget(viewTarget); setFormOpen(true) }}
            />
          : (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
              <div className="text-center">
                <div className="text-4xl mb-3">📖</div>
                <div className="font-cinzel text-sm">Выбери существо из списка</div>
              </div>
            </div>
          )
        }
      </div>

      {/* ── ФОРМА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ ── */}
      {formOpen && (
        <CreatureForm
          initial={editTarget ?? { type: addType }}
          onClose={() => { setFormOpen(false); setEditTarget(null) }}
          onSaved={c => { setViewTarget(c); setFormOpen(false); setEditTarget(null) }}
        />
      )}
    </div>
  )
}

// ─── MultiSelect ──────────────────────────────────────────────────────────────
function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function toggle(val) {
    onChange(selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val])
  }

  return (
    <div ref={ref} className="relative flex-1">
      <button
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-cinzel text-[10px] cursor-pointer"
        style={{ background: selected.length ? 'var(--gold-dim)' : 'var(--bg-row)', color: selected.length ? 'var(--gold)' : 'var(--text-muted)', border: `1px solid ${selected.length ? 'rgba(226,201,126,0.4)' : 'var(--border)'}` }}
        onClick={() => setOpen(s => !s)}
      >
        <span>{label}{selected.length > 0 ? ` (${selected.length})` : ''}</span>
        <IconChevronDown size={10} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 rounded-xl overflow-hidden shadow-xl z-50"
          style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-md)', minWidth: 160, maxHeight: 220, overflowY: 'auto' }}>
          {selected.length > 0 && (
            <button className="w-full text-left px-3 py-1.5 font-cinzel text-[10px] border-b cursor-pointer"
              style={{ borderColor: 'var(--border)', color: '#f87171' }}
              onClick={() => onChange([])}>
              Сбросить
            </button>
          )}
          {options.map(opt => {
            const active = selected.includes(opt)
            return (
              <button key={opt}
                className="w-full text-left px-3 py-1.5 font-cinzel text-[10px] cursor-pointer flex items-center gap-2"
                style={{ background: active ? 'var(--gold-dim)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text-dim)' }}
                onClick={() => toggle(opt)}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: active ? 'var(--gold)' : 'var(--border-md)', border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`, display: 'inline-block', flexShrink: 0 }} />
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
