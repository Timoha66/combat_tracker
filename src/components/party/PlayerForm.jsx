import { useState } from 'react'
import { IconX, IconCheck, IconTrash, IconPlus, IconShield } from '@tabler/icons-react'
import { usePartyStore } from '../../store/partyStore'
import {
  EMPTY_PLAYER, PLAYER_SIZES, PLAYER_CLASSES, SPECIAL_SENSES,
  SKILL_ABILITY, SKILLS_LIST, totalLevel, profBonus, abilityMod, effectiveAC, carryMax,
} from '../../data/partyDb'
import { ABILITY_KEYS, ABILITY_LABELS } from '../../data/gameData'
import { DMG_TYPES } from '../../data/constants'
import { DAMAGE_BONUS_TYPES, DAMAGE_BONUS_SHORT, DIE_SIZES, CONDITION_TYPES } from '../../data/spellDb'

// ─── Константы ────────────────────────────────────────────────────────────────
const ABILITY_OPTIONS = [
  { id: 'str', label: 'Сила' }, { id: 'dex', label: 'Ловкость' },
  { id: 'con', label: 'Телосложение' }, { id: 'int', label: 'Интеллект' },
  { id: 'wis', label: 'Мудрость' }, { id: 'cha', label: 'Харизма' },
]
const SPELL_ABILITY_LABELS = { str:'Сила', dex:'Ловкость', con:'Телосложение', int:'Интеллект', wis:'Мудрость', cha:'Харизма' }
const ACTION_SECTIONS  = [{ id:'action',label:'Действие' },{ id:'bonus',label:'Бонусное действие' },{ id:'reaction',label:'Реакция' }]
const TRAIT_ACTIONS    = [{ id:'',label:'— не выбрано —' },{ id:'action',label:'Действие' },{ id:'bonus',label:'Бонусное действие' },{ id:'reaction',label:'Реакция' }]
const PROFICIENCY_OPTS = [{ id:'none',label:'Нет' },{ id:'proficient',label:'Владение' },{ id:'expertise',label:'Экспертиза' }]
const SPEED_FIELDS = [
  { key:'walk',  label:'Ходьба',   placeholder:'30' },
  { key:'swim',  label:'Плавание', placeholder:'—' },
  { key:'fly',   label:'Полёт',    placeholder:'—' },
  { key:'burrow',label:'Копание',  placeholder:'—' },
  { key:'climb', label:'Лазание',  placeholder:'—' },
]

// ─── Вспомогатели СНАРУЖИ компонента (критично — иначе потеря фокуса) ────────

function SectionHeader({ title, showKey, form, onToggle }) {
  return (
    <div className="flex items-center justify-between mb-2 pb-1"
      style={{ borderBottom: '1px solid rgba(226,201,126,0.2)' }}>
      <span className="font-cinzel text-xs tracking-widest uppercase" style={{ color: 'var(--gold)' }}>{title}</span>
      {showKey && (
        <label className="flex items-center gap-1.5 cursor-pointer"
          style={{ fontFamily:'Cinzel,serif', fontSize:10, color: form[showKey] ? '#4ade80' : 'var(--text-muted)' }}>
          <input type="checkbox" checked={form[showKey] ?? false}
            onChange={e => onToggle(showKey, e.target.checked)}
            style={{ accentColor:'#4ade80', width:12, height:12 }} />
          В карточке
        </label>
      )}
    </div>
  )
}

function FL({ children }) {
  return <div className="font-cinzel text-[10px] tracking-wide uppercase mb-1" style={{ color:'var(--text-muted)' }}>{children}</div>
}

function CbMini({ value, onChange }) {
  return (
    <label className="flex items-center gap-1 cursor-pointer"
      style={{ fontFamily:'Cinzel,serif', fontSize:9, color: value ? '#4ade80' : 'var(--text-muted)' }}>
      <input type="checkbox" checked={value ?? false} onChange={e => onChange(e.target.checked)}
        style={{ accentColor:'#4ade80', width:11, height:11 }} />
      В карточке
    </label>
  )
}

