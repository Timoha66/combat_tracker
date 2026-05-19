import { useState } from 'react'
import {
  IconShieldChevron, IconBook2, IconCheck, IconX, IconHeartPlus, IconPlus,
} from '@tabler/icons-react'
import { useBattleStore, getEffectiveAC } from '../store/battleStore'
import { calcStoredInit, displayInit } from './AddModal'
import {
  getStatus, STATUS, STATUS_LABEL, STATUS_PILL,
  getHpBarColor, getHpTextColor, CONDITION_MAP,
} from '../data/constants'

// ─── LIST ─────────────────────────────────────────────────────────────────────
export default function CombatantList({ onOpenStatblock, onOpenCondPicker, onOpenAcEdit, onRevive }) {
  const combatants      = useBattleStore(s => s.combatants)
  const getCurrentCombatant = useBattleStore(s => s.getCurrentCombatant)
  const selectedTargets = useBattleStore(s => s.selectedTargets)
  const current         = getCurrentCombatant()

  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative)

  return (
    <div className="flex-1 overflow-y-auto py-4 pl-4 pr-2">
      <div className="section-label">Порядок инициативы</div>
      {sorted.map(c => (
        <CombatantRow
          key={c.id}
          combatant={c}
          isActive={current?.id === c.id}
          isSelected={selectedTargets.includes(c.id)}
          onOpenStatblock={onOpenStatblock}
          onOpenCondPicker={onOpenCondPicker}
          onOpenAcEdit={onOpenAcEdit}
          onRevive={onRevive}
        />
      ))}
      {combatants.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <div className="font-cinzel text-sm tracking-wide">Нет участников</div>
          <div className="text-sm mt-1">Нажми «Добавить» чтобы начать бой</div>
        </div>
      )}
    </div>
  )
}

