import { useEffect, useState } from 'react'
import {
  IconPlus, IconSearch, IconUpload, IconDownload,
  IconPencil, IconTrash, IconSword, IconUser, IconRefresh,
} from '@tabler/icons-react'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { ENTITY_TYPES } from '../../data/gameData'
import { db } from '../../data/bestiaryDb'
import seedData from '../../data/seedBestiary.json'
import CreatureForm from './CreatureForm'
import StatblockView from './StatblockView'

export default function BestiaryPage() {
  const { loadAll, loading, getFiltered, search, setSearch,
          filterType, setFilterType, filterSource, setFilterSource,
          deleteCreature, exportJSON, importJSON } = useBestiaryStore()

  const [formOpen,    setFormOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)  // creature to edit
  const [viewTarget,  setViewTarget]  = useState(null)  // creature to view statblock
  const [addType,     setAddType]     = useState('enemy')

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

        {/* Фильтры */}
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
          <div style={{ width: '100%', height: 1 }} />
          {[{ id: 'all', label: 'Все источники' }, { id: 'official', label: 'Официальные' }, { id: 'homebrew', label: 'Homebrew' }].map(s => (
            <button
              key={s.id}
              onClick={() => setFilterSource(s.id)}
              className="font-cinzel text-[10px] px-2 py-1 rounded-md transition-all cursor-pointer"
              style={{
                background: filterSource === s.id ? 'var(--gold-dim)' : 'var(--bg-row)',
                color: filterSource === s.id ? 'var(--gold)' : 'var(--text-muted)',
                border: `1px solid ${filterSource === s.id ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
              }}
            >
              {s.label}
            </button>
          ))}
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
          {filtered.map(c => (
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
      <div className="flex-1 overflow-y-auto">
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
