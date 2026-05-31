import { useEffect, useState } from 'react'
import { IconPlus, IconSearch, IconDownload, IconUpload, IconPencil, IconX } from '@tabler/icons-react'
import { useSpellStore } from '../../store/spellStore'
import {
  SPELL_SCHOOLS, SPELL_SCHOOL_MAP, SPELL_SOURCES, SPELL_CLASSES,
  formatCastingTime, formatRange, formatDuration,
} from '../../data/spellDb'
import SpellForm from './SpellForm'

const LEVEL_LABELS = ['Заговор', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

export default function SpellPage() {
  const { spells, loading, loadAll, exportJSON, importJSON } = useSpellStore()
  const [search,      setSearch]      = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterSchool,setFilterSchool]= useState('all')
  const [filterConc,  setFilterConc]  = useState('all')
  const [filterRitual,setFilterRitual]= useState('all')
  const [filterSource,setFilterSource]= useState('all')
  const [selected,    setSelected]    = useState(null)
  const [formOpen,    setFormOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)

  useEffect(() => { loadAll() }, [])

  // Live version from store
  const liveSelected = selected ? spells.find(s => s.id === selected.id) ?? selected : null

  const filtered = spells.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.nameEn?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterLevel  !== 'all' && String(s.level) !== filterLevel) return false
    if (filterSchool !== 'all' && s.school !== filterSchool) return false
    if (filterConc   !== 'all' && String(s.concentration) !== filterConc) return false
    if (filterRitual !== 'all' && String(s.ritual) !== filterRitual) return false
    if (filterSource !== 'all' && s.source !== filterSource) return false
    return true
  }).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'ru'))

  // Group by level
  const byLevel = {}
  filtered.forEach(s => {
    if (!byLevel[s.level]) byLevel[s.level] = []
    byLevel[s.level].push(s)
  })

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    importJSON(file).catch(err => alert('Ошибка: ' + err.message))
    e.target.value = ''
  }

  const filterBtnStyle = (active) => ({
    fontFamily: 'Cinzel, serif',
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 6,
    cursor: 'pointer',
    background: active ? 'var(--gold-dim)' : 'var(--bg-row)',
    color: active ? 'var(--gold)' : 'var(--text-muted)',
    border: `1px solid ${active ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
  })

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── ЛЕВАЯ ПАНЕЛЬ ── */}
      <div className="flex flex-col shrink-0 overflow-hidden"
        style={{ width: 320, borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}>

        {/* Поиск */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)' }}>
            <IconSearch size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text)' }}
              placeholder="Поиск заклинания..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Фильтры */}
        <div className="px-3 py-2 border-b flex flex-col gap-2" style={{ borderColor: 'var(--border)' }}>
          {/* Уровень */}
          <div className="flex flex-wrap gap-1">
            <button style={filterBtnStyle(filterLevel === 'all')} onClick={() => setFilterLevel('all')}>Все</button>
            {[0,1,2,3,4,5,6,7,8,9].map(l => (
              <button key={l} style={filterBtnStyle(filterLevel === String(l))}
                onClick={() => setFilterLevel(filterLevel === String(l) ? 'all' : String(l))}>
                {LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
          {/* Школа */}
          <div className="flex flex-wrap gap-1">
            <button style={filterBtnStyle(filterSchool === 'all')} onClick={() => setFilterSchool('all')}>Все школы</button>
            {SPELL_SCHOOLS.map(s => (
              <button key={s.id} style={filterBtnStyle(filterSchool === s.id)}
                onClick={() => setFilterSchool(filterSchool === s.id ? 'all' : s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          {/* Концентрация / Ритуал / Источник */}
          <div className="flex flex-wrap gap-1">
            {[
              { label: 'Конц.',   val: 'true',  state: filterConc,   set: setFilterConc },
              { label: 'Ритуал',  val: 'true',  state: filterRitual, set: setFilterRitual },
            ].map(({ label, val, state, set: setF }) => (
              <button key={label} style={filterBtnStyle(state === val)}
                onClick={() => setF(state === val ? 'all' : val)}>
                {label}
              </button>
            ))}
            {SPELL_SOURCES.map(s => (
              <button key={s.id} style={filterBtnStyle(filterSource === s.id)}
                onClick={() => setFilterSource(filterSource === s.id ? 'all' : s.id)}>
                {s.id}
              </button>
            ))}
          </div>
        </div>

        {/* Кнопка добавления */}
        <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-add w-full justify-center" style={{ fontSize: 12 }}
            onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <IconPlus size={13} /> Добавить заклинание
          </button>
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && <div className="text-center py-8 font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <div className="text-3xl mb-2">📖</div>
              <div className="font-cinzel text-xs">Заклинаний не найдено</div>
            </div>
          )}
          {[0,1,2,3,4,5,6,7,8,9].filter(l => byLevel[l]).map(lvl => (
            <div key={lvl} className="mb-3">
              <div className="font-cinzel text-[10px] uppercase tracking-widest px-2 py-1 mb-1"
                style={{ color: 'var(--text-muted)' }}>
                {lvl === 0 ? 'Заговоры' : `${lvl} уровень`}
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px]"
                  style={{ background: 'var(--bg-row)', color: 'var(--text-muted)' }}>
                  {byLevel[lvl].length}
                </span>
              </div>
              {byLevel[lvl].map(s => {
                const isActive = liveSelected?.id === s.id
                return (
                  <div key={s.id} onClick={() => setSelected(s)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1 cursor-pointer transition-all"
                    style={{
                      background: isActive ? 'var(--gold-dim)' : 'var(--bg-row)',
                      border: `1px solid ${isActive ? 'rgba(226,201,126,0.35)' : 'var(--border)'}`,
                    }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-cinzel text-sm font-semibold truncate"
                        style={{ color: isActive ? 'var(--gold)' : 'var(--text)' }}>
                        {s.name}
                      </div>
                      <div className="font-cinzel text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {SPELL_SCHOOL_MAP[s.school]?.label ?? s.school}
                        {s.concentration && ' · Конц.'}
                        {s.ritual && ' · Ритуал'}
                      </div>
                    </div>
                    <button className="icon-btn shrink-0" style={{ width: 22, height: 22 }}
                      onClick={e => { e.stopPropagation(); setEditTarget(s); setFormOpen(true) }}>
                      <IconPencil size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Экспорт / Импорт */}
        <div className="px-3 py-2 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-ghost flex-1 justify-center" style={{ fontSize: 11 }} onClick={exportJSON}>
            <IconDownload size={13} /> Экспорт
          </button>
          <label className="btn btn-ghost flex-1 justify-center cursor-pointer" style={{ fontSize: 11 }}>
            <IconUpload size={13} /> Импорт
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* ── ПРАВАЯ ПАНЕЛЬ ── */}
      <div className="flex-1 overflow-hidden">
        {liveSelected
          ? <SpellDetailView spell={liveSelected} onEdit={() => { setEditTarget(liveSelected); setFormOpen(true) }} />
          : (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
              <div className="text-center">
                <div className="text-4xl mb-3">📖</div>
                <div className="font-cinzel text-sm">Выбери заклинание из списка</div>
              </div>
            </div>
          )
        }
      </div>

      {/* Форма */}
      {formOpen && (
        <SpellForm
          initial={editTarget ?? {}}
          onClose={() => { setFormOpen(false); setEditTarget(null) }}
          onSaved={s => { setSelected(s); setFormOpen(false); setEditTarget(null) }}
        />
      )}
    </div>
  )
}

// ─── КАРТОЧКА ЗАКЛИНАНИЯ ──────────────────────────────────────────────────────
function SpellDetailView({ spell: s, onEdit }) {
  const school = SPELL_SCHOOL_MAP[s.school]
  const castTime = formatCastingTime(s.castingTime)
  const range    = formatRange(s.range)
  const duration = formatDuration(s.duration, s.concentration)
  const source   = SPELL_SOURCES.find(x => x.id === s.source)

  const compParts = []
  if (s.components?.verbal)   compParts.push('Вербальный')
  if (s.components?.somatic)  compParts.push('Соматический')
  if (s.components?.material) compParts.push(`Материальный${s.components.materialDesc ? ` (${s.components.materialDesc})` : ''}`)

  return (
    <div className="overflow-y-auto h-full p-5">
      {/* Шапка */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="font-cinzel text-2xl font-bold mb-0.5" style={{ color: 'var(--gold)' }}>{s.name}</h2>
          {s.nameEn && <p className="font-cinzel text-sm italic" style={{ color: 'var(--text-muted)' }}>{s.nameEn}</p>}
        </div>
        <button className="btn btn-ghost shrink-0" onClick={onEdit}><IconPencil size={14} /> Редактировать</button>
      </div>

      {/* Уровень / Школа / Ритуал / Источник */}
      <div className="flex items-center gap-2 flex-wrap mb-4"
        style={{ background: 'var(--bg-row)', borderRadius: 10, padding: '8px 14px', border: '1px solid var(--border)' }}>
        <span className="font-cinzel text-sm italic" style={{ color: 'var(--text-dim)', flex: 1 }}>
          {s.level === 0 ? 'Заговор' : `${s.level} уровень`}{school ? `, ${school.label.toLowerCase()}` : ''}
          {s.ritual ? ' (ритуал)' : ''}
        </span>
        {source && (
          <span className="font-cinzel text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: s.source === 'HB' ? 'rgba(167,139,250,0.12)' : 'rgba(226,201,126,0.08)', color: s.source === 'HB' ? '#c4b5fd' : 'var(--gold)', border: `0.5px solid ${s.source === 'HB' ? 'rgba(167,139,250,0.3)' : 'rgba(226,201,126,0.25)'}` }}>
            Источник: {s.source}
          </span>
        )}
      </div>

      {/* Таблица: Время / Дистанция / Длительность */}
      <table className="w-full mb-3 rounded-xl overflow-hidden text-sm"
        style={{ border: '1px solid var(--border)', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Время накладывания', 'Дистанция', 'Длительность'].map(h => (
              <th key={h} className="font-cinzel text-[10px] uppercase tracking-widest px-4 py-2 text-left"
                style={{ background: 'var(--bg-row)', color: 'var(--text-muted)', fontWeight: 600 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {[castTime, range, duration].map((v, i) => (
              <td key={i} className="px-4 py-2.5" style={{ color: 'var(--text-dim)', verticalAlign: 'top', borderRight: i < 2 ? '1px solid var(--border)' : 'none', background: 'var(--bg-panel)' }}>
                {v}
              </td>
            ))}
          </tr>
        </tbody>
        {compParts.length > 0 && (
          <tfoot>
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td colSpan={3} className="px-4 py-2.5" style={{ background: 'var(--bg-panel)' }}>
                <span className="font-cinzel text-[10px] uppercase tracking-widest font-semibold mr-2"
                  style={{ color: 'var(--text-muted)' }}>Компоненты:</span>
                <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{compParts.join(', ')}</span>
              </td>
            </tr>
          </tfoot>
        )}
      </table>

      {/* Описание */}
      {s.description && (
        <div className="mb-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-dim)' }}>
            {s.description}
          </p>
        </div>
      )}

      {/* На более высоких уровнях */}
      {s.higherLevels && (
        <div className="mb-4 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(226,201,126,0.05)', border: '1px solid rgba(226,201,126,0.2)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            <span className="font-cinzel font-bold" style={{ color: 'var(--gold)' }}>На более высоких уровнях: </span>
            {s.higherLevels}
          </p>
        </div>
      )}

      {/* Классы */}
      {s.classes?.length > 0 && (
        <div>
          <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Классы:
          </div>
          <div className="flex flex-wrap gap-1">
            {s.classes.map(cls => (
              <span key={cls} className="font-cinzel text-[10px] px-2 py-0.5 rounded-md"
                style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '0.5px solid rgba(226,201,126,0.3)' }}>
                {cls}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
