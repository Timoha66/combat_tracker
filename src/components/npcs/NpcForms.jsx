import { useState } from 'react'
import { IconX, IconPlus, IconTrash, IconCheck } from '@tabler/icons-react'
import { useNpcStore } from '../../store/npcStore'
import { EMPTY_FACTION, EMPTY_NPC, FACTION_STATUSES } from '../../data/npcDb'
import { QUEST_STATUSES } from '../../data/locationsDb'

// ─── ФОРМА ФРАКЦИИ ────────────────────────────────────────────────────────────
export function FactionForm({ initial, onClose, onSaved }) {
  const { addFaction, updateFaction } = useNpcStore()
  const isNew = !initial?.id
  const [form,    setForm]    = useState({ ...EMPTY_FACTION, ...initial })
  const [tagsStr, setTagsStr] = useState((initial?.tags ?? []).join(', '))
  const [saving,  setSaving]  = useState(false)

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }
  function addToArray(field, item) { setForm(f => ({ ...f, [field]: [...(f[field] ?? []), item] })) }
  function removeFromArray(field, idx) { setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) })) }
  function updateInArray(field, idx, updater) {
    setForm(f => ({ ...f, [field]: f[field].map((item, i) => i === idx ? updater(item) : item) }))
  }

  async function handleSave() {
    if (!form.title.trim()) { alert('Введи название'); return }
    setSaving(true)
    const final = { ...form, tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean) }
    try {
      let saved
      if (isNew) saved = await addFaction(final)
      else saved = await updateFaction(form.id, final)
      onSaved(saved)
    } finally { setSaving(false) }
  }

  const iStyle = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }
  const iCls   = 'w-full rounded-lg px-3 py-1.5 text-sm outline-none'
  const fStyle = { borderColor: 'rgba(226,201,126,0.5)' }

  return (
    <div className="overlay" style={{ zIndex: 300 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-md)', width: 560, maxWidth: '95vw', maxHeight: '88vh' }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>{isNew ? 'Новая фракция' : `Редактировать: ${form.title}`}</span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <FormSection title="Основное">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Название *">
                <input className={iCls} style={iStyle} value={form.title} onChange={e => set('title', e.target.value)} onFocus={e => Object.assign(e.target.style, fStyle)} onBlur={e => Object.assign(e.target.style, iStyle)} />
              </FormField>
              <FormField label="Тип">
                <input className={iCls} style={iStyle} value={form.type} placeholder="Торговая олигархия, Культ..." onChange={e => set('type', e.target.value)} onFocus={e => Object.assign(e.target.style, fStyle)} onBlur={e => Object.assign(e.target.style, iStyle)} />
              </FormField>
              <FormField label="Статус отношений">
                <select className={iCls} style={{ ...iStyle, cursor: 'pointer' }} value={form.status} onChange={e => set('status', e.target.value)}>
                  {FACTION_STATUSES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                </select>
              </FormField>
              <FormField label="Теги (через запятую)">
                <input className={iCls} style={iStyle} value={tagsStr} onChange={e => setTagsStr(e.target.value)} onFocus={e => Object.assign(e.target.style, fStyle)} onBlur={e => Object.assign(e.target.style, iStyle)} />
              </FormField>
            </div>
          </FormSection>
          <FormSection title="Описание">
            <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 80 }} value={form.description} placeholder="Цели, структура, особенности..." onChange={e => set('description', e.target.value)} />
          </FormSection>
          <FormSection title="Сведения">
            {form.info?.map((row, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className={iCls} style={{ ...iStyle, flex: '0 0 35%' }} value={row.label} placeholder="Параметр" onChange={e => updateInArray('info', i, x => ({ ...x, label: e.target.value }))} />
                <input className={iCls} style={{ ...iStyle, flex: 1 }} value={row.value} placeholder="Значение" onChange={e => updateInArray('info', i, x => ({ ...x, value: e.target.value }))} />
                <button className="icon-btn shrink-0" onClick={() => removeFromArray('info', i)}><IconTrash size={12} /></button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost w-full justify-center" style={{ fontSize: 12 }} onClick={() => addToArray('info', { label: '', value: '' })}><IconPlus size={13} /> Добавить строку</button>
          </FormSection>
          <FormSection title="Квесты фракции">
            {form.quests?.map((q, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input className={iCls} style={{ ...iStyle, flex: 1 }} value={q.title} placeholder="Квест" onChange={e => updateInArray('quests', i, x => ({ ...x, title: e.target.value }))} />
                <select className="rounded-lg px-2 py-1.5 text-xs outline-none shrink-0" style={{ ...iStyle, cursor: 'pointer' }} value={q.status} onChange={e => updateInArray('quests', i, x => ({ ...x, status: e.target.value }))}>
                  {QUEST_STATUSES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                </select>
                <button className="icon-btn shrink-0" onClick={() => removeFromArray('quests', i)}><IconTrash size={12} /></button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost w-full justify-center" style={{ fontSize: 12 }} onClick={() => addToArray('quests', { title: '', status: 'inactive' })}><IconPlus size={13} /> Добавить квест</button>
          </FormSection>
          <FormSection title="Заметки ДМ 🔒">
            <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 60 }} value={form.dmNotes ?? ''} onChange={e => set('dmNotes', e.target.value)} />
          </FormSection>
        </div>
        <div className="flex gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-cancel flex-1 justify-center" onClick={onClose}><IconX size={14} /> Отмена</button>
          <button className="btn btn-gold flex-1 justify-center" onClick={handleSave} disabled={saving}><IconCheck size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── ФОРМА НПС ────────────────────────────────────────────────────────────────
export function NpcForm({ initial, factionId, factions, onClose, onSaved }) {
  const { addNpc, updateNpc } = useNpcStore()
  const isNew = !initial?.id

  // Совместимость: старый factionId → новый factionIds
  const initFactionIds = initial?.factionIds
    ?? (initial?.factionId ? [initial.factionId] : factionId ? [factionId] : [])

  const [form,    setForm]    = useState({ ...EMPTY_NPC, ...initial, factionIds: initFactionIds })
  const [tagsStr, setTagsStr] = useState((initial?.tags ?? []).join(', '))
  const [saving,  setSaving]  = useState(false)

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }
  function addToArray(field, item) { setForm(f => ({ ...f, [field]: [...(f[field] ?? []), item] })) }
  function removeFromArray(field, idx) { setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) })) }
  function updateInArray(field, idx, updater) {
    setForm(f => ({ ...f, [field]: f[field].map((item, i) => i === idx ? updater(item) : item) }))
  }

  async function handleSave() {
    if (!form.name.trim()) { alert('Введи имя'); return }
    setSaving(true)
    const finalForm = { ...form, tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean) }
    try {
      let saved
      if (isNew) saved = await addNpc(finalForm)
      else saved = await updateNpc(form.id, finalForm)
      onSaved(saved)
    } finally { setSaving(false) }
  }

  const iStyle = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }
  const iCls   = 'w-full rounded-lg px-3 py-1.5 text-sm outline-none'

  return (
    <div className="overlay" style={{ zIndex: 300 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-md)', width: 660, maxWidth: '95vw', maxHeight: '90vh' }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>{isNew ? 'Новый НПС' : `Редактировать: ${form.name}`}</span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <FormSection title="Основное">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Имя *"><input className={iCls} style={iStyle} value={form.name} onChange={e => set('name', e.target.value)} /></FormField>
              <FormField label="Имя (англ.)"><input className={iCls} style={iStyle} value={form.nameEn} onChange={e => set('nameEn', e.target.value)} /></FormField>
              <FormField label="Роль / Должность"><input className={iCls} style={iStyle} value={form.role} placeholder="Торговый принц, Проводник..." onChange={e => set('role', e.target.value)} /></FormField>
              <FormField label="Мировоззрение"><input className={iCls} style={iStyle} value={form.alignment} placeholder="ЗД, НЗ, Н..." onChange={e => set('alignment', e.target.value)} /></FormField>
              <FormField label="Класс / Тип">
                <input className={iCls} style={iStyle}
                  value={(form.classTags ?? []).join(', ')}
                  placeholder="Маг [Mage], Наёмный убийца [Assassin]..."
                  onChange={e => set('classTags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} />
              </FormField>
              <FormField label="Раса / Вид">
                <input className={iCls} style={iStyle}
                  value={form.race ?? ''}
                  placeholder="Мужчина · Чультанец, Женщина · Балдуранка..."
                  onChange={e => set('race', e.target.value)} />
              </FormField>
              <FormField label="Фракции">
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-md)', maxHeight: 160, overflowY: 'auto' }}>
                  {factions.map(f => {
                    const checked = (form.factionIds ?? []).includes(f.id)
                    return (
                      <label key={f.id} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors"
                        style={{ background: checked ? 'var(--gold-dim)' : 'transparent', borderBottom: '0.5px solid var(--border)' }}>
                        <input type="checkbox" checked={checked}
                          onChange={e => {
                            const ids = form.factionIds ?? []
                            set('factionIds', e.target.checked ? [...ids, f.id] : ids.filter(id => id !== f.id))
                          }} />
                        <span className="font-cinzel text-xs" style={{ color: checked ? 'var(--gold)' : 'var(--text-dim)' }}>{f.title}</span>
                      </label>
                    )
                  })}
                </div>
              </FormField>
              <FormField label="Теги (через запятую)">
                <input className={iCls} style={iStyle} value={tagsStr}
                  placeholder="тег1, тег2, тег3"
                  onChange={e => setTagsStr(e.target.value)} />
              </FormField>
            </div>
          </FormSection>
          <FormSection title="Описание">
            <FormField label="Характер / Внешность">
              <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 70 }} value={form.character} onChange={e => set('character', e.target.value)} />
            </FormField>
            <FormField label="Знания / Заметки">
              <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 60 }} value={form.knowledge} onChange={e => set('knowledge', e.target.value)} />
            </FormField>
            <FormField label="Условия найма">
              <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 50 }} value={form.conditions} onChange={e => set('conditions', e.target.value)} />
            </FormField>
            <FormField label="Квест">
              <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 50 }} value={form.quest} onChange={e => set('quest', e.target.value)} />
            </FormField>
          </FormSection>
          <FormSection title="Секрет ДМ 🔒">
            <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 60 }} value={form.secret} onChange={e => set('secret', e.target.value)} />
          </FormSection>
          <FormSection title="Фразы">
            {form.phrases?.map((ph, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className={iCls} style={{ ...iStyle, flex: 1 }} value={ph} placeholder="«Цитата...»" onChange={e => updateInArray('phrases', i, () => e.target.value)} />
                <button className="icon-btn shrink-0" onClick={() => removeFromArray('phrases', i)}><IconTrash size={12} /></button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost w-full justify-center" style={{ fontSize: 12 }} onClick={() => addToArray('phrases', '')}><IconPlus size={13} /> Добавить фразу</button>
          </FormSection>
          <FormSection title="Торговля">
            {form.trade?.map((t, i) => (
              <div key={i} className="grid gap-2 mb-2" style={{ gridTemplateColumns: '1fr 80px 60px auto' }}>
                <input className={iCls} style={iStyle} value={t.name} placeholder="Товар" onChange={e => updateInArray('trade', i, x => ({ ...x, name: e.target.value }))} />
                <input className={iCls} style={iStyle} type="number" value={t.price} placeholder="Цена" onChange={e => updateInArray('trade', i, x => ({ ...x, price: Number(e.target.value) }))} />
                <input className={iCls} style={iStyle} value={t.currency} placeholder="ЗМ" onChange={e => updateInArray('trade', i, x => ({ ...x, currency: e.target.value }))} />
                <button className="icon-btn shrink-0" onClick={() => removeFromArray('trade', i)}><IconTrash size={12} /></button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost w-full justify-center" style={{ fontSize: 12 }} onClick={() => addToArray('trade', { name: '', price: 0, currency: 'ЗМ' })}><IconPlus size={13} /> Добавить товар</button>
            {form.trade?.length > 0 && (
              <textarea className={`${iCls} resize-none mt-2`} style={{ ...iStyle, minHeight: 40 }} value={form.tradeNote} placeholder="Примечание к торговле" onChange={e => set('tradeNote', e.target.value)} />
            )}
          </FormSection>
        </div>
        <div className="flex gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-cancel flex-1 justify-center" onClick={onClose}><IconX size={14} /> Отмена</button>
          <button className="btn btn-gold flex-1 justify-center" onClick={handleSave} disabled={saving}><IconCheck size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </div>
    </div>
  )
}

function FormSection({ title, children }) {
  return (
    <div className="mb-4">
      <div className="font-cinzel text-xs tracking-widest uppercase mb-2 pb-1" style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(226,201,126,0.2)' }}>{title}</div>
      {children}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div className="mb-2">
      <div className="font-cinzel text-[10px] tracking-wide uppercase mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      {children}
    </div>
  )
}
