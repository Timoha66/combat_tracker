import { useState } from 'react'
import { useBattleStore } from './store/battleStore'
import Header from './components/Header'
import CombatantList from './components/CombatantList'
import RightPanel from './components/RightPanel'
import AddModal from './components/AddModal'
import {
  ConditionPicker, AcPopover, ReviveModal, StatblockModal, BattleSummary,
} from './components/modals.jsx'

export default function App() {
  const view = useBattleStore(s => s.view)
  const [addModalOpen,     setAddModalOpen]     = useState(false)
  const [statblockTarget,  setStatblockTarget]  = useState(null)
  const [condPickerTarget, setCondPickerTarget] = useState(null)
  const [acTarget,         setAcTarget]         = useState(null)
  const [reviveTarget,     setReviveTarget]     = useState(null)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onAdd={() => setAddModalOpen(true)} />
      <div className="flex flex-1 overflow-hidden relative">
        {view === 'tracker' && (
          <>
            <CombatantList
              onOpenStatblock={setStatblockTarget}
              onOpenCondPicker={setCondPickerTarget}
              onOpenAcEdit={setAcTarget}
              onRevive={setReviveTarget}
            />
            <RightPanel />
          </>
        )}
        {view === 'summary' && <BattleSummary />}
        {addModalOpen     && <AddModal onClose={() => setAddModalOpen(false)} />}
        {statblockTarget  && <StatblockModal combatant={statblockTarget} onClose={() => setStatblockTarget(null)} />}
        {condPickerTarget && <ConditionPicker id={condPickerTarget} onClose={() => setCondPickerTarget(null)} />}
        {acTarget         && <AcPopover id={acTarget} onClose={() => setAcTarget(null)} />}
        {reviveTarget     && <ReviveModal id={reviveTarget} onClose={() => setReviveTarget(null)} />}
      </div>
    </div>
  )
}
