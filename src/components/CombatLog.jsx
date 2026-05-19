import { useBattleStore } from '../store/battleStore'

export default function CombatLog() {
  const log = useBattleStore(s => s.combatLog)

  if (!log.length) return null

  return (
    <div
      className="shrink-0 border-t px-3 py-2"
      style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}
    >
      <div className="flex flex-col gap-0.5">
        {log.map((entry, i) => (
          <div
            key={entry.id}
            className="flex items-center gap-2 font-cinzel text-[11px]"
            style={{ opacity: 1 - i * 0.18, color: i === 0 ? 'var(--text-dim)' : 'var(--text-muted)' }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{entry.time}</span>
            <span>{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
