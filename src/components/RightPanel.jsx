import { useState } from 'react'
import { IconBolt, IconHeart, IconShieldHalf, IconX } from '@tabler/icons-react'
import { useBattleStore } from '../store/battleStore'
import { DMG_TYPES, DMG_TYPE_GROUPS, getTypeMult } from '../data/constants'

export default function RightPanel() {
  const combatants     = useBattleStore(s => s.combatants)
  const selectedTargets = useBattleStore(s => s.selectedTargets)
  const toggleTarget   = useBattleStore(s => s.toggleTarget)
  const clearTargets   = useBattleStore(s => s.clearTargets)
  const applyDamage    = useBattleStore(s => s.applyDamage)
  const applyHeal      = useBattleStore(s => s.applyHeal)
  const setTempHp      = useBattleStore(s => s.setTempHp)

  const [amount,     setAmount]     = useState(10)
  const [manualMult, setManualMult] = useState(1)
  const [dmgType,    setDmgType]    = useState(null)

  const targets = selectedTargets.map(id => combatants.find(c => c.id === id)).filter(Boolean)
  const hasTargets = targets.length > 0

  // Предпросмотр урона по каждой цели
  const preview = hasTargets && dmgType
    ? targets.map(c => {
        const typeMult = getTypeMult(c, dmgType) ?? 1
        const final = Math.floor(amount * typeMult * manualMult)
        let badge = 'Норм.', badgeClass = 'pb-normal'
        if (typeMult === 0)   { badge = 'Иммун.';  badgeClass = 'pb-immune' }
        if (typeMult === 0.5) { badge = 'Устойч.'; badgeClass = 'pb-resist' }
        if (typeMult === 2)   { badge = 'Уязвим.'; badgeClass = 'pb-vuln'   }
        return { c, typeMult, final, badge, badgeClass }
      })
    : null

  function handleDmgType(id) {
    setDmgType(prev => prev === id ? null : id)
  }

  function selectByType(mode) {
    const alive = combatants.filter(c => !c.dead && c.hp?.current > 0)
    let ids = []
    if (mode === 'all')     ids = alive.map(c => c.id)
    if (mode === 'enemies') ids = alive.filter(c => c.type === 'enemy').map(c => c.id)
    if (mode === 'players') ids = alive.filter(c => c.type === 'player').map(c => c.id)
    const toRemove = selectedTargets.filter(id => !ids.includes(id))
    const toAdd    = ids.filter(id => !selectedTargets.includes(id))
    toRemove.forEach(id => toggleTarget(id))
    toAdd.forEach(id => toggleTarget(id))
  }

  function handleDamage() {
    if (!hasTargets || !amount) return
    applyDamage(selectedTargets, amount, dmgType, manualMult)
    clearTargets()
  }

  function handleHeal() {
    if (!hasTargets || !amount) return
    applyHeal(selectedTargets, amount)
    clearTargets()
  }

  function handleTemp() {
    if (!hasTargets || !amount) return
    setTempHp(selectedTargets, amount)
    clearTargets()
  }

  const MULTS = [
    { val: 0.25, label: '¼' },
    { val: 0.5,  label: '½' },
    { val: 1,    label: '×1' },
    { val: 2,    label: '×2' },
  ]

  return (
    <div
      className="flex flex-col overflow-y-auto py-4 px-3.5 shrink-0"
      style={{ width: 270, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)' }}
    >
      {/* Цели */}
      <span className="rp-label">Цели</span>
      <div
        className="rounded-lg p-2.5 mb-4"
        style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}
      >
        <span className="font-cinzel text-2xl font-bold leading-none block" style={{ color: 'var(--gold)' }}>
          {targets.length}
        </span>
        <span className="text-sm leading-snug block mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {targets.length === 0
            ? 'Выберите участников'
            : targets.map(c => c.name).join(', ')
          }
        </span>
      </div>

      {/* Значение */}
      <span className="rp-label">Значение</span>
      <input
        type="number"
        value={amount}
        min={0}
        onChange={e => setAmount(Number(e.target.value) || 0)}
        className="w-full font-cinzel text-3xl font-bold text-center rounded-lg px-2 py-2.5 mb-3 outline-none"
        style={{
          background: 'var(--bg-row)',
          border: '1px solid var(--border-md)',
          color: 'var(--text)',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(226,201,126,0.5)'}
        onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
      />

      {/* Тип урона */}
      <div className="flex items-center justify-between mb-2">
        <span className="rp-label" style={{ margin: 0 }}>Тип урона</span>
        <span className="text-xs italic" style={{ color: 'var(--text-muted)', fontFamily: 'Crimson Text, serif' }}>
          необязательно
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {DMG_TYPE_GROUPS.map(group => (
          <div key={group.key} className="contents">
            {DMG_TYPES.filter(t => t.group === group.key).map(t => (
              <button
                key={t.id}
                className={`dt-btn ${t.css} ${dmgType === t.id ? 'active' : ''}`}
                onClick={() => handleDmgType(t.id)}
              >
                {t.label}
              </button>
            ))}
            <div style={{ width: '100%', height: 3 }} />
          </div>
        ))}
      </div>

      {/* Предпросмотр */}
      {preview && (
        <>
          <div className="rp-divider" />
          <span className="rp-label">Предпросмотр</span>
          <div className="mb-3">
            {preview.map(({ c, typeMult, final, badge, badgeClass }) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md mb-1"
                style={{ background: 'var(--bg-row)' }}
              >
                <span className="flex-1 font-cinzel text-sm truncate" style={{ color: 'var(--text-dim)' }}>
                  {c.name}
                </span>
                <span className={`preview-badge ${badgeClass}`}>{badge}</span>
                <span
                  className="font-cinzel text-sm font-bold min-w-[24px] text-right"
                  style={{
                    color: typeMult === 0 ? 'var(--text-muted)'
                         : typeMult === 2 ? '#f87171'
                         : typeMult === 0.5 ? '#4ade80'
                         : 'var(--text)'
                  }}
                >
                  {final}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Ручной множитель */}
      <div className="rp-divider" />
      <span className="rp-label">Ручной множитель</span>
      <div className="grid grid-cols-4 gap-1 mb-3">
        {MULTS.map(m => (
          <button
            key={m.val}
            className={`rp-mult ${manualMult === m.val ? 'active' : ''}`}
            onClick={() => setManualMult(m.val)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Кнопки действий */}
      <button className="rp-btn rp-dmg" disabled={!hasTargets} onClick={handleDamage}>
        <IconBolt size={15} /> Нанести урон
      </button>
      <button className="rp-btn rp-heal" disabled={!hasTargets} onClick={handleHeal}>
        <IconHeart size={15} /> Лечение
      </button>
      <button className="rp-btn rp-temp" disabled={!hasTargets} onClick={handleTemp}>
        <IconShieldHalf size={15} /> Врем. HP
      </button>

      <div className="rp-divider" />

      {/* Быстрое выделение */}
      <span className="rp-label">Быстрый выбор</span>
      <div className="flex flex-col gap-1.5 mb-2">
        <button
          className="w-full font-cinzel text-xs tracking-wide py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ background: 'var(--bg-row)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-md)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          onClick={() => selectByType('all')}
        >
          Выделить всех
        </button>
        <button
          className="w-full font-cinzel text-xs tracking-wide py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.16)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
          onClick={() => selectByType('enemies')}
        >
          Выделить всех врагов
        </button>
        <button
          className="w-full font-cinzel text-xs tracking-wide py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.16)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(96,165,250,0.08)'}
          onClick={() => selectByType('players')}
        >
          Выделить всех героев
        </button>
        <button
          className="w-full font-cinzel text-xs tracking-wide py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-md)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          onClick={clearTargets}
        >
          <IconX size={12} className="inline mr-1" /> Снять выделение
        </button>
      </div>
    </div>
  )
}
