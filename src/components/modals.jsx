import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { useBattleStore, getEffectiveAC } from '../store/battleStore'
import { useBestiaryStore } from '../store/bestiaryStore'
import { CONDITIONS, CONDITIONS_BASE, CONDITIONS_COMBAT, STATUS_LABEL, STATUS_PILL, getStatus } from '../data/constants'
import { ABILITY_KEYS, ABILITY_LABELS, ACTION_SECTIONS, abilityMod } from '../data/gameData'
import { DMG_TYPES } from '../data/constants'

const ATTACK_TYPE_LABEL = {
  melee:        'Атака рукопашным оружием',
  ranged:       'Атака дальнобойным оружием',
  spell_melee:  'Атака заклинанием ближнего боя',
  spell_ranged: 'Атака заклинанием дальнего боя',
}
function attackLine(a) {
  if (!a.attackType && a.attackBonus == null) return null
  const typeLabel = ATTACK_TYPE_LABEL[a.attackType] ?? 'Атака'
  const bonus = a.attackBonus != null ? `${a.attackBonus >= 0 ? '+' : ''}${a.attackBonus} к попаданию` : ''
  const isMelee  = a.attackType === 'melee'  || a.attackType === 'spell_melee'
  const isRanged = a.attackType === 'ranged' || a.attackType === 'spell_ranged'
  const reach = isMelee  ? `, досягаемость ${a.reach || '1,5 м'}, одна цель` : ''
  const range = isRanged ? `, дальность ${a.range || '—'}, одна цель` : ''
  return `${typeLabel}: ${bonus}${reach}${range}.`
}

const DMG_LABEL = Object.fromEntries(DMG_TYPES.map(t => [t.id, t.label]))
function dmgName(id) { return DMG_LABEL[id] ?? id }

