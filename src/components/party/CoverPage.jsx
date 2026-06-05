// src/components/party/CoverPage.jsx

const COVER = [
  {
    type: 'Половинное укрытие',
    bonus: '+2 к КД и спасброскам Ловкости',
    examples: 'Низкая стена, большая мебель, дерево, другое существо',
    color: '#fbbf24',
  },
  {
    type: '¾ укрытие',
    bonus: '+5 к КД и спасброскам Ловкости',
    examples: 'Бойница, дверной проём, густые заросли',
    color: '#fb923c',
  },
  {
    type: 'Полное укрытие',
    bonus: 'Нельзя стать целью атаки или заклинания напрямую',
    examples: 'Существо полностью скрыто за препятствием',
    color: '#f87171',
  },
]

export default function CoverPage() {
  return (
    <div className="flex-1 overflow-auto px-6 py-5">
      <div className="mb-8">
        <h2 className="font-cinzel text-lg font-bold mb-1" style={{ color: 'var(--gold)' }}>Укрытие</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          Укрытие даёт бонус к КД и спасброскам Ловкости. Если источник атаки игнорирует укрытие — бонус не применяется.
        </p>
        <div className="flex flex-col gap-3">
          {COVER.map(c => (
            <div key={c.type} className="rounded-xl p-4 flex gap-4 items-start"
              style={{ background: 'var(--bg-panel)', border: `1px solid ${c.color}33` }}>
              <div className="shrink-0 flex-1">
                <div className="font-cinzel text-sm font-bold mb-1" style={{ color: c.color }}>{c.type}</div>
                <div className="font-cinzel text-base font-bold" style={{ color: 'var(--text)' }}>{c.bonus}</div>
              </div>
              <div className="text-xs text-right shrink-0" style={{ maxWidth: 220, color: 'var(--text-muted)' }}>
                <span className="font-cinzel text-[9px] uppercase tracking-widest block mb-1">Примеры</span>
                {c.examples}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
