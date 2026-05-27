import { useEffect, useState } from 'react'
import {
  IconPlus, IconTrash, IconPencil, IconDownload, IconUpload, IconRefresh,
  IconX, IconCheck,
} from '@tabler/icons-react'
import { useQuestStore }     from '../../store/questStore'
import { useNpcStore }       from '../../store/npcStore'
import { useLocationsStore } from '../../store/locationsStore'
import { QUEST_TYPES, QUEST_STATUSES, QUEST_STATUS_MAP, QUEST_TYPE_MAP } from '../../data/questDb'
import QuestForm from './QuestForm'
import QuestCard from './QuestCard'

export default function QuestPage({ initialQuest, onQuestOpened, onOpenNpc, onOpenLocation }) {
  const { loadAll: loadQuests, quests, loading, deleteQuest, exportJSON, importJSON } = useQuestStore()
  const npcs      = useNpcStore(s => s.npcs)
  const loadNpcs  = useNpcStore(s => s.loadAll)
  const locations = useLocationsStore(s => s.locations)
  const loadLocs  = useLocationsStore(s => s.loadAll)

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType,   setFilterType]   = useState('all')
  const [search,       setSearch]       = useState('')
  const [selectedId,   setSelectedId]   = useState(null)
  const [formOpen,     setFormOpen]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [viewCard,     setViewCard]     = useState(null) // questId для модалки

  useEffect(() => {
    loadQuests()
    loadNpcs()
    loadLocs()
  }, [])

  useEffect(() => {
    if (initialQuest) {
      setSelectedId(initialQuest.id)
      onQuestOpened?.()
    }
  }, [initialQuest])

  const selected = quests.find(q => q.id === selectedId) ?? null

  const filtered = quests.filter(q => {
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== 'all' && q.status !== filterStatus) return false
    if (filterType   !== 'all' && q.type   !== filterType)   return false
    return true
  })

  // Группировка по типу
  const grouped = {}
  QUEST_TYPES.forEach(t => {
    const list = filtered.filter(q => q.type === t.id)
    if (list.length > 0) grouped[t.id] = list
  })

  async function handleDelete(q, e) {
    e.stopPropagation()
    if (confirm(`Удалить квест «${q.title}»?`)) {
      await deleteQuest(q.id)
      if (selectedId === q.id) setSelectedId(null)
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── ЛЕВАЯ ПАНЕЛЬ ── */}
      <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: 320, borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}>

        {/* Поиск */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>🔍</span>
            <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text)' }}
              placeholder="Поиск квеста..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Фильтры */}
        <div className="px-3 py-2 border-b flex flex-wrap gap-1" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => setFilterStatus('all')}
            className="font-cinzel text-[10px] px-2 py-1 rounded-md cursor-pointer"
            style={{ background: filterStatus === 'all' ? 'var(--gold-dim)' : 'var(--bg-row)', color: filterStatus === 'all' ? 'var(--gold)' : 'var(--text-muted)', border: `1px solid ${filterStatus === 'all' ? 'rgba(226,201,126,0.4)' : 'var(--border)'}` }}>
            Все
          </button>
          {QUEST_STATUSES.map(s => (
            <button key={s.id} onClick={() => setFilterStatus(filterStatus === s.id ? 'all' : s.id)}
              className="font-cinzel text-[10px] px-2 py-1 rounded-md cursor-pointer"
              style={{ background: filterStatus === s.id ? `${s.color}22` : 'var(--bg-row)', color: filterStatus === s.id ? s.color : 'var(--text-muted)', border: `1px solid ${filterStatus === s.id ? s.color + '55' : 'var(--border)'}` }}>
              {s.icon}
            </button>
          ))}
        </div>

        {/* Кнопка добавления */}
        <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-add w-full justify-center" style={{ fontSize: 12 }}
            onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <IconPlus size={13} /> Новый квест
          </button>
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && <div className="text-center py-8 font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <div className="text-3xl mb-2">📋</div>
              <div className="font-cinzel text-xs">Нет квестов</div>
            </div>
          )}
          {QUEST_TYPES.filter(t => grouped[t.id]).map(t => (
            <div key={t.id} className="mb-3">
              <div className="font-cinzel text-[9px] uppercase tracking-widest px-2 py-1 mb-1 flex items-center gap-1.5"
                style={{ color: t.color }}>
                {t.icon} {t.label}
                <span className="font-cinzel text-[9px] px-1.5 py-0.5 rounded-full ml-1"
                  style={{ background: `${t.color}18`, color: t.color }}>{grouped[t.id].length}</span>
              </div>
              {grouped[t.id].map(q => {
                const st      = QUEST_STATUS_MAP[q.status] ?? QUEST_STATUS_MAP['inactive']
                const isActive = selectedId === q.id
                return (
                  <div key={q.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1 cursor-pointer transition-all"
                    style={{ background: isActive ? 'var(--gold-dim)' : 'var(--bg-row)', border: `1px solid ${isActive ? 'rgba(226,201,126,0.35)' : 'var(--border)'}` }}
                    onClick={() => setSelectedId(isActive ? null : q.id)}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{st.icon}</span>
                    <span className="font-cinzel text-sm flex-1 truncate" style={{ color: isActive ? 'var(--gold)' : 'var(--text)' }}>{q.title}</span>
                    <div className="flex gap-1 shrink-0">
                      <button className="icon-btn" style={{ width: 22, height: 22 }}
                        onClick={e => { e.stopPropagation(); setEditTarget(q); setFormOpen(true) }}>
                        <IconPencil size={11} />
                      </button>
                      <button className="icon-btn" style={{ width: 22, height: 22 }}
                        onClick={e => handleDelete(q, e)}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '' }}>
                        <IconTrash size={11} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Экспорт/Импорт */}
        <div className="px-3 py-2 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-ghost flex-1 justify-center" style={{ fontSize: 11 }} onClick={exportJSON}>
            <IconDownload size={13} /> Экспорт
          </button>
          <label className="btn btn-ghost flex-1 justify-center cursor-pointer" style={{ fontSize: 11 }}>
            <IconUpload size={13} /> Импорт
            <input type="file" accept=".json" className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) importJSON(f).catch(err => alert('Ошибка: ' + err.message)); e.target.value = '' }} />
          </label>
        </div>
      </div>

      {/* ── ПРАВАЯ ПАНЕЛЬ ── */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <QuestDetailView
            quest={selected}
            npcs={npcs}
            locations={locations}
            onEdit={() => { setEditTarget(selected); setFormOpen(true) }}
            onOpenNpc={onOpenNpc}
            onOpenLocation={onOpenLocation}
          />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
            <div className="text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="font-cinzel text-sm mb-1">Выбери квест из списка</div>
              <div className="font-cinzel text-xs">или создай новый</div>
            </div>
          </div>
        )}
      </div>

      {/* Форма */}
      {formOpen && (
        <QuestForm
          initial={editTarget ?? {}}
          npcs={npcs}
          locations={locations}
          onClose={() => { setFormOpen(false); setEditTarget(null) }}
          onSaved={q => { setSelectedId(q.id); setFormOpen(false); setEditTarget(null) }}
        />
      )}
    </div>
  )
}

