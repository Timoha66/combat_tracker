import { IconSword, IconChevronLeft, IconChevronRight, IconPlus, IconFlag, IconList } from '@tabler/icons-react'
import { useBattleStore } from '../store/battleStore'

export default function Header({ onAdd }) {
  const round    = useBattleStore(s => s.round)
  const nextTurn = useBattleStore(s => s.nextTurn)
  const prevTurn = useBattleStore(s => s.prevTurn)
  const setView  = useBattleStore(s => s.setView)
  const view     = useBattleStore(s => s.view)
  const current  = useBattleStore(s => s.getCurrentCombatant())

  return (
    <header
      className="flex items-center gap-4 px-5 shrink-0 border-b"
      style={{ height: 64, background: 'var(--bg-panel)', borderColor: 'var(--border)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 font-cinzel text-sm font-semibold tracking-widest shrink-0"
           style={{ color: 'var(--gold)' }}>
        <IconSword size={18} />
        DM Tracker
      </div>

      <div className="w-px h-7 shrink-0" style={{ background: 'var(--border)' }} />

      {/* Turn navigation */}
      <div className="flex items-center rounded-xl overflow-hidden shrink-0"
           style={{ border: '1px solid var(--border-md)', background: 'var(--bg-row)' }}>
        <button
          onClick={prevTurn}
          className="flex items-center gap-1.5 font-cinzel text-xs font-semibold tracking-wide px-3 py-2 transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-dim)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent' }}
        >
          <IconChevronLeft size={15} /> Пред.
        </button>

        <div className="px-5 py-1 text-center"
             style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', minWidth: 180 }}>
          <span className="font-cinzel text-[10px] tracking-widest uppercase block" style={{ color: 'var(--text-muted)' }}>
            Раунд {round}
          </span>
          <span className="font-cinzel text-sm font-semibold block truncate" style={{ color: 'var(--gold)' }}>
            {current?.name ?? '—'}
          </span>
        </div>

        <button
          onClick={nextTurn}
          className="flex items-center gap-1.5 font-cinzel text-xs font-semibold tracking-wide px-3 py-2 transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-dim)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent' }}
        >
          След. <IconChevronRight size={15} />
        </button>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        {view !== 'tracker' && (
          <button className="btn btn-ghost" onClick={() => setView('tracker')}>
            <IconList size={15} /> Трекер
          </button>
        )}
        <button className="btn btn-add" onClick={onAdd}>
          <IconPlus size={15} /> Добавить
        </button>
        <button className="btn btn-end" onClick={() => setView('summary')}>
          <IconFlag size={15} /> Завершить бой
        </button>
      </div>
    </header>
  )
}
