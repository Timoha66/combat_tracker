import { IconX, IconPencil, IconSword } from '@tabler/icons-react'
import { ABILITY_KEYS, ABILITY_LABELS, abilityMod } from '../../data/gameData'
import { DMG_TYPES } from '../../data/constants'
import { DAMAGE_BONUS_SHORT } from '../../data/spellDb'

const DMG_LABEL = Object.fromEntries(DMG_TYPES.map(t => [t.id, t.label]))
function dmgName(id) { return DMG_LABEL[id] ?? id }

function fmtDmg(d) {
  const base = `${d.count ?? 1}${d.die ?? 'd6'}`
  const bonus = d.bonus === 'custom'
    ? (d.bonusCustom ? ` + ${d.bonusCustom}` : '')
    : (d.bonus && DAMAGE_BONUS_SHORT[d.bonus] ? ` + ${DAMAGE_BONUS_SHORT[d.bonus]}` : '')
  const type = d.dmgType ? ` ${dmgName(d.dmgType)}` : ''
  return base + bonus + type
}

export default function PlayerModal({ player: p, onClose, onEdit, onAddToTracker }) {
  const mod = k => Math.floor(((p.abilities?.[k] ?? 10) - 10) / 2)
  const modStr = k => { const m = mod(k); return m >= 0 ? `+${m}` : `${m}` }
  const modColor = k => {
    const m = mod(k)
    return m >= 3 ? '#4ade80' : m >= 1 ? '#86efac' : m === 0 ? 'var(--text-muted)' : '#f87171'
  }

  return (
    <div className="overlay" style={{ zIndex: 500 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid rgba(226,201,126,0.3)', width: 620, maxWidth: '95vw', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)', background: 'rgba(226,201,126,0.06)' }}>
          <div className="flex-1 min-w-0">
            <h3 className="font-cinzel text-xl font-bold" style={{ color: 'var(--gold)' }}>{p.name}</h3>
            <p className="font-cinzel text-sm italic mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {[p.playerClass, p.level ? `${p.level} уровень` : '', p.size].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={onEdit}><IconPencil size={14} /> Редактировать</button>
            <button className="btn btn-add" onClick={() => onAddToTracker(p)}><IconSword size={14} /> В трекер</button>
            <button className="icon-btn" onClick={onClose}><IconX size={15} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ХП / КД / Скорость / Инициатива */}
          <div className="flex flex-wrap gap-3 mb-4">
            <StatPill label="ХП" value={p.hp?.max} color="#4ade80" />
            <StatPill label="КД" value={p.ac} color="#93c5fd" />
            {p.speed && <StatPill label="Скорость" value={p.speed} />}
            <StatPill label="Иниц. бонус" value={`${(p.initiative ?? 0) >= 0 ? '+' : ''}${p.initiative ?? 0}`} />
          </div>

          <Div />

          {/* Характеристики */}
          <div className="grid grid-cols-6 gap-2 my-3">
            {ABILITY_KEYS.map(k => (
              <div key={k} className="rounded-lg py-2 px-1 text-center"
                style={{ background: 'var(--bg-row)', border: '0.5px solid var(--border-md)' }}>
                <div className="font-cinzel text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {ABILITY_LABELS[k]}
                </div>
                <div className="font-cinzel text-base font-bold px-1 py-0.5 rounded-md mx-auto inline-block mb-1"
                  style={{ background: `${modColor(k)}22`, color: modColor(k), border: `1px solid ${modColor(k)}44`, minWidth: 34 }}>
                  {modStr(k)}
                </div>
                <div className="font-cinzel text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.abilities?.[k] ?? 10}</div>
              </div>
            ))}
          </div>

          {/* Спасброски */}
          {p.savingThrows?.length > 0 && (
            <><Div />
            <Block label="Спасброски" value={p.savingThrows.map(s => `${s.ability} ${s.bonus >= 0 ? '+' : ''}${s.bonus}`).join(', ')} /></>
          )}

          {/* Навыки */}
          {p.skills?.length > 0 && (
            <Block label="Навыки" value={p.skills.map(s => `${s.name} ${s.bonus >= 0 ? '+' : ''}${s.bonus}`).join(', ')} />
          )}

          {/* Сопротивления */}
          {(p.immunities?.length > 0 || p.resistances?.length > 0 || p.vulnerabilities?.length > 0) && (
            <><Div />
            {p.immunities?.length > 0 && <Block label="Иммунитет" value={p.immunities.join(', ')} color="#93c5fd" />}
            {p.resistances?.length > 0 && <Block label="Сопротивление" value={p.resistances.join(', ')} color="#4ade80" />}
            {p.vulnerabilities?.length > 0 && <Block label="Уязвимость" value={p.vulnerabilities.join(', ')} color="#f87171" />}
            </>
          )}

          {/* Чувства / языки */}
          {(p.senses || p.languages) && (
            <><Div />
            {p.senses    && <Block label="Чувства"  value={p.senses} />}
            {p.languages && <Block label="Языки"    value={p.languages} />}
            </>
          )}

          {/* Черты */}
          {p.traits?.length > 0 && (
            <><Div />
            <div className="my-2">
              {p.traits.map((t, i) => (
                <p key={i} className="text-sm mb-1.5" style={{ color: 'var(--text-dim)' }}>
                  <span className="font-cinzel font-semibold italic" style={{ color: 'var(--text)' }}>{t.name}. </span>
                  {t.description}
                </p>
              ))}
            </div></>
          )}

          {/* Действия */}
          {p.actions?.length > 0 && (
            <><Div />
            <div className="font-cinzel text-sm font-bold mt-3 mb-2" style={{ color: 'var(--gold)' }}>Действия</div>
            {p.actions.map((a, i) => (
              <div key={i} className="mb-1.5">
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
                    Попадание: {(a.damages).filter(d => d.die).map(fmtDmg).join(' плюс ')}. {' '}
                  </span>
                )}
                {a.description && <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{a.description}</span>}
              </div>
            ))}</>
          )}

          {/* Дополнительно */}
          {(p.exhaustion > 0 || p.conditions || p.carryCapacity) && (
            <><Div />
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
            {p.conditions && <Block label="Состояния" value={p.conditions} color="#fbbf24" />}
            {p.carryCapacity && <Block label="Грузоподъёмность" value={p.carryCapacity} />}
            </>
          )}

          {/* Заклинания */}
          {p.spellcasting && (
            <><Div />
            <Block label="Заклинатель" value={`${p.spellcasting.level} уровень, хар-ка: ${p.spellcasting.ability}`} />
            </>
          )}

          {/* Заметки */}
          {p.notes && (
            <><Div />
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

function Div() {
  return <hr style={{ borderColor: 'rgba(226,201,126,0.15)', margin: '8px 0' }} />
}
function StatPill({ label, value, color }) {
  return (
    <div className="text-sm">
      <span className="font-cinzel font-semibold" style={{ color: 'var(--text)' }}>{label}: </span>
      <span style={{ color: color ?? 'var(--text-dim)' }}>{value}</span>
    </div>
  )
}
function Block({ label, value, color }) {
  return (
    <div className="text-sm mb-1">
      <span className="font-cinzel font-semibold" style={{ color: 'var(--text)' }}>{label}: </span>
      <span style={{ color: color ?? 'var(--text-dim)' }}>{value}</span>
    </div>
  )
}
