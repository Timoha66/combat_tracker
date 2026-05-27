import { useState } from 'react'
import { useBattleStore } from './store/battleStore'
import Sidebar from './components/Sidebar'
import HomePage from './components/HomePage'
import Header from './components/Header'
import CombatantList from './components/CombatantList'
import RightPanel from './components/RightPanel'
import AddModal from './components/AddModal'
import CombatLog from './components/CombatLog'
import BestiaryPage from './components/bestiary/BestiaryPage'
import LocationsPage from './components/locations/LocationsPage'
import NpcPage from './components/npcs/NpcPage'
import QuestPage from './components/quests/QuestPage'
import JournalPage from './components/journal/JournalPage'
import WeatherPage from './components/weather/WeatherPage'
import MapPage from './components/map/MapPage'
import {
  ConditionPicker, AcPopover, ReviveModal, StatblockModal, BattleSummary,
} from './components/modals.jsx'

// Заглушка для будущих разделов
function ComingSoon({ title }) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
      <div className="text-center">
        <div className="text-4xl mb-4">🚧</div>
        <div className="font-cinzel text-xl font-bold mb-2" style={{ color: 'var(--gold)' }}>{title}</div>
        <div className="font-cinzel text-sm" style={{ color: 'var(--text-muted)' }}>В разработке</div>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('home')
  const view = useBattleStore(s => s.view)
  const [locationTarget, setLocationTarget] = useState(null)
  const [questTarget,    setQuestTarget]    = useState(null)
  const [npcTarget,      setNpcTarget]      = useState(null)

  const [showBestiary,     setShowBestiary]     = useState(false)
  const [addModalOpen,     setAddModalOpen]     = useState(false)
  const [statblockTarget,  setStatblockTarget]  = useState(null)
  const [condPickerTarget, setCondPickerTarget] = useState(null)
  const [acTarget,         setAcTarget]         = useState(null)
  const [reviveTarget,     setReviveTarget]     = useState(null)

  function handleNavigate(dest) {
    setPage(dest)
    // Скрываем бестиарий при переходе
    if (dest !== 'tracker') setShowBestiary(false)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Сайдбар — всегда виден */}
      <Sidebar page={page} onNavigate={handleNavigate} />

      {/* Основной контент */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ── ДОМАШНЯЯ СТРАНИЦА ── */}
        {page === 'home' && <HomePage onNavigate={handleNavigate} />}

        {/* ── ТРЕКЕР ── */}
        {page === 'tracker' && (
          <>
            <Header
              onAdd={() => setAddModalOpen(true)}
              onBestiary={() => setShowBestiary(b => !b)}
              showingBestiary={showBestiary}
            />
            <div className="flex flex-1 overflow-hidden relative">
              {showBestiary && <BestiaryPage />}
              {!showBestiary && (
                <>
                  {view === 'tracker' && (
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <div className="flex flex-1 overflow-hidden">
                        <CombatantList
                          onOpenStatblock={setStatblockTarget}
                          onOpenCondPicker={setCondPickerTarget}
                          onOpenAcEdit={setAcTarget}
                          onRevive={setReviveTarget}
                        />
                        <RightPanel />
                      </div>
                      <CombatLog />
                    </div>
                  )}
                  {view === 'summary' && <BattleSummary />}
                </>
              )}

              {addModalOpen     && <AddModal onClose={() => setAddModalOpen(false)} />}
              {statblockTarget  && <StatblockModal combatant={statblockTarget} onClose={() => setStatblockTarget(null)} />}
              {condPickerTarget && <ConditionPicker id={condPickerTarget} onClose={() => setCondPickerTarget(null)} />}
              {acTarget         && <AcPopover id={acTarget} onClose={() => setAcTarget(null)} />}
              {reviveTarget     && <ReviveModal id={reviveTarget} onClose={() => setReviveTarget(null)} />}
            </div>
          </>
        )}

        {/* ── ЛОКАЦИИ ── */}
        {page === 'locations' && <LocationsPage initialLocation={locationTarget} onLocationOpened={() => setLocationTarget(null)} />}
        {page === 'npcs'      && <NpcPage
                                    initialNpc={npcTarget} onNpcOpened={() => setNpcTarget(null)}
                                    onOpenQuest={q => { setQuestTarget(q); handleNavigate('quests') }} />}
        {page === 'quests'    && <QuestPage
                                    initialQuest={questTarget} onQuestOpened={() => setQuestTarget(null)}
                                    onOpenNpc={n  => { setNpcTarget(n);       handleNavigate('npcs') }}
                                    onOpenLocation={l => { setLocationTarget(l); handleNavigate('locations') }} />}
        {page === 'journal' && <JournalPage />}
        {page === 'weather' && <WeatherPage />}
        {page === 'map'     && <MapPage onNavigateToLocation={loc => { setLocationTarget(loc); handleNavigate('locations') }} />}

      </div>
    </div>
  )
}
