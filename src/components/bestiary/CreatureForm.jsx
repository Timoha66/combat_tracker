import { useState } from 'react'
import { IconX, IconPlus, IconTrash, IconCheck, IconGripVertical } from '@tabler/icons-react'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { EMPTY_CREATURE } from '../../data/bestiaryDb'
import {
  SIZES, CREATURE_TYPES, CR_VALUES, CR_TO_PROF,
  ABILITY_KEYS, ABILITY_LABELS, ABILITY_FULL,
  SKILLS, ACTION_SECTIONS, ENTITY_TYPES, CONDITION_IMMUNITY_OPTIONS,
  abilityMod,
} from '../../data/gameData'
import { DMG_TYPES } from '../../data/constants'

// ── Damage constants ──────────────────────────────────────────────────────────
const DICE_SIZES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20']
const EMPTY_DAMAGE = { count: 1, die: 'd6', bonuses: [], type: '' }
const BONUS_OPTIONS = [
  { id: 'str',     label: 'Мод. СИЛ' },
  { id: 'dex',     label: 'Мод. ЛОВ' },
  { id: 'con',     label: 'Мод. ТЕЛ' },
  { id: 'int',     label: 'Мод. ИНТ' },
  { id: 'wis',     label: 'Мод. МДР' },
  { id: 'cha',     label: 'Мод. ХАР' },
  { id: 'special', label: 'Специальный' },
]

/** Вычисляет живой предпросмотр урона для отображения в форме */
function computeDamagePreview(d, abilities = {}) {
  const count   = d.count ?? 1
  const die     = d.die ?? 'd6'
  const dieNum  = parseInt(die.slice(1)) || 6
  const bonuses = d.bonuses ?? []

  const diceAvg = count * (dieNum + 1) / 2
  let bonusTotal = 0
  const bonusStrs = []

  for (const b of bonuses) {
    if (['str','dex','con','int','wis','cha'].includes(b.type)) {
      const mod = Math.floor(((abilities[b.type] ?? 10) - 10) / 2)
      bonusTotal += mod
      bonusStrs.push(mod >= 0 ? `+${mod}` : String(mod))
    } else if (b.type === 'special' && b.value !== '') {
      const num = parseFloat(String(b.value).replace(/^\+/, ''))
      if (!isNaN(num)) bonusTotal += num
      const disp = String(b.value).startsWith('+') || String(b.value).startsWith('-')
        ? b.value : `+${b.value}`
      bonusStrs.push(disp)
    }
  }
  const avg        = Math.round(diceAvg + bonusTotal)
  const formulaStr = `${count}d${dieNum}${bonusStrs.join(' ')}`
  return `ср. ${avg} (${formulaStr})`
}
function parseLegacyFormula(formula = '') {
  const m = formula.match(/^(\d+)[кd](\d+)([+-]\d+)?$/)
  if (m) {
    const dieNum = parseInt(m[2])
    const die    = [4, 6, 8, 10, 12, 20].includes(dieNum) ? `d${dieNum}` : 'd6'
    const bonuses = m[3] ? [{ type: 'special', value: m[3] }] : []
    return { count: parseInt(m[1]), die, bonuses }
  }
  return { count: 1, die: 'd6', bonuses: formula ? [{ type: 'special', value: formula }] : [] }
}

