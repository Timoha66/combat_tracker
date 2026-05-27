import { useState, useRef, useEffect } from 'react'
import { IconX, IconCheck, IconSearch, IconChevronDown } from '@tabler/icons-react'
import { useQuestStore } from '../../store/questStore'
import { QUEST_TYPES, QUEST_STATUSES, EMPTY_QUEST } from '../../data/questDb'

// ─── Одиночный выбор с поиском ────────────────────────────────────────────────
function SearchableSelect({ value, onChange, options, placeholder = '— Не указан —', labelKey = 'name', idKey = 'id' }) {
  const [query,  setQuery]  = useState('')
  const [open,   setOpen]   = useState(false)
  const ref = useRef(null)

  const selected = options.find(o => o[idKey] === value)
  const filtered = options.filter(o =>
    !query || o[labelKey].toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const iStyle = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ ...iStyle, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px' }}
        onClick={() => { setOpen(o => !o); setQuery('') }}>
        <span className="flex-1 text-sm" style={{ color: selected ? 'var(--text)' : 'var(--text-muted)' }}>
          {selected ? selected[labelKey] : placeholder}
        </span>
        {selected && (
          <button style={{ color: 'var(--text-muted)', lineHeight: 1 }} onClick={e => { e.stopPropagation(); onChange(null) }}>
            <IconX size={13} />
          </button>
        )}
        <IconChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4,
          background: 'var(--bg-panel)', border: '1px solid var(--border-md)', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-deep)', borderRadius: 6, padding: '4px 8px' }}>
              <IconSearch size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input autoFocus className="bg-transparent outline-none text-sm flex-1" style={{ color: 'var(--text)' }}
                placeholder="Поиск..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            <div style={{ padding: '4px 12px 6px', cursor: 'pointer', borderBottom: '0.5px solid var(--border)' }}
              className="text-sm" onClick={() => { onChange(null); setOpen(false) }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-row)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{ color: 'var(--text-muted)', paddingTop: 8, paddingBottom: 8 }}>
              — Не указан —
            </div>
            {filtered.map(o => (
              <div key={o[idKey]} onClick={() => { onChange(o[idKey]); setOpen(false) }}
                style={{ padding: '6px 12px', cursor: 'pointer', background: value === o[idKey] ? 'var(--gold-dim)' : 'transparent',
                  borderBottom: '0.5px solid var(--border)' }}
                onMouseEnter={e => { if (value !== o[idKey]) e.currentTarget.style.background = 'var(--bg-row)' }}
                onMouseLeave={e => { if (value !== o[idKey]) e.currentTarget.style.background = 'transparent' }}>
                <span className="font-cinzel text-xs" style={{ color: value === o[idKey] ? 'var(--gold)' : 'var(--text-dim)' }}>
                  {o[labelKey]}
                </span>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-xs px-3 py-3" style={{ color: 'var(--text-muted)' }}>Ничего не найдено</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Множественный выбор с поиском ───────────────────────────────────────────
function SearchableMulti({ ids, onChange, options, labelKey = 'name', idKey = 'id' }) {
  const [query, setQuery] = useState('')
  const filtered = options.filter(o =>
    !query || o[labelKey].toLowerCase().includes(query.toLowerCase())
  )
  const iStyle = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }

  function toggle(id) {
    onChange(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  return (
    <div style={{ border: '1px solid var(--border-md)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg-deep)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconSearch size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input className="bg-transparent outline-none text-sm flex-1" style={{ color: 'var(--text)' }}
            placeholder="Поиск..." value={query} onChange={e => setQuery(e.target.value)} />
          {query && <button onClick={() => setQuery('')}><IconX size={11} style={{ color: 'var(--text-muted)' }} /></button>}
        </div>
      </div>
      <div style={{ maxHeight: 150, overflowY: 'auto' }}>
        {filtered.map(o => {
          const checked = ids.includes(o[idKey])
          return (
            <label key={o[idKey]} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer"
              style={{ background: checked ? 'var(--gold-dim)' : 'transparent', borderBottom: '0.5px solid var(--border)' }}>
              <input type="checkbox" checked={checked} onChange={() => toggle(o[idKey])} style={{ accentColor: 'var(--gold)' }} />
              <span className="font-cinzel text-xs" style={{ color: checked ? 'var(--gold)' : 'var(--text-dim)' }}>
                {o[labelKey]}
              </span>
            </label>
          )
        })}
        {filtered.length === 0 && <div className="text-xs px-3 py-3" style={{ color: 'var(--text-muted)' }}>Ничего не найдено</div>}
      </div>
      {ids.length > 0 && (
        <div style={{ padding: '4px 10px', borderTop: '1px solid var(--border)', background: 'var(--bg-deep)', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {ids.map(id => {
            const o = options.find(x => x[idKey] === id)
            if (!o) return null
            return (
              <span key={id} className="font-cinzel text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '0.5px solid rgba(226,201,126,0.3)' }}>
                {o[labelKey]}
                <button onClick={() => toggle(id)}><IconX size={9} /></button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function QuestForm({ initial, onClose, onSaved, npcs = [], locations = [] }) {
  const { addQuest, updateQuest } = useQuestStore()
  const isNew = !initial?.id
  const [form, setForm]   = useState({ ...EMPTY_QUEST, ...initial })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleArr(key, id) {
    const arr = form[key] ?? []
    set(key, arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])
  }

  async function handleSave() {
    if (!form.title.trim()) { alert('Введи название квеста'); return }
    setSaving(true)
    try {
      const saved = isNew ? await addQuest(form) : await updateQuest(form.id, form)
      onSaved(saved)
    } finally { setSaving(false) }
  }

  const iStyle = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }
  const iCls   = 'w-full rounded-lg px-3 py-1.5 text-sm outline-none'

  return (
    <div className="overlay" style={{ zIndex: 400 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-md)', width: 600, maxWidth: '95vw', maxHeight: '90vh' }}>

        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>
            {isNew ? 'Новый квест' : 'Редактировать квест'}
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Название */}
          <div>
            <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Название *</label>
            <input className={iCls} style={iStyle} value={form.title}
              onChange={e => set('title', e.target.value)} placeholder="Название квеста..." />
          </div>

          {/* Тип + Статус */}
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>Тип</label>
              <div className="flex flex-col gap-1">
                {QUEST_TYPES.map(t => (
                  <button key={t.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-left cursor-pointer"
                    style={{ background: form.type === t.id ? `${t.color}18` : 'var(--bg-row)', border: `1px solid ${form.type === t.id ? t.color + '55' : 'var(--border)'}` }}
                    onClick={() => set('type', t.id)}>
                    <span>{t.icon}</span>
                    <span className="font-cinzel text-xs" style={{ color: form.type === t.id ? t.color : 'var(--text-muted)' }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>Статус</label>
              <div className="flex flex-col gap-1">
                {QUEST_STATUSES.map(s => (
                  <button key={s.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-left cursor-pointer"
                    style={{ background: form.status === s.id ? `${s.color}18` : 'var(--bg-row)', border: `1px solid ${form.status === s.id ? s.color + '55' : 'var(--border)'}` }}
                    onClick={() => set('status', s.id)}>
                    <span>{s.icon}</span>
                    <span className="font-cinzel text-xs" style={{ color: form.status === s.id ? s.color : 'var(--text-muted)' }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Описание</label>
            <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 80 }}
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Краткое описание квеста..." />
          </div>

          {/* Условия */}
          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Условия получения</label>
              <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 70 }}
                value={form.conditionsGet} onChange={e => set('conditionsGet', e.target.value)}
                placeholder="Как игроки получат этот квест..." />
            </div>
            <div>
              <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Условия выполнения</label>
              <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 70 }}
                value={form.conditionsDone} onChange={e => set('conditionsDone', e.target.value)}
                placeholder="Что нужно сделать для выполнения..." />
            </div>
          </div>

          {/* Награда */}
          <div>
            <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Награда</label>
            <input className={iCls} style={iStyle} value={form.reward}
              onChange={e => set('reward', e.target.value)} placeholder="500 зм, магический предмет..." />
          </div>

          {/* Квестодатель */}
          {npcs.length > 0 && (
            <div>
              <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Квестодатель (НПС)</label>
              <SearchableSelect
                value={form.questGiverNpcId ?? null}
                onChange={v => set('questGiverNpcId', v)}
                options={npcs.map(n => ({ id: n.id, name: n.name + (n.role ? ` (${n.role})` : '') }))}
                placeholder="— Не указан —"
              />
            </div>
          )}

          {/* Связанные НПС */}
          {npcs.length > 0 && (
            <div>
              <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>Связанные НПС</label>
              <SearchableMulti
                ids={form.relatedNpcIds ?? []}
                onChange={v => set('relatedNpcIds', v)}
                options={npcs.map(n => ({ id: n.id, name: n.name + (n.role ? ` — ${n.role}` : '') }))}
              />
            </div>
          )}

          {/* Связанные локации */}
          {locations.length > 0 && (
            <div>
              <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>Связанные локации</label>
              <SearchableMulti
                ids={form.relatedLocationIds ?? []}
                onChange={v => set('relatedLocationIds', v)}
                options={locations.map(l => ({ id: l.id, name: l.title }))}
              />
            </div>
          )}

          {/* Заметки ДМ */}
          <div>
            <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Заметки ДМ 🔒</label>
            <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 70 }}
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Секреты, подсказки, напоминания..." />
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-cancel flex-1 justify-center" onClick={onClose}><IconX size={14} /> Отмена</button>
          <button className="btn btn-gold flex-1 justify-center" onClick={handleSave} disabled={saving}>
            <IconCheck size={14} /> {isNew ? 'Создать квест' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
