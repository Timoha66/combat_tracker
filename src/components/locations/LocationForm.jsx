import { useState } from 'react'
import { IconX, IconPlus, IconTrash, IconCheck } from '@tabler/icons-react'
import { useLocationsStore } from '../../store/locationsStore'
import { EMPTY_LOCATION, LOCATION_CATEGORIES, QUICK_TAGS } from '../../data/locationsDb'

export default function LocationForm({ initial, onClose, onSaved }) {
  const { addLocation, updateLocation } = useLocationsStore()
  const isNew = !initial?.id

  const [form,    setForm]    = useState({ ...EMPTY_LOCATION, ...initial })
  const [tagsStr, setTagsStr] = useState((initial?.tags ?? []).join(', '))
  const [saving,  setSaving]  = useState(false)

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function addToArray(field, item) { setForm(f => ({ ...f, [field]: [...(f[field] ?? []), item] })) }
  function removeFromArray(field, idx) { setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) })) }
  function updateInArray(field, idx, updater) {
    setForm(f => ({ ...f, [field]: f[field].map((item, i) => i === idx ? updater(item) : item) }))
  }

  function toggleQuickTag(tag) {
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean)
    if (tags.includes(tag)) {
      setTagsStr(tags.filter(t => t !== tag).join(', '))
    } else {
      setTagsStr([...tags, tag].join(', '))
    }
  }

  async function handleSave() {
    if (!form.title.trim()) { alert('Введи название'); return }
    setSaving(true)
    const finalForm = { ...form, tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean) }
    try {
      let saved
      if (isNew) {
        saved = await addLocation(finalForm)
      } else {
        saved = await updateLocation(form.id, finalForm)
      }
      onSaved(saved)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full rounded-lg px-3 py-1.5 text-sm outline-none"
  const inputStyle = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }
  const focusStyle = { borderColor: 'rgba(226,201,126,0.5)' }

  const currentTags = tagsStr.split(',').map(t => t.trim()).filter(Boolean)

  return (
    <div className="overlay" style={{ zIndex: 200 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-md)', width: 680, maxWidth: '96vw', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>
            {isNew ? 'Новая локация' : `Редактировать: ${form.title}`}
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Основное */}
          <FormSection title="Основное">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Название *">
                <input className={inputCls} style={inputStyle} value={form.title}
                  onChange={e => set('title', e.target.value)}
                  onFocus={e => Object.assign(e.target.style, focusStyle)}
                  onBlur={e => Object.assign(e.target.style, inputStyle)} />
              </FormField>
              <FormField label="Название (англ.)">
                <input className={inputCls} style={inputStyle} value={form.en}
                  onChange={e => set('en', e.target.value)}
                  onFocus={e => Object.assign(e.target.style, focusStyle)}
                  onBlur={e => Object.assign(e.target.style, inputStyle)} />
              </FormField>
              <FormField label="Категория">
                <select className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.cat} onChange={e => set('cat', e.target.value)}>
                  {LOCATION_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Тип (уточнение)">
                <input className={inputCls} style={inputStyle} value={form.type}
                  placeholder="Город, Руины, Бухта..."
                  onChange={e => set('type', e.target.value)}
                  onFocus={e => Object.assign(e.target.style, focusStyle)}
                  onBlur={e => Object.assign(e.target.style, inputStyle)} />
              </FormField>
            </div>
          </FormSection>

          {/* Теги */}
          <FormSection title="Теги">
            <div className="flex flex-wrap gap-1 mb-2">
              {QUICK_TAGS.map(t => (
                <button key={t} type="button"
                  onClick={() => toggleQuickTag(t)}
                  className="font-cinzel text-[10px] px-2 py-0.5 rounded-md transition-all cursor-pointer"
                  style={{
                    background: currentTags.includes(t) ? 'var(--gold-dim)' : 'var(--bg-row)',
                    color: currentTags.includes(t) ? 'var(--gold)' : 'var(--text-muted)',
                    border: `1px solid ${currentTags.includes(t) ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
                  }}>
                  {t}
                </button>
              ))}
            </div>
            <input className={inputCls} style={inputStyle}
              value={tagsStr}
              placeholder="Теги через запятую..."
              onChange={e => setTagsStr(e.target.value)}
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, inputStyle)} />
          </FormSection>

          {/* Описание */}
          <FormSection title="Описание">
            <FormField label="Атмосфера">
              <textarea className={`${inputCls} resize-none`} style={{ ...inputStyle, minHeight: 70 }}
                value={form.atmosphere} onChange={e => set('atmosphere', e.target.value)}
                placeholder="Как выглядит, как ощущается, что запоминается..." />
            </FormField>
            <FormField label="Характеристики">
              <textarea className={`${inputCls} resize-none`} style={{ ...inputStyle, minHeight: 70 }}
                value={form.chars} onChange={e => set('chars', e.target.value)}
                placeholder="Устройство, власть, районы, особенности..." />
            </FormField>
          </FormSection>

          {/* НПС */}
          <FormSection title="НПС">
            {form.npcs?.map((npc, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <input className={inputCls} style={inputStyle} value={npc.name}
                    placeholder="Имя"
                    onChange={e => updateInArray('npcs', i, x => ({ ...x, name: e.target.value }))} />
                  <input className={inputCls} style={inputStyle} value={npc.description}
                    placeholder="Кто такой, чем полезен..."
                    onChange={e => updateInArray('npcs', i, x => ({ ...x, description: e.target.value }))} />
                </div>
                <button className="icon-btn shrink-0" onClick={() => removeFromArray('npcs', i)}>
                  <IconTrash size={12} />
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost w-full justify-center" style={{ fontSize: 12 }}
              onClick={() => addToArray('npcs', { name: '', description: '' })}>
              <IconPlus size={13} /> Добавить НПС
            </button>
          </FormSection>

          {/* Точки интереса */}
          <FormSection title="Точки интереса">
            {form.points?.map((p, pi) => (
              <div key={pi} className="mb-3 p-3 rounded-xl" style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <input className={inputCls} style={{ ...inputStyle, flex: 1 }} value={p.title}
                    placeholder="Название точки (Таверна, Рынок...)"
                    onChange={e => updateInArray('points', pi, x => ({ ...x, title: e.target.value }))} />
                  <button className="icon-btn shrink-0" onClick={() => removeFromArray('points', pi)}>
                    <IconTrash size={12} />
                  </button>
                </div>
                <textarea className={`${inputCls} resize-none mb-2`} style={{ ...inputStyle, minHeight: 50 }}
                  value={p.description} placeholder="Описание..."
                  onChange={e => updateInArray('points', pi, x => ({ ...x, description: e.target.value }))} />

                {/* НПС точки */}
                <div className="font-cinzel text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>НПС</div>
                {p.npcs?.map((n, ni) => (
                  <div key={ni} className="flex gap-2 mb-1.5">
                    <input className={inputCls} style={{ ...inputStyle, flex: 1 }} value={n.name}
                      placeholder="Имя"
                      onChange={e => updateInArray('points', pi, x => ({ ...x, npcs: x.npcs.map((nn, nni) => nni === ni ? { ...nn, name: e.target.value } : nn) }))} />
                    <input className={inputCls} style={{ ...inputStyle, flex: 2 }} value={n.description}
                      placeholder="Описание"
                      onChange={e => updateInArray('points', pi, x => ({ ...x, npcs: x.npcs.map((nn, nni) => nni === ni ? { ...nn, description: e.target.value } : nn) }))} />
                    <button className="icon-btn shrink-0"
                      onClick={() => updateInArray('points', pi, x => ({ ...x, npcs: x.npcs.filter((_, nni) => nni !== ni) }))}>
                      <IconTrash size={11} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost justify-center mb-2" style={{ fontSize: 11, width: '100%' }}
                  onClick={() => updateInArray('points', pi, x => ({ ...x, npcs: [...(x.npcs ?? []), { name: '', description: '' }] }))}>
                  <IconPlus size={12} /> НПС
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost w-full justify-center" style={{ fontSize: 12 }}
              onClick={() => addToArray('points', { title: '', description: '', npcs: [] })}>
              <IconPlus size={13} /> Добавить точку интереса
            </button>
          </FormSection>

          {/* Заметки ДМ */}
          <FormSection title="Заметки ДМ 🔒">
            <textarea
              className={`${inputCls} resize-none`}
              style={{ ...inputStyle, minHeight: 80 }}
              value={form.dmNotes ?? ''}
              placeholder="Личные заметки, секреты, напоминания..."
              onChange={e => set('dmNotes', e.target.value)}
            />
          </FormSection>

        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-cancel flex-1 justify-center" onClick={onClose}>
            <IconX size={14} /> Отмена
          </button>
          <button className="btn btn-gold flex-1 justify-center" onClick={handleSave} disabled={saving}>
            <IconCheck size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormSection({ title, children }) {
  return (
    <div className="mb-5">
      <div className="font-cinzel text-xs tracking-widest uppercase mb-2 pb-1" style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(226,201,126,0.2)' }}>
        {title}
      </div>
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
