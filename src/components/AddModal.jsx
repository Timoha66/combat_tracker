import { useState, useEffect } from 'react'
import { IconX, IconDice5, IconPlus, IconCheck } from '@tabler/icons-react'
import { useBattleStore } from '../store/battleStore'
import { useBestiaryStore } from '../store/bestiaryStore'

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function rollFor(c) {
  const dexMod = Math.floor(((c.abilities?.dex ?? 10) - 10) / 2)
  const bonus  = c.initiative ?? dexMod
  return Math.floor(Math.random() * 20) + 1 + bonus
}

// Хранится как 17 - (priority-1)*0.0001, отображается как Math.round
export function calcStoredInit(base, priority = 1) {
  return base - (priority - 1) * 0.0001
}

export function displayInit(stored) {
  return Math.round(stored)
}

export default function AddModal({ onClose }) {
  const addCombatants = useBattleStore(s => s.addCombatants)
  const combatants    = useBattleStore(s => s.combatants)
  const { creatures, loadAll } = useBestiaryStore()

  const [search,   setSearch]   = useState('')
  // selected: { [id]: { creature, initiative: string, priority: string } }
  const [selected, setSelected] = useState({})

  useEffect(() => { loadAll() }, [])

  const filtered = creatures.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const typeLabels = { player: 'Игрок', enemy: 'Враг', npc: 'НПС', companion: 'Компаньон', pet: 'Питомец' }
  const typeColors = { player: 'type-player', enemy: 'type-enemy', npc: 'type-npc', companion: 'type-ally', pet: 'type-ally' }

  // Считаем сколько участников уже имеют данное базовое значение инициативы
  function countTies(baseVal, excludeId) {
    const inTracker  = combatants.filter(cb => Math.round(cb.initiative) === baseVal).length
    const inSelected = Object.values(selected).filter(e =>
      e.creature.id !== excludeId && Math.round(parseFloat(e.initiative) || 0) === baseVal
    ).length
    return inTracker + inSelected
  }

  function toggleSelect(c) {
    setSelected(prev => {
      if (prev[c.id]) {
        const next = { ...prev }
        delete next[c.id]
        return next
      }
      const initVal = c.type !== 'player' ? String(rollFor(c)) : ''
      return { ...prev, [c.id]: { creature: c, initiative: initVal, priority: '1' } }
    })
  }

  function setField(id, field, val) {
    setSelected(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }))
  }

  function rerollAll() {
    setSelected(prev => {
      const next = { ...prev }
      Object.entries(next).forEach(([id, entry]) => {
        if (entry.creature.type !== 'player') {
          next[id] = { ...entry, initiative: String(rollFor(entry.creature)) }
        }
      })
      return next
    })
  }

  const selectedList = Object.values(selected)
  const hasSelected  = selectedList.length > 0
  const playersWithoutInit = selectedList.filter(
    e => e.creature.type === 'player' && !e.initiative.trim()
  )
  const canAdd = hasSelected && playersWithoutInit.length === 0

  function handleAdd() {
    if (!canAdd) return
    selectedList.forEach(({ creature, initiative, priority }) => {
      const base = parseInt(initiative) || rollFor(creature)
      const prio = parseInt(priority) || 1
      const finalInit = calcStoredInit(base, prio)
      addCombatants(
        {
          name:            creature.name,
          type:            creature.type,
          hp:              creature.type === 'player' ? creature.hp?.max : creature.hp?.average,
          ac:              creature.type === 'player' ? creature.ac : creature.ac?.value,
          resistances:     creature.resistances    ?? [],
          immunities:      creature.immunities     ?? [],
          vulnerabilities: creature.vulnerabilities ?? [],
          id:              creature.id,
        },
        1,
        finalInit
      )
    })
    onClose()
  }

  const inputStyle = { background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }

  return (
    <div className="overlay">
      <div className="modal" style={{ width: 620, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center gap-3 mb-1 shrink-0">
          <span className="font-cinzel text-lg font-semibold" style={{ color: 'var(--text)' }}>Добавить участников</span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>
        <p className="text-sm mb-3 shrink-0" style={{ color: 'var(--text-dim)' }}>Выберите одного или нескольких существ</p>

        <input
          className="w-full rounded-lg px-3 py-2 mb-2 outline-none text-sm shrink-0"
          style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
          placeholder="Поиск по имени..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(226,201,126,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
        />

        <div className="overflow-y-auto shrink-0" style={{ maxHeight: 320, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 12 }}>
          {filtered.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <span className="font-cinzel text-xs">{creatures.length === 0 ? 'Бестиарий пуст' : 'Ничего не найдено'}</span>
            </div>
          )}
          {filtered.map(c => {
            const isSel    = !!selected[c.id]
            const isPlayer = c.type === 'player'
            return (
              <div key={c.id}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
                style={{ background: isSel ? 'var(--gold-dim)' : 'transparent', borderBottom: '0.5px solid var(--border)' }}
                onClick={() => toggleSelect(c)}
              >
                <div className="flex items-center justify-center rounded shrink-0"
                  style={{ width: 18, height: 18, background: isSel ? 'var(--gold)' : 'var(--bg-row)', border: `1px solid ${isSel ? 'var(--gold)' : 'var(--border-md)'}` }}>
                  {isSel && <IconCheck size={12} style={{ color: '#0a0c12' }} />}
                </div>
                <span className="font-cinzel text-sm flex-1 truncate" style={{ color: isSel ? 'var(--gold)' : 'var(--text)' }}>{c.name}</span>
                <span className={`type-badge ${typeColors[c.type] ?? 'type-npc'} shrink-0`}>{typeLabels[c.type] ?? c.type}</span>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {!isPlayer && c.cr ? `CR ${c.cr} · ` : ''}КД {isPlayer ? c.ac : c.ac?.value} · HP {isPlayer ? c.hp?.max : c.hp?.average}
                </span>
              </div>
            )
          })}
        </div>

        {hasSelected && (
          <div className="shrink-0" style={{ marginBottom: 14 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-cinzel text-[11px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                Инициатива — {selectedList.length} выбрано
              </span>
              <button className="btn btn-ghost" style={{ fontSize: 10, padding: '3px 8px' }} onClick={rerollAll}>
                <IconDice5 size={12} /> Перебросить всех
              </button>
            </div>
            <div className="overflow-y-auto rounded-lg" style={{ maxHeight: 260, border: '1px solid var(--border)' }}>
              {selectedList.map(({ creature: c, initiative, priority }) => {
                const isPlayer   = c.type === 'player'
                const baseVal    = parseInt(initiative) || 0
                const hasTie     = initiative.trim() !== '' && countTies(baseVal, c.id) > 0
                const needsInit  = isPlayer && !initiative.trim()
                return (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2"
                    style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--bg-row)' }}>
                    <span className="font-cinzel text-sm flex-1 truncate" style={{ color: 'var(--text)' }}>{c.name}</span>
                    {isPlayer && <span className="font-cinzel text-[9px] shrink-0" style={{ color: '#f59e0b' }}>✦ вручную</span>}

                    {/* Инициатива */}
                    <input type="number" placeholder={isPlayer ? 'Иниц.' : ''}
                      value={initiative}
                      onChange={e => setField(c.id, 'initiative', e.target.value)}
                      className="rounded px-2 py-1 outline-none font-cinzel text-sm text-center shrink-0"
                      style={{ width: 56, ...inputStyle, borderColor: needsInit ? 'rgba(245,158,11,0.5)' : 'var(--border-md)' }}
                    />
                    {!isPlayer && (
                      <button className="icon-btn shrink-0" style={{ width: 24, height: 24 }}
                        onClick={() => setField(c.id, 'initiative', String(rollFor(c)))} title="Перебросить">
                        <IconDice5 size={13} />
                      </button>
                    )}

                    {/* Приоритет — только при ничьей */}
                    {hasTie && (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-cinzel text-[9px]" style={{ color: '#a78bfa' }}>приор.</span>
                        <input type="number" min="1" max="20"
                          value={priority}
                          onChange={e => setField(c.id, 'priority', e.target.value)}
                          className="rounded px-2 py-1 outline-none font-cinzel text-sm text-center"
                          style={{ width: 44, background: 'var(--bg-deep)', border: '1px solid rgba(167,139,250,0.5)', color: '#c4b5fd' }}
                          title="Приоритет: 1 ходит раньше 2"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {playersWithoutInit.length > 0 && (
              <p className="text-xs mt-1.5 font-cinzel" style={{ color: '#f59e0b' }}>
                ✦ Введи инициативу для: {playersWithoutInit.map(e => e.creature.name).join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 shrink-0">
          <button className="btn btn-cancel flex-1 justify-center" onClick={onClose}>
            <IconX size={14} /> Отмена
          </button>
          <button className="btn btn-add flex-1 justify-center" onClick={handleAdd}
            disabled={!canAdd} style={{ opacity: canAdd ? 1 : 0.4 }}>
            <IconPlus size={14} />{hasSelected ? `Добавить ${selectedList.length}` : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}
