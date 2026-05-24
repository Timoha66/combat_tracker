import { IconSword, IconMap, IconUsers, IconBook, IconCloud } from '@tabler/icons-react'

const SECTIONS = [
  { id: 'tracker',   icon: <IconSword size={28} />, title: 'Трекер инициативы',   desc: 'Управление боем, инициатива, урон, состояния', color: 'rgba(226,201,126,0.12)', border: 'rgba(226,201,126,0.3)', iconColor: 'var(--gold)' },
  { id: 'locations', icon: <IconMap size={28} />,   title: 'Справочник локаций',  desc: 'Описания мест, НПС, квесты, точки интереса',  color: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.3)',   iconColor: '#60a5fa' },
  { id: 'npcs',      icon: <IconUsers size={28} />, title: 'НПС и фракции',       desc: 'Карточки персонажей, фракции, отношения',     color: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.3)', iconColor: '#a78bfa' },
  { id: 'journal',   icon: <IconBook size={28} />,  title: 'Журнал кампании',     desc: 'Записи по сессиям, заметки, события',         color: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)', iconColor: '#4ade80' },
  { id: 'weather',   icon: <IconCloud size={28} />, title: 'Погода и навигация',  desc: 'Погодный фронт, навигация, история дней',     color: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)',  iconColor: '#7dd3fc' },
]

export default function HomePage({ onNavigate }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto py-12 px-6" style={{ background: 'var(--bg-deep)' }}>
      <div className="text-center mb-10">
        <div className="font-cinzel text-4xl font-bold tracking-widest mb-2" style={{ color: 'var(--gold)' }}>⚔ DM Toolkit</div>
        <div className="font-cinzel text-sm tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Инструментарий Мастера подземелий</div>
      </div>
      <div className="grid gap-3 w-full" style={{ maxWidth: 1000, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => onNavigate(s.id)}
            className="flex flex-col items-start gap-3 p-5 rounded-2xl text-left transition-all cursor-pointer"
            style={{ background: s.color, border: `1.5px solid ${s.border}` }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
            <div style={{ color: s.iconColor }}>{s.icon}</div>
            <div>
              <div className="font-cinzel text-base font-bold mb-1" style={{ color: 'var(--text)' }}>{s.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{s.desc}</div>
            </div>
            <div className="font-cinzel text-[10px] tracking-widest uppercase mt-auto" style={{ color: s.iconColor, opacity: 0.7 }}>Открыть →</div>
          </button>
        ))}
      </div>
    </div>
  )
}
