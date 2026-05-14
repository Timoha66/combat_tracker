import { useState } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { useBattleStore, getEffectiveAC } from '../store/battleStore'
import { CONDITIONS, STATUS_LABEL, STATUS_PILL, getStatus } from '../data/constants'

// ─── CONDITION PICKER ─────────────────────────────────────────────────────────
export function ConditionPicker({ id, onClose }) {
  const combatant       = useBattleStore(s => s.combatants.find(c => c.id === id))
  const toggleCondition = useBattleStore(s => s.toggleCondition)

  if (!combatant) return null

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
        <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>Нажми для добавления / снятия</p>

        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {CONDITIONS.map(cond => {
            const isActive = combatant.conditions.includes(cond.id)
            return (
              <div
                key={cond.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                style={{
                  background: isActive ? 'var(--gold-dim)' : 'var(--bg-row)',
                  border: `1px solid ${isActive ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
                  color: isActive ? 'var(--gold)' : 'var(--text-dim)',
                }}
                onClick={() => toggleCondition(id, cond.id)}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cond.css}`}
                      style={{ background: cond.css.includes('red') ? '#f87171' : cond.css.includes('amber') ? '#f59e0b' : cond.css.includes('blue') ? '#60a5fa' : cond.css.includes('purple') ? '#a78bfa' : '#9ca3af' }} />
                <span className="font-cinzel text-[11px] flex-1">{cond.label}</span>
                {isActive && <IconCheck size={12} />}
              </div>
            )
          })}
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
  // В будущем данные будут тянуться из бестиария по c.sourceId
  // Сейчас показываем только доступные данные участника боя

  const effectiveAC = getEffectiveAC(c)
  const status      = getStatus(c)

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
              {c.type === 'player' ? 'Персонаж игрока'
               : c.type === 'ally' ? 'Союзник'
               : c.type === 'npc'  ? 'НПС'
               : 'Враг'}
            </div>
          </div>
          <button className="icon-btn shrink-0" onClick={onClose}><IconX size={15} /></button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Base stats */}
          <div className="flex gap-5 flex-wrap mb-4">
            {[
              { label: 'Класс доспеха', val: effectiveAC },
              { label: 'Хиты',          val: `${c.hp.current} / ${c.hp.max}` },
              { label: 'Инициатива',    val: c.initiative },
            ].map(s => (
              <div key={s.label}>
                <span className="font-cinzel text-[10px] tracking-widest uppercase block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  {s.label}
                </span>
                <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>{s.val}</span>
              </div>
            ))}
          </div>

          <hr style={{ borderColor: 'rgba(226,201,126,0.2)', marginBottom: 16 }} />

          {/* Resistances */}
          {(c.resistances?.length > 0 || c.immunities?.length > 0 || c.vulnerabilities?.length > 0) && (
            <div className="flex flex-col gap-2 mb-4">
              {c.immunities?.length > 0 && (
                <div>
                  <span className="font-cinzel text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    Иммунитеты
                  </span>
                  <span className="ml-2 text-sm" style={{ color: '#93c5fd' }}>{c.immunities.join(', ')}</span>
                </div>
              )}
              {c.resistances?.length > 0 && (
                <div>
                  <span className="font-cinzel text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    Сопротивления
                  </span>
                  <span className="ml-2 text-sm" style={{ color: '#4ade80' }}>{c.resistances.join(', ')}</span>
                </div>
              )}
              {c.vulnerabilities?.length > 0 && (
                <div>
                  <span className="font-cinzel text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    Уязвимости
                  </span>
                  <span className="ml-2 text-sm" style={{ color: '#f87171' }}>{c.vulnerabilities.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Placeholder */}
          <div
            className="rounded-xl p-5 text-center"
            style={{ background: 'var(--bg-row)', border: '1px solid var(--border)' }}
          >
            <div className="text-3xl mb-2">📖</div>
            <div className="font-cinzel text-sm" style={{ color: 'var(--text-muted)' }}>
              Полный статблок
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              В финальной версии данные подтягиваются из бестиария
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BATTLE SUMMARY ───────────────────────────────────────────────────────────
export function BattleSummary() {
  const combatants = useBattleStore(s => s.combatants)
  const round      = useBattleStore(s => s.round)
  const setView    = useBattleStore(s => s.setView)
  const clearBattle = useBattleStore(s => s.clearBattle)

  function handleClear() {
    if (confirm('Очистить трекер? Все данные боя будут удалены.')) {
      clearBattle()
    }
  }

  const status = combatants.map(c => ({ c, st: getStatus(c) }))

  return (
    <div className="flex-1 overflow-y-auto py-8 px-4">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="text-center mb-7">
          <div className="font-cinzel text-2xl font-bold mb-1" style={{ color: 'var(--gold)' }}>
            🏆 Бой завершён
          </div>
          <div className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Раунд {round} · {combatants.length} участников
          </div>
        </div>

        {/* Summary table */}
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ border: '1px solid var(--border)' }}
        >
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-panel)' }}>
                {['Участник', 'Тип', 'HP', 'Статус'].map(h => (
                  <th
                    key={h}
                    className="font-cinzel text-[10px] tracking-widest uppercase text-left px-3 py-2"
                    style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {status.map(({ c, st }) => (
                <tr key={c.id} style={{ background: 'var(--bg-row)', borderBottom: '0.5px solid var(--border)' }}>
                  <td className="px-3 py-2 font-cinzel text-sm" style={{ color: 'var(--text)' }}>{c.name}</td>
                  <td className="px-3 py-2">
                    <span className={`type-badge type-${c.type}`}>
                      {c.type === 'player' ? 'Игрок' : c.type === 'enemy' ? 'Враг' : c.type === 'ally' ? 'Союзник' : 'НПС'}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-cinzel text-sm" style={{ color: 'var(--text-dim)' }}>
                    {c.hp.current} / {c.hp.max}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`status-pill ${STATUS_PILL[st]}`}>{STATUS_LABEL[st]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 justify-center">
          <button className="btn btn-ghost" onClick={() => setView('tracker')}>
            ← Вернуться
          </button>
          <button className="btn btn-end" onClick={handleClear}>
            🗑 Очистить трекер
          </button>
        </div>
      </div>
    </div>
  )
}