function TagSelector({ items, selected, onToggle, colorActive, colorText }) {
  const ca = colorActive ?? 'rgba(167,139,250,0.15)', ct = colorText ?? '#c4b5fd'
  return (
    <div className="flex flex-wrap gap-1">
      {items.map(item => {
        const active = (selected ?? []).includes(item.id)
        return (
          <button key={item.id} type="button"
            className="font-cinzel text-[10px] px-2 py-0.5 rounded-md cursor-pointer transition-all"
            style={{ background: active ? ca : 'var(--bg-row)', color: active ? ct : 'var(--text-muted)', border:`1px solid ${active ? ct+'44' : 'var(--border)'}` }}
            onClick={() => onToggle(item.id)}>{item.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Основной компонент ───────────────────────────────────────────────────────
export default function PlayerForm({ initial, onClose, onSaved }) {
  const { addPlayer, updatePlayer, deletePlayer } = usePartyStore()
  const isNew = !initial?.id
  const [form, setForm] = useState(() => ({
    ...EMPTY_PLAYER, ...initial,
    classes:       initial?.classes       ?? [{ cls:'', level:1 }],
    speed:         initial?.speed         ?? { walk:9, swim:null, fly:null, burrow:null, climb:null },
    specialSenses: initial?.specialSenses ?? [],
    proficiencies: initial?.proficiencies ?? { languages:'', armor:'', weapons:'', tools:'' },
    savingThrows:  initial?.savingThrows  ?? [],
    skills:        initial?.skills        ?? [],
    traits:        initial?.traits        ?? [],
    actions:       initial?.actions       ?? [],
  }))
  const [saving, setSaving] = useState(false)

  const iStyle = { background:'var(--bg-deep)', border:'1px solid var(--border-md)', color:'var(--text)' }
  const iCls   = 'w-full rounded-lg px-3 py-1.5 text-sm outline-none'
  const selCls = `${iCls} cursor-pointer`

  const set       = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setAb     = (k, v) => setForm(f => ({ ...f, abilities: { ...f.abilities, [k]: Number(v)||10 } }))
  const setProf   = (k, v) => setForm(f => ({ ...f, proficiencies: { ...f.proficiencies, [k]: v } }))
  const setSpeed  = (k, v) => setForm(f => ({ ...f, speed: { ...f.speed, [k]: v==='' ? null : Number(v)||0 } }))

  const lvl = totalLevel(form)
  const pb  = profBonus(lvl)

  // Авторасчёт
  const computedAC         = effectiveAC(form)
  const computedCarryMax   = carryMax(form)
  const computedCarryLimit = computedCarryMax * 2

  function computeSave(ability) {
    return abilityMod(form.abilities?.[ability]) + pb
  }
  function computeSkill(skillName, proficiency) {
    const ability = SKILL_ABILITY[skillName] ?? 'str'
    const mod = abilityMod(form.abilities?.[ability])
    const profMod = proficiency === 'expertise' ? pb * 2 : proficiency === 'proficient' ? pb : 0
    return mod + profMod
  }
  function computeSpellAttack() {
    const ability = form.spellcasting?.ability ?? 'int'
    return pb + abilityMod(form.abilities?.[ability])
  }
  function computeSpellDC() {
    const ability = form.spellcasting?.ability ?? 'int'
    return 8 + pb + abilityMod(form.abilities?.[ability])
  }

  // Классы
  const setClsField = (i, k, v) => setForm(f => ({ ...f, classes: f.classes.map((c,idx) => idx===i ? {...c,[k]:v} : c) }))
  const addClass    = ()        => setForm(f => ({ ...f, classes: [...f.classes, {cls:'',level:1}] }))
  const removeClass = i         => setForm(f => ({ ...f, classes: f.classes.filter((_,idx) => idx!==i) }))

  // Массивы
  const addToArr    = (f2, item) => setForm(f => ({ ...f, [f2]: [...(f[f2]??[]), item] }))
  const removeFromArr=(f2, i)   => setForm(f => ({ ...f, [f2]: f[f2].filter((_,idx) => idx!==i) }))
  const updateInArr = (f2, i, fn)=> setForm(f => ({ ...f, [f2]: f[f2].map((x,idx) => idx===i ? fn(x) : x) }))

  const toggleResist = (field, id) => {
    const arr = form[field]??[]
    set(field, arr.includes(id) ? arr.filter(v=>v!==id) : [...arr,id])
  }
  const setSense = (i, k, v) => setForm(f => ({ ...f, specialSenses: f.specialSenses.map((s,idx) => idx===i ? {...s,[k]:v} : s) }))

  // Урон в действиях
  const setActionDmg = (ai,di,k,v) => setForm(f => ({...f, actions: f.actions.map((a,i)=> i!==ai?a:{...a,damages:(a.damages??[]).map((d,j)=>j!==di?d:{...d,[k]:v})})}))
  const addActionDmg = ai => setForm(f => ({...f, actions: f.actions.map((a,i)=>i!==ai?a:{...a,damages:[...(a.damages??[]),{count:1,die:'d6',dmgType:'',bonuses:[]}]})}))
  const removeActionDmg=(ai,di)=> setForm(f => ({...f, actions: f.actions.map((a,i)=>i!==ai?a:{...a,damages:(a.damages??[]).filter((_,j)=>j!==di)})}))

  const addDmgBonus=(ai,di,type)=>{ if(!type)return; setForm(f=>({...f,actions:f.actions.map((a,i)=>i!==ai?a:{...a,damages:(a.damages??[]).map((d,j)=>j!==di?d:{...d,bonuses:[...(d.bonuses??[]),type==='custom'?{type:'custom',value:''}:{type}]})})})) }
  const setDmgBonus=(ai,di,bi,k,v)=> setForm(f=>({...f,actions:f.actions.map((a,i)=>i!==ai?a:{...a,damages:(a.damages??[]).map((d,j)=>j!==di?d:{...d,bonuses:(d.bonuses??[]).map((b,k2)=>k2!==bi?b:{...b,[k]:v})})})}))
  const removeDmgBonus=(ai,di,bi)=> setForm(f=>({...f,actions:f.actions.map((a,i)=>i!==ai?a:{...a,damages:(a.damages??[]).map((d,j)=>j!==di?d:{...d,bonuses:(d.bonuses??[]).filter((_,k2)=>k2!==bi)})})}))

  async function handleSave() {
    if (!form.name.trim()) { alert('Введи имя персонажа'); return }
    setSaving(true)
    try { const saved = isNew ? await addPlayer(form) : await updatePlayer(form.id, form); onSaved(saved) }
    finally { setSaving(false) }
  }
  async function handleDelete() {
    if (!confirm(`Удалить «${form.name}»?`)) return
    await deletePlayer(form.id); onClose()
  }

  const sh = (title, showKey) => ({ title, showKey, form, onToggle: set })

  return (
    <div className="overlay" style={{ zIndex:400 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background:'var(--bg-panel)', border:'1px solid var(--border-md)', width:720, maxWidth:'96vw', maxHeight:'92vh' }}>

        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor:'var(--border)' }}>
          <span className="font-cinzel text-base font-semibold" style={{ color:'var(--text)' }}>
            {isNew ? 'Новый персонаж' : `Редактировать: ${form.name}`}
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

          {/* 1. ОСНОВНОЕ */}
          <section>
            <SectionHeader {...sh('Основное')} />
            <div className="mb-3"><FL>Имя *</FL>
              <input className={iCls} style={iStyle} value={form.name} placeholder="Торин Дубощит"
                onChange={e => set('name', e.target.value)} />
            </div>
            <FL>Классы {lvl>0 && <span style={{color:'var(--gold)'}}>· Итого: {lvl} ур. · БМ: +{pb}</span>}</FL>
            {(form.classes??[]).map((c,i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <select className={selCls} style={{...iStyle,flex:1}} value={c.cls} onChange={e => setClsField(i,'cls',e.target.value)}>
                  <option value="">— выбери класс —</option>
                  {PLAYER_CLASSES.map(cl=><option key={cl} value={cl}>{cl}</option>)}
                </select>
                <input type="number" min={1} max={20} className="rounded-lg px-3 py-1.5 text-sm outline-none text-center"
                  style={{...iStyle,width:70}} value={c.level}
                  onChange={e => setClsField(i,'level',Math.max(1,Math.min(20,Number(e.target.value)||1)))} />
                {(form.classes??[]).length>1 &&
                  <button className="icon-btn" style={{width:28,height:28}} onClick={()=>removeClass(i)}><IconTrash size={11}/></button>}
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center mb-3" style={{fontSize:11}} onClick={addClass}>
              <IconPlus size={11}/> Добавить класс
            </button>
            <FL>Размер</FL>
            <select className={selCls} style={iStyle} value={form.size??'Средний'} onChange={e=>set('size',e.target.value)}>
              {PLAYER_SIZES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </section>

          {/* 2. ХАРАКТЕРИСТИКИ */}
          <section>
            <SectionHeader {...sh('Характеристики')} />
            <div className="grid grid-cols-6 gap-2">
              {ABILITY_KEYS.map(k => (
                <div key={k}>
                  <div className="font-cinzel text-[9px] tracking-widest uppercase text-center mb-1" style={{color:'var(--text-muted)'}}>{ABILITY_LABELS[k]}</div>
                  <input className={`${iCls} text-center`} style={iStyle} type="number" min={1} max={30}
                    value={form.abilities?.[k]??10} onChange={e=>setAb(k,e.target.value)} />
                  <div className="font-cinzel text-[9px] text-center mt-0.5" style={{color:'var(--text-muted)'}}>
                    {abilityMod(form.abilities?.[k])>=0?'+':''}{abilityMod(form.abilities?.[k])}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. СПАСБРОСКИ */}
          <section>
            <SectionHeader {...sh('Спасброски', 'showSavingThrows')} />
            {(form.savingThrows??[]).map((s,i) => {
              const auto = computeSave(s.ability)
              const display = s.override !== null && s.override !== undefined && s.override !== '' ? Number(s.override) : auto
              return (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <select className={selCls} style={{...iStyle,flex:1}} value={s.ability??'str'}
                    onChange={e => updateInArr('savingThrows',i,x=>({...x,ability:e.target.value,override:null}))}>
                    {ABILITY_OPTIONS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <span className="font-cinzel text-xs" style={{color:'var(--text-muted)'}}>авто: {auto>=0?'+':''}{auto}</span>
                    <input className="rounded-lg px-2 py-1.5 text-sm outline-none text-center"
                      style={{...iStyle,width:70}} type="number"
                      value={s.override===null||s.override===undefined?'':(s.override)}
                      placeholder={String(auto)}
                      onChange={e => updateInArr('savingThrows',i,x=>({...x,override:e.target.value===''?null:Number(e.target.value)}))} />
                  </div>
                  <button className="icon-btn" style={{width:28,height:28}} onClick={()=>removeFromArr('savingThrows',i)}><IconTrash size={11}/></button>
                </div>
              )
            })}
            <button className="btn btn-ghost w-full justify-center" style={{fontSize:11}}
              onClick={()=>addToArr('savingThrows',{ability:'str',override:null})}>
              <IconPlus size={11}/> Добавить
            </button>
          </section>

          {/* 4. ВЛАДЕНИЯ */}
          <section>
            <SectionHeader {...sh('Владения', 'showProficiencies')} />
            <div className="grid grid-cols-2 gap-3">
              {[['languages','Языки'],['armor','Доспехи'],['weapons','Оружие'],['tools','Инструменты']].map(([k,label])=>(
                <div key={k}><FL>{label}</FL>
                  <input className={iCls} style={iStyle} value={form.proficiencies?.[k]??''} placeholder="через запятую"
                    onChange={e=>setProf(k,e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          {/* 5. БОЕВЫЕ ХАРАКТЕРИСТИКИ */}
          <section>
            <SectionHeader {...sh('Боевые характеристики', 'showSpeed')} />
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div><FL>Макс. ХП</FL>
                <input className={iCls} style={iStyle} type="number" min={1} value={form.hp?.max??10}
                  onChange={e=>setForm(f=>({...f,hp:{...f.hp,max:Number(e.target.value)||1}}))} />
              </div>
              <div>
                <FL>КД {computedAC !== form.ac && <span style={{color:'#4ade80'}}>({computedAC} ито.</span>}</FL>
                <div className="flex gap-1.5 items-center">
                  <input className={iCls} style={iStyle} type="number" min={1} value={form.ac??10}
                    onChange={e=>set('ac',Number(e.target.value)||10)} />
                  <button type="button" title="Щит (+2 КД)"
                    className="rounded-lg p-1.5 transition-all cursor-pointer shrink-0"
                    style={{background:form.shield?'rgba(74,222,128,0.15)':'var(--bg-row)', border:`1px solid ${form.shield?'rgba(74,222,128,0.4)':'var(--border)'}`, color:form.shield?'#4ade80':'var(--text-muted)'}}
                    onClick={()=>set('shield',!form.shield)}>
                    <IconShield size={14}/>
                  </button>
                </div>
                {form.shield && <div className="font-cinzel text-[9px] mt-0.5" style={{color:'#4ade80'}}>+2 от щита → {computedAC}</div>}
              </div>
              <div><FL>Бонус инициативы</FL>
                <input className={iCls} style={iStyle} type="number" value={form.initiative??0}
                  onChange={e=>set('initiative',Number(e.target.value)||0)} />
              </div>
            </div>
            {/* Скорости */}
            <FL>Скорость</FL>
            <div className="grid grid-cols-5 gap-2">
              {SPEED_FIELDS.map(({key,label,placeholder})=>(
                <div key={key}>
                  <div className="font-cinzel text-[9px] uppercase tracking-wide text-center mb-1" style={{color:key==='walk'?'var(--text-muted)':'rgba(255,255,255,0.3)'}}>{label}</div>
                  <div className="flex items-center gap-1">
                    <input className={`${iCls} text-center`} style={iStyle} type="number" min={0}
                      placeholder={placeholder}
                      value={form.speed?.[key]===null||form.speed?.[key]===undefined?'':form.speed[key]}
                      onChange={e=>setSpeed(key,e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. НАВЫКИ */}
          <section>
            <SectionHeader {...sh('Навыки', 'showSkills')} />
            {(form.skills??[]).map((s,i) => {
              const auto    = computeSkill(s.name, s.proficiency)
              const display = s.override!==null&&s.override!==undefined&&s.override!=='' ? Number(s.override) : auto
              return (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <select className={selCls} style={{...iStyle,flex:1}} value={s.name??''}
                    onChange={e=>updateInArr('skills',i,x=>({...x,name:e.target.value,override:null}))}>
                    <option value="">— выбери —</option>
                    {SKILLS_LIST.map(sk=><option key={sk} value={sk}>{sk}</option>)}
                  </select>
                  <select className={selCls} style={{...iStyle,width:130}} value={s.proficiency??'none'}
                    onChange={e=>updateInArr('skills',i,x=>({...x,proficiency:e.target.value,override:null}))}>
                    {PROFICIENCY_OPTS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <span className="font-cinzel text-xs" style={{color:'var(--text-muted)'}}>авто: {auto>=0?'+':''}{auto}</span>
                    <input className="rounded-lg px-2 py-1.5 text-sm outline-none text-center"
                      style={{...iStyle,width:65}} type="number"
                      value={s.override===null||s.override===undefined?'':s.override}
                      placeholder={String(auto)}
                      onChange={e=>updateInArr('skills',i,x=>({...x,override:e.target.value===''?null:Number(e.target.value)}))} />
                  </div>
                  <button className="icon-btn" style={{width:28,height:28}} onClick={()=>removeFromArr('skills',i)}><IconTrash size={11}/></button>
                </div>
              )
            })}
            <button className="btn btn-ghost w-full justify-center" style={{fontSize:11}}
              onClick={()=>addToArr('skills',{name:'',proficiency:'proficient',override:null})}>
              <IconPlus size={11}/> Добавить
            </button>
          </section>

          {/* 7. СОПРОТИВЛЕНИЯ */}
          <section>
            <SectionHeader {...sh('Сопротивления и иммунитеты', 'showResistances')} />
            <div className="flex flex-col gap-3">
              <div><FL>Иммунитет к урону</FL>
                <TagSelector items={DMG_TYPES} selected={form.immunities??[]} onToggle={id=>toggleResist('immunities',id)} colorActive="rgba(147,197,253,0.15)" colorText="#93c5fd"/></div>
              <div><FL>Сопротивление к урону</FL>
                <TagSelector items={DMG_TYPES} selected={form.resistances??[]} onToggle={id=>toggleResist('resistances',id)} colorActive="rgba(74,222,128,0.15)" colorText="#4ade80"/></div>
              <div><FL>Уязвимость к урону</FL>
                <TagSelector items={DMG_TYPES} selected={form.vulnerabilities??[]} onToggle={id=>toggleResist('vulnerabilities',id)} colorActive="rgba(248,113,113,0.15)" colorText="#f87171"/></div>
              <div><FL>Иммунитет к состояниям</FL>
                <TagSelector items={CONDITION_TYPES} selected={form.conditionImmunities??[]} onToggle={id=>toggleResist('conditionImmunities',id)} colorActive="rgba(251,191,36,0.15)" colorText="#fbbf24"/></div>
            </div>
          </section>

          {/* 8. ОСОБЫЕ ЧУВСТВА */}
          <section>
            <SectionHeader {...sh('Особые чувства', 'showSenses')} />
            {(form.specialSenses??[]).map((s,i)=>(
              <div key={i} className="flex gap-2 mb-2 items-center">
                <select className={selCls} style={{...iStyle,flex:1}} value={s.type??''}
                  onChange={e=>setSense(i,'type',e.target.value)}>
                  <option value="">— выбери —</option>
                  {SPECIAL_SENSES.map(ss=><option key={ss.id} value={ss.id}>{ss.label}</option>)}
                </select>
                <input type="number" min={0} max={1000} className="rounded-lg px-3 py-1.5 text-sm outline-none text-center"
                  style={{...iStyle,width:90}} placeholder="60"
                  value={s.range??''} onChange={e=>setSense(i,'range',Number(e.target.value)||0)} />
                <span className="font-cinzel text-xs shrink-0" style={{color:'var(--text-muted)'}}>фут.</span>
                <button className="icon-btn" style={{width:28,height:28}} onClick={()=>removeFromArr('specialSenses',i)}><IconTrash size={11}/></button>
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{fontSize:11}}
              onClick={()=>addToArr('specialSenses',{type:'',range:60})}>
              <IconPlus size={11}/> Добавить чувство
            </button>
          </section>

          {/* 9. ГРУЗОПОДЪЁМНОСТЬ */}
          <section>
            <div className="flex items-center justify-between mb-2 pb-1" style={{borderBottom:'1px solid rgba(226,201,126,0.2)'}}>
              <span className="font-cinzel text-xs tracking-widest uppercase" style={{color:'var(--gold)'}}>Грузоподъёмность</span>
              <CbMini value={form.showCarry} onChange={v=>set('showCarry',v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg px-3 py-2" style={{background:'var(--bg-row)',border:'1px solid var(--border)'}}>
                <div className="font-cinzel text-[9px] uppercase tracking-widest mb-0.5" style={{color:'var(--text-muted)'}}>Максимум (СИЛ × 15)</div>
                <div className="font-cinzel text-sm font-bold" style={{color:'var(--text)'}}>{computedCarryMax} фунтов</div>
              </div>
              <div className="rounded-lg px-3 py-2" style={{background:'var(--bg-row)',border:'1px solid var(--border)'}}>
                <div className="font-cinzel text-[9px] uppercase tracking-widest mb-0.5" style={{color:'var(--text-muted)'}}>Предел (макс × 2)</div>
                <div className="font-cinzel text-sm font-bold" style={{color:'var(--text)'}}>{computedCarryLimit} фунтов</div>
              </div>
            </div>
          </section>

          {/* 10. ИСТОЩЕНИЕ */}
          <section>
            <div className="flex items-center justify-between mb-2 pb-1" style={{borderBottom:'1px solid rgba(226,201,126,0.2)'}}>
              <span className="font-cinzel text-xs tracking-widest uppercase" style={{color:'var(--gold)'}}>Истощение</span>
              <CbMini value={form.showExhaustion} onChange={v=>set('showExhaustion',v)} />
            </div>
            <div className="flex items-center gap-3">
              <input className={iCls} style={{...iStyle,width:80}} type="number" min={0} max={6}
                value={form.exhaustion??0}
                onChange={e=>set('exhaustion',Math.max(0,Math.min(6,Number(e.target.value)||0)))} />
              <div className="flex gap-1.5">
                {[1,2,3,4,5,6].map(lvl=>(
                  <button key={lvl} type="button"
                    className="rounded-full transition-all cursor-pointer"
                    style={{width:20,height:20,background:lvl<=(form.exhaustion??0)?'#f87171':'var(--bg-row)',border:`1px solid ${lvl<=(form.exhaustion??0)?'#f87171':'var(--border-md)'}`}}
                    onClick={()=>set('exhaustion',form.exhaustion===lvl?lvl-1:lvl)} />
                ))}
              </div>
              <span className="font-cinzel text-xs" style={{color:'var(--text-muted)'}}>{form.exhaustion??0}/6</span>
            </div>
          </section>

          {/* 11. СОСТОЯНИЯ */}
          <section>
            <div className="flex items-center justify-between mb-2 pb-1" style={{borderBottom:'1px solid rgba(226,201,126,0.2)'}}>
              <span className="font-cinzel text-xs tracking-widest uppercase" style={{color:'var(--gold)'}}>Состояния</span>
              <CbMini value={form.showConditions} onChange={v=>set('showConditions',v)} />
            </div>
            <input className={iCls} style={iStyle} value={form.conditions??''} placeholder="Отравлен, Испуган..."
              onChange={e=>set('conditions',e.target.value)} />
          </section>

          {/* 12. ЧЕРТЫ */}
          <section>
            <SectionHeader {...sh('Черты и особенности', 'showTraits')} />
            {(form.traits??[]).map((t,i)=>(
              <div key={i} className="mb-3 p-3 rounded-xl" style={{background:'var(--bg-row)',border:'1px solid var(--border)'}}>
                <div className="flex gap-2 mb-2">
                  <input className={iCls} style={{...iStyle,flex:1}} value={t.name??''} placeholder="Название черты"
                    onChange={e=>updateInArr('traits',i,x=>({...x,name:e.target.value}))} />
                  <select className={selCls} style={{...iStyle,width:170}} value={t.actionType??''}
                    onChange={e=>updateInArr('traits',i,x=>({...x,actionType:e.target.value}))}>
                    {TRAIT_ACTIONS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                  <button className="icon-btn" style={{width:28,height:28}} onClick={()=>removeFromArr('traits',i)}><IconTrash size={11}/></button>
                </div>
                <textarea className={`${iCls} resize-none`} style={{...iStyle,minHeight:56}}
                  value={t.description??''} placeholder="Описание..."
                  onChange={e=>updateInArr('traits',i,x=>({...x,description:e.target.value}))} />
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{fontSize:11}}
              onClick={()=>addToArr('traits',{name:'',description:'',actionType:''})}>
              <IconPlus size={11}/> Добавить черту
            </button>
          </section>

          {/* 13. БОЕВЫЕ СПОСОБНОСТИ */}
          <section>
            <SectionHeader {...sh('Боевые способности', 'showActions')} />
            {(form.actions??[]).map((a,ai)=>(
              <div key={ai} className="mb-3 p-3 rounded-xl" style={{background:'var(--bg-row)',border:'1px solid var(--border)'}}>
                <div className="flex gap-2 mb-2">
                  <input className={iCls} style={{...iStyle,flex:1}} value={a.name??''} placeholder="Название атаки"
                    onChange={e=>updateInArr('actions',ai,x=>({...x,name:e.target.value}))} />
                  <select className={selCls} style={{...iStyle,width:160}} value={a.section??'action'}
                    onChange={e=>updateInArr('actions',ai,x=>({...x,section:e.target.value}))}>
                    {ACTION_SECTIONS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <button className="icon-btn" style={{width:28,height:28}} onClick={()=>removeFromArr('actions',ai)}><IconTrash size={11}/></button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div><FL>Бонус попадания</FL>
                    <input className={iCls} style={iStyle} type="number" value={a.attackBonus??''} placeholder="+5"
                      onChange={e=>updateInArr('actions',ai,x=>({...x,attackBonus:e.target.value===''?null:Number(e.target.value)}))} /></div>
                  <div><FL>Досягаемость</FL>
                    <input className={iCls} style={iStyle} value={a.reach??''} placeholder="1,5 м"
                      onChange={e=>updateInArr('actions',ai,x=>({...x,reach:e.target.value}))} /></div>
                  <div><FL>Дальность</FL>
                    <input className={iCls} style={iStyle} value={a.range??''} placeholder="18/54 м"
                      onChange={e=>updateInArr('actions',ai,x=>({...x,range:e.target.value}))} /></div>
                </div>
                <FL>Урон</FL>
                {(a.damages??[{count:1,die:'d6',dmgType:'',bonuses:[]}]).map((d,di)=>(
                  <div key={di} className="mb-2 p-2 rounded-lg" style={{background:'var(--bg-deep)',border:'1px solid var(--border)'}}>
                    <div className="flex gap-1.5 mb-2 items-center">
                      <input type="number" min={1} max={99} className="rounded-lg px-2 py-1.5 text-sm outline-none text-center"
                        style={{...iStyle,width:52}} value={d.count??1}
                        onChange={e=>setActionDmg(ai,di,'count',Math.max(1,Math.min(99,Number(e.target.value)||1)))} />
                      <select className="rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer"
                        style={{...iStyle,width:68}} value={d.die??'d6'}
                        onChange={e=>setActionDmg(ai,di,'die',e.target.value)}>
                        {DIE_SIZES.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                      <select className="rounded-lg px-2 py-1.5 text-sm outline-none cursor-pointer flex-1"
                        style={iStyle} value={d.dmgType??''}
                        onChange={e=>setActionDmg(ai,di,'dmgType',e.target.value)}>
                        <option value="">— тип —</option>
                        {DMG_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                      {(a.damages??[]).length>1 &&
                        <button className="icon-btn shrink-0" style={{width:26,height:26}} onClick={()=>removeActionDmg(ai,di)}><IconTrash size={11}/></button>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(d.bonuses??[]).map((b,bi)=>(
                        <div key={bi} className="flex items-center gap-1 rounded-md px-2 py-0.5"
                          style={{background:'rgba(167,139,250,0.12)',border:'1px solid rgba(167,139,250,0.3)'}}>
                          {b.type==='custom'
                            ? <input className="outline-none bg-transparent font-cinzel text-xs" style={{color:'#c4b5fd',width:50}} placeholder="+2"
                                value={b.value??''} onChange={e=>setDmgBonus(ai,di,bi,'value',e.target.value)} />
                            : <span className="font-cinzel text-[10px]" style={{color:'#c4b5fd'}}>{DAMAGE_BONUS_SHORT[b.type]??b.type}</span>
                          }
                          <button style={{color:'#c4b5fd',fontSize:12,lineHeight:1,marginLeft:2}} onClick={()=>removeDmgBonus(ai,di,bi)}>×</button>
                        </div>
                      ))}
                      <select className="rounded-md px-2 py-0.5 text-xs outline-none cursor-pointer"
                        style={{background:'var(--bg-row)',border:'1px dashed var(--border-md)',color:'var(--text-muted)'}}
                        value="" onChange={e=>{if(e.target.value)addDmgBonus(ai,di,e.target.value)}}>
                        <option value="">+ бонус</option>
                        {DAMAGE_BONUS_TYPES.filter(b=>b.id!=='').map(b=><option key={b.id} value={b.id}>{b.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost w-full justify-center mb-2" style={{fontSize:11}} onClick={()=>addActionDmg(ai)}>
                  <IconPlus size={11}/> Ещё тип урона
                </button>
                <textarea className={`${iCls} resize-none`} style={{...iStyle,minHeight:48}}
                  value={a.description??''} placeholder="Описание..."
                  onChange={e=>updateInArr('actions',ai,x=>({...x,description:e.target.value}))} />
              </div>
            ))}
            <button className="btn btn-ghost w-full justify-center" style={{fontSize:11}}
              onClick={()=>addToArr('actions',{name:'',section:'action',attackBonus:null,reach:'',range:'',damages:[{count:1,die:'d6',dmgType:'',bonuses:[]}],description:''})}>
              <IconPlus size={11}/> Добавить действие
            </button>
          </section>

          {/* 14. ЗАКЛИНАНИЯ */}
          <section>
            <SectionHeader {...sh('Заклинания', 'showSpellcasting')} />
            <label className="flex items-center gap-2 cursor-pointer mb-3"
              style={{fontFamily:'Cinzel,serif',fontSize:11,color:form.spellcasting?'var(--gold)':'var(--text-muted)'}}>
              <input type="checkbox" checked={!!form.spellcasting}
                onChange={e=>set('spellcasting',e.target.checked?{level:1,ability:'int'}:null)}
                style={{accentColor:'var(--gold)',width:13,height:13}} />
              Персонаж является заклинателем
            </label>
            {form.spellcasting && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div><FL>Уровень заклинателя</FL>
                    <input className={iCls} style={iStyle} type="number" min={1} max={20} value={form.spellcasting.level??1}
                      onChange={e=>set('spellcasting',{...form.spellcasting,level:Number(e.target.value)||1})} /></div>
                  <div><FL>Заклинат. характеристика</FL>
                    <select className={selCls} style={iStyle} value={form.spellcasting.ability??'int'}
                      onChange={e=>set('spellcasting',{...form.spellcasting,ability:e.target.value})}>
                      {ABILITY_OPTIONS.map(a=><option key={a.id} value={a.id}>{a.label} ({ABILITY_LABELS[a.id]})</option>)}
                    </select></div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg px-3 py-2" style={{background:'var(--bg-row)',border:'1px solid var(--border)'}}>
                    <div className="font-cinzel text-[9px] uppercase tracking-widest mb-0.5" style={{color:'var(--text-muted)'}}>Бонус атаки заклинанием</div>
                    <div className="font-cinzel text-sm font-bold" style={{color:'#a78bfa'}}>
                      {computeSpellAttack()>=0?'+':''}{computeSpellAttack()}
                    </div>
                    <div className="font-cinzel text-[9px]" style={{color:'var(--text-muted)'}}>БМ (+{pb}) + мод. {SPELL_ABILITY_LABELS[form.spellcasting.ability??'int']}</div>
                  </div>
                  <div className="flex-1 rounded-lg px-3 py-2" style={{background:'var(--bg-row)',border:'1px solid var(--border)'}}>
                    <div className="font-cinzel text-[9px] uppercase tracking-widest mb-0.5" style={{color:'var(--text-muted)'}}>Сложность спасброска</div>
                    <div className="font-cinzel text-sm font-bold" style={{color:'#a78bfa'}}>{computeSpellDC()}</div>
                    <div className="font-cinzel text-[9px]" style={{color:'var(--text-muted)'}}>8 + БМ (+{pb}) + мод. {SPELL_ABILITY_LABELS[form.spellcasting.ability??'int']}</div>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* 15. ЗАМЕТКИ */}
          <section>
            <SectionHeader {...sh('Заметки', 'showNotes')} />
            <textarea className={`${iCls} resize-none`} style={{...iStyle,minHeight:80}}
              value={form.notes??''} placeholder="Заметки о персонаже..."
              onChange={e=>set('notes',e.target.value)} />
          </section>

        </div>

        <div className="flex gap-2 px-5 py-3 border-t shrink-0" style={{borderColor:'var(--border)'}}>
          {!isNew && (
            <button className="btn btn-ghost" style={{color:'#f87171',borderColor:'rgba(248,113,113,0.3)'}} onClick={handleDelete}>
              <IconTrash size={14}/> Удалить
            </button>
          )}
          <button className="btn btn-cancel flex-1 justify-center" onClick={onClose}><IconX size={14}/> Отмена</button>
          <button className="btn btn-gold flex-1 justify-center" onClick={handleSave} disabled={saving}>
            <IconCheck size={14}/> {isNew?'Создать':'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
