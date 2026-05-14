import { useState } from 'react'
import { IconBolt, IconHeart, IconShieldHalf, IconX } from '@tabler/icons-react'
import { useBattleStore } from '../store/battleStore'
import { DMG_TYPES, DMG_TYPE_GROUPS, getTypeMult } from '../data/constants'

export default function RightPanel() {
  const combatants     = useBattleStore(s => s.combatants)
  const selectedTargets = useBattleStore(s => s.selectedTargets)
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
      style={{ width: 215, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)' }}
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
        <span className="text-[11px] leading-snug block mt-0.5" style={{ color: 'var(--text-muted)' }}>
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
        <span className="text-[10px] italic" style={{ color: 'var(--text-muted)', fontFamily: 'Crimson Text, serif' }}>
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
                <span className="flex-1 font-cinzel text-[11px] truncate" style={{ color: 'var(--text-dim)' }}>
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
      <button
        className="w-full font-cinzel text-[10px] tracking-wide py-1.5 rounded-md transition-colors cursor-pointer"
        style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        onClick={clearTargets}
      >
        <IconX size={12} className="inline mr-1" /> Снять выделение
      </button>
    </div>
  )
}

// ─── CSS для preview badges (глобальный через style tag не нужен — в index.css) ─
// Добавим стили прямо тут через JSX style объект, нет нужды в глобальных классах.
// pb-* классы уже определены в index.css