export default function CreatureForm({ initial, onClose, onSaved }) {
  const { addCreature, updateCreature } = useBestiaryStore()
  const isNew = !initial?.id

  const base = { ...EMPTY_CREATURE, ...initial }

  // Нормализуем старый формат damage/damageType → damages[] → новый структурный формат
  if (base.actions) {
    base.actions = base.actions.map(a => {
      const rawDamages = a.damages?.length > 0
        ? a.damages
        : a.damage ? [{ formula: a.damage, type: a.damageType ?? '' }]
        : [{ ...EMPTY_DAMAGE }]
      return {
        ...a,
        damages: rawDamages.map(d => {
          if (d.count !== undefined) return d  // уже новый формат
          const { count, die, bonuses } = parseLegacyFormula(d.formula ?? '')
          return { count, die, bonuses, type: d.type ?? '' }
        }),
      }
    })
  }

  const [form, setForm] = useState(base)
  const [tagsInput, setTagsInput] = useState((base.tags ?? []).join(', '))
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function setNested(field, key, value) {
    setForm(f => ({ ...f, [field]: { ...f[field], [key]: value } }))
  }

  function setAbility(key, value) {
    const val = Math.max(1, Math.min(30, Number(value) || 1))
    setForm(f => ({ ...f, abilities: { ...f.abilities, [key]: val } }))
  }

  // ── Arrays helpers ──────────────────────────────────────────────────────────
  function addToArray(field, item) {
    setForm(f => ({ ...f, [field]: [...(f[field] ?? []), item] }))
  }

  function removeFromArray(field, idx) {
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }))
  }

  function updateInArray(field, idx, updater) {
    setForm(f => ({ ...f, [field]: f[field].map((item, i) => i === idx ? updater(item) : item) }))
  }

  function toggleStringArray(field, val) {
    setForm(f => {
      const arr = f[field] ?? []
      return { ...f, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
  }

  // ── Drag & drop для действий ────────────────────────────────────────────────
  const [dragIdx,     setDragIdx]     = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  function handleDragStart(e, i) {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleDragOver(e, i) {
    e.preventDefault()
    if (dragOverIdx !== i) setDragOverIdx(i)
  }
  function handleDrop(e, i) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return }
    setForm(f => {
      const actions = [...(f.actions ?? [])]
      const [moved] = actions.splice(dragIdx, 1)
      actions.splice(i, 0, moved)
      return { ...f, actions }
    })
    setDragIdx(null)
    setDragOverIdx(null)
  }
  function handleDragEnd() {
    setDragIdx(null)
    setDragOverIdx(null)
  }

  // ── CR auto-prof ────────────────────────────────────────────────────────────
  function handleCrChange(cr) {
    setForm(f => ({ ...f, cr, proficiencyBonus: CR_TO_PROF[cr] ?? 2 }))
  }

  async function handleSave() {
    if (!form.name.trim()) { alert('Введи имя'); return }
    setSaving(true)
    const finalForm = {
      ...form,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
    }
    try {
      let saved
      if (isNew) {
        saved = await addCreature(finalForm)
      } else {
        await updateCreature(form.id, finalForm)
        saved = finalForm
      }
      onSaved(saved)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full rounded-lg px-3 py-1.5 text-sm outline-none transition-colors"
  const inputStyle = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }
  const focusStyle = { borderColor: 'rgba(226,201,126,0.5)' }

  return (
    <div className="overlay" style={{ zIndex: 200 }}>
      <div
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-md)',
          width: 680,
          maxWidth: '96vw',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>
            {isNew ? 'Новое существо' : `Редактировать: ${form.name}`}
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── ТИП ── */}
          <Section title="Тип участника">
            <div className="flex flex-wrap gap-2">
              {ENTITY_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => set('type', t.id)}
                  className="font-cinzel text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  style={{
                    background: form.type === t.id ? 'var(--gold-dim)' : 'var(--bg-row)',
                    color: form.type === t.id ? 'var(--gold)' : 'var(--text-dim)',
                    border: `1px solid ${form.type === t.id ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Section>

          {/* ── ОСНОВНОЕ ── */}
          <Section title="Основное">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Имя *">
                <input className={inputCls} style={inputStyle} value={form.name}
                  onChange={e => set('name', e.target.value)}
                  onFocus={e => Object.assign(e.target.style, focusStyle)}
                  onBlur={e => Object.assign(e.target.style, inputStyle)}
                />
              </Field>
              <Field label="Размер">
                    <Select value={form.size} onChange={v => set('size', v)} options={SIZES.map(s => ({ id: s, label: s }))} />
                  </Field>
                  <Field label="Тип существа">
                    <Select value={form.creatureType} onChange={v => set('creatureType', v)} options={CREATURE_TYPES.map(t => ({ id: t, label: t }))} />
                  </Field>
                  <Field label="CR">
                    <Select value={form.cr} onChange={handleCrChange} options={CR_VALUES.map(v => ({ id: v, label: v }))} />
                  </Field>
                  <Field label="Бонус мастерства">
                    <input className={inputCls} style={inputStyle} type="number" value={form.proficiencyBonus}
                      onChange={e => set('proficiencyBonus', Number(e.target.value))}
                      onFocus={e => Object.assign(e.target.style, focusStyle)}
                      onBlur={e => Object.assign(e.target.style, inputStyle)}
                    />
                  </Field>
                  <Field label="Источник">
                    <Select value={form.source ?? 'HB'} onChange={v => set('source', v)} options={[
                      { id: 'HB',   label: 'HB — Homebrew' },
                      { id: 'DMG',  label: 'DMG — Dungeon Master\'s Guide' },
                      { id: 'MM',   label: 'MM — Monster Manual' },
                      { id: 'VGM',  label: 'VGM — Volo\'s Guide to Monsters' },
                      { id: 'XGE',  label: 'XGE — Xanathar\'s Guide to Everything' },
                      { id: 'MTF',  label: 'MTF — Mordenkainen\'s Tome of Foes' },
                      { id: 'TCE',  label: 'TCE — Tasha\'s Cauldron of Everything' },
                      { id: 'MPMM', label: 'MPMM — Monsters of the Multiverse' },
                      { id: 'UA',   label: 'UA — Unearthed Arcana' },
                      { id: 'TOA',  label: 'TOA — Tomb of Annihilation' },
                      { id: 'OoTA', label: 'OoTA — Out of the Abyss' },
                      { id: 'PoTA', label: 'PoTA — Princes of the Apocalypse' },
                      { id: 'LH',   label: 'LH — LaserLlama' },
                    ]} />
                  </Field>
            </div>
          </Section>

          {/* ── БОЕВЫЕ ХАРАКТЕРИСТИКИ ── */}
          <Section title="Боевые характеристики">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Среднее HP">
                    <input className={inputCls} style={inputStyle} type="number" value={form.hp?.average ?? 0}
                      onChange={e => setNested('hp', 'average', Number(e.target.value))}
                      onFocus={e => Object.assign(e.target.style, focusStyle)}
                      onBlur={e => Object.assign(e.target.style, inputStyle)}
                    />
                  </Field>
                  <Field label="Формула HP (например 7к8+14)">
                    <input className={inputCls} style={inputStyle} value={form.hp?.formula ?? ''}
                      onChange={e => setNested('hp', 'formula', e.target.value)}
                      onFocus={e => Object.assign(e.target.style, focusStyle)}
                      onBlur={e => Object.assign(e.target.style, inputStyle)}
                    />
                  </Field>
                  <Field label="КД">
                    <input className={inputCls} style={inputStyle} type="number" value={form.ac?.value ?? 10}
                      onChange={e => setNested('ac', 'value', Number(e.target.value))}
                      onFocus={e => Object.assign(e.target.style, focusStyle)}
                      onBlur={e => Object.assign(e.target.style, inputStyle)}
                    />
                  </Field>
                  <Field label="Тип доспеха (необязательно)">
                    <input className={inputCls} style={inputStyle} value={form.ac?.note ?? ''}
                      placeholder="кольчуга, природный доспех..."
                      onChange={e => setNested('ac', 'note', e.target.value)}
                      onFocus={e => Object.assign(e.target.style, focusStyle)}
                      onBlur={e => Object.assign(e.target.style, inputStyle)}
                    />
                  </Field>
                  <Field label="Скорость">
                    <input className={inputCls} style={inputStyle} value={form.speed ?? ''}
                      placeholder="9 м, полёт 18 м..."
                      onChange={e => set('speed', e.target.value)}
                      onFocus={e => Object.assign(e.target.style, focusStyle)}
                      onBlur={e => Object.assign(e.target.style, inputStyle)}
                    />
                  </Field>
                  <Field label="Бонус инициативы">
                    <input className={inputCls} style={inputStyle} type="number" value={form.initiative ?? 0}
                      onChange={e => set('initiative', Number(e.target.value))}
                      onFocus={e => Object.assign(e.target.style, focusStyle)}
                      onBlur={e => Object.assign(e.target.style, inputStyle)}
                    />
                  </Field>
            </div>
          </Section>

          {/* ── ХАРАКТЕРИСТИКИ ── */}
          <Section title="Характеристики">
            <div className="grid grid-cols-6 gap-2">
              {ABILITY_KEYS.map(k => (
                <div key={k} className="flex flex-col items-center gap-1">
                  <span className="font-cinzel text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>{ABILITY_LABELS[k]}</span>
                  <input
                    type="number" min={1} max={30}
                    className="w-full text-center font-cinzel text-sm font-bold rounded-lg py-1.5 outline-none"
                    style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
                    value={form.abilities?.[k] ?? 10}
                    onChange={e => setAbility(k, e.target.value)}
                  />
                  <span className="font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>
                    {abilityMod(form.abilities?.[k] ?? 10)}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── СОПРОТИВЛЕНИЯ (для всех типов) ── */}
          <Section title="Иммунитеты / Сопротивления / Уязвимости">
            {[
              { field: 'immunities',      label: 'Иммунитеты к урону',  color: '#93c5fd' },
              { field: 'resistances',     label: 'Сопротивления',       color: '#4ade80' },
              { field: 'vulnerabilities', label: 'Уязвимости',          color: '#f87171' },
            ].map(({ field, label, color }) => (
              <div key={field} className="mb-3">
                <div className="font-cinzel text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div className="flex flex-wrap gap-1">
                  {DMG_TYPES.map(t => {
                    const active = (form[field] ?? []).includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleStringArray(field, t.id)}
                        className="font-cinzel text-[10px] px-2 py-0.5 rounded-md transition-all cursor-pointer"
                        style={{
                          background: active ? `${color}22` : 'var(--bg-row)',
                          color: active ? color : 'var(--text-muted)',
                          border: `1px solid ${active ? color + '66' : 'var(--border)'}`,
                        }}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <div>
                <div className="font-cinzel text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Иммунитеты к состояниям</div>
                <div className="flex flex-wrap gap-1">
                  {CONDITION_IMMUNITY_OPTIONS.map(ci => {
                    const active = (form.conditionImmunities ?? []).includes(ci)
                    return (
                      <button key={ci} type="button"
                        onClick={() => toggleStringArray('conditionImmunities', ci)}
                        className="font-cinzel text-[10px] px-2 py-0.5 rounded-md transition-all cursor-pointer"
                        style={{
                          background: active ? 'rgba(167,139,250,0.15)' : 'var(--bg-row)',
                          color: active ? '#c4b5fd' : 'var(--text-muted)',
                          border: `1px solid ${active ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
                        }}
                      >{ci}</button>
                    )
                  })}
                </div>
              </div>
          </Section>

          {/* ── СПАСБРОСКИ (только не-игроки) ── */}
            <Section title="Спасброски с владением">
              <div className="flex flex-wrap gap-2 mb-2">
                {ABILITY_KEYS.map(k => {
                  const existing = form.savingThrows?.find(s => s.ability === k)
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (existing) {
                          setForm(f => ({ ...f, savingThrows: f.savingThrows.filter(s => s.ability !== k) }))
                        } else {
                          const mod = Math.floor(((form.abilities?.[k] ?? 10) - 10) / 2)
                          addToArray('savingThrows', { ability: ABILITY_FULL[k], bonus: mod + (form.proficiencyBonus ?? 2) })
                        }
                      }}
                      className="font-cinzel text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      style={{
                        background: existing ? 'var(--gold-dim)' : 'var(--bg-row)',
                        color: existing ? 'var(--gold)' : 'var(--text-dim)',
                        border: `1px solid ${existing ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
                      }}
                    >
                      {ABILITY_LABELS[k]}
                    </button>
                  )
                })}
              </div>
              {form.savingThrows?.map((s, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  <span className="text-sm flex-1" style={{ color: 'var(--text-dim)' }}>{s.ability}</span>
                  <input
                    type="number"
                    className="w-16 text-center rounded px-2 py-1 text-sm outline-none"
                    style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    value={s.bonus}
                    onChange={e => updateInArray('savingThrows', i, x => ({ ...x, bonus: Number(e.target.value) }))}
                  />
                  <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => removeFromArray('savingThrows', i)}>
                    <IconTrash size={11} />
                  </button>
                </div>
              ))}
            </Section>

          {/* ── НАВЫКИ (только не-игроки) ── */}
            <Section title="Навыки с владением">
              <div className="flex flex-wrap gap-1 mb-2">
                {SKILLS.map(sk => {
                  const exists = form.skills?.find(s => s.name === sk.label)
                  return (
                    <button
                      key={sk.id}
                      type="button"
                      onClick={() => {
                        if (exists) {
                          setForm(f => ({ ...f, skills: f.skills.filter(s => s.name !== sk.label) }))
                        } else {
                          const base = Math.floor(((form.abilities?.[sk.ability] ?? 10) - 10) / 2)
                          addToArray('skills', { name: sk.label, bonus: base + (form.proficiencyBonus ?? 2) })
                        }
                      }}
                      className="font-cinzel text-[10px] px-2 py-0.5 rounded-md transition-all cursor-pointer"
                      style={{
                        background: exists ? 'var(--gold-dim)' : 'var(--bg-row)',
                        color: exists ? 'var(--gold)' : 'var(--text-muted)',
                        border: `1px solid ${exists ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
                      }}
                    >
                      {sk.label}
                    </button>
                  )
                })}
              </div>
              {form.skills?.map((s, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  <span className="text-sm flex-1" style={{ color: 'var(--text-dim)' }}>{s.name}</span>
                  <input
                    type="number"
                    className="w-16 text-center rounded px-2 py-1 text-sm outline-none"
                    style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    value={s.bonus}
                    onChange={e => updateInArray('skills', i, x => ({ ...x, bonus: Number(e.target.value) }))}
                  />
                  <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => removeFromArray('skills', i)}>
                    <IconTrash size={11} />
                  </button>
                </div>
              ))}
            </Section>

          {/* ── ЧУВСТВА / ЯЗЫКИ (только не-игроки) ── */}
            <Section title="Чувства и языки">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Чувства">
                  <input className={inputCls} style={inputStyle} value={form.senses ?? ''}
                    placeholder="тёмное зрение 18 м..."
                    onChange={e => set('senses', e.target.value)}
                    onFocus={e => Object.assign(e.target.style, focusStyle)}
                    onBlur={e => Object.assign(e.target.style, inputStyle)}
                  />
                </Field>
                <Field label="Языки">
                  <input className={inputCls} style={inputStyle} value={form.languages ?? ''}
                    placeholder="Общий, Орочий..."
                    onChange={e => set('languages', e.target.value)}
                    onFocus={e => Object.assign(e.target.style, focusStyle)}
                    onBlur={e => Object.assign(e.target.style, inputStyle)}
                  />
                </Field>
              </div>
            </Section>

          {/* ── ЧЕРТЫ (только не-игроки) ── */}
            <Section title="Черты">
              {form.traits?.map((t, i) => (
                <div key={i} className="flex gap-2 mb-2 p-2 rounded-lg" style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      className={inputCls} style={inputStyle}
                      placeholder="Название черты"
                      value={t.name}
                      onChange={e => updateInArray('traits', i, x => ({ ...x, name: e.target.value }))}
                    />
                    <textarea
                      className={`${inputCls} resize-none`} style={{ ...inputStyle, minHeight: 60 }}
                      placeholder="Описание..."
                      value={t.description}
                      onChange={e => updateInArray('traits', i, x => ({ ...x, description: e.target.value }))}
                    />
                  </div>
                  <button className="icon-btn self-start" onClick={() => removeFromArray('traits', i)}>
                    <IconTrash size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-ghost w-full justify-center"
                style={{ fontSize: 12 }}
                onClick={() => addToArray('traits', { name: '', description: '' })}
              >
                <IconPlus size={13} /> Добавить черту
              </button>
            </Section>

          {/* ── ДЕЙСТВИЯ (только не-игроки) ── */}
            <Section title="Действия и атаки">
              {form.actions?.map((a, i) => (
                <div key={i}
                  draggable
                  onDragStart={e => handleDragStart(e, i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={e => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  className="flex gap-2 mb-2 p-3 rounded-lg"
                  style={{
                    background: 'var(--bg-row)',
                    border: `1px solid ${dragOverIdx === i && dragIdx !== i ? 'rgba(226,201,126,0.6)' : 'var(--border)'}`,
                    opacity: dragIdx === i ? 0.4 : 1,
                    transition: 'opacity 0.15s, border-color 0.15s',
                  }}>
                  {/* Рукоятка перетаскивания */}
                  <div className="flex items-start pt-1 shrink-0" style={{ color: 'var(--text-muted)', cursor: 'grab' }}>
                    <IconGripVertical size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Field label="Название">
                        <input className={inputCls} style={inputStyle} value={a.name}
                          onChange={e => updateInArray('actions', i, x => ({ ...x, name: e.target.value }))}
                        />
                      </Field>
                      <Field label="Секция">
                        <Select value={a.section} onChange={v => updateInArray('actions', i, x => ({ ...x, section: v }))}
                          options={ACTION_SECTIONS.map(s => ({ id: s.id, label: s.label }))} />
                      </Field>
                      <Field label="Тип атаки">
                        <Select
                          value={a.attackType ?? ''}
                          onChange={v => updateInArray('actions', i, x => ({ ...x, attackType: v }))}
                          options={[
                            { id: '',       label: '— не атака —' },
                            { id: 'melee',  label: 'Атака рукопашным оружием' },
                            { id: 'ranged', label: 'Атака дальнобойным оружием' },
                          ]}
                        />
                      </Field>
                      <Field label="Бонус попадания">
                        <input className={inputCls} style={inputStyle} type="number" value={a.attackBonus ?? ''}
                          placeholder="пусто = нет атаки"
                          onChange={e => updateInArray('actions', i, x => ({ ...x, attackBonus: e.target.value === '' ? null : Number(e.target.value) }))}
                        />
                      </Field>
                      {/* Досягаемость — для рукопашных */}
                      {a.attackType === 'melee' && (
                        <Field label="Досягаемость">
                          <input className={inputCls} style={inputStyle} value={a.reach ?? ''}
                            placeholder="1,5 м"
                            onChange={e => updateInArray('actions', i, x => ({ ...x, reach: e.target.value }))}
                          />
                        </Field>
                      )}
                      {/* Дальность — для дальнобойных */}
                      {a.attackType === 'ranged' && (
                        <Field label="Дальность (норм./макс.)">
                          <input className={inputCls} style={inputStyle} value={a.range ?? ''}
                            placeholder="18/60 м"
                            onChange={e => updateInArray('actions', i, x => ({ ...x, range: e.target.value }))}
                          />
                        </Field>
                      )}
                      {a.attackType && (
                      <Field label="Урон">
                        {(a.damages ?? [{ ...EMPTY_DAMAGE }]).map((d, di) => {
                          const updateDmg = upd =>
                            updateInArray('actions', i, x => ({
                              ...x,
                              damages: x.damages.map((dd, ddi) => ddi === di ? { ...dd, ...upd } : dd),
                            }))
                          const updateBonus = (bi, upd) =>
                            updateInArray('actions', i, x => ({
                              ...x,
                              damages: x.damages.map((dd, ddi) => ddi === di ? {
                                ...dd,
                                bonuses: dd.bonuses.map((b, bii) => bii === bi ? { ...b, ...upd } : b),
                              } : dd),
                            }))
                          const addBonus = () =>
                            updateInArray('actions', i, x => ({
                              ...x,
                              damages: x.damages.map((dd, ddi) => ddi === di ? {
                                ...dd, bonuses: [...(dd.bonuses ?? []), { type: 'str', value: '' }],
                              } : dd),
                            }))
                          const removeBonus = bi =>
                            updateInArray('actions', i, x => ({
                              ...x,
                              damages: x.damages.map((dd, ddi) => ddi === di ? {
                                ...dd, bonuses: dd.bonuses.filter((_, bii) => bii !== bi),
                              } : dd),
                            }))
                          const preview = computeDamagePreview(d, form.abilities)
                          return (
                            <div key={di} className="mb-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                              {/* Строка кубиков и типа урона */}
                              <div className="flex gap-1.5 p-2 items-center" style={{ background: 'var(--bg-deep)' }}>
                                <select
                                  value={d.count ?? 1}
                                  onChange={e => updateDmg({ count: Number(e.target.value) })}
                                  className="rounded px-1.5 py-1 text-sm outline-none cursor-pointer font-cinzel text-center"
                                  style={{ width: 48, background: 'var(--bg-row)', border: '1px solid var(--border-md)', color: 'var(--text)' }}>
                                  {Array.from({ length: 20 }, (_, n) => n + 1).map(n => (
                                    <option key={n} value={n}>{n}</option>
                                  ))}
                                </select>
                                <span className="font-cinzel text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>×</span>
                                <select
                                  value={d.die ?? 'd6'}
                                  onChange={e => updateDmg({ die: e.target.value })}
                                  className="rounded px-1.5 py-1 text-sm outline-none cursor-pointer font-cinzel text-center"
                                  style={{ width: 64, background: 'var(--bg-row)', border: '1px solid var(--border-md)', color: 'var(--text)' }}>
                                  {DICE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <span className="font-cinzel text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>·</span>
                                <select
                                  value={d.type ?? ''}
                                  onChange={e => updateDmg({ type: e.target.value })}
                                  className="rounded px-2 py-1 text-sm outline-none cursor-pointer flex-1"
                                  style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)', color: 'var(--text)' }}>
                                  <option value="">— тип урона —</option>
                                  {DMG_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                                {(a.damages ?? []).length > 1 && (
                                  <button className="icon-btn shrink-0" style={{ width: 22, height: 22 }}
                                    onClick={() => updateInArray('actions', i, x => ({
                                      ...x, damages: x.damages.filter((_, ddi) => ddi !== di),
                                    }))}>
                                    <IconTrash size={10} />
                                  </button>
                                )}
                              </div>
                              {/* Бонусы */}
                              <div className="px-2 pt-1.5 pb-1" style={{ background: 'var(--bg-row)' }}>
                                {(d.bonuses ?? []).map((b, bi) => {
                                  const isAbility = ABILITY_KEYS.includes(b.type)
                                  const mod = isAbility
                                    ? Math.floor(((form.abilities?.[b.type] ?? 10) - 10) / 2)
                                    : null
                                  return (
                                    <div key={bi} className="flex gap-2 mb-1 items-center">
                                      <span className="font-cinzel text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>+</span>
                                      <select
                                        value={b.type}
                                        onChange={e => updateBonus(bi, { type: e.target.value, value: '' })}
                                        className="rounded px-2 py-1 text-sm outline-none cursor-pointer"
                                        style={{ width: 130, background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }}>
                                        {BONUS_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                      </select>
                                      {isAbility && (
                                        <span className="font-cinzel text-sm shrink-0" style={{ minWidth: 28, color: 'var(--gold)' }}>
                                          {mod >= 0 ? `+${mod}` : String(mod)}
                                        </span>
                                      )}
                                      {b.type === 'special' && (
                                        <input
                                          type="text" placeholder="+5" value={b.value ?? ''}
                                          onChange={e => updateBonus(bi, { value: e.target.value })}
                                          className="rounded px-2 py-1 text-sm outline-none font-cinzel"
                                          style={{ width: 64, background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
                                        />
                                      )}
                                      <button className="icon-btn shrink-0 ml-auto" style={{ width: 20, height: 20 }}
                                        onClick={() => removeBonus(bi)}>
                                        <IconTrash size={10} />
                                      </button>
                                    </div>
                                  )
                                })}
                                <button type="button" className="btn btn-ghost w-full justify-center" style={{ fontSize: 10, paddingTop: 2, paddingBottom: 2 }}
                                  onClick={addBonus}>
                                  <IconPlus size={10} /> Добавить бонус
                                </button>
                              </div>
                              {/* Превью формулы */}
                              <div className="px-2 py-1 flex items-center gap-1.5" style={{ background: 'rgba(0,0,0,0.25)', borderTop: '1px solid var(--border)' }}>
                                <span className="font-cinzel text-[10px]" style={{ color: 'var(--text-muted)' }}>→</span>
                                <span className="font-cinzel text-[11px]" style={{ color: 'var(--gold)' }}>{preview}</span>
                              </div>
                            </div>
                          )
                        })}
                        <button type="button" className="btn btn-ghost w-full justify-center mt-1" style={{ fontSize: 11 }}
                          onClick={() => updateInArray('actions', i, x => ({
                            ...x, damages: [...(x.damages ?? []), { ...EMPTY_DAMAGE }],
                          }))}>
                          <IconPlus size={11} /> Ещё урон
                        </button>
                      </Field>
                      )}
                    </div>
                    <Field label="Описание">
                      <textarea
                        className={`${inputCls} resize-none`} style={{ ...inputStyle, minHeight: 50 }}
                        value={a.description}
                        onChange={e => updateInArray('actions', i, x => ({ ...x, description: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <button className="icon-btn self-start shrink-0" onClick={() => removeFromArray('actions', i)}>
                    <IconTrash size={12} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost w-full justify-center" style={{ fontSize: 12 }}
                onClick={() => addToArray('actions', { name: '', section: 'action', attackBonus: null, damages: [{ ...EMPTY_DAMAGE }], description: '' })}>
                <IconPlus size={13} /> Добавить действие
              </button>
            </Section>

          {/* ── ЛЕГЕНДАРНЫЕ (только не-игроки) ── */}
            <Section title="Легендарные способности">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Легендарных сопротивлений / день (0 = нет)">
                  <input className={inputCls} style={inputStyle} type="number" min={0}
                    value={form.legendaryResistances ?? 0}
                    onChange={e => set('legendaryResistances', Number(e.target.value) || null)}
                  />
                </Field>
                <Field label="Легендарных действий / ход (0 = нет)">
                  <input className={inputCls} style={inputStyle} type="number" min={0}
                    value={form.legendaryActionCount ?? 0}
                    onChange={e => set('legendaryActionCount', Number(e.target.value) || null)}
                  />
                </Field>
              </div>
            </Section>

          {/* ── ЗАКЛИНАТЕЛЬ (только не-игроки) ── */}
            <SpellcastingSection
              form={form}
              setForm={setForm}
              inputCls={inputCls}
              inputStyle={inputStyle}
              focusStyle={focusStyle}
            />

          {/* ── ТЕГИ И ЗАМЕТКИ ── */}
          <Section title="Теги и заметки">
            <Field label="Теги (через запятую, например: лес, пещера, нежить)">
              <input className={inputCls} style={inputStyle}
                value={tagsInput}
                placeholder="лес, пещера, нежить..."
                onChange={e => setTagsInput(e.target.value)}
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, inputStyle)}
              />
            </Field>
            <Field label="Заметки ДМ">
              <textarea
                className={`${inputCls} resize-none`} style={{ ...inputStyle, minHeight: 70 }}
                value={form.notes ?? ''}
                onChange={e => set('notes', e.target.value)}
              />
            </Field>
          </Section>
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

// ── Spellcasting helpers ──────────────────────────────────────────────────────

const SPELL_ABILITY_OPTIONS = [
  { id: 'str', label: 'Сила' },
  { id: 'dex', label: 'Ловкость' },
  { id: 'con', label: 'Телосложение' },
  { id: 'int', label: 'Интеллект' },
  { id: 'wis', label: 'Мудрость' },
  { id: 'cha', label: 'Харизма' },
]

const SLOT_COUNT_OPTIONS = [
  { id: 'null',      label: '—' },
  { id: 'unlimited', label: '∞ Неограниченно' },
  { id: '1', label: '1' },
  { id: '2', label: '2' },
  { id: '3', label: '3' },
  { id: '4', label: '4' },
  { id: '5', label: '5' },
]

const EMPTY_SPELLCASTING = {
  level: 1,
  ability: 'int',
  saveDCOverride: null,
  attackBonusOverride: null,
  slots: Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [
      i, { count: i === 0 ? 'unlimited' : 'null', spells: '' }
    ])
  ),
}

function calcSpellStats(form) {
  const sc   = form.spellcasting
  const mod  = Math.floor(((form.abilities?.[sc?.ability ?? 'int'] ?? 10) - 10) / 2)
  const prof = form.proficiencyBonus ?? 2
  return {
    saveDC:       sc?.saveDCOverride       ?? (8 + prof + mod),
    attackBonus:  sc?.attackBonusOverride  ?? (prof + mod),
  }
}

function SpellcastingSection({ form, setForm, inputCls, inputStyle, focusStyle }) {
  const sc = form.spellcasting
  const enabled = !!sc
  const { saveDC, attackBonus } = enabled ? calcSpellStats(form) : { saveDC: 0, attackBonus: 0 }

  function toggle() {
    setForm(f => ({ ...f, spellcasting: f.spellcasting ? null : { ...EMPTY_SPELLCASTING } }))
  }
  function setSC(key, val) {
    setForm(f => ({ ...f, spellcasting: { ...f.spellcasting, [key]: val } }))
  }
  function setSlot(level, key, val) {
    setForm(f => ({
      ...f,
      spellcasting: {
        ...f.spellcasting,
        slots: { ...f.spellcasting.slots, [level]: { ...f.spellcasting.slots[level], [key]: val } }
      }
    }))
  }

  const iStyle = inputStyle
  const iCls   = inputCls

  return (
    <div className="mb-5">
      <div className="font-cinzel text-xs tracking-widest uppercase pb-1 flex items-center gap-3"
        style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(226,201,126,0.2)', marginBottom: 12 }}>
        Заклинатель
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: 11, color: enabled ? '#4ade80' : 'var(--text-muted)', fontWeight: 'normal', textTransform: 'none', letterSpacing: 0 }}>
          <input type="checkbox" checked={enabled} onChange={toggle} style={{ accentColor: '#4ade80', width: 13, height: 13 }} />
          {enabled ? 'Включён' : 'Выключен'}
        </label>
      </div>

      {enabled && (
        <div>
          {/* Уровень + Характеристика */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="font-cinzel text-[10px] tracking-wide uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Уровень заклинателя (1–20)</div>
              <input className={iCls} style={iStyle} type="number" min={1} max={20}
                value={sc.level}
                onChange={e => setSC('level', Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, iStyle)}
              />
            </div>
            <div>
              <div className="font-cinzel text-[10px] tracking-wide uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Заклинательная характеристика</div>
              <Select value={sc.ability} onChange={v => setSC('ability', v)} options={SPELL_ABILITY_OPTIONS} />
            </div>
          </div>

          {/* СЛ + Бонус атаки */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="font-cinzel text-[10px] tracking-wide uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                СЛ спасброска <span style={{ color: 'var(--text-muted)', fontFamily: 'sans-serif', fontSize: 10 }}>(авто: {8 + (form.proficiencyBonus ?? 2) + Math.floor(((form.abilities?.[sc.ability] ?? 10) - 10) / 2)})</span>
              </div>
              <div className="flex gap-2">
                <input className={iCls} style={{ ...iStyle, flex: 1 }} type="number"
                  placeholder={`авто (${8 + (form.proficiencyBonus ?? 2) + Math.floor(((form.abilities?.[sc.ability] ?? 10) - 10) / 2)})`}
                  value={sc.saveDCOverride ?? ''}
                  onChange={e => setSC('saveDCOverride', e.target.value === '' ? null : Number(e.target.value))}
                  onFocus={e => Object.assign(e.target.style, focusStyle)}
                  onBlur={e => Object.assign(e.target.style, iStyle)}
                />
                {sc.saveDCOverride !== null && (
                  <button type="button" className="btn btn-ghost shrink-0" style={{ fontSize: 10, padding: '2px 8px' }}
                    onClick={() => setSC('saveDCOverride', null)} title="Сбросить">↻</button>
                )}
              </div>
            </div>
            <div>
              <div className="font-cinzel text-[10px] tracking-wide uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                Бонус атаки заклинанием <span style={{ color: 'var(--text-muted)', fontFamily: 'sans-serif', fontSize: 10 }}>(авто: {(form.proficiencyBonus ?? 2) + Math.floor(((form.abilities?.[sc.ability] ?? 10) - 10) / 2) >= 0 ? '+' : ''}{(form.proficiencyBonus ?? 2) + Math.floor(((form.abilities?.[sc.ability] ?? 10) - 10) / 2)})</span>
              </div>
              <div className="flex gap-2">
                <input className={iCls} style={{ ...iStyle, flex: 1 }} type="number"
                  placeholder={`авто`}
                  value={sc.attackBonusOverride ?? ''}
                  onChange={e => setSC('attackBonusOverride', e.target.value === '' ? null : Number(e.target.value))}
                  onFocus={e => Object.assign(e.target.style, focusStyle)}
                  onBlur={e => Object.assign(e.target.style, iStyle)}
                />
                {sc.attackBonusOverride !== null && (
                  <button type="button" className="btn btn-ghost shrink-0" style={{ fontSize: 10, padding: '2px 8px' }}
                    onClick={() => setSC('attackBonusOverride', null)} title="Сбросить">↻</button>
                )}
              </div>
            </div>
          </div>

          {/* Ячейки заклинаний */}
          <div className="font-cinzel text-[10px] tracking-wide uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
            Заклинания по кругам
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }, (_, lvl) => {
              const slot  = sc.slots?.[lvl] ?? { count: lvl === 0 ? 'unlimited' : 'null', spells: '' }
              const countVal = String(slot.count ?? 'null')
              const isActive = countVal !== 'null'
              return (
                <div key={lvl} className="rounded-lg p-2.5" style={{ background: isActive ? 'var(--bg-row)' : 'transparent', border: `1px solid ${isActive ? 'var(--border-md)' : 'var(--border)'}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-cinzel text-xs font-semibold shrink-0" style={{ color: isActive ? 'var(--gold)' : 'var(--text-muted)', minWidth: 90 }}>
                      {lvl === 0 ? 'Заговоры' : `${lvl} уровень`}
                    </span>
                    <select
                      value={countVal}
                      onChange={e => setSlot(lvl, 'count', e.target.value === 'null' ? 'null' : e.target.value)}
                      className="rounded px-2 py-1 text-xs outline-none cursor-pointer"
                      style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)', minWidth: 120 }}
                    >
                      {SLOT_COUNT_OPTIONS.filter(o => lvl === 0 ? o.id !== 'null' : true).map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  {isActive && (
                    <input className={iCls} style={{ ...iStyle, fontSize: 12 }}
                      placeholder="заклинание 1, заклинание 2, ..."
                      value={slot.spells}
                      onChange={e => setSlot(lvl, 'spells', e.target.value)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-5">
      <div className="font-cinzel text-xs tracking-widest uppercase mb-2 pb-1" style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(226,201,126,0.2)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div className="font-cinzel text-[10px] tracking-wide uppercase mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer"
      style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
    >
      {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  )
}
