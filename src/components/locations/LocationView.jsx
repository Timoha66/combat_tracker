import { useState, useEffect, useCallback } from 'react'
import { IconPencil, IconChevronDown, IconChevronRight, IconExternalLink } from '@tabler/icons-react'
import { CAT_MAP } from '../../data/locationsDb'
import { QUEST_STATUS_MAP } from '../../data/questDb'
import { useLocationsStore } from '../../store/locationsStore'
import { useQuestStore }     from '../../store/questStore'
import QuestCard from '../quests/QuestCard'
import { useNpcStore }       from '../../store/npcStore'

export default function LocationView({ location: l, onEdit }) {
  const [openPOI,    setOpenPOI]    = useState(null)
  const [dmNotes,    setDmNotes]    = useState(l.dmNotes ?? '')
  const [saveTimer,  setSaveTimer]  = useState(null)
  const [questCardId, setQuestCardId] = useState(null)

  const saveDmNotes = useLocationsStore(s => s.saveDmNotes)
  const allQuests  = useQuestStore(s => s.quests)
  const loadQuests = useQuestStore(s => s.loadAll)
  const quests     = allQuests.filter(q => (q.relatedLocationIds ?? []).includes(l.id))
  const npcs       = useNpcStore(s => s.npcs)
  const loadNpcs   = useNpcStore(s => s.loadAll)
  const locations  = useLocationsStore(s => s.locations)

  useEffect(() => { loadQuests(); loadNpcs() }, [])

  const cat = CAT_MAP[l.cat]

  function handleNotesChange(val) {
    setDmNotes(val)
    if (saveTimer) clearTimeout(saveTimer)
    setSaveTimer(setTimeout(() => saveDmNotes(l.id, val), 800))
  }

  return (
    <>
    <div className="overflow-y-auto h-full">
      <div className="p-5">

        {/* ── ШАПКА ── */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-2xl">{cat?.icon}</span>
              <h2 className="font-cinzel text-2xl font-bold" style={{ color: 'var(--gold)' }}>{l.title}</h2>
              {l.en && <span className="font-cinzel text-sm italic" style={{ color: 'var(--text-muted)' }}>{l.en}</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-cinzel text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '0.5px solid rgba(226,201,126,0.3)' }}>
                {cat?.label}
              </span>
              {l.type && <span className="font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>{l.type}</span>}
              {(l.tags ?? []).map(t => (
                <span key={t} className="font-cinzel text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-row)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>{t}</span>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost shrink-0" onClick={onEdit}>
            <IconPencil size={14} /> Редактировать
          </button>
        </div>

        <hr style={{ borderColor: 'rgba(226,201,126,0.2)', marginBottom: 16 }} />

        {/* ── КОЛОНКИ (только непустые) ── */}
        {(() => {
          const cols = [
            // Колонка 1: Атмосфера + Характеристики
            (l.atmosphere || l.chars) && (
              <div key="col1" className="flex flex-col gap-4">
                {l.atmosphere && (
                  <Card title="Атмосфера">
                    <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-dim)' }}>{l.atmosphere}</p>
                  </Card>
                )}
                {l.chars && (
                  <Card title="Характеристики">
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{l.chars}</p>
                  </Card>
                )}
              </div>
            ),

            // Колонка 2: НПС + Квесты
            (l.npcs?.length > 0 || quests.length > 0) && (
              <div key="col2" className="flex flex-col gap-4">
                {l.npcs?.length > 0 && (
                  <Card title={`НПС (${l.npcs.length})`}>
                    <div className="flex flex-col gap-1.5">
                      {l.npcs.map((npc, i) => (
                        <div key={i} className="px-2.5 py-2 rounded-lg" style={{ background: 'var(--bg-deep)', border: '0.5px solid var(--border)' }}>
                          <span className="font-cinzel text-sm font-semibold" style={{ color: 'var(--text)' }}>{npc.name}</span>
                          {npc.description && <span className="text-sm" style={{ color: 'var(--text-dim)' }}> — {npc.description}</span>}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {quests.length > 0 && (
                  <Card title={`Квесты (${quests.length})`}>
                    <div className="flex flex-col gap-2">
                      {quests.map(q => {
                        const st = QUEST_STATUS_MAP[q.status] ?? QUEST_STATUS_MAP['inactive']
                        return (
                          <div key={q.id} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                            style={{ background: 'var(--bg-deep)', border: `1px solid ${st.color}33` }}>
                            <span style={{ fontSize: 14 }}>{st.icon}</span>
                            <span className="font-cinzel text-sm flex-1" style={{ color: 'var(--text)' }}>{q.title}</span>
                            <span className="font-cinzel text-[10px]" style={{ color: st.color }}>{st.label}</span>
                            <button
                              className="btn btn-ghost shrink-0"
                              style={{ fontSize: 10, padding: '2px 8px', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)' }}
                              onClick={() => setQuestCardId(q.id)}>
                              <IconExternalLink size={11} /> Карточка
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                )}
              </div>
            ),

            // Колонка 3: Точки интереса
            l.points?.length > 0 && (
              <div key="col3" className="flex flex-col gap-2">
                <Card title={`Точки интереса (${l.points.length})`}>
                  <div className="flex flex-col gap-2">
                    {l.points.map((p, i) => (
                      <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <button className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors"
                          style={{ background: openPOI === i ? 'rgba(226,201,126,0.08)' : 'var(--bg-deep)' }}
                          onClick={() => setOpenPOI(openPOI === i ? null : i)}>
                          {openPOI === i
                            ? <IconChevronDown size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                            : <IconChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                          <span className="font-cinzel text-sm font-semibold" style={{ color: openPOI === i ? 'var(--gold)' : 'var(--text)' }}>{p.title}</span>
                        </button>
                        {openPOI === i && (
                          <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
                            {p.description && <p className="text-sm mb-3" style={{ color: 'var(--text-dim)' }}>{p.description}</p>}
                            {p.npcs?.length > 0 && (
                              <div className="mb-3">
                                <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>НПС</div>
                                {p.npcs.map((n, j) => (
                                  <div key={j} className="text-sm py-1.5" style={{ color: 'var(--text-dim)', borderBottom: '0.5px solid var(--border)' }}>
                                    <span className="font-cinzel font-semibold" style={{ color: 'var(--text)' }}>{n.name}</span>
                                    {n.description && ` — ${n.description}`}
                                  </div>
                                ))}
                              </div>
                            )}
                            {p.quests?.length > 0 && (
                              <div>
                                <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Квесты</div>
                                {p.quests.map((q, j) => {
                                  const st = QUEST_STATUS_MAP[q.status] ?? QUEST_STATUS_MAP['inactive']
                                  return (
                                    <div key={j} className="flex items-center gap-2 text-sm py-1.5" style={{ borderBottom: '0.5px solid var(--border)' }}>
                                      <span>{st.icon}</span>
                                      <span style={{ color: 'var(--text-dim)' }}>{q.title}</span>
                                      <span className="ml-auto font-cinzel text-[10px]" style={{ color: st.color }}>{st.label}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ),

            // Колонка 4: Заметки ДМ — всегда показываем
            <div key="col4">
              <Card title="Заметки ДМ 🔒">
                <textarea
                  className="w-full resize-none outline-none text-sm rounded-lg px-2 py-2"
                  style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text-dim)', minHeight: 180, lineHeight: 1.6 }}
                  placeholder="Личные заметки, секреты, напоминания..."
                  value={dmNotes}
                  onChange={e => handleNotesChange(e.target.value)}
                  onFocus={e => e.target.style.borderColor = 'rgba(226,201,126,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
                />
                <div className="font-cinzel text-[9px] mt-1 text-right" style={{ color: 'var(--text-muted)' }}>автосохранение</div>
              </Card>
            </div>,
          ].filter(Boolean)

          return (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)`, alignItems: 'start' }}>
              {cols}
            </div>
          )
        })()}

      </div>
    </div>

    {/* QuestCard модалка */}
    {questCardId && (
      <QuestCard
        questId={questCardId}
        npcs={npcs}
        locations={locations}
        onClose={() => setQuestCardId(null)}
      />
    )}
  </>
  )
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
      <div className="font-cinzel text-xs uppercase tracking-widest px-3 py-2" style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(226,201,126,0.2)', background: 'rgba(226,201,126,0.05)' }}>
        {title}
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}
