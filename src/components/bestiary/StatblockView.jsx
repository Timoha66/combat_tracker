import { useState } from 'react'
import { IconPencil, IconSword } from '@tabler/icons-react'
import { abilityMod, ABILITY_KEYS, ABILITY_LABELS, ACTION_SECTIONS } from '../../data/gameData'
import { useBattleStore } from '../../store/battleStore'
import { DMG_TYPES } from '../../data/constants'
import SpellInlineList from '../spells/SpellInlineList'
import SpellMiniCard from '../spells/SpellMiniCard'

const ATTACK_TYPE_LABEL = {
  melee:        'Атака рукопашным оружием',
  ranged:       'Атака дальнобойным оружием',
  spell_melee:  'Атака заклинанием ближнего боя',
  spell_ranged: 'Атака заклинанием дальнего боя',
}

// id → русское название урона
const DMG_LABEL = Object.fromEntries(DMG_TYPES.map(t => [t.id, t.label]))
function dmgName(id) { return DMG_LABEL[id] ?? id }

// Формирует строку урона — поддерживает и старый и новый формат
function damageLine(a) {
  const damages = a.damages?.filter(d => d.formula) ?? (a.damage ? [{ formula: a.damage, type: a.damageType }] : [])
  if (!damages.length) return null
  return 'Попадание: ' + damages.map(d => `${d.formula}${d.type ? ` ${dmgName(d.type)}` : ''}`).join(' плюс ') + '.'
}

// Формирует строку атаки как в официальных книгах
function attackLine(a) {
  if (!a.attackType && a.attackBonus == null) return null
  const typeLabel = ATTACK_TYPE_LABEL[a.attackType] ?? 'Атака'
  const bonus = a.attackBonus != null ? `${a.attackBonus >= 0 ? '+' : ''}${a.attackBonus} к попаданию` : ''
  const isRanged = a.attackType === 'ranged' || a.attackType === 'spell_ranged'
  const isMelee  = a.attackType === 'melee'  || a.attackType === 'spell_melee'
  const reach = isMelee  ? `, досягаемость ${a.reach || '1,5 м'}, одна цель` : ''
  const range = isRanged ? `, дальность ${a.range || '—'}, одна цель` : ''
  return `${typeLabel}: ${bonus}${reach}${range}.`
}

