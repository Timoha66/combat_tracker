import { IconX, IconPencil, IconSword } from '@tabler/icons-react'
import { ABILITY_KEYS, ABILITY_LABELS } from '../../data/gameData'
import { totalLevel, classLabel, SPECIAL_SENSES } from '../../data/partyDb'
import { DMG_TYPES } from '../../data/constants'
import { DAMAGE_BONUS_SHORT, CONDITION_TYPES } from '../../data/spellDb'

const SENSE_LABEL = Object.fromEntries(SPECIAL_SENSES.map(s => [s.id, s.label]))
const DMG_LABEL   = Object.fromEntries(DMG_TYPES.map(t => [t.id, t.label]))
const COND_LABEL  = Object.fromEntries(CONDITION_TYPES.map(c => [c.id, c.label]))

function fmtDmg(d) {
  const base    = `${d.count ?? 1}${d.die ?? 'd6'}`
  const bonuses = (d.bonuses ?? []).map(b =>
    b.type === 'custom' ? (b.value || '') : (DAMAGE_BONUS_SHORT[b.type] ?? '')
  ).filter(Boolean).join(' + ')
  const type    = d.dmgType ? ` ${DMG_LABEL[d.dmgType] ?? d.dmgType}` : ''
  return base + (bonuses ? ` + ${bonuses}` : '') + type
}

const ACTION_SECTION_LABEL = { action: 'Действие', bonus: 'Бонусное действие', reaction: 'Реакция' }
const TRAIT_ACTION_LABEL   = { action: 'Действие', bonus: 'Бонусное', reaction: 'Реакция' }

