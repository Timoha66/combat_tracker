import { IconSword, IconMap, IconUsers, IconBook, IconCloud, IconMap2, IconCompass, IconListCheck, IconShield } from '@tabler/icons-react'

const SECTIONS = [
  { id: 'tracker',   icon: <IconSword size={28} />,      title: 'Трекер инициативы',   desc: 'Управление боем, инициатива, урон, состояния', iconColor: 'var(--gold)' },
  { id: 'party',     icon: <IconShield size={28} />,     title: 'Ширма',               desc: 'Партия, быстрые правила, таблицы, торговля',  iconColor: '#f472b6' },
  { id: 'locations', icon: <IconCompass size={28} />,    title: 'Справочник локаций',  desc: 'Описания мест, НПС, квесты, точки интереса',  iconColor: '#60a5fa' },
  { id: 'npcs',      icon: <IconUsers size={28} />,      title: 'НПС и фракции',       desc: 'Карточки персонажей, фракции, отношения',     iconColor: '#a78bfa' },
  { id: 'quests',    icon: <IconListCheck size={28} />,  title: 'Справочник квестов',  desc: 'Все квесты кампании, статусы, связи',         iconColor: '#fbbf24' },
  { id: 'journal',   icon: <IconBook size={28} />,       title: 'Журнал кампании',     desc: 'Записи по сессиям, заметки, события',         iconColor: '#4ade80' },
  { id: 'weather',   icon: <IconCloud size={28} />,      title: 'Погода и навигация',  desc: 'Погодный фронт, навигация, история дней',     iconColor: '#7dd3fc' },
  { id: 'map',       icon: <IconMap2 size={28} />,       title: 'Карта Чульта',        desc: 'Интерактивная карта, жетон партии, пины',     iconColor: '#86efac' },
]

export default function HomePage({ onNavigate }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto py-12 px-6" style={{ background: 'var(--bg-deep)' }}>
      <div className="text-center mb-10">
        <div className="font-cinzel text-4xl font-bold tracking-widest mb-2" style={{ color: 'var(--gold)' }}>⚔ DM Toolkit</div>
        <div className="font-cinzel text-sm tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Инструментарий Мастера подземелий</div>
      </div>
      <div className="grid gap-3 w-full" style={{ maxWidth: 900, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => onNavigate(s.id)}
            className="flex flex-col items-start gap-3 p-5 rounded-2xl text-left transition-all cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>
            <div style={{ color: s.iconColor }}>{s.icon}</div>
            <div>
              <div className="font-cinzel text-base font-bold mb-1" style={{ color: 'var(--text)' }}>{s.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{s.desc}</div>
            </div>
            <div className="font-cinzel text-[10px] tracking-widest uppercase mt-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>Открыть →</div>
          </button>
        ))}
      </div>
    </div>
  )
}
