// src/components/party/EnvironmentPage.jsx

// ─── Данные ───────────────────────────────────────────────────────────────────

const COVER = [
  { name: 'Половинное укрытие',  color: '#fbbf24', rules: ['+2 к КД и спасброскам Ловкости', 'Примеры: низкая стена, большая мебель, дерево, другое существо'] },
  { name: '¾ укрытие',           color: '#fb923c', rules: ['+5 к КД и спасброскам Ловкости', 'Примеры: бойница, дверной проём, густые заросли'] },
  { name: 'Полное укрытие',      color: '#f87171', rules: ['Нельзя стать целью атаки или заклинания напрямую', 'Примеры: существо полностью скрыто за препятствием'] },
]

const HAZARDS = [
  {
    name: 'Падение',
    nameEn: 'Falling',
    color: '#60a5fa',
    rules: [
      '1к6 дробящего урона за каждые 10 футов падения (максимум 20к6)',
      'При падении на мягкую поверхность — урон по усмотрению мастера',
      'Если не без сознания — проверка Ловкости СЛ 15 или опрокинут при приземлении',
    ],
  },
  {
    name: 'Удушение',
    nameEn: 'Suffocating',
    color: '#a78bfa',
    rules: [
      'Можно задержать дыхание на время равное 1 + мод. Телосложения минут (минимум 30 сек)',
      'По истечении — до начала следующего хода опускается до 0 хитов (не умирает)',
      'Следующий ход после 0 хитов — начинает умирать',
    ],
  },
]

const VISION = [
  {
    name: 'Слабо заслонённая',
    nameEn: 'Lightly Obscured',
    color: '#fbbf24',
    rules: [
      'Тусклый свет, редкий туман, умеренный лиственный покров',
      'Помеха на проверки Внимания (Восприятие), основанные на зрении',
    ],
  },
  {
    name: 'Сильно заслонённая',
    nameEn: 'Heavily Obscured',
    color: '#f87171',
    rules: [
      'Темнота, густой туман, густой лиственный покров',
      'Существо фактически ослеплено — автоматически проваливает проверки, требующие зрения',
      'Броски атаки в таких условиях — с помехой',
    ],
  },
]

const LIGHT = [
  {
    name: 'Яркий свет',
    nameEn: 'Bright Light',
    color: '#fde68a',
    rules: ['Нормальные условия видимости. Большинство существ видят в нём хорошо'],
  },
  {
    name: 'Тусклый свет',
    nameEn: 'Dim Light',
    color: '#f59e0b',
    rules: [
      'Создаёт слабо заслонённую зону',
      'Тени на краю яркого света, свет свечи в ночи, пасмурная погода',
    ],
  },
  {
    name: 'Темнота',
    nameEn: 'Darkness',
    color: '#64748b',
    rules: [
      'Создаёт сильно заслонённую зону',
      'Ночь на улице, затемнённое подземелье, магическая тьма',
    ],
  },
]

const SPECIAL_SENSES = [
  {
    name: 'Тёмное зрение',
    nameEn: 'Darkvision',
    color: '#93c5fd',
    rules: [
      'В темноте видит как в тусклом свете (обычно в пределах 60 фут.)',
      'В тусклом свете видит как в ярком',
      'Не различает цвета в темноте — только оттенки серого',
    ],
  },
  {
    name: 'Слепое зрение',
    nameEn: 'Blindsight',
    color: '#c4b5fd',
    rules: [
      'Воспринимает окружение без зрения в пределах определённой дистанции',
      'Невидимые существа не могут спрятаться от этого чувства',
    ],
  },
  {
    name: 'Истинное зрение',
    nameEn: 'Truesight',
    color: '#e2e8f0',
    rules: [
      'Видит в нормальной и магической темноте, невидимых существ',
      'Автоматически видит сквозь иллюзии и проверяет трансформации',
      'Видит в Эфирный план (обычно в пределах 120 фут.)',
    ],
  },
  {
    name: 'Чувство вибрации',
    nameEn: 'Tremorsense',
    color: '#86efac',
    rules: [
      'Обнаруживает существ, касающихся той же поверхности или жидкости',
      'Не требует зрения; невидимые существа всё равно обнаруживаются',
    ],
  },
]

// ─── Вспомогательные компоненты (снаружи для производительности) ─────────────

function SectionTitle({ children }) {
  return (
    <h3 className="font-cinzel text-sm font-bold uppercase tracking-widest mb-3 pb-1"
      style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(226,201,126,0.2)' }}>
      {children}
    </h3>
  )
}

function RuleCard({ item }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-panel)', border: `1px solid ${item.color}33` }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
        <span className="font-cinzel text-sm font-bold" style={{ color: item.color }}>{item.name}</span>
        {item.nameEn && <span className="font-cinzel text-xs italic" style={{ color: 'var(--text-muted)' }}>{item.nameEn}</span>}
      </div>
      <ul className="space-y-1">
        {item.rules.map((r, i) => (
          <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-dim)' }}>
            <span style={{ color: item.color, flexShrink: 0 }}>·</span>{r}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Основной компонент ───────────────────────────────────────────────────────

export default function EnvironmentPage() {
  return (
    <div className="flex-1 overflow-auto px-6 py-5 flex flex-col gap-8">

      {/* Укрытие */}
      <section>
        <SectionTitle>Укрытие</SectionTitle>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {COVER.map(c => <RuleCard key={c.name} item={c} />)}
        </div>
      </section>

      {/* Опасности */}
      <section>
        <SectionTitle>Опасности среды</SectionTitle>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {HAZARDS.map(h => <RuleCard key={h.name} item={h} />)}
        </div>
      </section>

      {/* Заслонённость */}
      <section>
        <SectionTitle>Заслонённость</SectionTitle>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {VISION.map(v => <RuleCard key={v.name} item={v} />)}
        </div>
      </section>

      {/* Свет */}
      <section>
        <SectionTitle>Источники света</SectionTitle>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {LIGHT.map(l => <RuleCard key={l.name} item={l} />)}
        </div>
      </section>

      {/* Особое восприятие */}
      <section>
        <SectionTitle>Особое восприятие</SectionTitle>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {SPECIAL_SENSES.map(s => <RuleCard key={s.name} item={s} />)}
        </div>
      </section>

    </div>
  )
}
