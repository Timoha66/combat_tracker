import { IconHome, IconSword, IconMap } from '@tabler/icons-react'

const NAV_ITEMS = [
  { id: 'home',      icon: <IconHome size={20} />,  label: 'Домой' },
  { id: 'tracker',   icon: <IconSword size={20} />, label: 'Трекер' },
  { id: 'locations', icon: <IconMap size={20} />,   label: 'Локации' },
]

export default function Sidebar({ page, onNavigate }) {
  return (
    <div
      className="flex flex-col items-center py-3 gap-1 shrink-0"
      style={{
        width: 52,
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {NAV_ITEMS.map((item, i) => {
        const isActive = page === item.id
        return (
          <div key={item.id}>
            {/* Разделитель после домой */}
            {i === 1 && (
              <div
                className="my-2 mx-3"
                style={{ height: 1, background: 'var(--border)', width: 28 }}
              />
            )}
            <button
              onClick={() => onNavigate(item.id)}
              title={item.label}
              className="flex items-center justify-center rounded-xl transition-all cursor-pointer"
              style={{
                width: 38,
                height: 38,
                background: isActive ? 'var(--gold-dim)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(226,201,126,0.4)' : 'transparent'}`,
                color: isActive ? 'var(--gold)' : 'var(--text-muted)',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                  e.currentTarget.style.color = 'var(--text)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }
              }}
            >
              {item.icon}
            </button>
          </div>
        )
      })}
    </div>
  )
}
