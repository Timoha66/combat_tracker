import { IconX, IconPencil, IconSword, IconShield } from '@tabler/icons-react'
import { ABILITY_KEYS, ABILITY_LABELS } from '../../data/gameData'
import {
  totalLevel, classLabel, SPECIAL_SENSES,
  effectiveAC, carryMax, profBonus, abilityMod, SKILL_ABILITY,
} from '../../data/partyDb'
import { DMG_TYPES } from '../../data/constants'
import { DAMAGE_BONUS_SHORT, CONDITION_TYPES } from '../../data/spellDb'

const SENSE_LABEL = Object.fromEntries(SPECIAL_SENSES.map(s => [s.id, s.label]))
const DMG_LABEL   = Object.fromEntries(DMG_TYPES.map(t => [t.id, t.label]))
const COND_LABEL  = Object.fromEntries(CONDITION_TYPES.map(c => [c.id, c.label]))
const SPELL_ABILITY_LABELS = {
  str: 'Сила', dex: 'Ловкость', con: 'Телосложение',
  int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма',
}
const SPEED_LABELS  = { walk: '', swim: 'пл.', fly: 'пол.', burrow: 'коп.', climb: 'лаз.' }
const TRAIT_LABEL   = { action: 'Действие', bonus: 'Бонусное', reaction: 'Реакция' }
const SECTION_LABEL = { action: 'Действие', bonus: 'Бонусное действие', reaction: 'Реакция' }
const PROF_LABEL    = { proficient: 'Владение', expertise: 'Экспертиза' }

function fmtDmg(d) {
  const base    = `${d.count ?? 1}${d.die ?? 'd6'}`
  const bonuses = (d.bonuses ?? [])
    .map(b => b.type === 'custom' ? (b.value || '') : (DAMAGE_BONUS_SHORT[b.type] ?? ''))
    .filter(Boolean).join(' + ')
  const type    = d.dmgType ? ` ${DMG_LABEL[d.dmgType] ?? d.dmgType}` : ''
  return base + (bonuses ? ` + ${bonuses}` : '') + type
}

function fmtSpeed(speed) {
  if (!speed) return null
  // Поддержка старого формата (строка)
  if (typeof speed === 'string') return speed || null
  const parts = []
  Object.entries(speed).forEach(([k, v]) => {
    if (v === null || v === undefined || v === '' || v === 0) return
    const prefix = SPEED_LABELS[k]
    parts.push(`${prefix ? prefix + ' ' : ''}${v} фут.`)
  })
  return parts.length ? parts.join(', ') : null
}

// ─── Вспомогательные компоненты (снаружи — критично) ─────────────────────────
function Hr()    { return <hr style={{ borderColor: 'rgba(226,201,126,0.15)', margin: '8px 0' }} /> }
function Sec({ label }) {
  return (
    <div className="font-cinzel text-sm font-bold mt-3 mb-2" style={{ color: 'var(--gold)' }}>{label}</div>
  )
}
function Row({ label, value, color }) {
  return (
    <div className="text-sm mb-1">
      <span className="font-cinzel font-semibold" style={{ color: 'var(--text)' }}>{label}: </span>
      <span style={{ color: color ?? 'var(--text-dim)' }}>{value}</span>
    </div>
  )
}
function Pill({ label, value, color }) {
  return (
    <div className="text-sm">
      <span className="font-cinzel font-semibold" style={{ color: 'var(--text)' }}>{label}: </span>
      <span style={{ color: color ?? 'var(--text-dim)' }}>{value}</span>
    </div>
  )
}