// ─── ROW ──────────────────────────────────────────────────────────────────────
function CombatantRow({ combatant: c, isActive, isSelected, onOpenStatblock, onOpenCondPicker, onOpenAcEdit, onRevive }) {
  const toggleTarget    = useBattleStore(s => s.toggleTarget)
  const toggleShield    = useBattleStore(s => s.toggleShield)
  const removeCondition = useBattleStore(s => s.removeCondition)
  const addDeathSave    = useBattleStore(s => s.addDeathSave)
  const setInitiative   = useBattleStore(s => s.setInitiative)
  const combatants      = useBattleStore(s => s.combatants)

  const [editingInit, setEditingInit] = useState(false)
  const [initDraft,   setInitDraft]   = useState(String(displayInit(c.initiative)))
  const [showPriority, setShowPriority] = useState(false)
  const [priorityDraft, setPriorityDraft] = useState('1')

  function handleInitClick(e) {
    e.stopPropagation()
    setInitDraft(String(displayInit(c.initiative)))
    setShowPriority(false)
    setEditingInit(true)
  }

  function handleInitConfirm() {
    const val = parseInt(initDraft)
    if (isNaN(val)) { setEditingInit(false); return }
    // Проверяем ничью с другими участниками
    const others = combatants.filter(x => x.id !== c.id)
    const hasTie = others.some(x => displayInit(x.initiative) === val)
    if (hasTie && !showPriority) {
      setShowPriority(true)
      setPriorityDraft('1')
      return
    }
    const prio = showPriority ? (parseInt(priorityDraft) || 1) : 1
    setInitiative(c.id, calcStoredInit(val, prio))
    setEditingInit(false)
    setShowPriority(false)
  }

  function handleInitKey(e) {
    if (e.key === 'Enter') handleInitConfirm()
    if (e.key === 'Escape') { setEditingInit(false); setShowPriority(false) }
  }

  const status    = getStatus(c)
  const effectiveAC = getEffectiveAC(c)
  const shieldFx  = c.tempEffects.some(fx => fx.name === 'Щит')
  const acModified = c.ac.current !== c.ac.base
  const canCheck  = status !== STATUS.DEAD
  const isDead    = status === STATUS.DEAD
  const isDying   = status === STATUS.DYING

  const hpPct   = c.hp.max > 0 ? Math.max(0, Math.min(100, (c.hp.current / c.hp.max) * 100)) : 0
  const tempPct = c.hp.max > 0 ? Math.min(30, (c.hp.temp / c.hp.max) * 100) : 0

  function handleRowClick(e) {
    if (!canCheck) return
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.cond-add')) return
    toggleTarget(c.id)
  }

  const typeLabels = { player: 'Игрок', enemy: 'Враг', ally: 'Союзник', npc: 'НПС' }

  return (
    <div
      className={`c-row ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isDying ? 'dying' : ''} ${isDead ? 'dead' : ''}`}
      onClick={handleRowClick}
      style={{ cursor: canCheck ? 'pointer' : 'default' }}
    >
      {/* Checkbox */}
      <div className="flex items-center justify-center">
        {canCheck && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleTarget(c.id)}
            onClick={e => e.stopPropagation()}
            className="w-4 h-4 cursor-pointer"
            style={{ accentColor: 'var(--gold)' }}
          />
        )}
      </div>

      {/* Initiative */}
      <div
        className="flex flex-col items-center pt-1 cursor-pointer"
        title="Изменить инициативу"
        onClick={handleInitClick}
      >
        {editingInit ? (
          <div className="flex flex-col items-center gap-1" onClick={e => e.stopPropagation()}>
            <input
              type="number"
              value={initDraft}
              onChange={e => setInitDraft(e.target.value)}
              onBlur={handleInitConfirm}
              onKeyDown={handleInitKey}
              autoFocus
              className="w-10 font-cinzel text-lg font-bold text-center rounded outline-none"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--gold)', color: 'var(--gold)' }}
            />
            {showPriority && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-cinzel text-[8px]" style={{ color: '#a78bfa' }}>приор.</span>
                <input
                  type="number" min="1" max="20"
                  value={priorityDraft}
                  onChange={e => setPriorityDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleInitConfirm(); if (e.key === 'Escape') { setEditingInit(false); setShowPriority(false) } }}
                  autoFocus
                  className="w-10 font-cinzel text-sm text-center rounded outline-none"
                  style={{ background: 'var(--bg-panel)', border: '1px solid rgba(167,139,250,0.6)', color: '#c4b5fd' }}
                  title="1 = ходит первым"
                />
                <button
                  className="font-cinzel text-[9px] px-2 py-0.5 rounded cursor-pointer"
                  style={{ background: 'rgba(167,139,250,0.2)', color: '#c4b5fd', border: '0.5px solid rgba(167,139,250,0.4)' }}
                  onClick={handleInitConfirm}
                >ок</button>
              </div>
            )}
          </div>
        ) : (
          <span
            className="font-cinzel text-xl font-bold leading-none"
            style={{ color: isActive ? 'var(--gold)' : 'var(--text-dim)' }}
          >
            {displayInit(c.initiative)}
          </span>
        )}
        {!editingInit && (
          <span className="font-cinzel text-[9px] tracking-wide uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Иниц.
          </span>
        )}
      </div>

      {/* Name + conditions */}
      <div className="flex flex-col gap-1 min-w-0 py-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-cinzel text-sm font-semibold truncate ${isDead ? 'line-through' : ''}`}
            style={{
              color: isActive ? 'var(--gold)' : isDead ? 'var(--text-muted)' : isDying ? '#f87171' : 'var(--text)'
            }}
          >
            {c.name}
          </span>
          <span className={`type-badge type-${c.type}`}>{typeLabels[c.type] ?? c.type}</span>
          {isActive && (
            <span className="font-cinzel text-[9px] tracking-wide turn-marker" style={{ color: 'var(--gold)' }}>
              ◀ ХОД
            </span>
          )}
        </div>

        {/* Death saves / conditions */}
        {isDying && c.deathSaves ? (
          <div className="flex items-center gap-1.5">
            <span className="font-cinzel text-[10px]" style={{ color: 'var(--text-muted)' }}>Успехи</span>
            {[0,1,2].map(i => <span key={i} className={`ds-pip ${i < c.deathSaves.successes ? 'ds-success' : ''}`} />)}
            <span className="font-cinzel text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>Провалы</span>
            {[0,1,2].map(i => <span key={i} className={`ds-pip ${i < c.deathSaves.failures ? 'ds-fail' : ''}`} />)}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {c.conditions.map(condId => {
              const cond = CONDITION_MAP[condId]
              if (!cond) return null
              return (
                <span
                  key={condId}
                  className={`cond ${cond.css}`}
                  onClick={e => { e.stopPropagation(); removeCondition(c.id, condId) }}
                  title="Снять состояние"
                >
                  {cond.label}
                  <IconX size={9} style={{ opacity: 0.7 }} />
                </span>
              )
            })}
            {!isDead && (
              <span
                className="cond-add"
                onClick={e => { e.stopPropagation(); onOpenCondPicker(c.id) }}
                title="Добавить состояние"
              >
                <IconPlus size={11} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* AC */}
      <div
        className="flex flex-col items-center gap-0.5 pt-1 cursor-pointer"
        onClick={e => { e.stopPropagation(); onOpenAcEdit(c.id) }}
        title="Изменить КД"
      >
        <span
          className="text-[17px]"
          style={{ color: shieldFx ? 'var(--gold)' : acModified ? '#a78bfa' : 'var(--text-dim)' }}
        >
          🛡
        </span>
        <span
          className="font-cinzel text-lg font-bold leading-none"
          style={{ color: shieldFx ? 'var(--gold)' : acModified ? '#c4b5fd' : 'var(--text)' }}
        >
          {effectiveAC}
        </span>
        {shieldFx
          ? <span className="font-cinzel text-[9px] animate-pulse-slow" style={{ color: 'var(--gold)' }}>+5 щит</span>
          : acModified
            ? (
              <>
                <span className="font-cinzel text-[9px]" style={{ color: '#a78bfa' }}>изм.</span>
                <span className="font-cinzel text-[9px] line-through" style={{ color: 'var(--text-muted)' }}>{c.ac.base}</span>
              </>
            )
            : <span className="font-cinzel text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>КД</span>
        }
      </div>

      {/* HP */}
      <div className="flex flex-col gap-1 pt-1">
        <div className="flex items-baseline gap-1">
          <span className={`font-cinzel text-xl font-bold leading-none ${getHpTextColor(getStatus(c))}`}>
            {c.hp.current}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {c.hp.max}</span>
          {c.hp.temp > 0 && (
            <span className="font-cinzel text-xs" style={{ color: '#60a5fa' }}>+{c.hp.temp}</span>
          )}
        </div>
        <div className="hp-bar-outer" style={{ width: '100%' }}>
          {c.hp.temp > 0 && <div className="hp-bar-temp" style={{ width: `${tempPct}%` }} />}
          <div className="hp-bar-fill" style={{ width: `${hpPct}%`, background: getHpBarColor(getStatus(c)) }} />
        </div>
        <span className={`status-pill ${STATUS_PILL[status]}`}>{STATUS_LABEL[status]}</span>
      </div>

      {/* Action buttons */}
      {isDead ? (
        <button
          className="icon-btn"
          style={{ gridColumn: 'span 2', width: '100%', borderColor: 'rgba(96,165,250,0.3)', color: '#60a5fa' }}
          onClick={e => { e.stopPropagation(); onRevive(c.id) }}
          title="Оживить"
        >
          <IconHeartPlus size={14} />
        </button>
      ) : isDying ? (
        <>
          <button
            className="icon-btn"
            style={{ borderColor: 'rgba(226,201,126,0.3)', color: 'var(--gold)' }}
            onClick={e => { e.stopPropagation(); addDeathSave(c.id, 'success') }}
            title="Успех спасброска"
          >
            <IconCheck size={14} />
          </button>
          <button
            className="icon-btn"
            style={{ borderColor: 'rgba(248,113,113,0.3)', color: '#f87171' }}
            onClick={e => { e.stopPropagation(); addDeathSave(c.id, 'failure') }}
            title="Провал спасброска"
          >
            <IconX size={14} />
          </button>
        </>
      ) : (
        <>
          <button
            className={`icon-btn ${shieldFx ? 'active' : ''}`}
            onClick={e => { e.stopPropagation(); toggleShield(c.id) }}
            title="Реакция: Щит (+5 КД до начала следующего хода)"
          >
            <IconShieldChevron size={14} />
          </button>
          <button
            className="icon-btn"
            style={{ '--hover-color': '#93c5fd' }}
            onClick={e => { e.stopPropagation(); onOpenStatblock(c) }}
            title="Статблок"
          >
            <IconBook2 size={14} />
          </button>
        </>
      )}
    </div>
  )
}
