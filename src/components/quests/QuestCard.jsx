import { IconX, IconPencil } from '@tabler/icons-react'
import { useQuestStore } from '../../store/questStore'
import { QUEST_STATUSES, QUEST_STATUS_MAP, QUEST_TYPE_MAP } from '../../data/questDb'

export default function QuestCard({ questId, onClose, onEdit, npcs = [], locations = [] }) {
  const quest      = useQuestStore(s => s.getById(questId))
  const updateStatus = useQuestStore(s => s.updateStatus)

  if (!quest) return null

  const st  = QUEST_STATUS_MAP[quest.status] ?? QUEST_STATUS_MAP['inactive']
  const typ = QUEST_TYPE_MAP[quest.type]     ?? QUEST_TYPE_MAP['side']

  const giverNpc     = npcs.find(n => n.id === quest.questGiverNpcId)
  const relatedNpcs  = npcs.filter(n => (quest.relatedNpcIds ?? []).includes(n.id))
  const relatedLocs  = locations.filter(l => (quest.relatedLocationIds ?? []).includes(l.id))

  return (
    <div className="overlay" style={{ zIndex: 400 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: `1px solid ${typ.color}44`, width: 560, maxWidth: '95vw', maxHeight: '85vh' }}>

        {/* Header */}
        <div className="px-5 py-4 border-b shrink-0 flex items-start gap-3"
          style={{ borderColor: 'var(--border)', background: `${typ.color}0a` }}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-cinzel text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: `${typ.color}22`, color: typ.color, border: `0.5px solid ${typ.color}55` }}>
                {typ.icon} {typ.label}
              </span>
              <span className="font-cinzel text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: `${st.color}22`, color: st.color, border: `0.5px solid ${st.color}55` }}>
                {st.icon} {st.label}
              </span>
            </div>
            <h2 className="font-cinzel text-xl font-bold" style={{ color: 'var(--gold)' }}>{quest.title}</h2>
          </div>
          {onEdit && (
            <button className="btn btn-ghost shrink-0" style={{ fontSize: 11 }} onClick={onEdit}>
              <IconPencil size={13} /> Редактировать
            </button>
          )}
          <button className="icon-btn shrink-0" onClick={onClose}><IconX size={15} /></button>
        </div>

        {/* Status switcher */}
        <div className="px-5 py-2 border-b flex gap-1.5 flex-wrap shrink-0" style={{ borderColor: 'var(--border)' }}>
          {QUEST_STATUSES.map(s => (
            <button key={s.id}
              className="font-cinzel text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-all"
              style={{
                background: quest.status === s.id ? `${s.color}22` : 'var(--bg-row)',
                color:      quest.status === s.id ? s.color : 'var(--text-muted)',
                border:     `1px solid ${quest.status === s.id ? s.color + '66' : 'var(--border)'}`,
                fontWeight: quest.status === s.id ? 700 : 400,
              }}
              onClick={() => updateStatus(quest.id, s.id)}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {quest.description && (
            <Section title="Описание">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{quest.description}</p>
            </Section>
          )}

          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {quest.conditionsGet && (
              <Section title="Условия получения">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{quest.conditionsGet}</p>
              </Section>
            )}
            {quest.conditionsDone && (
              <Section title="Условия выполнения">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{quest.conditionsDone}</p>
              </Section>
            )}
          </div>

          {quest.reward && (
            <Section title="Награда">
              <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>{quest.reward}</p>
            </Section>
          )}

          {(giverNpc || relatedNpcs.length > 0 || relatedLocs.length > 0) && (
            <div className="grid gap-3" style={{ gridTemplateColumns: relatedLocs.length > 0 ? '1fr 1fr' : '1fr' }}>
              {(giverNpc || relatedNpcs.length > 0) && (
                <Section title="НПС">
                  {giverNpc && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-cinzel text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(226,201,126,0.15)', color: 'var(--gold)', border: '0.5px solid rgba(226,201,126,0.3)' }}>
                        Квестодатель
                      </span>
                      <span className="font-cinzel text-xs" style={{ color: 'var(--text)' }}>{giverNpc.name}</span>
                    </div>
                  )}
                  {relatedNpcs.map(n => (
                    <div key={n.id} className="font-cinzel text-xs py-0.5" style={{ color: 'var(--text-dim)' }}>
                      • {n.name} {n.role && <span style={{ color: 'var(--text-muted)' }}>— {n.role}</span>}
                    </div>
                  ))}
                </Section>
              )}
              {relatedLocs.length > 0 && (
                <Section title="Локации">
                  {relatedLocs.map(l => (
                    <div key={l.id} className="font-cinzel text-xs py-0.5" style={{ color: 'var(--text-dim)' }}>
                      • {l.title}
                    </div>
                  ))}
                </Section>
              )}
            </div>
          )}

          {quest.notes && (
            <Section title="Заметки ДМ 🔒">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>{quest.notes}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
      <div className="font-cinzel text-[10px] uppercase tracking-widest px-3 py-1.5"
        style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(226,201,126,0.15)', background: 'rgba(226,201,126,0.04)' }}>
        {title}
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}