export default function StatblockView({ creature: c, onEdit }) {
  const addCombatants = useBattleStore(s => s.addCombatants)
  const isPlayer = c.type === 'player'
  const [spellCard, setSpellCard] = useState(null)

  function handleAddToTracker() {
    const initBonus = c.initiative ?? (c.abilities ? Math.floor((c.abilities.dex - 10) / 2) : 0)
    const initiative = Math.floor(Math.random() * 20) + 1 + initBonus
    addCombatants({
      name:                 c.name,
      type:                 c.type,
      hp:                   isPlayer ? c.hp?.max : c.hp?.average,
      ac:                   isPlayer ? c.ac : c.ac?.value,
      resistances:          c.resistances    ?? [],
      immunities:           c.immunities     ?? [],
      vulnerabilities:      c.vulnerabilities ?? [],
      legendaryActionCount: c.legendaryActionCount ?? 0,
      legendaryResistances: c.legendaryResistances ?? 0,
      spellcasting:         c.spellcasting ?? null,
      id:                   c.id,
    }, 1, initiative)
    alert(`${c.name} добавлен в трекер с инициативой ${initiative}`)
  }

  return (
    <>
    <div className="p-5 h-full overflow-y-auto">
      {/* Header actions */}
      <div className="flex items-center gap-2 mb-4">
        {onEdit && (
          <button className="btn btn-ghost" onClick={onEdit}>
            <IconPencil size={14} /> Редактировать
          </button>
        )}
        <button className="btn btn-add ml-auto" onClick={handleAddToTracker}>
          <IconSword size={14} /> Добавить в трекер
        </button>
      </div>

      {/* Statblock */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(226,201,126,0.25)', background: 'var(--bg-panel)' }}>
        {/* Name bar */}
        <div className="px-5 py-4" style={{ background: 'rgba(226,201,126,0.08)', borderBottom: '2px solid rgba(226,201,126,0.3)' }}>
          <h2 className="font-cinzel text-2xl font-bold" style={{ color: 'var(--gold)' }}>{c.name}</h2>
          {!isPlayer && (
            <p className="text-sm italic mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {c.size} {c.creatureType}
            </p>
          )}
        </div>

        <div className="px-5 py-4">
          {/* Core stats */}
          <div className="flex flex-wrap gap-4 mb-3">
            <StatLine label="Класс доспеха" value={isPlayer ? c.ac : `${c.ac?.value}${c.ac?.note ? ` (${c.ac.note})` : ''}`} />
            <StatLine label="Хиты" value={isPlayer ? c.hp?.max : `${c.hp?.average}${c.hp?.formula ? ` (${c.hp.formula})` : ''}`} />
            {!isPlayer && <StatLine label="Скорость" value={c.speed} />}
            {!isPlayer && c.cr && <StatLine label="Опасность" value={`${c.cr} (бонус мастерства +${c.proficiencyBonus ?? 2})`} />}
          </div>

          <SbDivider />

          {/* Ability scores */}
          <div className="grid grid-cols-6 gap-2 my-3">
            {ABILITY_KEYS.map(k => {
              const val = c.abilities?.[k] ?? 10
              const mod = Math.floor((val - 10) / 2)
              const modStr = mod >= 0 ? `+${mod}` : `${mod}`
              const modColor = mod >= 3 ? '#4ade80' : mod >= 1 ? '#86efac' : mod === 0 ? 'var(--text-muted)' : mod >= -2 ? '#f87171' : '#ef4444'
              return (
                <div key={k} className="rounded-lg py-2 px-2"
                  style={{ background: 'var(--bg-row)', border: '0.5px solid var(--border-md)' }}>
                  <div className="font-cinzel text-[9px] tracking-widest uppercase mb-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
                    {ABILITY_LABELS[k]}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-cinzel text-sm" style={{ color: 'var(--text-dim)' }}>{val}</span>
                    <span className="font-cinzel text-sm font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: `${modColor}22`, color: modColor, border: `1px solid ${modColor}44`, minWidth: 30, textAlign: 'center' }}>
                      {modStr}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <SbDivider />

          {/* Secondary stats */}
          {!isPlayer && (
            <div className="flex flex-col gap-1.5 mb-3">
              {c.savingThrows?.length > 0 && (
                <StatLine label="Спасброски" value={c.savingThrows.map(s => `${s.ability} ${s.bonus >= 0 ? '+' : ''}${s.bonus}`).join(', ')} />
              )}
              {c.skills?.length > 0 && (
                <StatLine label="Навыки" value={c.skills.map(s => `${s.name} ${s.bonus >= 0 ? '+' : ''}${s.bonus}`).join(', ')} />
              )}
              {c.immunities?.length > 0 && (
                <StatLine label="Иммунитет к урону" value={c.immunities.map(dmgName).join(', ')} color="#93c5fd" />
              )}
              {c.resistances?.length > 0 && (
                <StatLine label="Сопротивление" value={c.resistances.map(dmgName).join(', ')} color="#4ade80" />
              )}
              {c.vulnerabilities?.length > 0 && (
                <StatLine label="Уязвимость" value={c.vulnerabilities.map(dmgName).join(', ')} color="#f87171" />
              )}
              {c.conditionImmunities?.length > 0 && (
                <StatLine label="Иммунитет к состояниям" value={c.conditionImmunities.join(', ')} />
              )}
              {c.senses && <StatLine label="Чувства" value={c.senses} />}
              {c.languages && <StatLine label="Языки" value={c.languages} />}
            </div>
          )}

          {/* Legendary resistances */}
          {!isPlayer && c.legendaryResistances > 0 && (
            <>
              <SbDivider />
              <div className="my-3">
                <TraitBlock
                  name={`Легендарное сопротивление (${c.legendaryResistances}/день)`}
                  desc="Если это существо провалило спасбросок, оно может вместо этого считать его успешным."
                />
              </div>
            </>
          )}

          {/* Traits */}
          {c.traits?.length > 0 && (
            <>
              <SbDivider />
              <div className="my-3 flex flex-col gap-2">
                {c.traits.map((t, i) => <TraitBlock key={i} name={t.name} desc={t.description} />)}
              </div>
            </>
          )}

          {/* Spellcasting */}
          {c.spellcasting && (() => {
            const sc = c.spellcasting
            const mod  = Math.floor(((c.abilities?.[sc.ability] ?? 10) - 10) / 2)
            const prof = c.proficiencyBonus ?? 2
            const saveDC      = sc.saveDCOverride       ?? (8 + prof + mod)
            const atkBonus    = sc.attackBonusOverride  ?? (prof + mod)
            const atkStr      = `${atkBonus >= 0 ? '+' : ''}${atkBonus}`
            const abilityName = { str: 'Сила', dex: 'Ловкость', con: 'Телосложение', int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма' }[sc.ability] ?? sc.ability
            const activeSlots = Array.from({ length: 10 }, (_, i) => i)
              .filter(i => sc.slots?.[i]?.count && sc.slots[i].count !== 'null' && sc.slots[i].spells?.trim())
            return (
              <>
                <SbDivider />
                <div className="my-3">
                  <p className="text-sm mb-2" style={{ color: 'var(--text-dim)' }}>
                    <span className="font-cinzel font-semibold italic" style={{ color: 'var(--text)' }}>Использование заклинаний. </span>
                    {c.name} является заклинателем <strong>{sc.level}</strong> уровня. Его заклинательной характеристикой является <strong>{abilityName}</strong> (СЛ спасброска от заклинаний {saveDC}, {atkStr} к атакам заклинаниями). {c.name} обладает следующими заготовленными заклинаниями:
                  </p>
                  <div className="flex flex-col gap-1">
                    {activeSlots.map(lvl => {
                      const slot = sc.slots[lvl]
                      const countStr = slot.count === 'unlimited' ? 'неограниченно' : `${slot.count} ${['ячейка','ячейки','ячейки','ячейки','ячеек'][Math.min(Number(slot.count) - 1, 4)] ?? 'ячеек'}`
                      const label = lvl === 0 ? 'Заговоры' : `${lvl} уровень`
                      return (
                        <p key={lvl} className="text-sm" style={{ color: 'var(--text-dim)' }}>
                          <span className="font-cinzel font-semibold" style={{ color: 'var(--text)' }}>{label} </span>
                          <em>({countStr}):</em>{' '}
                          <SpellInlineList spellsText={slot.spells} onSpellClick={setSpellCard} />
                        </p>
                      )
                    })}
                  </div>
                </div>
              </>
            )
          })()}

          {/* Actions by section */}
          {ACTION_SECTIONS.map(section => {
            const acts = (c.actions ?? []).filter(a => a.section === section.id)
            if (!acts.length) return null
            return (
              <div key={section.id}>
                <SbDivider />
                <div className="font-cinzel text-sm font-bold mt-3 mb-2" style={{ color: 'var(--gold)' }}>
                  {section.label}
                  {section.id === 'legendary' && c.legendaryActionCount > 0 && (
                    <span className="font-normal text-xs ml-2" style={{ color: 'var(--text-dim)' }}>
                      ({c.legendaryActionCount} в ход)
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {acts.map((a, i) => (
                    <div key={i}>
                      <span className="font-cinzel text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {a.name}.{' '}
                      </span>
                      {attackLine(a) && (
                        <span className="text-sm italic" style={{ color: 'var(--text-dim)' }}>
                          {attackLine(a)}{' '}
                        </span>
                      )}
                      {!attackLine(a) && a.attackBonus != null && (
                        <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                          <em>Атака:</em> {a.attackBonus >= 0 ? '+' : ''}{a.attackBonus} к попаданию.{' '}
                        </span>
                      )}
                      {damageLine(a) && (
                        <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                          <em>{damageLine(a)}</em>{' '}
                        </span>
                      )}
                      {a.description && (
                        <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{a.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Notes */}
          {c.notes && (
            <>
              <SbDivider />
              <div className="mt-3">
                <div className="font-cinzel text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                  Заметки ДМ
                </div>
                <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{c.notes}</p>
              </div>
            </>
          )}

          {/* Tags + Source */}
          {(c.tags?.length > 0 || c.source) && (
            <div className="flex flex-wrap items-center gap-1 mt-4">
              <div className="flex flex-wrap gap-1 flex-1">
                {c.tags?.map(t => (
                  <span key={t} className="font-cinzel text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-row)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>
                    {t}
                  </span>
                ))}
              </div>
              {c.source && (
                <span className="font-cinzel text-[10px] px-2 py-0.5 rounded-full ml-auto shrink-0"
                  style={{ background: c.source === 'HB' ? 'rgba(167,139,250,0.12)' : 'rgba(226,201,126,0.08)', color: c.source === 'HB' ? '#c4b5fd' : 'var(--gold)', border: `0.5px solid ${c.source === 'HB' ? 'rgba(167,139,250,0.3)' : 'rgba(226,201,126,0.25)'}` }}>
                  {c.source}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    {spellCard && <SpellMiniCard spell={spellCard} onClose={() => setSpellCard(null)} />}
    </>
  )
}

function SbDivider() {
  return <hr style={{ borderColor: 'rgba(226,201,126,0.2)', margin: '4px 0' }} />
}

function StatLine({ label, value, color }) {
  return (
    <div className="text-sm">
      <span className="font-cinzel font-semibold" style={{ color: 'var(--text)' }}>{label}: </span>
      <span style={{ color: color ?? 'var(--text-dim)' }}>{value}</span>
    </div>
  )
}

function TraitBlock({ name, desc }) {
  return (
    <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
      <span className="font-cinzel font-semibold italic" style={{ color: 'var(--text)' }}>{name}. </span>
      {desc}
    </p>
  )
}
