import { useState } from 'react'
import { IconPencil, IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { QUEST_STATUS_MAP, CAT_MAP } from '../../data/locationsDb'

export default function LocationView({ location: l, onEdit }) {
  const [openPOI, setOpenPOI] = useState(null)
  const cat = CAT_MAP[l.cat]

  return (
    <div className="overflow-y-auto h-full">
      <div className="p-5" style={{ maxWidth: 1400 }}>

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
                <span key={t} className="font-cinzel text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-row)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost shrink-0" onClick={onEdit}>
            <IconPencil size={14} /> Редактировать
          </button>
        </div>

        <hr style={{ borderColor: 'rgba(226,201,126,0.2)', marginBottom: 16 }} />

        {/* ── 3 КОЛОНКИ ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'start' }}>

          {/* ── КОЛОНКА 1: Атмосфера + Характеристики ── */}
          <div className="flex flex-col gap-4">
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

          {/* ── КОЛОНКА 2: НПС + Квесты ── */}
          <div className="flex flex-col gap-4">
            {l.npcs?.length > 0 && (
              <Card title={`НПС (${l.npcs.length})`}>
                <div className="flex flex-col gap-1.5">
                  {l.npcs.map((npc, i) => (
                    <div key={i} className="px-2.5 py-2 rounded-lg" style={{ background: 'var(--bg-deep)', border: '0.5px solid var(--border)' }}>
                      <span className="font-cinzel text-sm font-semibold" style={{ color: 'var(--text)' }}>{npc.name}</span>
                      {npc.description && (
                        <span className="text-sm" style={{ color: 'var(--text-dim)' }}> — {npc.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {l.quests?.length > 0 && (
              <Card title={`Квесты (${l.quests.length})`}>
                <div className="flex flex-col gap-1.5">
                  {l.quests.map((q, i) => {
                    const st = QUEST_STATUS_MAP[q.status] ?? QUEST_STATUS_MAP['inactive']
                    return (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: 'var(--bg-deep)', border: '0.5px solid var(--border)' }}>
                        <span className="text-sm shrink-0">{st.icon}</span>
                        <span className="text-sm flex-1" style={{ color: 'var(--text-dim)' }}>{q.title}</span>
                        <span className="font-cinzel text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ color: st.color, background: `${st.color}18`, border: `0.5px solid ${st.color}44` }}>
                          {st.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* ── КОЛОНКА 3: Точки интереса ── */}
          <div className="flex flex-col gap-2">
            {l.points?.length > 0 && (
              <Card title={`Точки интереса (${l.points.length})`}>
                <div className="flex flex-col gap-2">
                  {l.points.map((p, i) => (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors"
                        style={{ background: openPOI === i ? 'rgba(226,201,126,0.08)' : 'var(--bg-deep)' }}
                        onClick={() => setOpenPOI(openPOI === i ? null : i)}
                      >
                        {openPOI === i
                          ? <IconChevronDown size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                          : <IconChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        }
                        <span className="font-cinzel text-sm font-semibold" style={{ color: openPOI === i ? 'var(--gold)' : 'var(--text)' }}>
                          {p.title}
                        </span>
                      </button>
                      {openPOI === i && (
                        <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
                          {p.description && (
                            <p className="text-sm mb-3" style={{ color: 'var(--text-dim)' }}>{p.description}</p>
                          )}
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
            )}
            {(!l.points || l.points.length === 0) && (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <div className="text-2xl mb-2">📍</div>
                <div className="font-cinzel text-xs">Нет точек интереса</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
      <div className="font-cinzel text-xs uppercase tracking-widest px-3 py-2" style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(226,201,126,0.2)', background: 'rgba(226,201,126,0.05)' }}>
        {title}
      </div>
      <div className="p-3">
        {children}
      </div>
    </div>
  )
}
