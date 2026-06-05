import { IconSword, IconPencil, IconShield } from '@tabler/icons-react'
import { ABILITY_KEYS, ABILITY_LABELS } from '../../data/gameData'
import { totalLevel, classLabel, SPECIAL_SENSES, effectiveAC, carryMax, profBonus, abilityMod } from '../../data/partyDb'
import { DAMAGE_BONUS_SHORT } from '../../data/spellDb'
import { DMG_TYPES } from '../../data/constants'

const SENSE_LABEL = Object.fromEntries(SPECIAL_SENSES.map(s=>[s.id,s.label]))
const DMG_LABEL   = Object.fromEntries(DMG_TYPES.map(t=>[t.id,t.label]))
const SPEED_LABELS = { walk:'', swim:'пл.', fly:'пол.', burrow:'коп.', climb:'лаз.' }

function fmtActionDmg(d) {
  const base    = `${d.count??1}${d.die??'d6'}`
  const bonuses = (d.bonuses??[]).map(b=>b.type==='custom'?(b.value||''):(DAMAGE_BONUS_SHORT[b.type]??'')).filter(Boolean).join('+')
  const type    = d.dmgType ? ` ${DMG_LABEL[d.dmgType]??d.dmgType}` : ''
  return base+(bonuses?` + ${bonuses}`:'')+type
}

function fmtSpeed(speed) {
  if (!speed) return '—'
  const parts = []
  Object.entries(speed).forEach(([k,v]) => {
    if (v===null||v===undefined||v==='') return
    const prefix = SPEED_LABELS[k]
    parts.push(`${prefix?prefix+' ':''}${v} м`)
  })
  return parts.join(', ') || '—'
}