// ─── Основной компонент ───────────────────────────────────────────────────────
export default function PlayerModal({ player: p, onClose, onEdit, onAddToTracker }) {
  const mod    = k => abilityMod(p.abilities?.[k])
  const modStr = k => { const m = mod(k); return m >= 0 ? `+${m}` : `${m}` }
  const modClr = k => {
    const m = mod(k)
    return m >= 3 ? '#4ade80' : m >= 1 ? '#86efac' : m === 0 ? 'var(--text-muted)' : '#f87171'
  }

  const lvl    = totalLevel(p)
  const pb     = profBonus(lvl)
  const clsLbl = classLabel(p)
  const ac     = effectiveAC(p)
  const carry  = carryMax(p)
  const speedStr = fmtSpeed(p.speed)

  // Спасброски с авторасчётом
  function getSaveValue(s) {
    if (s.override !== null && s.override !== undefined && s.override !== '') return Number(s.override)
    return mod(s.ability) + pb
  }

  // Навыки с авторасчётом
  function getSkillValue(s) {
    if (s.override !== null && s.override !== undefined && s.override !== '') return Number(s.override)
    const ability  = SKILL_ABILITY[s.name] ?? 'str'
    const profMod  = s.proficiency === 'expertise' ? pb * 2 : s.proficiency === 'proficient' ? pb : 0
    return mod(ability) + profMod
  }

  // Заклинания
  const spellAttack = p.spellcasting
    ? pb + mod(p.spellcasting.ability ?? 'int')
    : null
  const spellDC = p.spellcasting
    ? 8 + pb + mod(p.spellcasting.ability ?? 'int')
    : null

  // Группируем действия по секции
  const actionGroups = ['action', 'bonus', 'reaction']
    .map(sec => ({ sec, label: SECTION_LABEL[sec], items: (p.actions ?? []).filter(a => (a.section ?? 'action') === sec) }))
    .filter(g => g.items.length > 0)

  return (
    <div className="overlay" style={{ zIndex: 500 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid rgba(226,201,126,0.3)', width: 640, maxWidth: '95vw', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>

        {/* Шапка */}
        <div className="flex items-start gap-3 px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)', background: 'rgba(226,201,126,0.06)' }}>
          <div className="flex-1 min-w-0">
            <h3 className="font-cinzel text-xl font-bold flex items-center gap-2" style={{ color: 'var(--gold)' }}>
              {p.name}
              {lvl > 0 && (
                <span className="font-cinzel text-sm px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(226,201,126,0.15)', color: 'var(--gold)', border: '1px solid rgba(226,201,126,0.3)' }}>
                  {lvl} ур.
                </span>
              )}
            </h3>
            <p className="font-cinzel text-sm italic mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {[clsLbl, lvl ? `${lvl} уровень` : '', p.size].filter(Boolean).join(' · ')}
              {lvl > 0 && <span style={{ color: 'rgba(226,201,126,0.6)' }}> · БМ +{pb}</span>}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="btn btn-ghost" onClick={onEdit}><IconPencil size={14} /> Редактировать</button>
            <button className="btn btn-add"   onClick={() => onAddToTracker(p)}><IconSword size={14} /> В трекер</button>
            <button className="icon-btn"      onClick={onClose}><IconX size={15} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Боевые параметры */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Pill label="ХП"    value={p.hp?.max}  color="#4ade80" />
            <Pill label={p.shield ? 'КД 🛡' : 'КД'} value={ac} color="#93c5fd" />
            {p.shield && <span className="font-cinzel text-xs self-center" style={{ color: '#4ade80' }}>(+2 щит)</span>}
            {speedStr && <Pill label="Скорость" value={speedStr} />}
            <Pill label="Иниц." value={`${(p.initiative ?? 0) >= 0 ? '+' : ''}${p.initiative ?? 0}`} />
          </div>

          <Hr />

          {/* Характеристики */}
          <div className="grid grid-cols-6 gap-2 my-3">
            {ABILITY_KEYS.map(k => (
              <div key={k} className="rounded-lg py-2 px-1 text-center"
                style={{ background: 'var(--bg-row)', border: '0.5px solid var(--border-md)' }}>
                <div className="font-cinzel text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {ABILITY_LABELS[k]}</div>
                <div className="font-cinzel text-base font-bold px-1 py-0.5 rounded-md mx-auto inline-block mb-1"
                  style={{ background: `${modClr(k)}22`, color: modClr(k), border: `1px solid ${modClr(k)}44`, minWidth: 34 }}>
                  {modStr(k)}</div>
                <div className="font-cinzel text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.abilities?.[k] ?? 10}</div>
              </div>
            ))}
          </div>

          {/* Спасброски */}
          {(p.savingThrows ?? []).length > 0 && (
            <><Hr />
            <Row label="Спасброски" value={
              p.savingThrows.map(s => {
                const val = getSaveValue(s)
                return `${SPELL_ABILITY_LABELS[s.ability] ?? s.ability} ${val >= 0 ? '+' : ''}${val}${s.override !== null && s.override !== undefined && s.override !== '' ? '*' : ''}`
              }).join(', ')
            } /></>
          )}

          {/* Навыки */}
          {(p.skills ?? []).length > 0 && (
            <Row label="Навыки" value={
              p.skills.map(s => {
                const val = getSkillValue(s)
                const profStr = PROF_LABEL[s.proficiency] ? ` (${PROF_LABEL[s.proficiency]})` : ''
                return `${s.name}${profStr} ${val >= 0 ? '+' : ''}${val}`
              }).join(', ')
            } />
          )}

          {/* Владения */}
          {p.proficiencies && Object.values(p.proficiencies).some(Boolean) && (
            <><Hr />
            {[['Языки','languages'],['Доспехи','armor'],['Оружие','weapons'],['Инструменты','tools']]
              .filter(([, k]) => p.proficiencies[k])
              .map(([label, k]) => <Row key={k} label={label} value={p.proficiencies[k]} />)
            }</>
          )}

          {/* Иммунитеты / сопротивления */}
          {(p.immunities?.length > 0 || p.resistances?.length > 0 || p.vulnerabilities?.length > 0 || p.conditionImmunities?.length > 0) && (
            <><Hr />
            {p.immunities?.length          > 0 && <Row label="Иммунитет к урону"      value={p.immunities.map(id => DMG_LABEL[id] ?? id).join(', ')} color="#93c5fd" />}
            {p.resistances?.length         > 0 && <Row label="Сопротивление"          value={p.resistances.map(id => DMG_LABEL[id] ?? id).join(', ')} color="#4ade80" />}
            {p.vulnerabilities?.length     > 0 && <Row label="Уязвимость"             value={p.vulnerabilities.map(id => DMG_LABEL[id] ?? id).join(', ')} color="#f87171" />}
            {p.conditionImmunities?.length > 0 && <Row label="Иммунитет к состояниям" value={p.conditionImmunities.map(id => COND_LABEL[id] ?? id).join(', ')} color="#fbbf24" />}
            </>
          )}

          {/* Особые чувства */}
          {(p.specialSenses ?? []).length > 0 && (
            <><Hr />
            <Row label="Особые чувства" value={p.specialSenses.map(s => `${SENSE_LABEL[s.type] ?? s.type} ${s.range} фут.`).join(', ')} />
            </>
          )}

          {/* Грузоподъёмность */}
          {(carry > 0) && (
            <><Hr />
            <Row label="Грузоподъёмность" value={`макс. ${carry} фунтов · предел ${carry * 2} фунтов`} />
            </>
          )}

          {/* Истощение */}
          {(p.exhaustion ?? 0) > 0 && (
            <><Hr />
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-cinzel text-sm font-semibold" style={{ color: 'var(--text)' }}>Истощение: </span>
              <div className="flex gap-1">
                {[1,2,3,4,5,6].map(lvl => (
                  <div key={lvl} className="rounded-full"
                    style={{ width: 14, height: 14, background: lvl <= p.exhaustion ? '#f87171' : 'var(--bg-row)', border: '1px solid var(--border-md)' }} />
                ))}
              </div>
              <span className="text-sm" style={{ color: '#f87171' }}>{p.exhaustion}/6</span>
            </div></>
          )}

          {/* Состояния */}
          {p.conditions && (
            <><Hr />
            <Row label="Состояния" value={p.conditions} color="#fbbf24" />
            </>
          )}

          {/* Черты */}
          {(p.traits ?? []).length > 0 && (
            <><Hr />
            <div className="my-2">
              {p.traits.map((t, i) => (
                <div key={i} className="mb-2">
                  <span className="font-cinzel text-sm font-semibold italic" style={{ color: 'var(--text)' }}>
                    {t.name}
                    {t.actionType && (
                      <span className="font-cinzel text-[10px] px-1.5 py-0.5 rounded ml-2"
                        style={{ background: 'rgba(167,139,250,0.12)', color: '#c4b5fd', fontStyle: 'normal' }}>
                        {TRAIT_LABEL[t.actionType] ?? t.actionType}
                      </span>
                    )}
                    {'. '}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{t.description}</span>
                </div>
              ))}
            </div></>
          )}

          {/* Боевые способности */}
          {actionGroups.length > 0 && (
            <><Hr />
            {actionGroups.map(({ sec, label, items }) => (
              <div key={sec} className="mb-3">
                <Sec label={label} />
                {items.map((a, i) => (
                  <div key={i} className="mb-2">
                    <span className="font-cinzel text-sm font-semibold" style={{ color: 'var(--text)' }}>{a.name}. </span>
                    {a.attackBonus != null && (
                      <span className="text-sm italic" style={{ color: 'var(--text-dim)' }}>
                        Атака: {a.attackBonus >= 0 ? '+' : ''}{a.attackBonus} к попаданию
                        {a.reach ? `, досягаемость ${a.reach}` : ''}
                        {a.range ? `, дальность ${a.range}` : ''}. {' '}
                      </span>
                    )}
                    {(a.damages ?? []).filter(d => d.die).length > 0 && (
                      <span className="text-sm italic" style={{ color: 'var(--text-dim)' }}>
                        Попадание: {a.damages.filter(d => d.die).map(fmtDmg).join(' плюс ')}. {' '}
                      </span>
                    )}
                    {a.description && <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{a.description}</span>}
                  </div>
                ))}
              </div>
            ))}</>
          )}

          {/* Заклинания */}
          {p.spellcasting && (
            <><Hr />
            <Sec label="Заклинания" />
            <div className="flex gap-3 mb-2">
              <div className="flex-1 rounded-lg px-3 py-2" style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}>
                <div className="font-cinzel text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Бонус атаки заклинанием</div>
                <div className="font-cinzel text-base font-bold" style={{ color: '#a78bfa' }}>
                  {spellAttack >= 0 ? '+' : ''}{spellAttack}
                </div>
              </div>
              <div className="flex-1 rounded-lg px-3 py-2" style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}>
                <div className="font-cinzel text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Сложность спасброска</div>
                <div className="font-cinzel text-base font-bold" style={{ color: '#a78bfa' }}>{spellDC}</div>
              </div>
              <div className="flex-1 rounded-lg px-3 py-2" style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}>
                <div className="font-cinzel text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Хар-ка</div>
                <div className="font-cinzel text-sm" style={{ color: 'var(--text-dim)' }}>
                  {SPELL_ABILITY_LABELS[p.spellcasting.ability ?? 'int']}
                </div>
              </div>
            </div>
            </>
          )}

          {/* Заметки */}
          {p.notes && (
            <><Hr />
            <div className="mt-2">
              <div className="font-cinzel text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Заметки</div>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{p.notes}</p>
            </div></>
          )}

        </div>
      </div>
    </div>
  )
}
