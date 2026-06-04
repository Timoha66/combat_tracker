import { useState } from 'react'
import { IconX, IconCheck, IconTrash, IconPlus } from '@tabler/icons-react'
import { usePartyStore } from '../../store/partyStore'
import { EMPTY_PLAYER, PLAYER_SIZES } from '../../data/partyDb'
import { ABILITY_KEYS, ABILITY_LABELS } from '../../data/gameData'
import { DMG_TYPES } from '../../data/constants'
import { DAMAGE_BONUS_TYPES, DIE_SIZES } from '../../data/spellDb'

const ACTION_SECTIONS = [
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

export default function PlayerForm({ initial, onClose, onSaved }) {
  const { addPlayer, updatePlayer, deletePlayer } = usePartyStore()
  const isNew = !initial?.id
  const [form, setForm] = useState({ ...EMPTY_PLAYER, ...initial })
  const [saving, setSaving] = useState(false)

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setAb = (k, v) => setForm(f => ({ ...f, abilities: { ...f.abilities, [k]: Number(v) || 10 } }))

  function addToArray(field, item) {
    setForm(f => ({ ...f, [field]: [...(f[field] ?? []), item] }))
  }
  function removeFromArray(field, i) {
    setForm(f => ({ ...f, [field]: f[field].filter((_, idx) => idx !== i) }))
  }
  function updateInArray(field, i, updater) {
    setForm(f => ({ ...f, [field]: f[field].map((item, idx) => idx === i ? updater(item) : item) }))
  }

  // Damage within actions
  function setActionDmg(aIdx, dIdx, key, val) {
    setForm(f => ({
      ...f,
      actions: f.actions.map((a, i) => i !== aIdx ? a : {
        ...a,
        damages: (a.damages ?? []).map((d, j) => j !== dIdx ? d : { ...d, [key]: val }),
      }),
    }))
  }
  function addActionDmg(aIdx) {
    setForm(f => ({
      ...f,
      actions: f.actions.map((a, i) => i !== aIdx ? a : {
        ...a, damages: [...(a.damages ?? []), { count: 1, die: 'd6', dmgType: '', bonus: '', bonusCustom: '' }],
      }),
    }))
  }
  function removeActionDmg(aIdx, dIdx) {
    setForm(f => ({
      ...f,
      actions: f.actions.map((a, i) => i !== aIdx ? a : {
        ...a, damages: (a.damages ?? []).filter((_, j) => j !== dIdx),
      }),
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) { alert('Введи имя'); return }
    setSaving(true)
    try {
      const saved = isNew ? await addPlayer(form) : await updatePlayer(form.id, form)
      onSaved(saved)
    } finally { setSaving(false) }
  }
  async function handleDelete() {
    if (!confirm(`Удалить «${form.name}»?`)) return
    await deletePlayer(form.id)
    onClose()
  }

  const iStyle = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }
  const iCls   = 'w-full rounded-lg px-3 py-1.5 text-sm outline-none'
  const selCls = `${iCls} cursor-pointer`

  function SectionHeader({ title, showKey }) {
    return (
      <div className="flex items-center justify-between mb-2 pb-1"
        style={{ borderBottom: '1px solid rgba(226,201,126,0.2)' }}>
        <span className="font-cinzel text-xs tracking-widest uppercase" style={{ color: 'var(--gold)' }}>{title}</span>
        {showKey && (
          <label className="flex items-center gap-1.5 cursor-pointer"
            style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: form[showKey] ? '#4ade80' : 'var(--text-muted)' }}>
            <input type="checkbox" checked={form[showKey] ?? false} onChange={e => set(showKey, e.target.checked)}
              style={{ accentColor: '#4ade80', width: 12, height: 12 }} />
            В карточке
          </label>
        )}
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

  return (
    <div className="overlay" style={{ zIndex: 400 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-md)', width: 680, maxWidth: '96vw', maxHeight: '92vh' }}>

        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>
            {isNew ? 'Новый персонаж' : `Редактировать: ${form.name}`}
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

          {/* ── ОСНОВНОЕ ── */}
          <div><SectionHeader title="Основное" />
            <div className="grid grid-cols-4 gap-3 mb-2">
              <div className="col-span-2">
                <Field label="Имя *">
                  <input className={iCls} style={iStyle} value={form.name} placeholder="Торин Дубощит"
                    onChange={e => set('name', e.target.value)} />
                </Field>
              </div>
              <div>
                <Field label="Класс">
                  <input className={iCls} style={iStyle} value={form.playerClass ?? ''}
                    placeholder="Воин" onChange={e => set('playerClass', e.target.value)} />
                </Field>
              </div>
              <div>
                <Field label="Уровень">
                  <input className={iCls} style={iStyle} type="number" min={1} max={20}
                    value={form.level ?? 1}
                    onChange={e => set('level', Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
                </Field>
              </div>
            </div>
            <Field label="Размер">
              <select className={selCls} style={iStyle} value={form.size ?? 'Средний'} onChange={e => set('size', e.target.value)}>
                {PLAYER_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          {/* ── БОЕВЫЕ ХАРАКТЕРИСТИКИ ── */}
          <div><SectionHeader title="Боевые характеристики" showKey="showSpeed" />
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Field label="Макс. ХП">
                  <input className={iCls} style={iStyle} type="number" min={1}
                    value={form.hp?.max ?? 10}
                    onChange={e => set('hp', { ...form.hp, max: Number(e.target.value) || 10, current: Number(e.target.value) || 10 })} />
                </Field>
              </div>
              <div>
                <Field label="КД">
                  <input className={iCls} style={iStyle} type="number" min={1}
                    value={form.ac ?? 10} onChange={e => set('ac', Number(e.target.value) || 10)} />
                </Field>
              </div>
              <div>
                <Field label="Бонус инициативы">
                  <input className={iCls} style={iStyle} type="number"
                    value={form.initiative ?? 0} onChange={e => set('initiative', Number(e.target.value) || 0)} />
                </Field>
              </div>
              <div>
                <Field label="Скорость">
                  <input className={iCls} style={iStyle} value={form.speed ?? '9 м'}
                    onChange={e => set('speed', e.target.value)} />
                </Field>
              </div>
            </div>
          </div>

          {/* ── ХАРАКТЕРИСТИКИ ── */}
          <div><SectionHeader title="Характеристики" />
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
          </div>

          {/* ── СПАСБРОСКИ ── */}
          <div><SectionHeader title="Спасброски" showKey="showSavingThrows" />
            {(form.savingThrows ?? []).map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className={iCls} style={{ ...iStyle, flex: 1 }} value={s.ability}
                  placeholder="Сила" onChange={e => updateInArray('savingThrows', i, x => ({ ...x, ability: e.target.value }))} />
                <input className={iCls} style={{ ...iStyle, width: 80 }} type="number" value={s.bonus}
                  onChange={e => updateInArray('savingThrows', i, x => ({ ...x, bonus: Number(e.target.value) || 0 }))} />
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeFromArray('savingThrows', i)}>
                  <IconTrash size={11} /></button>
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11 }}
              onClick={() => addToArray('savingThrows', { ability: '', bonus: 0 })}>
              <IconPlus size={11} /> Добавить
            </button>
          </div>

          {/* ── НАВЫКИ ── */}
          <div><SectionHeader title="Навыки" showKey="showSkills" />
            {(form.skills ?? []).map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select className={selCls} style={{ ...iStyle, flex: 1 }}
                  value={s.name} onChange={e => updateInArray('skills', i, x => ({ ...x, name: e.target.value }))}>
                  <option value="">— выбери —</option>
                  {SKILLS_LIST.map(sk => <option key={sk} value={sk}>{sk}</option>)}
                </select>
                <input className={iCls} style={{ ...iStyle, width: 80 }} type="number" value={s.bonus}
                  onChange={e => updateInArray('skills', i, x => ({ ...x, bonus: Number(e.target.value) || 0 }))} />
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeFromArray('skills', i)}>
                  <IconTrash size={11} /></button>
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11 }}
              onClick={() => addToArray('skills', { name: '', bonus: 0 })}>
              <IconPlus size={11} /> Добавить
            </button>
          </div>

          {/* ── СОПРОТИВЛЕНИЯ ── */}
          <div><SectionHeader title="Сопротивления и иммунитеты" showKey="showResistances" />
            {[
              { label: 'Иммунитет к урону', key: 'immunities' },
              { label: 'Сопротивление', key: 'resistances' },
              { label: 'Уязвимость', key: 'vulnerabilities' },
              { label: 'Иммунитет к состояниям', key: 'conditionImmunities' },
            ].map(({ label, key }) => (
              <div key={key} className="mb-2">
                <div className="font-cinzel text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
                <input className={iCls} style={iStyle}
                  value={(form[key] ?? []).join(', ')}
                  placeholder="через запятую"
                  onChange={e => set(key, e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
              </div>
            ))}
          </div>

          {/* ── ЧУВСТВА И ЯЗЫКИ ── */}
          <div><SectionHeader title="Чувства и языки" showKey="showSenses" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Чувства">
                <input className={iCls} style={iStyle} value={form.senses ?? ''}
                  placeholder="Тёмное зрение 18 м" onChange={e => set('senses', e.target.value)} />
              </Field>
              <Field label="Языки">
                <input className={iCls} style={iStyle} value={form.languages ?? ''}
                  placeholder="Общий, Дварфийский" onChange={e => set('languages', e.target.value)} />
              </Field>
            </div>
          </div>

          {/* ── ЧЕРТЫ ── */}
          <div><SectionHeader title="Черты и особенности" showKey="showTraits" />
            {(form.traits ?? []).map((t, i) => (
              <div key={i} className="mb-3 p-3 rounded-xl" style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}>
                <div className="flex gap-2 mb-2">
                  <input className={iCls} style={{ ...iStyle, flex: 1 }} value={t.name}
                    placeholder="Название черты" onChange={e => updateInArray('traits', i, x => ({ ...x, name: e.target.value }))} />
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeFromArray('traits', i)}>
                    <IconTrash size={11} /></button>
                </div>
                <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 56 }}
                  value={t.description} placeholder="Описание..."
                  onChange={e => updateInArray('traits', i, x => ({ ...x, description: e.target.value }))} />
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11 }}
              onClick={() => addToArray('traits', { name: '', description: '' })}>
              <IconPlus size={11} /> Добавить черту
            </button>
          </div>

          {/* ── ДЕЙСТВИЯ ── */}
          <div><SectionHeader title="Действия и атаки" showKey="showActions" />
            {(form.actions ?? []).map((a, i) => (
              <div key={i} className="mb-3 p-3 rounded-xl" style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}>
                <div className="flex gap-2 mb-2">
                  <input className={iCls} style={{ ...iStyle, flex: 1 }} value={a.name}
                    placeholder="Название атаки" onChange={e => updateInArray('actions', i, x => ({ ...x, name: e.target.value }))} />
                  <select className={selCls} style={{ ...iStyle, width: 160 }}
                    value={a.section ?? 'action'}
                    onChange={e => updateInArray('actions', i, x => ({ ...x, section: e.target.value }))}>
                    {ACTION_SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeFromArray('actions', i)}>
                    <IconTrash size={11} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Field label="Бонус попадания">
                    <input className={iCls} style={iStyle} type="number"
                      value={a.attackBonus ?? ''} placeholder="+5"
                      onChange={e => updateInArray('actions', i, x => ({ ...x, attackBonus: e.target.value === '' ? null : Number(e.target.value) }))} />
                  </Field>
                  <Field label="Досягаемость">
                    <input className={iCls} style={iStyle} value={a.reach ?? ''}
                      placeholder="1,5 м" onChange={e => updateInArray('actions', i, x => ({ ...x, reach: e.target.value }))} />
                  </Field>
                  <Field label="Дальность">
                    <input className={iCls} style={iStyle} value={a.range ?? ''}
                      placeholder="18/54 м" onChange={e => updateInArray('actions', i, x => ({ ...x, range: e.target.value }))} />
                  </Field>
                </div>
                {/* Урон */}
                <div className="mb-2">
                  <div className="font-cinzel text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Урон</div>
                  {(a.damages ?? [{ count: 1, die: 'd6', dmgType: '', bonus: '', bonusCustom: '' }]).map((d, di) => (
                    <div key={di} className="flex gap-1.5 mb-1.5 items-center flex-wrap">
                      <input type="number" min={1} max={99} className="rounded-lg px-2 py-1.5 text-sm outline-none text-center"
                        style={{ ...iStyle, width: 52 }} value={d.count ?? 1}
                        onChange={e => setActionDmg(i, di, 'count', Math.max(1, Math.min(99, Number(e.target.value) || 1)))} />
                      <select className="rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer"
                        style={{ ...iStyle, width: 70 }} value={d.die ?? 'd6'}
                        onChange={e => setActionDmg(i, di, 'die', e.target.value)}>
                        {DIE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select className="rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer"
                        style={{ ...iStyle, minWidth: 90 }} value={d.bonus ?? ''}
                        onChange={e => setActionDmg(i, di, 'bonus', e.target.value)}>
                        {DAMAGE_BONUS_TYPES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                      </select>
                      {d.bonus === 'custom' && (
                        <input className="rounded-lg px-2 py-1.5 text-sm outline-none"
                          style={{ ...iStyle, width: 60 }} placeholder="+2"
                          value={d.bonusCustom ?? ''}
                          onChange={e => setActionDmg(i, di, 'bonusCustom', e.target.value)} />
                      )}
                      <select className="rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer"
                        style={{ ...iStyle, minWidth: 100 }} value={d.dmgType ?? ''}
                        onChange={e => setActionDmg(i, di, 'dmgType', e.target.value)}>
                        <option value="">— тип —</option>
                        {DMG_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                      {(a.damages ?? []).length > 1 && (
                        <button className="icon-btn shrink-0" style={{ width: 26, height: 26 }}
                          onClick={() => removeActionDmg(i, di)}><IconTrash size={11} /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-ghost w-full justify-center mt-1" style={{ fontSize: 11 }}
                    onClick={() => addActionDmg(i)}>
                    <IconPlus size={11} /> Ещё тип урона
                  </button>
                </div>
                <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 48 }}
                  value={a.description ?? ''} placeholder="Описание действия..."
                  onChange={e => updateInArray('actions', i, x => ({ ...x, description: e.target.value }))} />
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11 }}
              onClick={() => addToArray('actions', { name: '', section: 'action', attackBonus: null, reach: '', range: '', damages: [{ count: 1, die: 'd6', dmgType: '', bonus: '', bonusCustom: '' }], description: '' })}>
              <IconPlus size={11} /> Добавить действие
            </button>
          </div>

          {/* ── ЗАКЛИНАНИЯ ── */}
          <div><SectionHeader title="Заклинания" showKey="showSpellcasting" />
            <label className="flex items-center gap-2 cursor-pointer mb-3"
              style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: form.spellcasting ? 'var(--gold)' : 'var(--text-muted)' }}>
              <input type="checkbox" checked={!!form.spellcasting}
                onChange={e => set('spellcasting', e.target.checked ? { level: 1, ability: 'int', saveDCOverride: null, attackBonusOverride: null, slots: {} } : null)}
                style={{ accentColor: 'var(--gold)', width: 13, height: 13 }} />
              Персонаж является заклинателем
            </label>
            {form.spellcasting && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Уровень заклинателя">
                  <input className={iCls} style={iStyle} type="number" min={1} max={20}
                    value={form.spellcasting.level ?? 1}
                    onChange={e => set('spellcasting', { ...form.spellcasting, level: Number(e.target.value) || 1 })} />
                </Field>
                <Field label="Заклинательная характеристика">
                  <select className={selCls} style={iStyle}
                    value={form.spellcasting.ability ?? 'int'}
                    onChange={e => set('spellcasting', { ...form.spellcasting, ability: e.target.value })}>
                    {[['str','Сила'],['dex','Ловкость'],['con','Телосложение'],['int','Интеллект'],['wis','Мудрость'],['cha','Харизма']]
                      .map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </Field>
              </div>
            )}
          </div>

          {/* ── ДОПОЛНИТЕЛЬНО ── */}
          <div><SectionHeader title="Дополнительно" />
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-cinzel text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Грузоподъёмность</span>
                  <CbMini value={form.showCarryCapacity} onChange={v => set('showCarryCapacity', v)} />
                </div>
                <input className={iCls} style={iStyle} value={form.carryCapacity ?? ''}
                  placeholder="150 фунтов" onChange={e => set('carryCapacity', e.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-cinzel text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Истощение (0–6)</span>
                  <CbMini value={form.showExhaustion} onChange={v => set('showExhaustion', v)} />
                </div>
                <input className={iCls} style={iStyle} type="number" min={0} max={6}
                  value={form.exhaustion ?? 0}
                  onChange={e => set('exhaustion', Math.max(0, Math.min(6, Number(e.target.value) || 0)))} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-cinzel text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Состояния</span>
                  <CbMini value={form.showConditions} onChange={v => set('showConditions', v)} />
                </div>
                <input className={iCls} style={iStyle} value={form.conditions ?? ''}
                  placeholder="Отравлен, Испуган..."
                  onChange={e => set('conditions', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── ЗАМЕТКИ ── */}
          <div><SectionHeader title="Заметки" showKey="showNotes" />
            <textarea className={`${iCls} resize-none`} style={{ ...iStyle, minHeight: 80 }}
              value={form.notes ?? ''} placeholder="Заметки о персонаже..."
              onChange={e => set('notes', e.target.value)} />
          </div>

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

function CbMini({ value, onChange }) {
  return (
    <label className="flex items-center gap-1 cursor-pointer"
      style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: value ? '#4ade80' : 'var(--text-muted)' }}>
      <input type="checkbox" checked={value ?? false} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: '#4ade80', width: 11, height: 11 }} />
      В карточке
    </label>
  )
}
