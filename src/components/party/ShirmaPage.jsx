// src/components/party/ShirmaPage.jsx
import { useState } from 'react'
import { IconUsers, IconHeartHandshake, IconTrees, IconBandage } from '@tabler/icons-react'
import PartyPage from './PartyPage'
import ConditionsPage from './ConditionsPage'
import EnvironmentPage from './EnvironmentPage'
import InjuriesPage from './InjuriesPage'

const SECTIONS = [
  { id: 'party',       icon: <IconUsers size={16} />,          label: 'Партия' },
  { id: 'conditions',  icon: <IconHeartHandshake size={16} />, label: 'Состояния' },
  { id: 'environment', icon: <IconTrees size={16} />,          label: 'Окружающая среда' },
  { id: 'injuries',    icon: <IconBandage size={16} />,        label: 'Травмы' },
]

const SECTION_TITLES = {
  conditions:  { title: 'Состояния',          sub: 'Шпаргалка по состояниям и истощению' },
  environment: { title: 'Окружающая среда',   sub: 'Укрытие, зрение, свет, падение и прочее' },
  injuries:    { title: 'Травмы',             sub: 'Типы травм, получение и лечение' },
}

export default function ShirmaPage() {
  const [section, setSection] = useState('party')

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* Левая навигация */}
      <div className="flex flex-col shrink-0 border-r py-3 px-2 gap-1"
        style={{ width: 160, background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
        <div className="font-cinzel text-[10px] uppercase tracking-widest px-2 mb-2"
          style={{ color: 'var(--text-muted)' }}>Ширма</div>
        {SECTIONS.map(s => {
          const active = section === s.id
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all cursor-pointer w-full"
              style={{
                background: active ? 'var(--gold-dim)' : 'transparent',
                border: `1px solid ${active ? 'rgba(226,201,126,0.4)' : 'transparent'}`,
                color: active ? 'var(--gold)' : 'var(--text-muted)',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
              {s.icon}
              <span className="font-cinzel text-xs">{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* Контент */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {section === 'party' && <PartyPage />}
        {['conditions', 'environment', 'injuries'].includes(section) && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 shrink-0 border-b"
              style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
              <h1 className="font-cinzel text-xl font-bold" style={{ color: 'var(--gold)' }}>
                {SECTION_TITLES[section].title}
              </h1>
              <span className="font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>
                {SECTION_TITLES[section].sub}
              </span>
            </div>
            {section === 'conditions'  && <ConditionsPage />}
            {section === 'environment' && <EnvironmentPage />}
            {section === 'injuries'    && <InjuriesPage />}
          </div>
        )}
      </div>
    </div>
  )
}