export default function PlayerCard({ player: p, onEdit, onAddToTracker, onClick }) {
  const mod    = k => abilityMod(p.abilities?.[k])
  const modStr = k => { const m=mod(k); return m>=0?`+${m}`:`${m}` }
  const modClr = k => { const m=mod(k); return m>=3?'#4ade80':m>=1?'#86efac':m===0?'var(--text-muted)':'#f87171' }

  const lvl    = totalLevel(p)
  const clsLbl = classLabel(p)
  const ac     = effectiveAC(p)
  const carry  = carryMax(p)

  // Скорость для отображения
  const speedStr = p.showSpeed ? fmtSpeed(typeof p.speed === 'object' ? p.speed : { walk: parseInt(p.speed)||9 }) : null

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all"
      style={{background:'var(--bg-panel)',border:'1px solid var(--border-md)',width:280,flexShrink:0}}
      onClick={onClick}
      onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(226,201,126,0.4)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-md)'}>

      {/* Шапка */}
      <div className="px-4 py-3" style={{background:'rgba(226,201,126,0.08)',borderBottom:'1px solid rgba(226,201,126,0.2)'}}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-cinzel text-base font-bold truncate" style={{color:'var(--gold)'}}>{p.name}</div>
            <div className="font-cinzel text-xs" style={{color:'var(--text-dim)'}}>
              {[clsLbl, lvl?`${lvl} ур.`:'', p.size].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button className="icon-btn shrink-0" style={{width:26,height:26}}
            onClick={e=>{e.stopPropagation();onEdit()}}><IconPencil size={12}/></button>
        </div>
      </div>

      <div className="px-4 py-3 flex-1 flex flex-col gap-2">

        {/* ХП / КД / Скорость */}
        <div className="flex gap-2">
          <StatChip label="ХП" value={p.hp?.max??'—'} color="#4ade80" />
          <StatChip label={p.shield?"КД 🛡":"КД"} value={ac} color="#93c5fd" />
          {speedStr && <StatChip label="Скор." value={speedStr.split(',')[0]} />}
        </div>

        {/* Характеристики */}
        <div className="grid grid-cols-6 gap-1">
          {ABILITY_KEYS.map(k=>(
            <div key={k} className="rounded-lg py-1.5 text-center" style={{background:'var(--bg-row)',border:'0.5px solid var(--border)'}}>
              <div className="font-cinzel text-[8px] uppercase mb-0.5" style={{color:'var(--text-muted)'}}>{ABILITY_LABELS[k]}</div>
              <div className="font-cinzel text-[10px] font-bold rounded" style={{background:`${modClr(k)}22`,color:modClr(k),padding:'1px 2px'}}>{modStr(k)}</div>
              <div className="font-cinzel text-[9px]" style={{color:'var(--text-muted)'}}>{p.abilities?.[k]??10}</div>
            </div>
          ))}
        </div>

        {/* Истощение */}
        {p.showExhaustion && (
          <div className="flex items-center gap-2">
            <span className="font-cinzel text-[10px]" style={{color:'var(--text-muted)'}}>Истощение:</span>
            <div className="flex gap-1">
              {[1,2,3,4,5,6].map(lvl=>(
                <div key={lvl} className="rounded-full"
                  style={{width:12,height:12,background:lvl<=(p.exhaustion??0)?'#f87171':'var(--bg-row)',border:'1px solid var(--border-md)'}} />
              ))}
            </div>
          </div>
        )}

        {/* Состояния */}
        {p.showConditions && p.conditions && (
          <div className="font-cinzel text-[10px] px-2 py-1 rounded-lg"
            style={{background:'rgba(251,191,36,0.08)',color:'#fbbf24',border:'1px solid rgba(251,191,36,0.2)'}}>
            {p.conditions}
          </div>
        )}

        {/* Грузоподъёмность */}
        {p.showCarry && (
          <div className="text-xs" style={{color:'var(--text-dim)'}}>
            <span className="font-cinzel" style={{color:'var(--text-muted)'}}>Груз.: </span>{carry} / {carry*2} фунтов
          </div>
        )}

        {/* Особые чувства */}
        {p.showSenses && (p.specialSenses??[]).length>0 && (
          <div className="text-xs" style={{color:'var(--text-dim)'}}>
            {p.specialSenses.map((s,i)=><span key={i}>{i>0&&', '}{SENSE_LABEL[s.type]??s.type} {s.range} фут.</span>)}
          </div>
        )}

        {/* Действия */}
        {p.showActions && (p.actions??[]).length>0 && (
          <div>
            <div className="font-cinzel text-[9px] uppercase tracking-widest mb-1" style={{color:'var(--text-muted)'}}>Боевые способности</div>
            {p.actions.map((a,i)=>(
              <div key={i} className="font-cinzel text-[10px] mb-0.5" style={{color:'var(--text-dim)'}}>
                <span style={{color:'var(--text)'}}>{a.name}</span>
                {a.attackBonus!=null&&` · ${a.attackBonus>=0?'+':''}${a.attackBonus}`}
              </div>
            ))}
          </div>
        )}

        {/* Заклинания */}
        {p.showSpellcasting && p.spellcasting && (() => {
          const lvl2 = totalLevel(p)
          const pb2  = profBonus(lvl2)
          const spellMod = abilityMod(p.abilities?.[p.spellcasting.ability ?? 'int'])
          const atk = pb2 + spellMod
          const dc  = 8 + pb2 + spellMod
          return (
            <div className="text-xs px-2 py-1 rounded-lg"
              style={{ background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', color:'var(--text-dim)' }}>
              <span className="font-cinzel" style={{ color:'#c4b5fd' }}>Закл.: </span>
              атака {atk>=0?'+':''}{atk} · СЛ {dc}
            </div>
          )
        })()}

        {/* Заметки */}
        {p.showNotes && p.notes && (
          <div className="text-xs italic" style={{color:'var(--text-dim)'}}>{p.notes}</div>
        )}
      </div>

      <div className="px-4 pb-3">
        <button className="btn btn-add w-full justify-center" style={{fontSize:11}}
          onClick={e=>{e.stopPropagation();onAddToTracker(p)}}>
          <IconSword size={12}/> В трекер
        </button>
      </div>
    </div>
  )
}

function StatChip({ label, value, color }) {
  return (
    <div className="flex-1 text-center rounded-lg py-1.5" style={{background:'var(--bg-row)',border:'1px solid var(--border)'}}>
      <div className="font-cinzel text-[9px] uppercase tracking-widest mb-0.5" style={{color:'var(--text-muted)'}}>{label}</div>
      <div className="font-cinzel text-sm font-bold" style={{color:color??'var(--text-dim)'}}>{value}</div>
    </div>
  )
}
