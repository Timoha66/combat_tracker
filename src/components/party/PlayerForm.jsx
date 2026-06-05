import { useState } from 'react'
import { IconX, IconCheck, IconTrash, IconPlus } from '@tabler/icons-react'
import { usePartyStore } from '../../store/partyStore'
import { EMPTY_PLAYER, PLAYER_SIZES, PLAYER_CLASSES, SPECIAL_SENSES } from '../../data/partyDb'
import { ABILITY_KEYS, ABILITY_LABELS } from '../../data/gameData'
import { DMG_TYPES } from '../../data/constants'
import { DAMAGE_BONUS_TYPES, DAMAGE_BONUS_SHORT, DIE_SIZES, CONDITION_TYPES } from '../../data/spellDb'

// ─── Константы ────────────────────────────────────────────────────────────────
const ACTION_SECTIONS = [
  { id: 'action',   label: 'Действие' },
  { id: 'bonus',    label: 'Бонусное действие' },
  { id: 'reaction', label: 'Реакция' },
]
const TRAIT_ACTIONS = [
  { id: '',         label: '— не выбрано —' },
  { id: 'action',   label: 'Действие' },
  { id: 'bonus',    label: 'Бонусное действие' },
  { id: 'reaction', label: 'Реакция' },
]
const SKILLS_LIST = [
  'Акробатика','Анализ','Атлетика','Внимание','Выживание',
  'Запугивание','История','Магия','Медицина','Обман',
  'Обращение с животными','Природа','Проницательность',
  'Религия','Скрытность','Убеждение','Ловкость рук',
]

// ─── Вспомогательные компоненты СНАРУЖИ PlayerForm (критично для инпутов!) ───

function SectionHeader({ title, showKey, form, onToggle }) {
  return (
    <div className="flex items-center justify-between mb-2 pb-1"
      style={{ borderBottom: '1px solid rgba(226,201,126,0.2)' }}>
      <span className="font-cinzel text-xs tracking-widest uppercase" style={{ color: 'var(--gold)' }}>{title}</span>
      {showKey && (
        <label className="flex items-center gap-1.5 cursor-pointer"
          style={{ fontFamily: 'Cinzel,serif', fontSize: 10, color: form[showKey] ? '#4ade80' : 'var(--text-muted)' }}>
          <input type="checkbox" checked={form[showKey] ?? false}
            onChange={e => onToggle(showKey, e.target.checked)}
            style={{ accentColor: '#4ade80', width: 12, height: 12 }} />
          В карточке
        </label>
      )}
    </div>
  )
}

function FL({ children }) {
  return <div className="font-cinzel text-[10px] tracking-wide uppercase mb-1" style={{ color: 'var(--text-muted)' }}>{children}</div>
}

function CbMini({ value, onChange }) {
  return (
    <label className="flex items-center gap-1 cursor-pointer"
      style={{ fontFamily: 'Cinzel,serif', fontSize: 9, color: value ? '#4ade80' : 'var(--text-muted)' }}>
      <input type="checkbox" checked={value ?? false} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: '#4ade80', width: 11, height: 11 }} />
      В карточке
    </label>
  )
}

