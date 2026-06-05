// src/components/party/ConditionsPage.jsx

const CONDITIONS = [
  {
    id: 'blinded', name: 'Ослеплён', nameEn: 'Blinded', color: '#94a3b8',
    effects: [
      'Автоматически проваливает проверки характеристик, требующие зрения',
      'Броски атаки против — с преимуществом',
      'Собственные броски атаки — с помехой',
    ],
  },
  {
    id: 'charmed', name: 'Очарован', nameEn: 'Charmed', color: '#f9a8d4',
    effects: [
      'Не может атаковать очаровавшее его существо или делать его целью вредоносных заклинаний',
      'Очаровавшее существо совершает проверки Харизмы в общении с очарованным с преимуществом',
    ],
  },
  {
    id: 'deafened', name: 'Оглохший', nameEn: 'Deafened', color: '#94a3b8',
    effects: [
      'Не может слышать',
      'Автоматически проваливает проверки характеристик, требующие слуха',
    ],
  },
  {
    id: 'frightened', name: 'Испуган', nameEn: 'Frightened', color: '#fbbf24',
    effects: [
      'С помехой на проверки характеристик и броски атаки, пока источник страха в поле зрения',
      'Не может добровольно приближаться к источнику страха',
    ],
  },
  {
    id: 'grappled', name: 'Схвачен', nameEn: 'Grappled', color: '#fb923c',
    effects: [
      'Скорость становится 0, не может получить бонус к скорости',
      'Состояние снимается, если захватчик стал недееспособен или цель вышла из его досягаемости',
    ],
  },
  {
    id: 'incapacitated', name: 'Недееспособен', nameEn: 'Incapacitated', color: '#a78bfa',
    effects: [
      'Не может совершать действия и реакции',
    ],
  },
  {
    id: 'invisible', name: 'Невидим', nameEn: 'Invisible', color: '#e2e8f0',
    effects: [
      'Невозможно увидеть без магии или особых чувств; считается сильно скрытым',
      'Броски атаки — с преимуществом',
      'Броски атаки против — с помехой',
    ],
  },
  {
    id: 'paralyzed', name: 'Парализован', nameEn: 'Paralyzed', color: '#c4b5fd',
    effects: [
      'Недееспособен, не может двигаться и говорить',
      'Автоматически проваливает спасброски Силы и Ловкости',
      'Броски атаки против — с преимуществом',
      'Атака с 5 футов — автоматически критическое попадание',
    ],
  },
  {
    id: 'petrified', name: 'Окаменел', nameEn: 'Petrified', color: '#78716c',
    effects: [
      'Превращается в неодушевлённое твёрдое вещество; вес увеличивается в 10 раз',
      'Недееспособен, не может двигаться, говорить, осознавать происходящее',
      'Броски атаки против — с преимуществом',
      'Автоматически проваливает спасброски Силы и Ловкости',
      'Сопротивление ко всему урону; иммунитет к яду и болезням',
    ],
  },
  {
    id: 'poisoned', name: 'Отравлен', nameEn: 'Poisoned', color: '#4ade80',
    effects: [
      'С помехой на броски атаки и проверки характеристик',
    ],
  },
  {
    id: 'prone', name: 'Опрокинут', nameEn: 'Prone', color: '#f59e0b',
    effects: [
      'Может двигаться только ползком (движение стоит вдвое больше); встать — половина скорости',
      'Атаки в ближнем бою против — с преимуществом; дальние атаки против — с помехой',
      'Собственные броски атаки — с помехой',
    ],
  },
  {
    id: 'restrained', name: 'Обездвижен', nameEn: 'Restrained', color: '#f87171',
    effects: [
      'Скорость становится 0',
      'Броски атаки против — с преимуществом',
      'Собственные броски атаки — с помехой',
      'С помехой на спасброски Ловкости',
    ],
  },
  {
    id: 'stunned', name: 'Оглушён', nameEn: 'Stunned', color: '#7dd3fc',
    effects: [
      'Недееспособен, не может двигаться, говорит невнятно',
      'Автоматически проваливает спасброски Силы и Ловкости',
      'Броски атаки против — с преимуществом',
    ],
  },
  {
    id: 'unconscious', name: 'Без сознания', nameEn: 'Unconscious', color: '#64748b',
    effects: [
      'Недееспособен, не может двигаться, говорить или осознавать окружение; падает ниц',
      'Автоматически проваливает спасброски Силы и Ловкости',
      'Броски атаки против — с преимуществом',
      'Атака с 5 футов — автоматически критическое попадание',
    ],
  },
]

