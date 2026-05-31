import { useState } from 'react'
import { IconX, IconCheck, IconTrash, IconPlus } from '@tabler/icons-react'
import { useSpellStore } from '../../store/spellStore'
import {
  EMPTY_SPELL, SPELL_SCHOOLS, SPELL_CLASSES, SPELL_SOURCES,
  CASTING_TIME_UNITS, RANGE_TYPES, DURATION_TYPES,
  EFFECT_TYPES, SAVE_ABILITIES,
} from '../../data/spellDb'
import { DMG_TYPES } from '../../data/constants'

export default function SpellForm({ initial, onClose, onSaved }) {
  const { addSpell, updateSpell, deleteSpell } = useSpellStore()
  const isNew = !initial?.id
  const [form, setForm]   = useState({ ...EMPTY_SPELL, ...initial })
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }
  function setNested(field, key, value) { setForm(f => ({ ...f, [field]: { ...f[field], [key]: value } })) }
  function setComp(key, value) { setForm(f => ({ ...f, components: { ...f.components, [key]: value } })) }
  function setEffect(key, value) { setForm(f => ({ ...f, effect: { ...f.effect, [key]: value } })) }
  function setEffectDamage(idx, key, value) {
    setForm(f => ({
      ...f,
      effect: {
        ...f.effect,
        damages: (f.effect?.damages ?? []).map((d, i) => i === idx ? { ...d, [key]: value } : d),
      },
    }))
  }

  function toggleClass(cls) {
    const arr = form.classes ?? []
    set('classes', arr.includes(cls) ? arr.filter(c => c !== cls) : [...arr, cls])
  }

  async function handleSave() {
    if (!form.name.trim()) { alert('Введи название'); return }
    setSaving(true)
    try {
      const saved = isNew ? await addSpell(form) : await updateSpell(form.id, form)
      onSaved(saved)
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm(`Удалить «${form.name}»?`)) return
    await deleteSpell(form.id)
    onClose()
  }

  const iStyle = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }
  const iCls   = 'w-full rounded-lg px-3 py-1.5 text-sm outline-none'
  const selCls = `${iCls} cursor-pointer`

  const castUnit   = CASTING_TIME_UNITS.find(u => u.id === form.castingTime?.unit)
  const rangeType  = RANGE_TYPES.find(t => t.id === form.range?.type)
  const durType    = DURATION_TYPES.find(t => t.id === form.duration?.type)

  return (
    <div className="overlay" style={{ zIndex: 400 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-md)', width: 640, maxWidth: '96vw', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>
            {isNew ? 'Новое заклинание' : `Редактировать: ${form.name}`}
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

          {/* ── ОБЩЕЕ ── */}
          <FormSection title="Общее">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2 grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Название *</Label>
                  <input className={iCls} style={iStyle} value={form.name}
                    placeholder="Огненный шар" onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <Label>Уровень</Label>
                  <input className={iCls} style={iStyle} type="number" min={0} max={9}
                    value={form.level}
                    onChange={e => set('level', Math.max(0, Math.min(9, Number(e.target.value) || 0)))} />
                </div>
              </div>
              <div>
                <Label>Название (англ.)</Label>
                <input className={iCls} style={iStyle} value={form.nameEn ?? ''}
                  placeholder="Fireball" onChange={e => set('nameEn', e.target.value)} />
              </div>
              <div>
                <Label>Школа</Label>
                <select className={selCls} style={iStyle} value={form.school} onChange={e => set('school', e.target.value)}>
                  {SPELL_SCHOOLS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </FormSection>

          {/* ── КОМПОНЕНТЫ ── */}
          <FormSection title="Компоненты">
            <div className="flex gap-2 mb-2">
              {[
                { key: 'verbal',   label: 'Вербальный' },
                { key: 'somatic',  label: 'Соматический' },
                { key: 'material', label: 'Материальный' },
              ].map(({ key, label }) => {
                const active = form.components?.[key]
                return (
                  <button key={key} type="button" onClick={() => setComp(key, !active)}
                    className="font-cinzel text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    style={{
                      background: active ? 'var(--gold-dim)' : 'var(--bg-row)',
                      color:      active ? 'var(--gold)' : 'var(--text-dim)',
                      border:     `1px solid ${active ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
                    }}>
                    {label}
                  </button>
                )
              })}
            </div>
            {form.components?.material && (
              <input className={iCls} style={iStyle}
                placeholder="Описание материального компонента..."
                value={form.components.materialDesc ?? ''}
                onChange={e => setComp('materialDesc', e.target.value)} />
            )}
          </FormSection>

          {/* ── ВРЕМЯ НАКЛАДЫВАНИЯ ── */}
          <FormSection title="Время накладывания">
            <div className="flex gap-2 items-end">
              {castUnit?.hasCount && (
                <div style={{ width: 80 }}>
                  <Label>Кол-во</Label>
                  <input className={iCls} style={iStyle} type="number" min={1}
                    value={form.castingTime?.value ?? 1}
                    onChange={e => setNested('castingTime', 'value', Number(e.target.value) || 1)} />
                </div>
              )}
              <div className="flex-1">
                <Label>Единица</Label>
                <select className={selCls} style={iStyle}
                  value={form.castingTime?.unit ?? 'action'}
                  onChange={e => setNested('castingTime', 'unit', e.target.value)}>
                  {CASTING_TIME_UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
              </div>
            </div>
            {castUnit?.hasCondition && (
              <div className="mt-2">
                <Label>{form.castingTime?.unit === 'reaction' ? 'Условие реакции' : 'Условие'}</Label>
                <input className={iCls} style={iStyle}
                  placeholder={form.castingTime?.unit === 'reaction' ? 'совершаемая вами в ответ на...' : 'Описание...'}
                  value={form.castingTime?.condition ?? ''}
                  onChange={e => setNested('castingTime', 'condition', e.target.value)} />
              </div>
            )}
          </FormSection>

          {/* ── ДИСТАНЦИЯ ── */}
          <FormSection title="Дистанция">
            <div className="flex gap-2 items-end">
              {rangeType?.hasValue && (
                <div style={{ width: 80 }}>
                  <Label>Значение</Label>
                  <input className={iCls} style={iStyle} type="number" min={0}
                    value={form.range?.value ?? 0}
                    onChange={e => setNested('range', 'value', Number(e.target.value) || 0)} />
                </div>
              )}
              <div className="flex-1">
                <Label>Тип</Label>
                <select className={selCls} style={iStyle}
                  value={form.range?.type ?? 'feet'}
                  onChange={e => setNested('range', 'type', e.target.value)}>
                  {RANGE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {rangeType?.hasCondition && (
              <div className="mt-2">
                <Label>Условие</Label>
                <input className={iCls} style={iStyle} placeholder="Описание дистанции..."
                  value={form.range?.condition ?? ''}
                  onChange={e => setNested('range', 'condition', e.target.value)} />
              </div>
            )}
          </FormSection>

          {/* ── ДЛИТЕЛЬНОСТЬ ── */}
          <FormSection title="Длительность">
            <div className="flex gap-2 items-center mb-2">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: 11, color: form.concentration ? '#4ade80' : 'var(--text-muted)' }}>
                <input type="checkbox" checked={form.concentration ?? false}
                  onChange={e => set('concentration', e.target.checked)}
                  style={{ accentColor: '#4ade80', width: 13, height: 13 }} />
                Концентрация
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: 11, color: form.ritual ? 'var(--gold)' : 'var(--text-muted)', marginLeft: 12 }}>
                <input type="checkbox" checked={form.ritual ?? false}
                  onChange={e => set('ritual', e.target.checked)}
                  style={{ accentColor: 'var(--gold)', width: 13, height: 13 }} />
                Ритуал
              </label>
            </div>
            <div className="flex gap-2 items-end">
              {durType?.hasValue && (
                <div style={{ width: 80 }}>
                  <Label>Кол-во</Label>
                  <input className={iCls} style={iStyle} type="number" min={1}
                    value={form.duration?.value ?? 1}
                    onChange={e => setNested('duration', 'value', Number(e.target.value) || 1)} />
                </div>
              )}
              <div className="flex-1">
                <Label>Тип</Label>
                <select className={selCls} style={iStyle}
                  value={form.duration?.type ?? 'instant'}
                  onChange={e => setNested('duration', 'type', e.target.value)}>
                  {DURATION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {durType?.hasCondition && (
              <div className="mt-2">
                <Label>Условие</Label>
                <input className={iCls} style={iStyle} placeholder="Описание длительности..."
                  value={form.duration?.condition ?? ''}
                  onChange={e => setNested('duration', 'condition', e.target.value)} />
              </div>
            )}
          </FormSection>

          {/* ── ЭФФЕКТ ── */}
          <FormSection title="Эффект">
            <Label>Тип действия</Label>
            <select className={selCls} style={{ ...iStyle, marginBottom: 12 }}
              value={form.effect?.type ?? ''}
              onChange={e => setEffect('type', e.target.value)}>
              {EFFECT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>

            {/* Спасбросок → выбор характеристики */}
            {form.effect?.type === 'save' && (
              <div className="mb-3">
                <Label>Характеристика спасброска</Label>
                <select className={selCls} style={iStyle}
                  value={form.effect?.saveAbility ?? ''}
                  onChange={e => setEffect('saveAbility', e.target.value)}>
                  <option value="">— выбери —</option>
                  {SAVE_ABILITIES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
            )}

            {/* Атаки / Лечение → урон */}
            {(form.effect?.type === 'melee_attack' || form.effect?.type === 'ranged_attack' || form.effect?.type === 'healing') && (
              <div>
                <Label>{form.effect?.type === 'healing' ? 'Лечение' : 'Урон'}</Label>
                {(form.effect?.damages ?? [{ formula: '', dmgType: '' }]).map((d, i) => (
                  <div key={i} className="flex gap-2 mb-1.5">
                    <input className={iCls} style={{ ...iStyle, flex: 1 }}
                      placeholder="2к10+5"
                      value={d.formula ?? ''}
                      onChange={e => setEffectDamage(i, 'formula', e.target.value)} />
                    {form.effect?.type !== 'healing' && (
                      <select className="rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer shrink-0"
                        style={{ ...iStyle, minWidth: 130 }}
                        value={d.dmgType ?? ''}
                        onChange={e => setEffectDamage(i, 'dmgType', e.target.value)}>
                        <option value="">— тип —</option>
                        {DMG_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    )}
                    {(form.effect?.damages?.length ?? 1) > 1 && (
                      <button className="icon-btn shrink-0" style={{ width: 28, height: 28 }}
                        onClick={() => setEffect('damages', form.effect.damages.filter((_, j) => j !== i))}>
                        <IconTrash size={11} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost w-full justify-center mt-1" style={{ fontSize: 11 }}
                  onClick={() => setEffect('damages', [...(form.effect?.damages ?? []), { formula: '', dmgType: '' }])}>
                  <IconPlus size={11} /> Ещё компонент урона
                </button>
              </div>
            )}

            {/* Специальное → текст */}
            {form.effect?.type === 'special' && (
              <div>
                <Label>Описание эффекта</Label>
                <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 60 }}
                  placeholder="Опишите эффект..."
                  value={form.effect?.specialText ?? ''}
                  onChange={e => setEffect('specialText', e.target.value)} />
              </div>
            )}
          </FormSection>

          {/* ── ОПИСАНИЕ ── */}
          <FormSection title="Описание">
            <Label>Описание *</Label>
            <textarea className={`${iCls} resize-none mb-3`} style={{ ...iStyle, minHeight: 100 }}
              placeholder="Текст заклинания..."
              value={form.description} onChange={e => set('description', e.target.value)} />
            <Label>На более высоких уровнях</Label>
            <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 60 }}
              placeholder="Эффект при использовании ячейки более высокого уровня..."
              value={form.higherLevels ?? ''} onChange={e => set('higherLevels', e.target.value)} />
          </FormSection>

          {/* ── КЛАССЫ ── */}
          <FormSection title="Доступные классы">
            <div className="flex flex-wrap gap-1">
              {SPELL_CLASSES.map(cls => {
                const active = (form.classes ?? []).includes(cls)
                return (
                  <button key={cls} type="button" onClick={() => toggleClass(cls)}
                    className="font-cinzel text-[10px] px-2 py-0.5 rounded-md transition-all cursor-pointer"
                    style={{
                      background: active ? 'var(--gold-dim)' : 'var(--bg-row)',
                      color:      active ? 'var(--gold)' : 'var(--text-muted)',
                      border:     `1px solid ${active ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
                    }}>
                    {cls}
                  </button>
                )
              })}
            </div>
          </FormSection>

          {/* ── ИСТОЧНИК ── */}
          <FormSection title="Источник">
            <select className={selCls} style={iStyle} value={form.source ?? 'PHB'} onChange={e => set('source', e.target.value)}>
              {SPELL_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </FormSection>

        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          {!isNew && (
            <button className="btn btn-ghost" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={handleDelete}>
              <IconTrash size={14} /> Удалить
            </button>
          )}
          <button className="btn btn-cancel flex-1 justify-center" onClick={onClose}><IconX size={14} /> Отмена</button>
          <button className="btn btn-gold flex-1 justify-center" onClick={handleSave} disabled={saving}>
            <IconCheck size={14} /> {isNew ? 'Создать' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormSection({ title, children }) {
  return (
    <div>
      <div className="font-cinzel text-xs tracking-widest uppercase mb-2 pb-1"
        style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(226,201,126,0.2)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Label({ children }) {
  return (
    <div className="font-cinzel text-[10px] tracking-wide uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
      {children}
    </div>
  )
}
