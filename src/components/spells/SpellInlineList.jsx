import { useEffect } from 'react'
import { useSpellStore } from '../../store/spellStore'

// Разбивает строку заклинаний через запятую, находит совпадения в базе по имени,
// кликабельные — фиолетовые с подчёркиванием, некликабельные — обычный курсив
export default function SpellInlineList({ spellsText, onSpellClick }) {
  const spells  = useSpellStore(s => s.spells)
  const loadAll = useSpellStore(s => s.loadAll)

  useEffect(() => { if (spells.length === 0) loadAll() }, [])

  const names = (spellsText ?? '').split(',').map(s => s.trim()).filter(Boolean)

  function findSpell(name) {
    const lower = name.toLowerCase()
    return spells.find(s =>
      s.name.toLowerCase() === lower ||
      s.nameEn?.toLowerCase() === lower
    )
  }

  return (
    <>
      {names.map((name, i) => {
        const found = findSpell(name)
        return (
          <span key={i}>
            {i > 0 && ', '}
            {found ? (
              <button
                onClick={() => onSpellClick(found)}
                title={`Открыть карточку: ${found.name}`}
                style={{
                  color: '#a78bfa',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                  textDecorationColor: 'rgba(167,139,250,0.5)',
                  cursor: 'pointer',
                  fontStyle: 'italic',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                {name}
              </button>
            ) : (
              <em>{name}</em>
            )}
          </span>
        )
      })}
    </>
  )
}
