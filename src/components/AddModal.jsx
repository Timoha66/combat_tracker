import { useState, useEffect } from 'react'
import { IconX, IconDice5, IconPlus, IconMinus, IconBook2 } from '@tabler/icons-react'
import { useBattleStore } from '../store/battleStore'
import { useBestiaryStore } from '../store/bestiaryStore'

export default function AddModal({ onClose }) {
  const addCombatants  = useBattleStore(s => s.addCombatants)
  const { creatures, loadAll } = useBestiaryStore()

  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const [count,    setCount]    = useState(1)
  const [initVal,  setInitVal]  = useState('')

  useEffect(() => { loadAll() }, [])

  const filtered = creatures.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const typeLabels = { player: 'Игрок', enemy: 'Враг', npc: 'НПС', companion: 'Компаньон', pet: 'Питомец' }
  const typeColors = { player: 'type-player', enemy: 'type-enemy', npc: 'type-npc', companion: 'type-ally', pet: 'type-ally' }

  function rollInit() {
    if (!selected) return
    const isPlayer = selected.type === 'player'
    const dexMod   = Math.floor(((selected.abilities?.dex ?? 10) - 10) / 2)
    const bonus    = isPlayer ? (selected.initiative ?? dexMod) : (selected.initiative ?? dexMod)
    setInitVal(String(Math.floor(Math.random() * 20) + 1 + bonus))
  }

  function handleAdd() {
    if (!selected) return
    const isPlayer  = selected.type === 'player'
    const dexMod    = Math.floor(((selected.abilities?.dex ?? 10) - 10) / 2)
    const initBonus = selected.initiative ?? dexMod

    // Для игроков инициатива обязательна вручную
    if (isPlayer && !initVal) {
      alert('Введи инициативу для игрока вручную')
      return
    }

    // Для остальных — вручную или автобросок
    const initiative = parseInt(initVal) || Math.floor(Math.random() * 20) + 1 + initBonus

    addCombatants(
      {
        name:            selected.name,
        type:            selected.type,
        hp:              isPlayer ? selected.hp?.max : selected.hp?.average,
        ac:              isPlayer ? selected.ac : selected.ac?.value,
        resistances:     selected.resistances    ?? [],
        immunities:      selected.immunities     ?? [],
        vulnerabilities: selected.vulnerabilities ?? [],
        id:              selected.id,
      },
      count,
      initiative
    )
    onClose()
  }

  return (
    <div className="overlay">
      <div className="modal" style={{ width: 440 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <span className="font-cinzel text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Добавить участника
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
          Выберите существо из бестиария
        </p>

        {/* Search */}
        <input
          className="w-full rounded-lg px-3 py-2 mb-2 outline-none text-sm"
          style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
          placeholder="Поиск по имени..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(226,201,126,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
        />

        {/* List */}
        <div className="overflow-y-auto mb-3" style={{ maxHeight: 220, border: '1px solid var(--border)', borderRadius: 8 }}>
          {filtered.length === 0 && (
            <div className="text-center py-8 flex flex-col items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <IconBook2 size={28} style={{ opacity: 0.3 }} />
              <span className="font-cinzel text-xs">
                {creatures.length === 0 ? 'Бестиарий пуст — добавь существ через кнопку «Бестиарий»' : 'Ничего не найдено'}
              </span>
            </div>
          )}
          {filtered.map(c => {
            const isPlayer = c.type === 'player'
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
                style={{
                  background: selected?.id === c.id ? 'var(--gold-dim)' : 'transparent',
                  borderBottom: '0.5px solid var(--border)',
                  color: selected?.id === c.id ? 'var(--gold)' : 'var(--text)',
                }}
                onClick={() => setSelected(c)}
              >
                <span className="font-cinzel text-sm flex-1 truncate">{c.name}</span>
                <span className={`type-badge ${typeColors[c.type] ?? 'type-npc'} shrink-0`}>
                  {typeLabels[c.type] ?? c.type}
                </span>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {!isPlayer && c.cr !== undefined ? `CR ${c.cr} · ` : ''}
                  КД {isPlayer ? c.ac : c.ac?.value} · HP {isPlayer ? c.hp?.max : c.hp?.average}
                </span>
              </div>
            )
          })}
        </div>

        {/* Count */}
        <div className="flex items-center gap-3 mb-3">
          <span className="font-cinzel text-[11px] tracking-widest uppercase flex-1" style={{ color: 'var(--text-muted)' }}>
            Количество
          </span>
          <button className="icon-btn" onClick={() => setCount(c => Math.max(1, c - 1))}>
            <IconMinus size={14} />
          </button>
          <span className="font-cinzel text-lg font-semibold w-8 text-center" style={{ color: 'var(--text)' }}>
            {count}
          </span>
          <button className="icon-btn" onClick={() => setCount(c => Math.min(10, c + 1))}>
            <IconPlus size={14} />
          </button>
        </div>

        {/* Initiative */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-cinzel text-[11px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              Инициатива
            </div>
            {selected?.type === 'player' && (
              <span className="font-cinzel text-[10px]" style={{ color: '#f59e0b' }}>
                ✦ Вводится вручную
              </span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder={selected?.type === 'player' ? 'Введи инициативу игрока...' : 'Оставь пустым для автоброска'}
              value={initVal}
              onChange={e => setInitVal(e.target.value)}
              className="flex-1 rounded-lg px-3 py-2 outline-none text-sm"
              style={{
                background: 'var(--bg-row)',
                border: `1px solid ${selected?.type === 'player' && !initVal ? 'rgba(245,158,11,0.4)' : 'var(--border-md)'}`,
                color: 'var(--text)',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(226,201,126,0.5)'}
              onBlur={e => e.target.style.borderColor = selected?.type === 'player' && !initVal ? 'rgba(245,158,11,0.4)' : 'var(--border-md)'}
            />
            {selected?.type !== 'player' && (
              <button className="btn btn-ghost shrink-0" onClick={rollInit} disabled={!selected}>
                <IconDice5 size={15} /> Бросить
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2">
          <button className="btn btn-cancel flex-1 justify-center" onClick={onClose}>
            <IconX size={14} /> Отмена
          </button>
          <button
            className="btn btn-add flex-1 justify-center"
            onClick={handleAdd}
            disabled={!selected || (selected?.type === 'player' && !initVal)}
            style={{ opacity: (!selected || (selected?.type === 'player' && !initVal)) ? 0.4 : 1 }}
          >
            <IconPlus size={14} /> Добавить
          </button>
        </div>
      </div>
    </div>
  )
}
