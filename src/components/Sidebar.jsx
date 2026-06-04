import { IconHome, IconSword, IconMap, IconUsers, IconBook, IconCloud, IconMap2, IconCompass, IconListCheck, IconShield } from '@tabler/icons-react'

const NAV_ITEMS = [
  { id: 'home',      icon: <IconHome size={20} />,       label: 'Домой' },
  { id: 'tracker',   icon: <IconSword size={20} />,      label: 'Трекер' },
  { id: 'party',     icon: <IconShield size={20} />,     label: 'Ширма' },
  { id: 'locations', icon: <IconCompass size={20} />,    label: 'Локации' },
  { id: 'npcs',      icon: <IconUsers size={20} />,      label: 'НПС и фракции' },
  { id: 'quests',    icon: <IconListCheck size={20} />,  label: 'Справочник квестов' },
  { id: 'journal',   icon: <IconBook size={20} />,       label: 'Журнал кампании' },
  { id: 'weather',   icon: <IconCloud size={20} />,      label: 'Погода и навигация' },
  { id: 'map',       icon: <IconMap2 size={20} />,       label: 'Карта Чульта' },
]

export default function Sidebar({ page, onNavigate }) {
  return (
    <div className="flex flex-col items-center py-3 shrink-0"
      style={{ width: 52, background: 'var(--bg-panel)', borderRight: '1px solid var(--border)' }}>
      {NAV_ITEMS.map((item, i) => {
        const isActive = page === item.id
        return (
          <>
            {i === 1 && <div key="div1" style={{ width: 28, height: 1, background: 'var(--border)', margin: '6px 0' }} />}
            {i === 2 && <div key="div2" style={{ width: 28, height: 1, background: 'var(--border)', margin: '6px 0' }} />}
            <button key={item.id} onClick={() => onNavigate(item.id)} title={item.label}
              className="flex items-center justify-center rounded-xl transition-all cursor-pointer"
              style={{ width: 38, height: 38, marginBottom: 2, background: isActive ? 'var(--gold-dim)' : 'transparent', border: `1px solid ${isActive ? 'rgba(226,201,126,0.4)' : 'transparent'}`, color: isActive ? 'var(--gold)' : 'var(--text-muted)' }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}
            >
              {item.icon}
            </button>
          </>
        )
      })}
    </div>
  )
}
