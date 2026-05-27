import { useState } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { useQuestStore } from '../../store/questStore'
import { QUEST_TYPES, QUEST_STATUSES, EMPTY_QUEST } from '../../data/questDb'

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
              <select className={iCls} style={{ ...iStyle, cursor: 'pointer' }}
                value={form.questGiverNpcId ?? ''}
                onChange={e => set('questGiverNpcId', e.target.value ? Number(e.target.value) : null)}>
                <option value="">— Не указан —</option>
                {npcs.map(n => <option key={n.id} value={n.id}>{n.name}{n.role ? ` (${n.role})` : ''}</option>)}
              </select>
            </div>
          )}

          {/* Связанные НПС */}
          {npcs.length > 0 && (
            <div>
              <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>Связанные НПС</label>
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-md)', maxHeight: 140, overflowY: 'auto' }}>
                {npcs.map(n => {
                  const checked = (form.relatedNpcIds ?? []).includes(n.id)
                  return (
                    <label key={n.id} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer"
                      style={{ background: checked ? 'var(--gold-dim)' : 'transparent', borderBottom: '0.5px solid var(--border)' }}>
                      <input type="checkbox" checked={checked}
                        onChange={() => toggleArr('relatedNpcIds', n.id)} />
                      <span className="font-cinzel text-xs" style={{ color: checked ? 'var(--gold)' : 'var(--text-dim)' }}>
                        {n.name}{n.role ? ` — ${n.role}` : ''}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Связанные локации */}
          {locations.length > 0 && (
            <div>
              <label className="font-cinzel text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>Связанные локации</label>
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-md)', maxHeight: 140, overflowY: 'auto' }}>
                {locations.map(l => {
                  const checked = (form.relatedLocationIds ?? []).includes(l.id)
                  return (
                    <label key={l.id} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer"
                      style={{ background: checked ? 'var(--gold-dim)' : 'transparent', borderBottom: '0.5px solid var(--border)' }}>
                      <input type="checkbox" checked={checked}
                        onChange={() => toggleArr('relatedLocationIds', l.id)} />
                      <span className="font-cinzel text-xs" style={{ color: checked ? 'var(--gold)' : 'var(--text-dim)' }}>{l.title}</span>
                    </label>
                  )
                })}
              </div>
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
