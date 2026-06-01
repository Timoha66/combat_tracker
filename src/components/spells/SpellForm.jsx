import { useState } from 'react'
import { IconX, IconCheck, IconTrash, IconPlus } from '@tabler/icons-react'
import { useSpellStore } from '../../store/spellStore'
import {
  EMPTY_SPELL, EMPTY_EFFECT, EMPTY_UPCAST,
  SPELL_SCHOOLS, SPELL_CLASSES, SPELL_SOURCES,
  CASTING_TIME_UNITS, RANGE_TYPES, DURATION_TYPES,
  EFFECT_TYPES, SAVE_ABILITIES, SAVE_ON_SUCCESS, CONDITION_TYPES,
  DAMAGE_BONUS_TYPES, DIE_SIZES, normalizeSpell, formatUpcast,
} from '../../data/spellDb'
import { DMG_TYPES } from '../../data/constants'

export default function SpellForm({ initial, onClose, onSaved }) {
  const { addSpell, updateSpell, deleteSpell } = useSpellStore()
  const isNew   = !initial?.id
  const [form, setForm] = useState(() => normalizeSpell({ ...EMPTY_SPELL, ...initial }))
  const [saving, setSaving] = useState(false)

  // ── helpers ────────────────────────────────────────────────────────────────
  const set     = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const setNest = (field, key, value) => setForm(f => ({ ...f, [field]: { ...f[field], [key]: value } }))
  const setComp = (key, value) => setForm(f => ({ ...f, components: { ...f.components, [key]: value } }))

  // upcast helpers
  const setUpcast = (key, value) => setForm(f => ({ ...f, upcast: { ...f.upcast, [key]: value } }))
  const setCantripLevel = (lvl, value) => setForm(f => ({
    ...f, upcast: { ...f.upcast, cantripLevels: { ...(f.upcast?.cantripLevels ?? {}), [lvl]: value } }
  }))

  // effects helpers
  function setEffectField(idx, key, value) {
    setForm(f => ({ ...f, effects: f.effects.map((e, i) => i === idx ? { ...e, [key]: value } : e) }))
  }
  function setEffectDamage(eIdx, dIdx, key, value) {
    setForm(f => ({
      ...f,
      effects: f.effects.map((e, i) => i !== eIdx ? e : {
        ...e,
        damages: e.damages.map((d, j) => j !== dIdx ? d : { ...d, [key]: value }),
      }),
    }))
  }
  function addDamage(eIdx) {
    setForm(f => ({
      ...f,
      effects: f.effects.map((e, i) => i !== eIdx ? e : {
        ...e, damages: [...(e.damages ?? []), { count: 1, die: 'd6', dmgType: '' }],
      }),
    }))
  }
  function removeDamage(eIdx, dIdx) {
    setForm(f => ({
      ...f,
      effects: f.effects.map((e, i) => i !== eIdx ? e : {
        ...e, damages: e.damages.filter((_, j) => j !== dIdx),
      }),
    }))
  }
  function addEffect() {
    setForm(f => ({ ...f, effects: [...(f.effects ?? []), { ...EMPTY_EFFECT }] }))
  }
  function removeEffect(idx) {
    setForm(f => ({ ...f, effects: f.effects.filter((_, i) => i !== idx) }))
  }

  // Auto-fill cantrip levels from first damage
  function autofillCantripLevels() {
    const firstDmg = form.effects?.[0]?.damages?.[0]
    if (!firstDmg?.die) return
    const count = firstDmg.count ?? 1
    const die   = firstDmg.die
    setForm(f => ({
      ...f,
      upcast: {
        ...f.upcast,
        cantripLevels: {
          5:  `${count + 1}${die}`,
          11: `${count + 2}${die}`,
          17: `${count + 3}${die}`,
        },
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

  const iStyle   = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }
  const iCls     = 'w-full rounded-lg px-3 py-1.5 text-sm outline-none'
  const selCls   = `${iCls} cursor-pointer`
  const castUnit = CASTING_TIME_UNITS.find(u => u.id === form.castingTime?.unit)
  const rangeType = RANGE_TYPES.find(t => t.id === form.range?.type)
  const durType  = DURATION_TYPES.find(t => t.id === form.duration?.type)
  const upcastPreview = form.upcast?.enabled ? formatUpcast(form) : ''

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
            <div className="grid grid-cols-3 gap-3 mb-3">
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
            <div className="grid grid-cols-2 gap-3">
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
              {[{key:'verbal',label:'Вербальный'},{key:'somatic',label:'Соматический'},{key:'material',label:'Материальный'}].map(({key,label}) => {
                const active = form.components?.[key]
                return (
                  <button key={key} type="button" onClick={() => setComp(key, !active)}
                    className="font-cinzel text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    style={{ background: active ? 'var(--gold-dim)' : 'var(--bg-row)', color: active ? 'var(--gold)' : 'var(--text-dim)', border: `1px solid ${active ? 'rgba(226,201,126,0.4)' : 'var(--border)'}` }}>
                    {label}
                  </button>
                )
              })}
            </div>
            {form.components?.material && (
              <input className={iCls} style={iStyle} placeholder="Описание материального компонента..."
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
                    onChange={e => setNest('castingTime', 'value', Number(e.target.value) || 1)} />
                </div>
              )}
              <div className="flex-1">
                <Label>Единица</Label>
                <select className={selCls} style={iStyle}
                  value={form.castingTime?.unit ?? 'action'}
                  onChange={e => setNest('castingTime', 'unit', e.target.value)}>
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
                  onChange={e => setNest('castingTime', 'condition', e.target.value)} />
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
                    onChange={e => setNest('range', 'value', Number(e.target.value) || 0)} />
                </div>
              )}
              <div className="flex-1">
                <Label>Тип</Label>
                <select className={selCls} style={iStyle}
                  value={form.range?.type ?? 'feet'}
                  onChange={e => setNest('range', 'type', e.target.value)}>
                  {RANGE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {rangeType?.hasCondition && (
              <div className="mt-2">
                <Label>Условие</Label>
                <input className={iCls} style={iStyle} placeholder="Описание дистанции..."
                  value={form.range?.condition ?? ''}
                  onChange={e => setNest('range', 'condition', e.target.value)} />
              </div>
            )}
          </FormSection>

          {/* ── ДЛИТЕЛЬНОСТЬ ── */}
          <FormSection title="Длительность">
            <div className="flex gap-2 items-center mb-2">
              <CbLabel active={form.concentration} color="#4ade80"
                onChange={e => set('concentration', e.target.checked)}>
                Концентрация
              </CbLabel>
              <CbLabel active={form.ritual} color="var(--gold)" style={{ marginLeft: 12 }}
                onChange={e => set('ritual', e.target.checked)}>
                Ритуал
              </CbLabel>
            </div>
            <div className="flex gap-2 items-end">
              {durType?.hasValue && (
                <div style={{ width: 80 }}>
                  <Label>Кол-во</Label>
                  <input className={iCls} style={iStyle} type="number" min={1}
                    value={form.duration?.value ?? 1}
                    onChange={e => setNest('duration', 'value', Number(e.target.value) || 1)} />
                </div>
              )}
              <div className="flex-1">
                <Label>Тип</Label>
                <select className={selCls} style={iStyle}
                  value={form.duration?.type ?? 'instant'}
                  onChange={e => setNest('duration', 'type', e.target.value)}>
                  {DURATION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {durType?.hasCondition && (
              <div className="mt-2">
                <Label>Условие</Label>
                <input className={iCls} style={iStyle} placeholder="Описание длительности..."
                  value={form.duration?.condition ?? ''}
                  onChange={e => setNest('duration', 'condition', e.target.value)} />
              </div>
            )}
          </FormSection>

          {/* ── ЭФФЕКТЫ ── */}
          <FormSection title="Эффекты">
            {(form.effects ?? []).map((eff, eIdx) => (
              <div key={eIdx} className="rounded-xl mb-3 p-3"
                style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-cinzel text-[10px] uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)' }}>Эффект {eIdx + 1}</span>
                  {(form.effects?.length ?? 1) > 1 && (
                    <button className="icon-btn ml-auto" style={{ width: 22, height: 22 }}
                      onClick={() => removeEffect(eIdx)}>
                      <IconTrash size={11} style={{ color: '#f87171' }} />
                    </button>
                  )}
                </div>

                {/* Тип */}
                <select className={selCls} style={{ ...iStyle, marginBottom: 10 }}
                  value={eff.type ?? ''}
                  onChange={e => setEffectField(eIdx, 'type', e.target.value)}>
                  {EFFECT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>

                {/* Спасбросок → характеристика + результат при успехе */}
                {eff.type === 'save' && (
                  <div className="mb-2 flex flex-col gap-2">
                    <div>
                      <Label>Характеристика спасброска</Label>
                      <select className={selCls} style={iStyle}
                        value={eff.saveAbility ?? ''}
                        onChange={e => setEffectField(eIdx, 'saveAbility', e.target.value)}>
                        <option value="">— выбери —</option>
                        {SAVE_ABILITIES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Результат при успехе</Label>
                      <select className={selCls} style={iStyle}
                        value={eff.saveOnSuccess ?? ''}
                        onChange={e => setEffectField(eIdx, 'saveOnSuccess', e.target.value)}>
                        {SAVE_ON_SUCCESS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Состояние → выбор из списка */}
                {eff.type === 'condition' && (
                  <div className="mb-2">
                    <Label>Состояние</Label>
                    <select className={selCls} style={iStyle}
                      value={eff.condition ?? ''}
                      onChange={e => setEffectField(eIdx, 'condition', e.target.value)}>
                      <option value="">— выбери —</option>
                      {CONDITION_TYPES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                )}

                {/* Урон/Лечение → кубы (только для damage и healing, не для save) */}
                {(eff.type === 'damage' || eff.type === 'healing') && (
                  <div>
                    <Label>{eff.type === 'healing' ? 'Лечение' : 'Урон'}</Label>
                    {(eff.damages ?? []).map((d, dIdx) => (
                      <div key={dIdx} className="flex gap-1.5 mb-1.5 items-center flex-wrap">
                        {/* Количество кубов */}
                        <input type="number" min={1} max={99}
                          className="rounded-lg px-2 py-1.5 text-sm outline-none text-center"
                          style={{ ...iStyle, width: 52 }}
                          value={d.count ?? 1}
                          onChange={e => setEffectDamage(eIdx, dIdx, 'count', Math.max(1, Math.min(99, Number(e.target.value) || 1)))} />
                        {/* Размер куба */}
                        <select className="rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer"
                          style={{ ...iStyle, width: 70 }}
                          value={d.die ?? 'd6'}
                          onChange={e => setEffectDamage(eIdx, dIdx, 'die', e.target.value)}>
                          {DIE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {/* Бонус */}
                        <select className="rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer"
                          style={{ ...iStyle, minWidth: 120 }}
                          value={d.bonus ?? ''}
                          onChange={e => setEffectDamage(eIdx, dIdx, 'bonus', e.target.value)}>
                          {DAMAGE_BONUS_TYPES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                        </select>
                        {/* Специальный бонус — текстовое поле */}
                        {d.bonus === 'custom' && (
                          <input className="rounded-lg px-2 py-1.5 text-sm outline-none"
                            style={{ ...iStyle, width: 70 }}
                            placeholder="+2"
                            value={d.bonusCustom ?? ''}
                            onChange={e => setEffectDamage(eIdx, dIdx, 'bonusCustom', e.target.value)} />
                        )}
                        {/* Тип урона (не для лечения) */}
                        {eff.type !== 'healing' && (
                          <select className="rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer"
                            style={{ ...iStyle, minWidth: 110 }}
                            value={d.dmgType ?? ''}
                            onChange={e => setEffectDamage(eIdx, dIdx, 'dmgType', e.target.value)}>
                            <option value="">— тип —</option>
                            {DMG_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                        )}
                        {/* Удалить строку */}
                        {(eff.damages?.length ?? 1) > 1 && (
                          <button className="icon-btn shrink-0" style={{ width: 26, height: 26 }}
                            onClick={() => removeDamage(eIdx, dIdx)}>
                            <IconTrash size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn btn-ghost w-full justify-center mt-1" style={{ fontSize: 11 }}
                      onClick={() => addDamage(eIdx)}>
                      <IconPlus size={11} /> Ещё тип урона
                    </button>
                  </div>
                )}

                {/* Специальное → текст */}
                {eff.type === 'special' && (
                  <div>
                    <Label>Описание эффекта</Label>
                    <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 56 }}
                      placeholder="Опишите эффект..."
                      value={eff.specialText ?? ''}
                      onChange={e => setEffectField(eIdx, 'specialText', e.target.value)} />
                  </div>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-ghost w-full justify-center" style={{ fontSize: 11 }}
              onClick={addEffect}>
              <IconPlus size={11} /> Добавить эффект
            </button>
          </FormSection>

          {/* ── ОПИСАНИЕ ── */}
          <FormSection title="Описание">
            <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 100 }}
              placeholder="Текст заклинания..."
              value={form.description} onChange={e => set('description', e.target.value)} />
          </FormSection>

          {/* ── НА БОЛЕЕ ВЫСОКИХ УРОВНЯХ ── */}
          <FormSection title="На более высоких уровнях">
            <CbLabel active={form.upcast?.enabled} color="#a78bfa"
              onChange={e => setUpcast('enabled', e.target.checked)}>
              Апкаст
            </CbLabel>

            {form.upcast?.enabled ? (
              <div className="mt-3">
                {form.level === 0 ? (
                  /* Заговор: режим Урон / Снаряды */
                  <>
                    {/* Переключатель режима */}
                    <div className="flex gap-2 mb-3">
                      {[{id:'damage',label:'Урон'},{id:'projectiles',label:'Снаряды'}].map(opt => {
                        const active = (form.upcast?.cantripMode ?? 'damage') === opt.id
                        return (
                          <button key={opt.id} type="button"
                            className="font-cinzel text-xs px-3 py-1.5 rounded-lg flex-1 transition-all cursor-pointer"
                            style={{ background: active ? 'rgba(167,139,250,0.15)' : 'var(--bg-row)', color: active ? '#c4b5fd' : 'var(--text-dim)', border: `1px solid ${active ? 'rgba(167,139,250,0.4)' : 'var(--border)'}` }}
                            onClick={() => setUpcast('cantripMode', opt.id)}>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>

                    {(form.upcast?.cantripMode ?? 'damage') === 'damage' ? (
                      <>
                        <div className="flex gap-2 mb-2">
                          {[5, 11, 17].map(lvl => (
                            <div key={lvl} className="flex-1">
                              <Label>{lvl} уровень</Label>
                              <input className={iCls} style={iStyle}
                                placeholder={`2d${(form.effects?.[0]?.damages?.[0]?.die ?? 'd6').slice(1)}`}
                                value={form.upcast?.cantripLevels?.[lvl] ?? ''}
                                onChange={e => setCantripLevel(lvl, e.target.value)} />
                            </div>
                          ))}
                        </div>
                        {form.effects?.[0]?.damages?.[0]?.die && (
                          <button type="button" className="btn btn-ghost w-full justify-center" style={{ fontSize: 11 }}
                            onClick={autofillCantripLevels}>
                            ✨ Подставить +1 куб за порог
                          </button>
                        )}
                      </>
                    ) : (
                      /* Снаряды: поля 5/11/17 */
                      <div className="flex gap-2">
                        {[5, 11, 17].map(lvl => (
                          <div key={lvl} className="flex-1">
                            <Label>{lvl} уровень</Label>
                            <input className={iCls} style={iStyle} type="number" min={1} max={99}
                              placeholder="2"
                              value={form.upcast?.cantripProjectiles?.[lvl] ?? ''}
                              onChange={e => setForm(f => ({
                                ...f, upcast: { ...f.upcast, cantripProjectiles: { ...(f.upcast?.cantripProjectiles ?? {}), [lvl]: e.target.value } }
                              }))} />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* Не заговор: выбор типа прогрессии */
                  <>
                    <div className="flex gap-2 mb-3">
                      {[
                        { id: 'extra_target', label: 'Доп. цель'   },
                        { id: 'extra_damage', label: 'Доп. урон'   },
                        { id: 'custom',       label: 'Специальный' },
                      ].map(opt => {
                        const active = (form.upcast?.progressionType ?? 'extra_target') === opt.id
                        return (
                          <button key={opt.id} type="button"
                            className="font-cinzel text-xs px-3 py-1.5 rounded-lg flex-1 transition-all cursor-pointer"
                            style={{ background: active ? 'rgba(167,139,250,0.15)' : 'var(--bg-row)', color: active ? '#c4b5fd' : 'var(--text-dim)', border: `1px solid ${active ? 'rgba(167,139,250,0.4)' : 'var(--border)'}` }}
                            onClick={() => setUpcast('progressionType', opt.id)}>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Доп. цель → предпросмотр */}
                    {form.upcast?.progressionType === 'extra_target' && (
                      <div className="px-3 py-2 rounded-lg text-sm italic"
                        style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--text-dim)' }}>
                        {upcastPreview || 'Предпросмотр появится здесь'}
                      </div>
                    )}

                    {/* Доп. урон → выбор куба + предпросмотр */}
                    {form.upcast?.progressionType === 'extra_damage' && (
                      <>
                        <div className="flex gap-2 items-end mb-2">
                          <div className="flex-1">
                            <Label>Куб урона заклинания</Label>
                            <select className={selCls} style={iStyle}
                              value={form.upcast?.damageDie ?? ''}
                              onChange={e => setUpcast('damageDie', e.target.value)}>
                              <option value="">— авто из эффекта —</option>
                              {DIE_SIZES.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="px-3 py-2 rounded-lg text-sm italic"
                          style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--text-dim)' }}>
                          {upcastPreview || 'Предпросмотр появится здесь'}
                        </div>
                      </>
                    )}

                    {/* Специальный → свободный текст */}
                    {form.upcast?.progressionType === 'custom' && (
                      <>
                        <Label>Описание</Label>
                        <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 60 }}
                          placeholder="Опишите эффект апкаста..."
                          value={form.upcast?.customText ?? ''}
                          onChange={e => setUpcast('customText', e.target.value)} />
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Обычное текстовое поле */
              <div className="mt-2">
                <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 60 }}
                  placeholder="Эффект при использовании ячейки более высокого уровня..."
                  value={form.higherLevels ?? ''} onChange={e => set('higherLevels', e.target.value)} />
              </div>
            )}
          </FormSection>

          {/* ── КЛАССЫ ── */}
          <FormSection title="Доступные классы">
            <div className="flex flex-wrap gap-1">
              {SPELL_CLASSES.map(cls => {
                const active = (form.classes ?? []).includes(cls)
                return (
                  <button key={cls} type="button" onClick={() => toggleClass(cls)}
                    className="font-cinzel text-[10px] px-2 py-0.5 rounded-md transition-all cursor-pointer"
                    style={{ background: active ? 'var(--gold-dim)' : 'var(--bg-row)', color: active ? 'var(--gold)' : 'var(--text-muted)', border: `1px solid ${active ? 'rgba(226,201,126,0.4)' : 'var(--border)'}` }}>
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

// ── Мелкие вспомогательные компоненты ─────────────────────────────────────────
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
function CbLabel({ active, color, onChange, children, style }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'Cinzel, serif', fontSize:11, color: active ? color : 'var(--text-muted)', ...style }}>
      <input type="checkbox" checked={active ?? false} onChange={onChange}
        style={{ accentColor: color, width:13, height:13 }} />
      {children}
    </label>
  )
}