// ─── CONDITION PICKER ─────────────────────────────────────────────────────────
export function ConditionPicker({ id, onClose }) {
  const combatant       = useBattleStore(s => s.combatants.find(c => c.id === id))
  const toggleCondition = useBattleStore(s => s.toggleCondition)
  const [immuneMsg, setImmuneMsg] = useState(null)

  if (!combatant) return null

  // Получаем иммунитеты к состояниям из бестиария (через sourceId) или из самого участника
  const creatures  = useBestiaryStore.getState().creatures
  const source     = creatures.find(c => c.id === combatant.sourceId)
  const condImmunities = source?.conditionImmunities ?? combatant.conditionImmunities ?? []

  function handleToggle(cond) {
    const isActive = combatant.conditions.includes(cond.id)
    if (!isActive && condImmunities.includes(cond.label)) {
      setImmuneMsg(`Нельзя добавить — ${combatant.name} имеет иммунитет к состоянию «${cond.label}»`)
      setTimeout(() => setImmuneMsg(null), 3000)
      return
    }
    setImmuneMsg(null)
    toggleCondition(id, cond.id)
  }

  function renderCond(cond) {
    const isActive = combatant.conditions.includes(cond.id)
    const isImmune = condImmunities.includes(cond.label)
    const dotColor = cond.css.includes('red') ? '#f87171' : cond.css.includes('amber') ? '#f59e0b' : cond.css.includes('blue') ? '#60a5fa' : cond.css.includes('purple') ? '#a78bfa' : '#9ca3af'
    return (
      <div key={cond.id}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
        style={{
          background: isImmune ? 'rgba(96,165,250,0.06)' : isActive ? 'var(--gold-dim)' : 'var(--bg-row)',
          border: `1px solid ${isImmune ? 'rgba(96,165,250,0.2)' : isActive ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
          color: isImmune ? 'var(--text-muted)' : isActive ? 'var(--gold)' : 'var(--text-dim)',
          cursor: isImmune ? 'not-allowed' : 'pointer',
          opacity: isImmune ? 0.6 : 1,
        }}
        onClick={() => handleToggle(cond)}
        title={isImmune ? `Иммунитет к ${cond.label}` : ''}
      >
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
        <span className="font-cinzel text-[11px] flex-1">{cond.label}</span>
        {isImmune && <span className="font-cinzel text-[9px]" style={{ color: '#60a5fa' }}>иммун.</span>}
        {isActive && !isImmune && <IconCheck size={12} />}
      </div>
    )
  }

  return (
    <div className="overlay">
      <div className="modal" style={{ width: 380 }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>
            Состояния
          </span>
          <span className="text-sm ml-1" style={{ color: 'var(--text-dim)' }}>{combatant.name}</span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>
        <p className="text-sm mb-3" style={{ color: 'var(--text-dim)' }}>Нажми для добавления / снятия</p>

        {/* Сообщение об иммунитете */}
        {immuneMsg && (
          <div className="rounded-lg px-3 py-2 mb-3 text-sm font-cinzel"
               style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171' }}>
            🛡 {immuneMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {CONDITIONS_BASE.map(cond => renderCond(cond))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="font-cinzel text-[10px] tracking-widest uppercase px-2" style={{ color: 'var(--text-muted)' }}>
            Боевые состояния
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {CONDITIONS_COMBAT.map(cond => renderCond(cond))}
        </div>

        <button className="btn btn-cancel w-full justify-center" onClick={onClose}>
          <IconX size={14} /> Закрыть
        </button>
      </div>
    </div>
  )
}

// ─── AC POPOVER ───────────────────────────────────────────────────────────────
export function AcPopover({ id, onClose }) {
  const combatant = useBattleStore(s => s.combatants.find(c => c.id === id))
  const setAc     = useBattleStore(s => s.setAc)
  const revertAc  = useBattleStore(s => s.revertAc)
  const [value, setValue] = useState(combatant?.ac.current ?? 10)

  if (!combatant) return null

  function handleApply() {
    setAc(id, value)
    onClose()
  }

  function handleRevert() {
    revertAc(id)
    onClose()
  }

  return (
    <div className="overlay">
      <div className="modal" style={{ width: 280 }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>
            Класс доспеха
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>

        <input
          type="number"
          value={value}
          min={0} max={30}
          onChange={e => setValue(Number(e.target.value))}
          autoFocus
          className="w-full font-cinzel text-4xl font-bold text-center rounded-lg py-3 mb-2 outline-none"
          style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
          onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
        />

        <p className="text-center text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Базовое КД: {combatant.ac.base}
        </p>

        <div className="flex gap-2">
          {combatant.ac.current !== combatant.ac.base && (
            <button className="btn btn-ghost flex-1 justify-center" onClick={handleRevert}>
              ↩ Сброс
            </button>
          )}
          <button className="btn btn-cancel flex-1 justify-center" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn-purple flex-1 justify-center" onClick={handleApply}>
            <IconCheck size={14} /> Задать
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── REVIVE MODAL ─────────────────────────────────────────────────────────────
export function ReviveModal({ id, onClose }) {
  const combatant = useBattleStore(s => s.combatants.find(c => c.id === id))
  const revive    = useBattleStore(s => s.revive)
  const [hp, setHp] = useState(1)

  if (!combatant) return null

  function handleRevive() {
    revive(id, hp)
    onClose()
  }

  return (
    <div className="overlay">
      <div className="modal" style={{ width: 280 }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>
            Оживить
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>

        <p className="text-sm mb-3" style={{ color: 'var(--text-dim)' }}>{combatant.name}</p>

        <span className="modal-label">Восстановить HP</span>
        <input
          type="number"
          value={hp}
          min={1} max={combatant.hp.max}
          onChange={e => setHp(Number(e.target.value) || 1)}
          autoFocus
          className="w-full font-cinzel text-4xl font-bold text-center rounded-lg py-3 mb-4 outline-none"
          style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)', color: '#4ade80' }}
          onKeyDown={e => e.key === 'Enter' && handleRevive()}
        />

        <div className="flex gap-2">
          <button className="btn btn-cancel flex-1 justify-center" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn-green flex-1 justify-center" onClick={handleRevive}>
            <IconCheck size={14} /> Оживить
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── STATBLOCK MODAL ──────────────────────────────────────────────────────────
export function StatblockModal({ combatant: c, onClose }) {
  const creatures  = useBestiaryStore(s => s.creatures)
  const loadAll    = useBestiaryStore(s => s.loadAll)

  useEffect(() => { loadAll() }, [])

  // Ищем полную запись в бестиарии по sourceId
  const full = creatures.find(x => x.id === c.sourceId) ?? null

  return (
    <div className="overlay">
      <div className="sb-modal" style={{ overflowY: 'auto' }}>
        {/* Header */}
        <div
          className="flex items-start gap-3 p-5 border-b sticky top-0 z-10"
          style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}
        >
          <div className="flex-1">
            <div className="font-cinzel text-xl font-bold" style={{ color: 'var(--gold)' }}>{c.name}</div>
            <div className="text-sm italic mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {full ? `${full.size ?? ''} ${full.creatureType ?? ''}`.trim()
               : c.type === 'player' ? 'Персонаж игрока'
               : c.type === 'npc'   ? 'НПС'
               : 'Враг'}
            </div>
          </div>
          <button className="icon-btn shrink-0" onClick={onClose}><IconX size={15} /></button>
        </div>

        {/* Если нашли полную запись — показываем полный статблок */}
        {full
          ? <StatblockViewInline creature={full} currentHp={c.hp.current} />
          : <StatblockFallback c={c} />
        }
      </div>
    </div>
  )
}

// ─── STATBLOCK INLINE (полный статблок внутри модалки трекера) ───────────────
function StatblockViewInline({ creature: c, currentHp }) {
  const isPlayer = c.type === 'player'
  return (
    <div className="p-5">
      <div className="flex gap-5 flex-wrap mb-3">
        <SbStat label="Класс доспеха" val={isPlayer ? c.ac : `${c.ac?.value}${c.ac?.note ? ` (${c.ac.note})` : ''}`} />
        <SbStat label="Хиты" val={isPlayer ? `${currentHp} / ${c.hp?.max}` : `${currentHp} / ${c.hp?.average} (${c.hp?.formula ?? ''})`} />
        {!isPlayer && c.speed && <SbStat label="Скорость" val={c.speed} />}
        {!isPlayer && c.cr   && <SbStat label="Опасность" val={`${c.cr} (+${c.proficiencyBonus ?? 2})`} />}
      </div>
      <hr style={{ borderColor: 'rgba(226,201,126,0.2)', margin: '12px 0' }} />
      <div className="grid grid-cols-6 gap-2 mb-3">
        {ABILITY_KEYS.map(k => (
          <div key={k} className="rounded-lg py-2 px-1 text-center ability-box">
            <div className="font-cinzel text-[9px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>{ABILITY_LABELS[k]}</div>
            <div className="font-cinzel text-base font-bold" style={{ color: 'var(--text)' }}>{c.abilities?.[k] ?? 10}</div>
            <div className="font-cinzel text-xs" style={{ color: 'var(--text-dim)' }}>{abilityMod(c.abilities?.[k] ?? 10)}</div>
          </div>
        ))}
      </div>
      <hr style={{ borderColor: 'rgba(226,201,126,0.2)', margin: '12px 0' }} />
      {!isPlayer && (
        <div className="flex flex-col gap-1.5 mb-3">
          {c.immunities?.length > 0     && <SbStat label="Иммунитет"    val={c.immunities.map(dmgName).join(', ')}     color="#93c5fd" />}
          {c.resistances?.length > 0    && <SbStat label="Сопротивление" val={c.resistances.map(dmgName).join(', ')}    color="#4ade80" />}
          {c.vulnerabilities?.length > 0 && <SbStat label="Уязвимость"  val={c.vulnerabilities.map(dmgName).join(', ')} color="#f87171" />}
          {c.conditionImmunities?.length > 0 && <SbStat label="Иммун. состояния" val={c.conditionImmunities.join(', ')} />}
          {c.senses    && <SbStat label="Чувства"  val={c.senses} />}
          {c.languages && <SbStat label="Языки"    val={c.languages} />}
        </div>
      )}
      {c.traits?.length > 0 && (
        <>
          <hr style={{ borderColor: 'rgba(226,201,126,0.2)', margin: '12px 0' }} />
          {c.traits.map((t, i) => (
            <p key={i} className="text-sm mb-2" style={{ color: 'var(--text-dim)' }}>
              <span className="font-cinzel font-semibold italic" style={{ color: 'var(--text)' }}>{t.name}. </span>{t.description}
            </p>
          ))}
        </>
      )}
      {ACTION_SECTIONS.map(section => {
        const acts = (c.actions ?? []).filter(a => a.section === section.id)
        if (!acts.length) return null
        return (
          <div key={section.id}>
            <hr style={{ borderColor: 'rgba(226,201,126,0.2)', margin: '12px 0' }} />
            <div className="font-cinzel text-sm font-bold mb-2" style={{ color: 'var(--gold)' }}>{section.label}</div>
            {acts.map((a, i) => (
              <p key={i} className="text-sm mb-2" style={{ color: 'var(--text-dim)' }}>
                <span className="font-cinzel font-semibold" style={{ color: 'var(--text)' }}>{a.name}. </span>
                {attackLine(a)
                  ? <><em>{attackLine(a)}</em>{' '}</>
                  : a.attackBonus != null ? <><em>Атака:</em> {a.attackBonus >= 0 ? '+' : ''}{a.attackBonus} к попаданию. </> : null
                }
                {a.damage && <><em>Урон:</em> {a.damage}{a.damageType ? ` ${dmgName(a.damageType)}` : ''}. </>}
                {a.description}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function StatblockFallback({ c }) {
  const effectiveAC = getEffectiveAC(c)
  return (
    <div className="p-5">
      <div className="flex gap-5 flex-wrap mb-4">
        {[
          { label: 'Класс доспеха', val: effectiveAC },
          { label: 'Хиты',         val: `${c.hp.current} / ${c.hp.max}` },
          { label: 'Инициатива',   val: c.initiative },
        ].map(s => <SbStat key={s.label} label={s.label} val={s.val} />)}
      </div>
      <div className="rounded-xl p-5 text-center" style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}>
        <div className="text-3xl mb-2">📖</div>
        <div className="font-cinzel text-sm" style={{ color: 'var(--text-muted)' }}>Существо не найдено в бестиарии</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Добавь его через раздел «Бестиарий»</div>
      </div>
    </div>
  )
}

function SbStat({ label, val, color }) {
  return (
    <div className="text-sm">
      <span className="font-cinzel font-semibold" style={{ color: 'var(--text)' }}>{label}: </span>
      <span style={{ color: color ?? 'var(--text-dim)' }}>{val}</span>
    </div>
  )
}

// ─── BATTLE SUMMARY ───────────────────────────────────────────────────────────
export function BattleSummary() {
  const combatants  = useBattleStore(s => s.combatants)
  const round       = useBattleStore(s => s.round)
  const setView     = useBattleStore(s => s.setView)
  const clearBattle = useBattleStore(s => s.clearBattle)

  function handleClear() {
    if (confirm('Очистить трекер? Все данные боя будут удалены.')) clearBattle()
  }

  const players = combatants.filter(c => c.type === 'player')
  const enemies = combatants.filter(c => c.type !== 'player')

  const heroesDealt    = players.reduce((s, c) => s + (c.damageDealt ?? 0), 0)
  const heroesTaken    = players.reduce((s, c) => s + (c.damageTaken ?? 0), 0)
  const enemiesDealt   = enemies.reduce((s, c) => s + (c.damageDealt ?? 0), 0)
  const enemiesTotalHp = enemies.reduce((s, c) => s + c.hp.max, 0)
  const enemiesKilled  = enemies.filter(c => c.dead).length

  const topDealt  = [...combatants].sort((a, b) => (b.damageDealt ?? 0) - (a.damageDealt ?? 0)).slice(0, 3)
  const topTaken  = [...combatants].sort((a, b) => (b.damageTaken ?? 0) - (a.damageTaken ?? 0)).slice(0, 3)

  const typeLabel = { player: 'Игрок', enemy: 'Враг', ally: 'Союзник', npc: 'НПС', companion: 'Компаньон', pet: 'Питомец' }

  return (
    <div className="flex-1 overflow-y-auto py-8 px-4">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="font-cinzel text-2xl font-bold mb-1" style={{ color: 'var(--gold)' }}>🏆 Бой завершён</div>
          <div className="text-sm" style={{ color: 'var(--text-dim)' }}>Раунд {round} · {combatants.length} участников</div>
        </div>

        {/* Big stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
            <div className="font-cinzel text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Урон героев</div>
            <div className="font-cinzel text-3xl font-bold" style={{ color: '#60a5fa' }}>{heroesDealt}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>получено: {heroesTaken}</div>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
            <div className="font-cinzel text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Урон врагов</div>
            <div className="font-cinzel text-3xl font-bold" style={{ color: '#f87171' }}>{enemiesDealt}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>убито: {enemiesKilled} / {enemies.length}</div>
          </div>
        </div>

        {/* Top damage dealt / taken */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="font-cinzel text-[10px] tracking-widest uppercase px-3 py-2" style={{ background: 'var(--bg-panel)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              Топ урона
            </div>
            {topDealt.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--bg-row)', borderBottom: '0.5px solid var(--border)' }}>
                <span className="font-cinzel text-xs" style={{ color: 'var(--text-muted)', minWidth: 16 }}>{i + 1}.</span>
                <span className="font-cinzel text-sm flex-1 truncate" style={{ color: 'var(--text)' }}>{c.name}</span>
                <span className="font-cinzel text-sm font-bold" style={{ color: '#60a5fa' }}>{c.damageDealt ?? 0}</span>
                {(c.kills ?? 0) > 0 && <span className="font-cinzel text-[10px]" style={{ color: 'var(--gold)' }}>⚔ {c.kills}</span>}
              </div>
            ))}
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="font-cinzel text-[10px] tracking-widest uppercase px-3 py-2" style={{ background: 'var(--bg-panel)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              Больше всего получил
            </div>
            {topTaken.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--bg-row)', borderBottom: '0.5px solid var(--border)' }}>
                <span className="font-cinzel text-xs" style={{ color: 'var(--text-muted)', minWidth: 16 }}>{i + 1}.</span>
                <span className="font-cinzel text-sm flex-1 truncate" style={{ color: 'var(--text)' }}>{c.name}</span>
                <span className="font-cinzel text-sm font-bold" style={{ color: '#f87171' }}>{c.damageTaken ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Full table */}
        <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-panel)' }}>
                {['Участник', 'Тип', 'HP', 'Нанёс', 'Получил', 'Убийств', 'Статус'].map(h => (
                  <th key={h} className="font-cinzel text-[10px] tracking-widest uppercase text-left px-3 py-2"
                      style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {combatants.map(c => {
                const st = getStatus(c)
                return (
                  <tr key={c.id} style={{ background: 'var(--bg-row)', borderBottom: '0.5px solid var(--border)' }}>
                    <td className="px-3 py-2 font-cinzel text-sm" style={{ color: 'var(--text)' }}>{c.name}</td>
                    <td className="px-3 py-2"><span className={`type-badge type-${c.type}`}>{typeLabel[c.type] ?? c.type}</span></td>
                    <td className="px-3 py-2 font-cinzel text-sm" style={{ color: 'var(--text-dim)' }}>{c.hp.current} / {c.hp.max}</td>
                    <td className="px-3 py-2 font-cinzel text-sm font-bold" style={{ color: '#60a5fa' }}>{c.damageDealt ?? 0}</td>
                    <td className="px-3 py-2 font-cinzel text-sm font-bold" style={{ color: '#f87171' }}>{c.damageTaken ?? 0}</td>
                    <td className="px-3 py-2 font-cinzel text-sm" style={{ color: 'var(--gold)' }}>{c.kills ?? 0}</td>
                    <td className="px-3 py-2"><span className={`status-pill ${STATUS_PILL[st]}`}>{STATUS_LABEL[st]}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 justify-center">
          <button className="btn btn-ghost" onClick={() => setView('tracker')}>← Вернуться</button>
          <button className="btn btn-end" onClick={handleClear}>🗑 Очистить трекер</button>
        </div>
      </div>
    </div>
  )
}
