import { IconX } from '@tabler/icons-react'
import {
  SPELL_SCHOOL_MAP, SPELL_SOURCES, formatCastingTime, formatRange, formatDuration,
  normalizeSpell, EFFECT_TYPES, SAVE_ABILITY_MAP, SAVE_ON_SUCCESS_MAP,
  CONDITION_MAP, DAMAGE_BONUS_SHORT, formatDieFormula, formatUpcast,
} from '../../data/spellDb'
import { DMG_TYPES } from '../../data/constants'

const _DMG_LABEL = Object.fromEntries(DMG_TYPES.map(t => [t.id, t.label]))
function _dmgName(id) { return _DMG_LABEL[id] ?? id }
function _fmtDmgList(damages, isHeal) {
  return (damages ?? []).filter(d => d.die || d.formula).map(d => {
    const f = formatDieFormula(d)
    return isHeal ? f : `${f}${d.dmgType ? ` ${_dmgName(d.dmgType)}` : ''}`
  }).join(' + ')
}
function MiniEffectsBlock({ spell: s }) {
  const ns = normalizeSpell(s)
  const effects = (ns.effects ?? []).filter(e => e.type && e.type !== '')
  const upcastText = formatUpcast(ns)
  if (!effects.length && !upcastText) return null
  return (
    <div className="mb-3">
      {effects.length > 0 && (
        <div className="mb-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1.5"
            style={{ color: 'rgba(167,139,250,0.7)' }}>Эффект</div>
          <div className="flex flex-col gap-1">
            {effects.map((e, i) => {
              const tLabel    = EFFECT_TYPES.find(t => t.id === e.type)?.label ?? e.type
              const saveName  = e.saveAbility   ? SAVE_ABILITY_MAP[e.saveAbility]      : null
              const saveOnSuc = e.saveOnSuccess  ? SAVE_ON_SUCCESS_MAP[e.saveOnSuccess] : null
              const condName  = e.condition      ? CONDITION_MAP[e.condition]           : null
              const showDmg   = e.type === 'damage' || e.type === 'healing'
              const dmgStr    = showDmg ? _fmtDmgList(e.damages, e.type === 'healing') : ''
              return (
                <div key={i} className="flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="font-cinzel text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(167,139,250,0.12)', color: '#c4b5fd' }}>{tLabel}</span>
                  {saveName   && <span className="font-cinzel text-xs" style={{ color: '#fbbf24' }}>{saveName}</span>}
                  {saveOnSuc  && <span className="font-cinzel text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#fca5a5' }}>· {saveOnSuc}</span>}
                  {condName   && <span className="font-cinzel text-xs font-semibold" style={{ color: '#fb923c' }}>{condName}</span>}
                  {dmgStr     && <span className="font-cinzel text-xs font-semibold" style={{ color: 'var(--text)' }}>{dmgStr}</span>}
                  {e.type === 'special' && e.specialText && <span className="text-xs italic" style={{ color: 'var(--text-dim)' }}>{e.specialText}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {upcastText && (
        <div className="px-3 py-2 rounded-lg"
          style={{ background: 'rgba(226,201,126,0.05)', border: '1px solid rgba(226,201,126,0.2)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            <span className="font-cinzel font-bold" style={{ color: 'var(--gold)' }}>На более высоких уровнях: </span>
            {upcastText}
          </p>
        </div>
      )}
    </div>
  )
}

export default function SpellMiniCard({ spell: s, onClose }) {
  const school   = SPELL_SCHOOL_MAP[s.school]
  const castTime = formatCastingTime(s.castingTime)
  const range    = formatRange(s.range)
  const duration = formatDuration(s.duration, s.concentration)
  const source   = SPELL_SOURCES.find(x => x.id === s.source)

  const compParts = []
  if (s.components?.verbal)   compParts.push('Вербальный')
  if (s.components?.somatic)  compParts.push('Соматический')
  if (s.components?.material) compParts.push(`Материальный${s.components.materialDesc ? ` (${s.components.materialDesc})` : ''}`)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid rgba(167,139,250,0.35)', width: 560, maxWidth: '95vw', maxHeight: '85vh', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)', background: 'rgba(167,139,250,0.06)' }}>
          <div className="flex-1 min-w-0">
            <h3 className="font-cinzel text-lg font-bold" style={{ color: '#c4b5fd' }}>{s.name}</h3>
            {s.nameEn && <p className="font-cinzel text-xs italic" style={{ color: 'var(--text-muted)' }}>{s.nameEn}</p>}
          </div>
          <button className="icon-btn shrink-0" onClick={onClose}><IconX size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Уровень / Школа / Источник */}
          <div className="flex items-center gap-2 flex-wrap mb-3"
            style={{ background: 'var(--bg-row)', borderRadius: 8, padding: '6px 12px', border: '1px solid var(--border)' }}>
            <span className="font-cinzel text-sm italic flex-1" style={{ color: 'var(--text-dim)' }}>
              {s.level === 0 ? 'Заговор' : `${s.level} уровень`}
              {school ? `, ${school.label.toLowerCase()}` : ''}
              {s.ritual ? ' (ритуал)' : ''}
            </span>
            {source && (
              <span className="font-cinzel text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: s.source === 'HB' ? 'rgba(167,139,250,0.12)' : 'rgba(226,201,126,0.08)', color: s.source === 'HB' ? '#c4b5fd' : 'var(--gold)', border: `0.5px solid ${s.source === 'HB' ? 'rgba(167,139,250,0.3)' : 'rgba(226,201,126,0.25)'}` }}>
                {s.source}
              </span>
            )}
          </div>

          {/* Таблица */}
          <table className="w-full mb-3 text-sm"
            style={{ border: '1px solid var(--border)', borderCollapse: 'collapse', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Время накладывания', 'Дистанция', 'Длительность'].map(h => (
                  <th key={h} className="font-cinzel text-[10px] uppercase tracking-widest px-3 py-1.5 text-left"
                    style={{ background: 'var(--bg-row)', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {[castTime, range, duration].map((v, i) => (
                  <td key={i} className="px-3 py-2"
                    style={{ color: 'var(--text-dim)', verticalAlign: 'top', background: 'var(--bg-panel)', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    {v}
                  </td>
                ))}
              </tr>
            </tbody>
            {compParts.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td colSpan={3} className="px-3 py-2" style={{ background: 'var(--bg-panel)' }}>
                    <span className="font-cinzel text-[10px] uppercase tracking-widest font-semibold mr-2" style={{ color: 'var(--text-muted)' }}>Компоненты:</span>
                    <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{compParts.join(', ')}</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Описание */}
          {s.description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3" style={{ color: 'var(--text-dim)' }}>
              {s.description}
            </p>
          )}

          {/* Эффект + апкаст */}
          <MiniEffectsBlock spell={s} />

          {/* Классы */}
          {s.classes?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-cinzel text-[10px] uppercase tracking-widest mr-1" style={{ color: 'var(--text-muted)' }}>Классы:</span>
              {s.classes.map(cls => (
                <span key={cls} className="font-cinzel text-[10px] px-2 py-0.5 rounded-md"
                  style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '0.5px solid rgba(226,201,126,0.3)' }}>
                  {cls}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
