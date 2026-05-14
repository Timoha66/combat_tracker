import { useState } from 'react'
import { IconX, IconDice5, IconPlus, IconMinus } from '@tabler/icons-react'
import { useBattleStore } from '../store/battleStore'

// ─── ВСТРОЕННЫЙ БЕСТИАРИЙ (шаблоны) ──────────────────────────────────────────
// В будущем это будет тянуться из IndexedDB / Dexie
const TEMPLATE_BESTIARY = []

export default function AddModal({ onClose }) {
  const addCombatants = useBattleStore(s => s.addCombatants)

  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const [count,    setCount]    = useState(1)
  const [initVal,  setInitVal]  = useState('')
  const [type,     setType]     = useState(null) // override type

  const filtered = TEMPLATE_BESTIARY.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  function rollInit() {
    const bonus = selected?.initBonus ?? 0
    setInitVal(String(Math.floor(Math.random() * 20) + 1 + bonus))
  }

  function handleAdd() {
    if (!selected) return
    const initiative = parseInt(initVal) || Math.floor(Math.random() * 20) + 1 + (selected.initBonus ?? 0)
    addCombatants(
      { ...selected, type: type ?? selected.type },
      count,
      initiative
    )
    onClose()
  }

  const TYPE_OPTIONS = [
    { id: null,      label: 'По шаблону' },
    { id: 'player',  label: 'Игрок' },
    { id: 'enemy',   label: 'Враг' },
    { id: 'ally',    label: 'Союзник' },
    { id: 'npc',     label: 'НПС' },
  ]

  return (
    <div className="overlay">
      <div className="modal" style={{ width: 420 }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-cinzel text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Добавить участника
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>Выберите существо из бестиария</p>

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

        {/* Beast list */}
        <div className="overflow-y-auto mb-3" style={{ maxHeight: 200 }}>
          {filtered.map(b => (
            <div
              key={b.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                background: selected?.id === b.id ? 'var(--gold-dim)' : 'transparent',
                borderBottom: '0.5px solid var(--border)',
              }}
              onClick={() => setSelected(b)}
            >
              <span className="font-cinzel text-sm flex-1" style={{ color: 'var(--text)' }}>{b.name}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {b.type === 'enemy' ? 'Враг' : b.type === 'ally' ? 'Союзник' : 'НПС'} · КД {b.ac} · HP {b.hp}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              Ничего не найдено
            </div>
          )}
        </div>

        {/* Count */}
        <div className="flex items-center gap-3 mb-3">
          <span className="modal-label" style={{ margin: 0, flex: 1 }}>Количество</span>
          <button
            className="icon-btn"
            onClick={() => setCount(c => Math.max(1, c - 1))}
          ><IconMinus size={14} /></button>
          <span className="font-cinzel text-lg font-semibold w-8 text-center" style={{ color: 'var(--text)' }}>
            {count}
          </span>
          <button
            className="icon-btn"
            onClick={() => setCount(c => Math.min(10, c + 1))}
          ><IconPlus size={14} /></button>
        </div>

        {/* Initiative */}
        <div className="mb-3">
          <span className="modal-label">Инициатива</span>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Ввести вручную"
              value={initVal}
              onChange={e => setInitVal(e.target.value)}
              className="flex-1 rounded-lg px-3 py-2 outline-none text-sm"
              style={{ background: 'var(--bg-row)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(226,201,126,0.5)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
            />
            <button className="btn btn-ghost shrink-0" onClick={rollInit}>
              <IconDice5 size={15} /> Бросить
            </button>
          </div>
        </div>

        {/* Type override */}
        <div className="mb-4">
          <span className="modal-label">Тип участника</span>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={String(opt.id)}
                onClick={() => setType(opt.id)}
                className="font-cinzel text-[11px] px-2.5 py-1 rounded-lg transition-all"
                style={{
                  background: type === opt.id ? 'var(--gold-dim)' : 'var(--bg-row)',
                  color: type === opt.id ? 'var(--gold)' : 'var(--text-dim)',
                  border: `1px solid ${type === opt.id ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
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
            disabled={!selected}
            style={{ opacity: selected ? 1 : 0.4 }}
          >
            <IconPlus size={14} /> Добавить
          </button>
        </div>
      </div>
    </div>
  )
}
