import { useEffect, useState } from 'react'
import { IconPlus, IconSword } from '@tabler/icons-react'
import { usePartyStore } from '../../store/partyStore'
import { useBattleStore } from '../../store/battleStore'
import PlayerCard from './PlayerCard'
import PlayerForm from './PlayerForm'
import PlayerModal from './PlayerModal'

function rollInit(p) {
  const dexMod = Math.floor(((p.abilities?.dex ?? 10) - 10) / 2)
  const bonus  = p.initiative ?? dexMod
  return Math.floor(Math.random() * 20) + 1 + bonus
}

export default function PartyPage() {
  const { players, loading, loadAll } = usePartyStore()
  const addCombatants = useBattleStore(s => s.addCombatants)

  const [formOpen,    setFormOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [modalPlayer, setModalPlayer] = useState(null)

  useEffect(() => { loadAll() }, [])

  function playerToTracker(p) {
    const init = rollInit(p)
    addCombatants({
      name:                 p.name,
      type:                 'player',
      hp:                   p.hp?.max ?? 10,
      ac:                   p.ac ?? 10,
      resistances:          p.resistances     ?? [],
      immunities:           p.immunities      ?? [],
      vulnerabilities:      p.vulnerabilities ?? [],
      legendaryActionCount: 0,
      legendaryResistances: 0,
      spellcasting:         p.spellcasting ?? null,
      sourceId:             p.id,
    }, 1, init)
    alert(`${p.name} добавлен в трекер с инициативой ${init}`)
  }

  function allToTracker() {
    if (!players.length) return
    players.forEach(playerToTracker)
    alert(`Вся партия (${players.length} чел.) добавлена в трекер`)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Заголовок */}
      <div className="flex items-center gap-3 px-6 py-4 shrink-0 border-b"
        style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
        <div>
          <h1 className="font-cinzel text-xl font-bold" style={{ color: 'var(--gold)' }}>Партия</h1>
          <p className="font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>
            {players.length ? `${players.length} персонаж${players.length === 1 ? '' : players.length < 5 ? 'а' : 'ей'}` : 'Нет персонажей'}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {players.length > 0 && (
            <button className="btn btn-ghost" onClick={allToTracker}>
              <IconSword size={14} /> Вся партия в трекер
            </button>
          )}
          <button className="btn btn-add" onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <IconPlus size={14} /> Добавить персонажа
          </button>
        </div>
      </div>

      {/* Карточки */}
      <div className="flex-1 overflow-auto p-6">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <span className="font-cinzel text-sm" style={{ color: 'var(--text-muted)' }}>Загрузка...</span>
          </div>
        )}

        {!loading && players.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-4">⚔️</div>
            <div className="font-cinzel text-base mb-1" style={{ color: 'var(--gold)' }}>Партия пуста</div>
            <div className="font-cinzel text-sm">Добавь персонажей игроков</div>
          </div>
        )}

        {!loading && players.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {players.map(p => (
              <PlayerCard
                key={p.id}
                player={p}
                onClick={() => setModalPlayer(p)}
                onEdit={() => { setEditTarget(p); setFormOpen(true) }}
                onAddToTracker={playerToTracker}
              />
            ))}
          </div>
        )}
      </div>

      {/* Форма */}
      {formOpen && (
        <PlayerForm
          initial={editTarget ?? {}}
          onClose={() => { setFormOpen(false); setEditTarget(null) }}
          onSaved={p => {
            setFormOpen(false)
            setEditTarget(null)
            if (modalPlayer?.id === p.id) setModalPlayer(p)
          }}
        />
      )}

      {/* Модал просмотра */}
      {modalPlayer && (
        <PlayerModal
          player={players.find(p => p.id === modalPlayer.id) ?? modalPlayer}
          onClose={() => setModalPlayer(null)}
          onEdit={() => { setEditTarget(modalPlayer); setFormOpen(true) }}
          onAddToTracker={p => { playerToTracker(p); setModalPlayer(null) }}
        />
      )}
    </div>
  )
}