// ─── Детальный вид квеста ──────────────────────────────────────────────────────
function QuestDetailView({ quest, npcs, locations, onEdit, onOpenNpc, onOpenLocation }) {
  const updateStatus = useQuestStore(s => s.updateStatus)
  const st   = QUEST_STATUS_MAP[quest.status] ?? QUEST_STATUS_MAP['inactive']
  const typ  = QUEST_TYPE_MAP[quest.type]     ?? QUEST_TYPE_MAP['side']

  const giverNpc    = npcs.find(n => n.id === quest.questGiverNpcId)
  const relNpcs     = npcs.filter(n => (quest.relatedNpcIds ?? []).includes(n.id))
  const relLocs     = locations.filter(l => (quest.relatedLocationIds ?? []).includes(l.id))

  return (
    <div className="overflow-y-auto h-full p-5">
      {/* Шапка */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-cinzel text-xs px-2.5 py-1 rounded-full"
              style={{ background: `${typ.color}20`, color: typ.color, border: `1px solid ${typ.color}44` }}>
              {typ.icon} {typ.label}
            </span>
            <span className="font-cinzel text-xs px-2.5 py-1 rounded-full"
              style={{ background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}44` }}>
              {st.icon} {st.label}
            </span>
          </div>
          <h2 className="font-cinzel text-2xl font-bold" style={{ color: 'var(--gold)' }}>{quest.title}</h2>
        </div>
        <button className="btn btn-ghost shrink-0" onClick={onEdit}>
          <IconPencil size={14} /> Редактировать
        </button>
      </div>

      {/* Смена статуса */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {QUEST_STATUSES.map(s => (
          <button key={s.id}
            className="font-cinzel text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-all"
            style={{
              background: quest.status === s.id ? `${s.color}22` : 'var(--bg-row)',
              color:      quest.status === s.id ? s.color : 'var(--text-muted)',
              border:     `1px solid ${quest.status === s.id ? s.color + '66' : 'var(--border)'}`,
            }}
            onClick={() => updateStatus(quest.id, s.id)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <hr style={{ borderColor: 'rgba(226,201,126,0.2)', marginBottom: 16 }} />

      {/* Контент */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'start' }}>
        {quest.description && (
          <Card title="Описание">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{quest.description}</p>
          </Card>
        )}
        {quest.conditionsGet && (
          <Card title="Условия получения">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{quest.conditionsGet}</p>
          </Card>
        )}
        {quest.conditionsDone && (
          <Card title="Условия выполнения">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{quest.conditionsDone}</p>
          </Card>
        )}
        {quest.reward && (
          <Card title="Награда">
            <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>{quest.reward}</p>
          </Card>
        )}
        {(giverNpc || relNpcs.length > 0) && (
          <Card title="НПС">
            {giverNpc && (
              <div className="mb-2 flex items-center gap-2">
                <span className="font-cinzel text-[9px] px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: 'rgba(226,201,126,0.15)', color: 'var(--gold)' }}>Квестодатель</span>
                <button className="font-cinzel text-xs text-left transition-colors"
                  style={{ color: 'var(--text)', textDecoration: onOpenNpc ? 'underline' : 'none', textDecorationColor: 'rgba(255,255,255,0.2)', cursor: onOpenNpc ? 'pointer' : 'default' }}
                  onClick={() => onOpenNpc?.(giverNpc)}>
                  {giverNpc.name}
                </button>
              </div>
            )}
            {relNpcs.map(n => (
              <div key={n.id} className="py-0.5">
                <button className="font-cinzel text-xs text-left transition-colors"
                  style={{ color: 'var(--text-dim)', textDecoration: onOpenNpc ? 'underline' : 'none', textDecorationColor: 'rgba(255,255,255,0.15)', cursor: onOpenNpc ? 'pointer' : 'default' }}
                  onClick={() => onOpenNpc?.(n)}>
                  • {n.name}
                </button>
              </div>
            ))}
          </Card>
        )}
        {relLocs.length > 0 && (
          <Card title="Локации">
            {relLocs.map(l => (
              <div key={l.id} className="py-0.5">
                <button className="font-cinzel text-xs text-left transition-colors"
                  style={{ color: 'var(--text-dim)', textDecoration: onOpenLocation ? 'underline' : 'none', textDecorationColor: 'rgba(255,255,255,0.15)', cursor: onOpenLocation ? 'pointer' : 'default' }}
                  onClick={() => onOpenLocation?.(l)}>
                  • {l.title}
                </button>
              </div>
            ))}
          </Card>
        )}
        {quest.notes && (
          <Card title="Заметки ДМ 🔒">
            <p className="text-sm" style={{ color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>{quest.notes}</p>
          </Card>
        )}
      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
      <div className="font-cinzel text-[10px] uppercase tracking-widest px-3 py-1.5"
        style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(226,201,126,0.15)', background: 'rgba(226,201,126,0.04)' }}>
        {title}
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}