function TagSelector({ items, selected, onToggle, colorActive, colorText }) {
  const ca = colorActive ?? 'rgba(167,139,250,0.15)'
  const ct = colorText   ?? '#c4b5fd'
  return (
    <div className="flex flex-wrap gap-1">
      {items.map(item => {
        const active = (selected ?? []).includes(item.id)
        return (
          <button key={item.id} type="button"
            className="font-cinzel text-[10px] px-2 py-0.5 rounded-md cursor-pointer transition-all"
            style={{ background: active ? ca : 'var(--bg-row)', color: active ? ct : 'var(--text-muted)', border: `1px solid ${active ? ct + '44' : 'var(--border)'}` }}
            onClick={() => onToggle(item.id)}>
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function PlayerForm({ initial, onClose, onSaved }) {
  const { addPlayer, updatePlayer, deletePlayer } = usePartyStore()
  const isNew = !initial?.id
  const [form, setForm] = useState(() => ({
    ...EMPTY_PLAYER, ...initial,
    classes:       initial?.classes       ?? [{ cls: '', level: 1 }],
    specialSenses: initial?.specialSenses ?? [],
    proficiencies: initial?.proficiencies ?? { languages: '', armor: '', weapons: '', tools: '' },
    traits:        initial?.traits        ?? [],
    actions:       initial?.actions       ?? [],
  }))
  const [saving, setSaving] = useState(false)

  const iStyle = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }
  const iCls   = 'w-full rounded-lg px-3 py-1.5 text-sm outline-none'
  const selCls = `${iCls} cursor-pointer`

  const set     = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setAb   = (k, v) => setForm(f => ({ ...f, abilities: { ...f.abilities, [k]: Number(v) || 10 } }))
  const setProf = (k, v) => setForm(f => ({ ...f, proficiencies: { ...f.proficiencies, [k]: v } }))

  const totalLevel = (form.classes ?? []).reduce((s, c) => s + (Number(c.level) || 0), 0)

  // Классы
  const setClsField = (i, k, v) => setForm(f => ({ ...f, classes: f.classes.map((c, idx) => idx === i ? { ...c, [k]: v } : c) }))
  const addClass    = ()        => setForm(f => ({ ...f, classes: [...f.classes, { cls: '', level: 1 }] }))
  const removeClass = i         => setForm(f => ({ ...f, classes: f.classes.filter((_, idx) => idx !== i) }))

  // Массивы
  const addToArr    = (field, item)   => setForm(f => ({ ...f, [field]: [...(f[field] ?? []), item] }))
  const removeFromArr = (field, i)    => setForm(f => ({ ...f, [field]: f[field].filter((_, idx) => idx !== i) }))
  const updateInArr = (field, i, fn)  => setForm(f => ({ ...f, [field]: f[field].map((x, idx) => idx === i ? fn(x) : x) }))

  // Сопротивления
  const toggleResist = (field, id) => {
    const arr = form[field] ?? []
    set(field, arr.includes(id) ? arr.filter(v => v !== id) : [...arr, id])
  }

  // Особые чувства
  const setSense = (i, k, v) => setForm(f => ({ ...f, specialSenses: f.specialSenses.map((s, idx) => idx === i ? { ...s, [k]: v } : s) }))

  // Урон в действиях
  const setActionDmg = (ai, di, k, v) => setForm(f => ({
    ...f, actions: f.actions.map((a, i) => i !== ai ? a : {
      ...a, damages: (a.damages ?? []).map((d, j) => j !== di ? d : { ...d, [k]: v }),
    }),
  }))
  const addActionDmg = ai => setForm(f => ({
    ...f, actions: f.actions.map((a, i) => i !== ai ? a : {
      ...a, damages: [...(a.damages ?? []), { count: 1, die: 'd6', dmgType: '', bonuses: [] }],
    }),
  }))
  const removeActionDmg = (ai, di) => setForm(f => ({
    ...f, actions: f.actions.map((a, i) => i !== ai ? a : {
      ...a, damages: (a.damages ?? []).filter((_, j) => j !== di),
    }),
  }))

  // Бонусы к урону
  const addDmgBonus = (ai, di, type) => {
    if (!type) return
    setForm(f => ({
      ...f, actions: f.actions.map((a, i) => i !== ai ? a : {
        ...a, damages: (a.damages ?? []).map((d, j) => j !== di ? d : {
          ...d, bonuses: [...(d.bonuses ?? []), type === 'custom' ? { type: 'custom', value: '' } : { type }],
        }),
      }),
    }))
  }
  const setDmgBonus = (ai, di, bi, k, v) => setForm(f => ({
    ...f, actions: f.actions.map((a, i) => i !== ai ? a : {
      ...a, damages: (a.damages ?? []).map((d, j) => j !== di ? d : {
        ...d, bonuses: (d.bonuses ?? []).map((b, k2) => k2 !== bi ? b : { ...b, [k]: v }),
      }),
    }),
  }))
  const removeDmgBonus = (ai, di, bi) => setForm(f => ({
    ...f, actions: f.actions.map((a, i) => i !== ai ? a : {
      ...a, damages: (a.damages ?? []).map((d, j) => j !== di ? d : {
        ...d, bonuses: (d.bonuses ?? []).filter((_, k2) => k2 !== bi),
      }),
    }),
  }))

  async function handleSave() {
    if (!form.name.trim()) { alert('Введи имя персонажа'); return }
    setSaving(true)
    try {
      const saved = isNew ? await addPlayer(form) : await updatePlayer(form.id, form)
      onSaved(saved)
    } finally { setSaving(false) }
  }
  async function handleDelete() {
    if (!confirm(`Удалить «${form.name}»?`)) return
    await deletePlayer(form.id); onClose()
  }

  const sh = (title, showKey) => ({ title, showKey, form, onToggle: set })

  return (
    <div className="overlay" style={{ zIndex: 400 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-md)', width: 700, maxWidth: '96vw', maxHeight: '92vh' }}>

        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>
            {isNew ? 'Новый персонаж' : `Редактировать: ${form.name}`}
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

          {/* ОСНОВНОЕ */}
          <section>
            <SectionHeader {...sh('Основное')} />
            <div className="mb-3">
              <FL>Имя *</FL>
              <input className={iCls} style={iStyle} value={form.name} placeholder="Торин Дубощит"
                onChange={e => set('name', e.target.value)} />
            </div>
            <FL>Классы {totalLevel > 0 && <span style={{ color: 'var(--gold)' }}>· Итого: {totalLevel} ур.</span>}</FL>
            {(form.classes ?? []).map((c, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <select className={selCls} style={{ ...iStyle, flex: 1 }} value={c.cls}
                  onChange={e => setClsField(i, 'cls', e.target.value)}>
                  <option value="">— выбери класс —</option>
                  {PLAYER_CLASSES.map(cl => <option key={cl} value={cl}>{cl}</option>)}
                </select>
                <input type="number" min={1} max={20}
                  className="rounded-lg px-3 py-1.5 text-sm outline-none text-center"
                  style={{ ...iStyle, width: 70 }} value={c.level}
                  onChange={e => setClsField(i, 'level', Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
                {(form.classes ?? []).length > 1 && (
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeClass(i)}>
                    <IconTrash size={11} /></button>
                )}
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center mb-3" style={{ fontSize: 11 }} onClick={addClass}>
              <IconPlus size={11} /> Добавить класс
            </button>
            <FL>Размер</FL>
            <select className={selCls} style={iStyle} value={form.size ?? 'Средний'} onChange={e => set('size', e.target.value)}>
              {PLAYER_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </section>

          {/* БОЕВЫЕ */}
          <section>
            <SectionHeader {...sh('Боевые характеристики', 'showSpeed')} />
            <div className="grid grid-cols-4 gap-3">
              <div><FL>Макс. ХП</FL>
                <input className={iCls} style={iStyle} type="number" min={1} value={form.hp?.max ?? 10}
                  onChange={e => setForm(f => ({ ...f, hp: { ...f.hp, max: Number(e.target.value) || 1 } }))} /></div>
              <div><FL>КД</FL>
                <input className={iCls} style={iStyle} type="number" min={1} value={form.ac ?? 10}
                  onChange={e => set('ac', Number(e.target.value) || 10)} /></div>
              <div><FL>Бонус инициативы</FL>
                <input className={iCls} style={iStyle} type="number" value={form.initiative ?? 0}
                  onChange={e => set('initiative', Number(e.target.value) || 0)} /></div>
              <div><FL>Скорость</FL>
                <input className={iCls} style={iStyle} value={form.speed ?? '9 м'}
                  onChange={e => set('speed', e.target.value)} /></div>
            </div>
          </section>

          {/* ХАРАКТЕРИСТИКИ */}
          <section>
            <SectionHeader {...sh('Характеристики')} />
            <div className="grid grid-cols-6 gap-2">
              {ABILITY_KEYS.map(k => (
                <div key={k}>
                  <div className="font-cinzel text-[9px] tracking-widest uppercase text-center mb-1"
                    style={{ color: 'var(--text-muted)' }}>{ABILITY_LABELS[k]}</div>
                  <input className={`${iCls} text-center`} style={iStyle} type="number" min={1} max={30}
                    value={form.abilities?.[k] ?? 10} onChange={e => setAb(k, e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          {/* СПАСБРОСКИ */}
          <section>
            <SectionHeader {...sh('Спасброски', 'showSavingThrows')} />
            {(form.savingThrows ?? []).map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className={iCls} style={{ ...iStyle, flex: 1 }} value={s.ability} placeholder="Сила"
                  onChange={e => updateInArr('savingThrows', i, x => ({ ...x, ability: e.target.value }))} />
                <input className={iCls} style={{ ...iStyle, width: 80 }} type="number" value={s.bonus}
                  onChange={e => updateInArr('savingThrows', i, x => ({ ...x, bonus: Number(e.target.value) || 0 }))} />
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeFromArr('savingThrows', i)}>
                  <IconTrash size={11} /></button>
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11 }}
              onClick={() => addToArr('savingThrows', { ability: '', bonus: 0 })}>
              <IconPlus size={11} /> Добавить</button>
          </section>

          {/* НАВЫКИ */}
          <section>
            <SectionHeader {...sh('Навыки', 'showSkills')} />
            {(form.skills ?? []).map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select className={selCls} style={{ ...iStyle, flex: 1 }} value={s.name}
                  onChange={e => updateInArr('skills', i, x => ({ ...x, name: e.target.value }))}>
                  <option value="">— выбери —</option>
                  {SKILLS_LIST.map(sk => <option key={sk} value={sk}>{sk}</option>)}
                </select>
                <input className={iCls} style={{ ...iStyle, width: 80 }} type="number" value={s.bonus}
                  onChange={e => updateInArr('skills', i, x => ({ ...x, bonus: Number(e.target.value) || 0 }))} />
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeFromArr('skills', i)}>
                  <IconTrash size={11} /></button>
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11 }}
              onClick={() => addToArr('skills', { name: '', bonus: 0 })}>
              <IconPlus size={11} /> Добавить</button>
          </section>

          {/* СОПРОТИВЛЕНИЯ */}
          <section>
            <SectionHeader {...sh('Сопротивления и иммунитеты', 'showResistances')} />
            <div className="flex flex-col gap-3">
              <div><FL>Иммунитет к урону</FL>
                <TagSelector items={DMG_TYPES} selected={form.immunities ?? []}
                  onToggle={id => toggleResist('immunities', id)}
                  colorActive="rgba(147,197,253,0.15)" colorText="#93c5fd" /></div>
              <div><FL>Сопротивление к урону</FL>
                <TagSelector items={DMG_TYPES} selected={form.resistances ?? []}
                  onToggle={id => toggleResist('resistances', id)}
                  colorActive="rgba(74,222,128,0.15)" colorText="#4ade80" /></div>
              <div><FL>Уязвимость к урону</FL>
                <TagSelector items={DMG_TYPES} selected={form.vulnerabilities ?? []}
                  onToggle={id => toggleResist('vulnerabilities', id)}
                  colorActive="rgba(248,113,113,0.15)" colorText="#f87171" /></div>
              <div><FL>Иммунитет к состояниям</FL>
                <TagSelector items={CONDITION_TYPES} selected={form.conditionImmunities ?? []}
                  onToggle={id => toggleResist('conditionImmunities', id)}
                  colorActive="rgba(251,191,36,0.15)" colorText="#fbbf24" /></div>
            </div>
          </section>

          {/* ОСОБЫЕ ЧУВСТВА */}
          <section>
            <SectionHeader {...sh('Особые чувства', 'showSenses')} />
            {(form.specialSenses ?? []).map((s, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <select className={selCls} style={{ ...iStyle, flex: 1 }} value={s.type ?? ''}
                  onChange={e => setSense(i, 'type', e.target.value)}>
                  <option value="">— выбери —</option>
                  {SPECIAL_SENSES.map(ss => <option key={ss.id} value={ss.id}>{ss.label}</option>)}
                </select>
                <input type="number" min={0} max={1000}
                  className="rounded-lg px-3 py-1.5 text-sm outline-none text-center"
                  style={{ ...iStyle, width: 90 }} placeholder="60"
                  value={s.range ?? ''} onChange={e => setSense(i, 'range', Number(e.target.value) || 0)} />
                <span className="font-cinzel text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>фут.</span>
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeFromArr('specialSenses', i)}>
                  <IconTrash size={11} /></button>
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11 }}
              onClick={() => addToArr('specialSenses', { type: '', range: 60 })}>
              <IconPlus size={11} /> Добавить чувство</button>
          </section>

          {/* ВЛАДЕНИЯ */}
          <section>
            <SectionHeader {...sh('Владения', 'showProficiencies')} />
            <div className="grid grid-cols-2 gap-3">
              {[['languages','Языки'],['armor','Доспехи'],['weapons','Оружие'],['tools','Инструменты']].map(([k, label]) => (
                <div key={k}><FL>{label}</FL>
                  <input className={iCls} style={iStyle} value={form.proficiencies?.[k] ?? ''}
                    placeholder="через запятую" onChange={e => setProf(k, e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          {/* ЧЕРТЫ */}
          <section>
            <SectionHeader {...sh('Черты и особенности', 'showTraits')} />
            {(form.traits ?? []).map((t, i) => (
              <div key={i} className="mb-3 p-3 rounded-xl" style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}>
                <div className="flex gap-2 mb-2">
                  <input className={iCls} style={{ ...iStyle, flex: 1 }} value={t.name ?? ''} placeholder="Название черты"
                    onChange={e => updateInArr('traits', i, x => ({ ...x, name: e.target.value }))} />
                  <select className={selCls} style={{ ...iStyle, width: 170 }} value={t.actionType ?? ''}
                    onChange={e => updateInArr('traits', i, x => ({ ...x, actionType: e.target.value }))}>
                    {TRAIT_ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeFromArr('traits', i)}>
                    <IconTrash size={11} /></button>
                </div>
                <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 56 }}
                  value={t.description ?? ''} placeholder="Описание..."
                  onChange={e => updateInArr('traits', i, x => ({ ...x, description: e.target.value }))} />
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11 }}
              onClick={() => addToArr('traits', { name: '', description: '', actionType: '' })}>
              <IconPlus size={11} /> Добавить черту</button>
          </section>

          {/* ДЕЙСТВИЯ */}
          <section>
            <SectionHeader {...sh('Действия и атаки', 'showActions')} />
            {(form.actions ?? []).map((a, ai) => (
              <div key={ai} className="mb-3 p-3 rounded-xl" style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}>
                <div className="flex gap-2 mb-2">
                  <input className={iCls} style={{ ...iStyle, flex: 1 }} value={a.name ?? ''} placeholder="Название атаки"
                    onChange={e => updateInArr('actions', ai, x => ({ ...x, name: e.target.value }))} />
                  <select className={selCls} style={{ ...iStyle, width: 170 }} value={a.section ?? 'action'}
                    onChange={e => updateInArr('actions', ai, x => ({ ...x, section: e.target.value }))}>
                    {ACTION_SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeFromArr('actions', ai)}>
                    <IconTrash size={11} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div><FL>Бонус попадания</FL>
                    <input className={iCls} style={iStyle} type="number" value={a.attackBonus ?? ''} placeholder="+5"
                      onChange={e => updateInArr('actions', ai, x => ({ ...x, attackBonus: e.target.value === '' ? null : Number(e.target.value) }))} /></div>
                  <div><FL>Досягаемость</FL>
                    <input className={iCls} style={iStyle} value={a.reach ?? ''} placeholder="1,5 м"
                      onChange={e => updateInArr('actions', ai, x => ({ ...x, reach: e.target.value }))} /></div>
                  <div><FL>Дальность</FL>
                    <input className={iCls} style={iStyle} value={a.range ?? ''} placeholder="18/54 м"
                      onChange={e => updateInArr('actions', ai, x => ({ ...x, range: e.target.value }))} /></div>
                </div>

                <FL>Урон</FL>
                {(a.damages ?? [{ count: 1, die: 'd6', dmgType: '', bonuses: [] }]).map((d, di) => (
                  <div key={di} className="mb-2 p-2 rounded-lg" style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)' }}>
                    <div className="flex gap-1.5 mb-2 items-center">
                      <input type="number" min={1} max={99}
                        className="rounded-lg px-2 py-1.5 text-sm outline-none text-center"
                        style={{ ...iStyle, width: 52 }} value={d.count ?? 1}
                        onChange={e => setActionDmg(ai, di, 'count', Math.max(1, Math.min(99, Number(e.target.value) || 1)))} />
                      <select className="rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer"
                        style={{ ...iStyle, width: 68 }} value={d.die ?? 'd6'}
                        onChange={e => setActionDmg(ai, di, 'die', e.target.value)}>
                        {DIE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select className="rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer flex-1"
                        style={iStyle} value={d.dmgType ?? ''}
                        onChange={e => setActionDmg(ai, di, 'dmgType', e.target.value)}>
                        <option value="">— тип —</option>
                        {DMG_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                      {(a.damages ?? []).length > 1 && (
                        <button className="icon-btn shrink-0" style={{ width: 26, height: 26 }}
                          onClick={() => removeActionDmg(ai, di)}><IconTrash size={11} /></button>
                      )}
                    </div>
                    {/* Бонусы к урону */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(d.bonuses ?? []).map((b, bi) => (
                        <div key={bi} className="flex items-center gap-1 rounded-md px-2 py-0.5"
                          style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)' }}>
                          {b.type === 'custom' ? (
                            <input className="outline-none bg-transparent font-cinzel text-xs"
                              style={{ color: '#c4b5fd', width: 50 }} placeholder="+2"
                              value={b.value ?? ''}
                              onChange={e => setDmgBonus(ai, di, bi, 'value', e.target.value)} />
                          ) : (
                            <span className="font-cinzel text-[10px]" style={{ color: '#c4b5fd' }}>
                              {DAMAGE_BONUS_SHORT[b.type] ?? b.type}
                            </span>
                          )}
                          <button style={{ color: '#c4b5fd', fontSize: 12, lineHeight: 1, marginLeft: 2 }}
                            onClick={() => removeDmgBonus(ai, di, bi)}>×</button>
                        </div>
                      ))}
                      <select className="rounded-md px-2 py-0.5 text-xs outline-none cursor-pointer"
                        style={{ background: 'var(--bg-row)', border: '1px dashed var(--border-md)', color: 'var(--text-muted)' }}
                        value="" onChange={e => { if (e.target.value) addDmgBonus(ai, di, e.target.value) }}>
                        <option value="">+ бонус</option>
                        {DAMAGE_BONUS_TYPES.filter(b => b.id !== '').map(b => (
                          <option key={b.id} value={b.id}>{b.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost w-full justify-center mb-2" style={{ fontSize: 11 }}
                  onClick={() => addActionDmg(ai)}>
                  <IconPlus size={11} /> Ещё тип урона</button>
                <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 48 }}
                  value={a.description ?? ''} placeholder="Описание действия..."
                  onChange={e => updateInArr('actions', ai, x => ({ ...x, description: e.target.value }))} />
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11 }}
              onClick={() => addToArr('actions', { name: '', section: 'action', attackBonus: null, reach: '', range: '', damages: [{ count: 1, die: 'd6', dmgType: '', bonuses: [] }], description: '' })}>
              <IconPlus size={11} /> Добавить действие</button>
          </section>

          {/* ЗАКЛИНАНИЯ */}
          <section>
            <SectionHeader {...sh('Заклинания', 'showSpellcasting')} />
            <label className="flex items-center gap-2 cursor-pointer mb-3"
              style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: form.spellcasting ? 'var(--gold)' : 'var(--text-muted)' }}>
              <input type="checkbox" checked={!!form.spellcasting}
                onChange={e => set('spellcasting', e.target.checked ? { level: 1, ability: 'int' } : null)}
                style={{ accentColor: 'var(--gold)', width: 13, height: 13 }} />
              Персонаж является заклинателем
            </label>
            {form.spellcasting && (
              <div className="grid grid-cols-2 gap-3">
                <div><FL>Уровень заклинателя</FL>
                  <input className={iCls} style={iStyle} type="number" min={1} max={20}
                    value={form.spellcasting.level ?? 1}
                    onChange={e => set('spellcasting', { ...form.spellcasting, level: Number(e.target.value) || 1 })} /></div>
                <div><FL>Заклинательная характеристика</FL>
                  <select className={selCls} style={iStyle} value={form.spellcasting.ability ?? 'int'}
                    onChange={e => set('spellcasting', { ...form.spellcasting, ability: e.target.value })}>
                    {[['str','Сила'],['dex','Ловкость'],['con','Телосложение'],['int','Интеллект'],['wis','Мудрость'],['cha','Харизма']]
                      .map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select></div>
              </div>
            )}
          </section>

          {/* ДОПОЛНИТЕЛЬНО */}
          <section>
            <SectionHeader {...sh('Дополнительно')} />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <FL>Грузоподъёмность</FL>
                  <CbMini value={form.showCarryCapacity} onChange={v => set('showCarryCapacity', v)} />
                </div>
                <input className={iCls} style={iStyle} value={form.carryCapacity ?? ''} placeholder="150 фунтов"
                  onChange={e => set('carryCapacity', e.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <FL>Истощение (0–6)</FL>
                  <CbMini value={form.showExhaustion} onChange={v => set('showExhaustion', v)} />
                </div>
                <input className={iCls} style={iStyle} type="number" min={0} max={6} value={form.exhaustion ?? 0}
                  onChange={e => set('exhaustion', Math.max(0, Math.min(6, Number(e.target.value) || 0)))} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <FL>Состояния</FL>
                  <CbMini value={form.showConditions} onChange={v => set('showConditions', v)} />
                </div>
                <input className={iCls} style={iStyle} value={form.conditions ?? ''} placeholder="Отравлен, Испуган..."
                  onChange={e => set('conditions', e.target.value)} />
              </div>
            </div>
          </section>

          {/* ЗАМЕТКИ */}
          <section>
            <SectionHeader {...sh('Заметки', 'showNotes')} />
            <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 80 }}
              value={form.notes ?? ''} placeholder="Заметки о персонаже..."
              onChange={e => set('notes', e.target.value)} />
          </section>

        </div>

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
