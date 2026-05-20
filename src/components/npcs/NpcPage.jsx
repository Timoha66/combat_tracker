import { useEffect, useState } from 'react'
import {
  IconSearch, IconPlus, IconPencil, IconTrash,
  IconDownload, IconRefresh, IconUsers, IconUserPlus,
} from '@tabler/icons-react'
import { useNpcStore } from '../../store/npcStore'
import { FACTION_STATUSES, FACTION_STATUS_MAP } from '../../data/npcDb'
import { QUEST_STATUS_MAP } from '../../data/locationsDb'
import NpcModal from './NpcModal'
import { FactionForm, NpcForm } from './NpcForms'

export default function NpcPage() {
  const {
    loadAll, loading, getFilteredFactions, getNpcsForFaction,
    search, setSearch, filterStatus, setFilterStatus,
    selectedFactionId, setSelectedFaction,
    deleteFaction, updateFactionStatus, exportJSON, resetToSeed,
    factions, npcs,
  } = useNpcStore()

  const [viewNpc,       setViewNpc]       = useState(null)
  const [factionForm,   setFactionForm]   = useState(null)
  const [npcForm,       setNpcForm]       = useState(null)
  const [mode,          setMode]          = useState('factions') // 'factions' | 'npcs'
  const [npcSearch,     setNpcSearch]     = useState('')

  useEffect(() => { loadAll() }, [])

  const filtered    = getFilteredFactions()
  const selectedFac = factions.find(f => f.id === selectedFactionId)
  const facNpcs     = selectedFactionId ? getNpcsForFaction(selectedFactionId) : []

  // Поиск по всем НПС
  const allNpcsFiltered = npcSearch.trim()
    ? npcs.filter(n => n.name.toLowerCase().includes(npcSearch.toLowerCase()) || n.nameEn?.toLowerCase().includes(npcSearch.toLowerCase()))
    : npcs

  function getFactionTitle(factionId) {
    return factions.find(f => f.id === factionId)?.title ?? '—'
  }

  async function handleDeleteFaction(f, e) {
    e.stopPropagation()
    if (confirm(`Удалить фракцию «${f.title}» и всех её НПС?`)) {
      await deleteFaction(f.id)
    }
  }

  async function handleReset() {
    if (confirm('Сбросить к базовым данным? Все изменения будут утеряны.')) {
      await resetToSeed()
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── ЛЕВАЯ ПАНЕЛЬ: фракции ── */}
      <div className="flex flex-col overflow-hidden shrink-0" style={{ width: 300, borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}>

        {/* Вкладки режима */}
        <div className="flex border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          {[{ id: 'factions', label: 'Фракции' }, { id: 'npcs', label: 'Все НПС' }].map(tab => (
            <button key={tab.id} onClick={() => setMode(tab.id)}
              className="flex-1 font-cinzel text-xs py-2.5 tracking-wide transition-colors cursor-pointer"
              style={{
                color: mode === tab.id ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom: `2px solid ${mode === tab.id ? 'var(--gold)' : 'transparent'}`,
                background: 'none',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 'factions' ? (
          <>
            {/* Поиск фракций */}
            <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)' }}>
                <IconSearch size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text)' }}
                  placeholder="Поиск фракции..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {/* Фильтр статуса */}
            <div className="px-3 py-2 border-b flex flex-wrap gap-1" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setFilterStatus('all')}
                className="font-cinzel text-[10px] px-2 py-1 rounded-md cursor-pointer"
                style={{ background: filterStatus === 'all' ? 'var(--gold-dim)' : 'var(--bg-row)', color: filterStatus === 'all' ? 'var(--gold)' : 'var(--text-muted)', border: `1px solid ${filterStatus === 'all' ? 'rgba(226,201,126,0.4)' : 'var(--border)'}` }}>
                Все
              </button>
              {FACTION_STATUSES.map(s => (
                <button key={s.id} onClick={() => setFilterStatus(s.id)}
                  className="font-cinzel text-[10px] px-2 py-1 rounded-md cursor-pointer"
                  style={{ background: filterStatus === s.id ? `${s.color}22` : 'var(--bg-row)', color: filterStatus === s.id ? s.color : 'var(--text-muted)', border: `1px solid ${filterStatus === s.id ? s.color + '55' : 'var(--border)'}` }}>
                  {s.icon}
                </button>
              ))}
            </div>

            {/* Кнопка добавления фракции */}
            <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <button className="btn btn-add w-full justify-center" style={{ fontSize: 12 }} onClick={() => setFactionForm('new')}>
                <IconPlus size={13} /> Добавить фракцию
              </button>
            </div>

            {/* Список фракций */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {loading && <div className="text-center py-8 font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>}
              {filtered.map(f => {
                const st       = FACTION_STATUS_MAP[f.status] ?? FACTION_STATUS_MAP['unknown']
                const npcCount = getNpcsForFaction(f.id).length
                const isActive = selectedFactionId === f.id
                return (
                  <div key={f.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1 cursor-pointer transition-all"
                    style={{ background: isActive ? 'var(--gold-dim)' : 'var(--bg-row)', border: `1px solid ${isActive ? 'rgba(226,201,126,0.35)' : 'var(--border)'}` }}
                    onClick={() => setSelectedFaction(f.id)}
                  >
                    <span className="text-base shrink-0" title={st.label}>{st.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-cinzel text-sm font-semibold truncate" style={{ color: isActive ? 'var(--gold)' : 'var(--text)' }}>{f.title}</div>
                      {f.type && <div className="font-cinzel text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{f.type}</div>}
                    </div>
                    {npcCount > 0 && <span className="font-cinzel text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{npcCount} НПС</span>}
                    <div className="flex gap-1 shrink-0">
                      <button className="icon-btn" style={{ width: 20, height: 20 }} onClick={e => { e.stopPropagation(); setFactionForm(f) }}><IconPencil size={10} /></button>
                      <button className="icon-btn" style={{ width: 20, height: 20 }} onClick={e => handleDeleteFaction(f, e)}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '' }}>
                        <IconTrash size={10} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            {/* Поиск по НПС */}
            <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)' }}>
                <IconSearch size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text)' }}
                  placeholder="Поиск по имени НПС..."
                  autoFocus
                  value={npcSearch}
                  onChange={e => setNpcSearch(e.target.value)} />
              </div>
            </div>
            <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <button className="btn btn-add w-full justify-center" style={{ fontSize: 12 }} onClick={() => setNpcForm('new')}>
                <IconUserPlus size={13} /> Добавить НПС
              </button>
            </div>
            {/* Список всех НПС */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {allNpcsFiltered.length === 0 && (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <div className="font-cinzel text-xs">Ничего не найдено</div>
                </div>
              )}
              {allNpcsFiltered.map(npc => (
                <div key={npc.id}
                  className="px-3 py-2 rounded-lg mb-1 cursor-pointer transition-all"
                  style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}
                  onClick={() => setViewNpc(npc)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(226,201,126,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div className="font-cinzel text-sm font-semibold" style={{ color: 'var(--text)' }}>{npc.name}</div>
                  {npc.role && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{npc.role}</div>}
                  <div className="font-cinzel text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{getFactionTitle(npc.factionId)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Экспорт / Сброс */}
        <div className="px-3 py-2 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-ghost flex-1 justify-center" style={{ fontSize: 11 }} onClick={exportJSON}><IconDownload size={13} /> Экспорт</button>
        </div>
        <div className="px-3 pb-3">
          <button className="btn w-full justify-center" style={{ fontSize: 11, background: 'none', color: 'var(--text-muted)', borderColor: 'var(--border)' }} onClick={handleReset}>
            <IconRefresh size={13} /> Сбросить к базовому
          </button>
        </div>
      </div>

      {/* ── ПРАВАЯ ПАНЕЛЬ ── */}
      <div className="flex-1 overflow-y-auto">
        {selectedFac ? (
          <div className="p-5">
            {/* Карточка фракции */}
            <FactionCard faction={selectedFac} onEdit={() => setFactionForm(selectedFac)} onStatusChange={updateFactionStatus} />

            {/* НПС фракции */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-cinzel text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  НПС фракции ({facNpcs.length})
                </span>
                <button className="btn btn-add" style={{ fontSize: 11 }} onClick={() => setNpcForm('new')}>
                  <IconUserPlus size={13} /> Добавить НПС
                </button>
              </div>
              {facNpcs.length === 0 ? (
                <div className="text-center py-8 rounded-xl" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <IconUsers size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <div className="font-cinzel text-xs">Нет НПС в этой фракции</div>
                </div>
              ) : (
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                  {facNpcs.map(npc => (
                    <NpcCard key={npc.id} npc={npc} onClick={() => setViewNpc(npc)} onEdit={() => setNpcForm(npc)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
            <div className="text-center">
              <div className="text-4xl mb-3">🏴</div>
              <div className="font-cinzel text-sm">Выбери фракцию из списка</div>
            </div>
          </div>
        )}
      </div>

      {/* Модалки */}
      {viewNpc && (
        <NpcModal
          npc={viewNpc}
          onClose={() => setViewNpc(null)}
          onEdit={() => { setNpcForm(viewNpc); setViewNpc(null) }}
        />
      )}
      {factionForm && (
        <FactionForm
          initial={factionForm === 'new' ? {} : factionForm}
          onClose={() => setFactionForm(null)}
          onSaved={() => setFactionForm(null)}
        />
      )}
      {npcForm && (
        <NpcForm
          initial={npcForm === 'new' ? {} : npcForm}
          factionId={selectedFactionId}
          factions={factions}
          onClose={() => setNpcForm(null)}
          onSaved={() => setNpcForm(null)}
        />
      )}
    </div>
  )
}

// ─── КАРТОЧКА ФРАКЦИИ ─────────────────────────────────────────────────────────
function FactionCard({ faction: f, onEdit, onStatusChange }) {
  const st = FACTION_STATUS_MAP[f.status] ?? FACTION_STATUS_MAP['unknown']

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${st.color}44`, background: 'var(--bg-panel)' }}>
      {/* Header фракции */}
      <div className="flex items-start gap-3 px-5 py-4 border-b" style={{ borderColor: `${st.color}33`, background: `${st.color}0a` }}>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-cinzel text-xl font-bold" style={{ color: 'var(--gold)' }}>{f.title}</h2>
            {f.type && <span className="font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>{f.type}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Статус - кнопки переключения */}
            <div className="flex gap-1 flex-wrap">
              {FACTION_STATUSES.map(s => (
                <button key={s.id} onClick={() => onStatusChange(f.id, s.id)}
                  className="font-cinzel text-[9px] px-1.5 py-0.5 rounded cursor-pointer transition-all"
                  style={{
                    background: f.status === s.id ? `${s.color}22` : 'transparent',
                    color: f.status === s.id ? s.color : 'var(--text-muted)',
                    border: `0.5px solid ${f.status === s.id ? s.color + '66' : 'var(--border)'}`,
                    fontWeight: f.status === s.id ? 700 : 400,
                  }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost shrink-0" onClick={onEdit}><IconPencil size={13} /> Редактировать</button>
      </div>

      <div className="p-4 grid gap-4" style={{ gridTemplateColumns: f.info?.length > 0 ? '1fr 1fr' : '1fr' }}>
        {/* Описание */}
        {f.description && (
          <div>
            {f.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {f.tags.map(t => (
                  <span key={t} className="font-cinzel text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-row)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>{t}</span>
                ))}
              </div>
            )}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{f.description}</p>
          </div>
        )}
        {/* Инфо таблица */}
        {f.info?.length > 0 && (
          <div className="flex flex-col gap-1">
            {f.info.map((row, i) => (
              <div key={i} className="flex gap-2 text-sm px-2 py-1 rounded" style={{ background: 'var(--bg-row)' }}>
                <span className="font-cinzel text-[11px] font-semibold shrink-0" style={{ color: 'var(--text)', minWidth: 100 }}>{row.label}</span>
                <span style={{ color: 'var(--text-dim)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Квесты */}
      {f.quests?.length > 0 && (
        <div className="px-4 pb-4">
          <div className="font-cinzel text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Квесты</div>
          <div className="flex flex-col gap-1">
            {f.quests.map((q, i) => {
              const qs = QUEST_STATUS_MAP[q.status] ?? QUEST_STATUS_MAP['inactive']
              return (
                <div key={i} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded" style={{ background: 'var(--bg-row)' }}>
                  <span>{qs.icon}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{q.title}</span>
                  <span className="ml-auto font-cinzel text-[10px]" style={{ color: qs.color }}>{qs.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── МИНИ-КАРТОЧКА НПС ────────────────────────────────────────────────────────
function NpcCard({ npc, onClick, onEdit }) {
  return (
    <div className="rounded-xl overflow-hidden cursor-pointer transition-all"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(226,201,126,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      onClick={onClick}
    >
      <div className="flex items-start gap-2 p-3">
        <div className="flex-1 min-w-0">
          <div className="font-cinzel text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{npc.name}</div>
          {npc.nameEn && <div className="font-cinzel text-[10px] italic truncate" style={{ color: 'var(--text-muted)' }}>{npc.nameEn}</div>}
          {npc.role && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{npc.role}</div>}
          {npc.character && <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--text-dim)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{npc.character}</p>}
        </div>
        <button className="icon-btn shrink-0" style={{ width: 22, height: 22 }} onClick={e => { e.stopPropagation(); onEdit() }} title="Редактировать"><IconPencil size={11} /></button>
      </div>
      {(npc.alignment || npc.classTags?.length > 0 || npc.tags?.filter(Boolean).length > 0) && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {npc.alignment && <span className="font-cinzel text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-row)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>{npc.alignment}</span>}
          {npc.classTags?.slice(0,1).map((t, i) => <span key={i} className="font-cinzel text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-row)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>{t}</span>)}
          {npc.secret && <span className="font-cinzel text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '0.5px solid rgba(167,139,250,0.3)' }}>🔒 Секрет</span>}
        </div>
      )}
    </div>
  )
}
