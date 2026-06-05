// src/components/party/InjuriesPage.jsx

const INJURIES = [
  {
    type: 'Лёгкая травма',
    severity: 1,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.3)',
    acquisition: [
      'Критический удар → спасбросок Телосложения СЛ 13 провален',
      'Единовременное получение 10 и более урона из одного источника',
    ],
    treatment: [
      '1к4 долгих отдыхов',
      'Любое магическое лечение',
    ],
  },
  {
    type: 'Средняя травма',
    severity: 2,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.08)',
    border: 'rgba(251,146,60,0.3)',
    acquisition: [
      'Критический удар при ≤50% хитов',
      '≤15% хитов при получении более 1 атаки подряд',
      'Вход в спасброски смерти',
    ],
    treatment: [
      '1к12 долгих отдыхов',
      'Магическое лечение 3 круга и выше',
    ],
  },
  {
    type: 'Тяжёлая травма',
    severity: 3,
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.3)',
    acquisition: [
      'Получение урона в спасбросках смерти',
      'Критический удар при <15% хитов',
      '≤15% хитов при получении более 2 атак подряд',
    ],
    treatment: [
      'Простоем не лечится',
      'Только магическое лечение 5 круга и выше',
    ],
  },
]

export default function InjuriesPage() {
  return (
    <div className="flex-1 overflow-auto px-6 py-5">
      <div className="mb-8">
        <h2 className="font-cinzel text-lg font-bold mb-1" style={{ color: 'var(--gold)' }}>Травмы</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          Хоумбрю правила. Травмы накладываются на персонажей при определённых условиях и требуют лечения.
        </p>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {INJURIES.map(inj => (
            <div key={inj.type} className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-panel)', border: `1px solid ${inj.border}` }}>

              {/* Заголовок */}
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ background: inj.bg, borderBottom: `1px solid ${inj.border}` }}>
                <div className="flex gap-0.5">
                  {Array.from({ length: inj.severity }).map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: inj.color }} />
                  ))}
                  {Array.from({ length: 3 - inj.severity }).map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full"
                      style={{ background: 'var(--bg-row)', border: `1px solid ${inj.border}` }} />
                  ))}
                </div>
                <span className="font-cinzel text-sm font-bold" style={{ color: inj.color }}>{inj.type}</span>
              </div>

              <div className="px-4 py-3 flex flex-col gap-3">
                <div>
                  <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--text-muted)' }}>Как получить</div>
                  <ul className="space-y-1">
                    {inj.acquisition.map((a, i) => (
                      <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-dim)' }}>
                        <span style={{ color: inj.color, flexShrink: 0 }}>·</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--text-muted)' }}>Как вылечить</div>
                  <ul className="space-y-1">
                    {inj.treatment.map((t, i) => (
                      <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-dim)' }}>
                        <span style={{ color: '#4ade80', flexShrink: 0 }}>·</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