export default function PlayerModal({ player: p, onClose, onEdit, onAddToTracker }) {
  const mod    = k => Math.floor(((p.abilities?.[k] ?? 10) - 10) / 2)
  const modStr = k => { const m = mod(k); return m >= 0 ? `+${m}` : `${m}` }
  const modClr = k => {
    const m = mod(k)
    return m >= 3 ? '#4ade80' : m >= 1 ? '#86efac' : m === 0 ? 'var(--text-muted)' : '#f87171'
  }

  const lvl    = totalLevel(p)
  const clsLbl = classLabel(p)

  // Группируем действия по секции
  const actionsBySection = ['action', 'bonus', 'reaction'].map(sec => ({
    sec,
    label: ACTION_SECTION_LABEL[sec],
    items: (p.actions ?? []).filter(a => (a.section ?? 'action') === sec),
  })).filter(g => g.items.length > 0)

  return (
    <div className="overlay" style={{ zIndex: 500 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid rgba(226,201,126,0.3)', width: 640, maxWidth: '95vw', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>

        {/* Шапка */}
        <div className="flex items-start gap-3 px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)', background: 'rgba(226,201,126,0.06)' }}>
          <div className="flex-1 min-w-0">
            <h3 className="font-cinzel text-xl font-bold" style={{ color: 'var(--gold)' }}>{p.name}</h3>
            <p className="font-cinzel text-sm italic mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {[clsLbl, lvl ? `${lvl} уровень` : '', p.size].filter(Boolean).join(' · ')}
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
            <Pill label="ХП" value={p.hp?.max} color="#4ade80" />
            <Pill label="КД" value={p.ac} color="#93c5fd" />
            {p.speed    && <Pill label="Скорость"     value={p.speed} />}
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

          {/* Спасброски / Навыки */}
          {p.savingThrows?.length > 0 && <><Hr /><Row label="Спасброски" value={p.savingThrows.map(s => `${s.ability} ${s.bonus >= 0 ? '+' : ''}${s.bonus}`).join(', ')} /></>}
          {p.skills?.length > 0       && <Row label="Навыки"      value={p.skills.map(s => `${s.name} ${s.bonus >= 0 ? '+' : ''}${s.bonus}`).join(', ')} />}

          {/* Иммунитеты / сопротивления */}
          {(p.immunities?.length > 0 || p.resistances?.length > 0 || p.vulnerabilities?.length > 0 || p.conditionImmunities?.length > 0) && (
            <><Hr />
            {p.immunities?.length > 0           && <Row label="Иммунитет к урону"    value={p.immunities.map(id => DMG_LABEL[id] ?? id).join(', ')} color="#93c5fd" />}
            {p.resistances?.length > 0          && <Row label="Сопротивление"        value={p.resistances.map(id => DMG_LABEL[id] ?? id).join(', ')} color="#4ade80" />}
            {p.vulnerabilities?.length > 0      && <Row label="Уязвимость"           value={p.vulnerabilities.map(id => DMG_LABEL[id] ?? id).join(', ')} color="#f87171" />}
            {p.conditionImmunities?.length > 0  && <Row label="Иммунитет к состояниям" value={p.conditionImmunities.map(id => COND_LABEL[id] ?? id).join(', ')} color="#fbbf24" />}
            </>
          )}

          {/* Особые чувства */}
          {(p.specialSenses ?? []).length > 0 && (
            <><Hr />
            <Row label="Особые чувства" value={p.specialSenses.map(s => `${SENSE_LABEL[s.type] ?? s.type} ${s.range} фут.`).join(', ')} />
            </>
          )}

          {/* Владения */}
          {p.proficiencies && Object.values(p.proficiencies).some(Boolean) && (
            <><Hr />
            {[['Языки','languages'],['Доспехи','armor'],['Оружие','weapons'],['Инструменты','tools']].map(([label, key]) =>
              p.proficiencies[key] ? <Row key={key} label={label} value={p.proficiencies[key]} /> : null
            )}
            </>
          )}

          {/* Черты */}
          {p.traits?.length > 0 && (
            <><Hr />
            <div className="my-2">
              {p.traits.map((t, i) => (
                <div key={i} className="mb-2">
                  <span className="font-cinzel text-sm font-semibold italic" style={{ color: 'var(--text)' }}>
                    {t.name}
                    {t.actionType && (
                      <span className="font-cinzel text-[10px] px-1.5 py-0.5 rounded ml-2"
                        style={{ background: 'rgba(167,139,250,0.12)', color: '#c4b5fd', fontStyle: 'normal' }}>
                        {TRAIT_ACTION_LABEL[t.actionType] ?? t.actionType}
                      </span>
                    )}
                    {'. '}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{t.description}</span>
                </div>
              ))}
            </div></>
          )}

          {/* Действия */}
          {actionsBySection.length > 0 && (
            <><Hr />
            {actionsBySection.map(({ sec, label, items }) => (
              <div key={sec} className="mb-3">
                <div className="font-cinzel text-sm font-bold mb-2" style={{ color: 'var(--gold)' }}>{label}</div>
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

          {/* Дополнительно */}
          {(p.exhaustion > 0 || p.conditions || p.carryCapacity) && (
            <><Hr />
            {p.exhaustion > 0 && (
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-cinzel text-sm font-semibold" style={{ color: 'var(--text)' }}>Истощение: </span>
                <div className="flex gap-1">
                  {[1,2,3,4,5,6].map(lvl => (
                    <div key={lvl} className="rounded-full"
                      style={{ width: 14, height: 14, background: lvl <= p.exhaustion ? '#f87171' : 'var(--bg-row)', border: '1px solid var(--border-md)' }} />
                  ))}
                </div>
                <span className="text-sm" style={{ color: '#f87171' }}>{p.exhaustion}/6</span>
              </div>
            )}
            {p.conditions    && <Row label="Состояния"        value={p.conditions}    color="#fbbf24" />}
            {p.carryCapacity && <Row label="Грузоподъёмность" value={p.carryCapacity} />}
            </>
          )}

          {/* Заклинания */}
          {p.spellcasting && (
            <><Hr />
            <Row label="Заклинатель" value={`${p.spellcasting.level} уровень, хар-ка: ${p.spellcasting.ability}`} />
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

function Hr()  { return <hr style={{ borderColor: 'rgba(226,201,126,0.15)', margin: '8px 0' }} /> }
function Pill({ label, value, color }) {
  return (
    <div className="text-sm">
      <span className="font-cinzel font-semibold" style={{ color: 'var(--text)' }}>{label}: </span>
      <span style={{ color: color ?? 'var(--text-dim)' }}>{value}</span>
    </div>
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