const EXHAUSTION_LEVELS = [
  { level: 1, effect: 'Помеха на проверки характеристик' },
  { level: 2, effect: 'Скорость уменьшается вдвое' },
  { level: 3, effect: 'Помеха на броски атаки и спасброски' },
  { level: 4, effect: 'Максимум хитов уменьшается вдвое' },
  { level: 5, effect: 'Скорость падает до 0' },
  { level: 6, effect: 'Смерть' },
]

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

const INJURIES = [
  {
    type: 'Лёгкая травма',
    severity: 1,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.3)',
    acquisition: [
      'Критический удар → спасбросок Телосложения СЛ 13 провален',
      'Единовременное получение 10 или более урона из одного источника',
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
      '15% хитов при получении более 1 атаки подряд',
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
      '15% хитов при получении более 2 атак подряд',
    ],
    treatment: [
      'Простоем не лечится',
      'Только магическое лечение 5 круга и выше',
    ],
  },
]

export default function ConditionsPage() {
  return (
    <div className="flex-1 overflow-auto px-6 py-5">

      {/* ── СОСТОЯНИЯ ── */}
      <div className="mb-8">
        <h2 className="font-cinzel text-lg font-bold mb-4" style={{ color: 'var(--gold)' }}>Состояния</h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {CONDITIONS.map(c => (
            <div key={c.id} className="rounded-xl p-4"
              style={{ background: 'var(--bg-panel)', border: `1px solid ${c.color}33` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="font-cinzel text-sm font-bold" style={{ color: c.color }}>{c.name}</span>
                <span className="font-cinzel text-xs italic" style={{ color: 'var(--text-muted)' }}>{c.nameEn}</span>
              </div>
              <ul className="space-y-1">
                {c.effects.map((e, i) => (
                  <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-dim)' }}>
                    <span style={{ color: c.color, flexShrink: 0 }}>·</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Истощение */}
        <div className="mt-4 rounded-xl p-4"
          style={{ background: 'var(--bg-panel)', border: '1px solid rgba(248,113,113,0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#f87171' }} />
            <span className="font-cinzel text-sm font-bold" style={{ color: '#f87171' }}>Истощение</span>
            <span className="font-cinzel text-xs italic" style={{ color: 'var(--text-muted)' }}>Exhaustion</span>
            <span className="font-cinzel text-[10px] px-1.5 py-0.5 rounded ml-1"
              style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>накапливается</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {EXHAUSTION_LEVELS.map(l => (
              <div key={l.level} className="flex items-start gap-2">
                <span className="font-cinzel text-xs font-bold shrink-0"
                  style={{ color: l.level <= 3 ? '#fbbf24' : l.level <= 5 ? '#fb923c' : '#f87171' }}>
                  {l.level}.
                </span>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{l.effect}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-2 font-cinzel" style={{ color: 'var(--text-muted)' }}>
            Каждый долгий отдых снижает уровень истощения на 1 (при условии еды и питья)
          </p>
        </div>
      </div>

      {/* ── УКРЫТИЕ ── */}
      <div className="mb-8">
        <h2 className="font-cinzel text-lg font-bold mb-4" style={{ color: 'var(--gold)' }}>Укрытие</h2>
        <div className="flex flex-col gap-3">
          {COVER.map(c => (
            <div key={c.type} className="rounded-xl p-4 flex gap-4 items-start"
              style={{ background: 'var(--bg-panel)', border: `1px solid ${c.color}33` }}>
              <div className="shrink-0">
                <div className="font-cinzel text-sm font-bold mb-1" style={{ color: c.color }}>{c.type}</div>
                <div className="font-cinzel text-base font-bold" style={{ color: 'var(--text)' }}>{c.bonus}</div>
              </div>
              <div className="ml-auto text-xs text-right" style={{ color: 'var(--text-muted)' }}>
                <span className="font-cinzel text-[9px] uppercase tracking-widest block mb-1">Примеры</span>
                {c.examples}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ТРАВМЫ ── */}
      <div className="mb-8">
        <h2 className="font-cinzel text-lg font-bold mb-4" style={{ color: 'var(--gold)' }}>Травмы</h2>
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
                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--bg-row)', border: `1px solid ${inj.border}` }} />
                  ))}
                </div>
                <span className="font-cinzel text-sm font-bold" style={{ color: inj.color }}>{inj.type}</span>
              </div>

              <div className="px-4 py-3 flex flex-col gap-3">
                {/* Получение */}
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

                {/* Лечение */}
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
