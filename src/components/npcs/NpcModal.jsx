import { useState } from 'react'
import { IconX, IconPencil, IconTrash, IconBook2 } from '@tabler/icons-react'
import { useNpcStore } from '../../store/npcStore'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { useQuestStore } from '../../store/questStore'
import StatblockView from '../bestiary/StatblockView'

const QUEST_STATUS_COLORS = {
  active:   '#f59e0b',
  done:     '#4ade80',
  failed:   '#f87171',
  inactive: '#9ca3af',
  waiting:  '#60a5fa',
}

export default function NpcModal({ npc, onClose, onEdit, onOpenQuest }) {
  const [showSecret,    setShowSecret]    = useState(false)
  const [showStatblock, setShowStatblock] = useState(null)
  const deleteNpc  = useNpcStore(s => s.deleteNpc)
  const creatures  = useBestiaryStore(s => s.creatures)
  const loadBest   = useBestiaryStore(s => s.loadAll)
  const quests     = useQuestStore(s => s.quests)
  const loadQuests = useQuestStore(s => s.loadAll)

  useState(() => { loadBest(); loadQuests() }, [])

  const bestiaryMatches = creatures.filter(c => {
    const cName = c.name.toLowerCase(), nName = npc.name.toLowerCase()
    return cName.includes(nName) || nName.includes(cName)
  })

  // Квесты этого НПС
  const giverQuests   = quests.filter(q => q.questGiverNpcId === npc.id)
  const relatedQuests = quests.filter(q =>
    (q.relatedNpcIds ?? []).includes(npc.id) && q.questGiverNpcId !== npc.id
  )
  const hasQuests = giverQuests.length > 0 || relatedQuests.length > 0

  async function handleDelete() {
    if (confirm(`Удалить НПС «${npc.name}»?`)) {
      await deleteNpc(npc.id)
      onClose()
    }
  }

  if (showStatblock) {
    return (
      <div className="overlay" style={{ zIndex: 300 }}>
        <div className="flex flex-col rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-md)', width: 600, maxWidth: '95vw', maxHeight: '88vh' }}>
          <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
            <span className="font-cinzel text-sm font-semibold" style={{ color: 'var(--text)' }}>Статблок — {showStatblock.name}</span>
            <button className="btn btn-ghost ml-auto" style={{ fontSize: 11 }} onClick={() => setShowStatblock(null)}>← Назад</button>
            <button className="icon-btn" onClick={onClose}><IconX size={15} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <StatblockView creature={showStatblock} onEdit={null} hideEdit />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay" style={{ zIndex: 300 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-md)', width: 820, maxWidth: '96vw', maxHeight: '90vh' }}>

        {/* ── HEADER ── */}
        <div className="flex items-start gap-3 px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)', background: 'rgba(226,201,126,0.05)' }}>
          <div className="flex-1 min-w-0">
            {/* Имя */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-cinzel text-xl font-bold" style={{ color: 'var(--gold)' }}>{npc.name}</h2>
              {npc.nameEn && <span className="font-cinzel text-sm italic" style={{ color: 'var(--text-muted)' }}>{npc.nameEn}</span>}
            </div>
            {/* Мета-строка: роль · теги · черты */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {npc.role && <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{npc.role}</span>}
              {npc.alignment && <GrayTag>{npc.alignment}</GrayTag>}
              {npc.classTags?.map((t, i) => <GrayTag key={i}>{t}</GrayTag>)}
              {npc.race && <GrayTag>{npc.race}</GrayTag>}
              {npc.tags?.filter(Boolean).length > 0 && (
                <>
                  <span style={{ color: 'var(--border-md)', margin: '0 2px' }}>·</span>
                  {npc.tags.filter(Boolean).map((t, i) => (
                    <span key={i} className="font-cinzel text-[10px] px-2 py-0.5 rounded-full italic"
                      style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '0.5px solid rgba(226,201,126,0.3)' }}>
                      {t}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-1 shrink-0 flex-wrap justify-end">
            {bestiaryMatches.map(c => (
              <button key={c.id} className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => setShowStatblock(c)}>
                <IconBook2 size={13} /> {bestiaryMatches.length > 1 ? c.name : 'Статблок'}
              </button>
            ))}
            <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={onEdit}>
              <IconPencil size={13} /> Изменить
            </button>
            <button className="icon-btn" onClick={handleDelete} title="Удалить"
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = '' }}>
              <IconTrash size={13} />
            </button>
            <button className="icon-btn" onClick={onClose}><IconX size={15} /></button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>

            {/* Левая колонка */}
            <div className="flex flex-col gap-3">
              {npc.character && (
                <NpcSection title="Характер / Внешность">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{npc.character}</p>
                </NpcSection>
              )}
              {(npc.knowledge || npc.quest) && (
                <NpcSection title="Знания / Заметки">
                  {npc.quest    && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)', marginBottom: npc.knowledge ? 8 : 0 }}>{npc.quest}</p>}
                  {npc.knowledge && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{npc.knowledge}</p>}
                </NpcSection>
              )}
              {npc.conditions && (
                <NpcSection title="Условия найма">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{npc.conditions}</p>
                </NpcSection>
              )}
              {npc.phrases?.length > 0 && (
                <NpcSection title="Фразы">
                  {npc.phrases.map((ph, i) => (
                    <p key={i} className="text-sm italic mb-1 last:mb-0"
                      style={{ color: 'var(--text-dim)', borderLeft: '2px solid rgba(226,201,126,0.3)', paddingLeft: 8 }}>
                      {ph}
                    </p>
                  ))}
                </NpcSection>
              )}
            </div>

            {/* Правая колонка */}
            <div className="flex flex-col gap-3">
              {/* Квесты */}
              {hasQuests && (
                <NpcSection title="Квесты">
                  <div className="flex flex-col gap-3">
                    {giverQuests.length > 0 && (
                      <div>
                        <div className="font-cinzel text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                          Выдаёт квест
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {giverQuests.map(q => <QuestBadge key={q.id} quest={q} onOpen={onOpenQuest} />)}
                        </div>
                      </div>
                    )}
                    {relatedQuests.length > 0 && (
                      <div>
                        <div className="font-cinzel text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                          Связан с квестами
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {relatedQuests.map(q => <QuestBadge key={q.id} quest={q} onOpen={onOpenQuest} />)}
                        </div>
                      </div>
                    )}
                  </div>
                </NpcSection>
              )}

              {/* Секрет ДМ */}
              {npc.secret && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(167,139,250,0.3)' }}>
                  <button
                    className="w-full flex items-center justify-between px-3 py-2 font-cinzel text-xs uppercase tracking-widest transition-colors"
                    style={{ background: showSecret ? 'rgba(167,139,250,0.12)' : 'rgba(167,139,250,0.06)', color: '#c4b5fd' }}
                    onClick={() => setShowSecret(s => !s)}>
                    🔒 Секрет ДМ <span>{showSecret ? '▲' : '▼'}</span>
                  </button>
                  {showSecret && (
                    <div className="px-3 py-2.5" style={{ background: 'var(--bg-deep)' }}>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{npc.secret}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GrayTag({ children }) {
  return (
    <span className="font-cinzel text-xs px-2 py-0.5 rounded-full"
      style={{ background: 'var(--bg-row)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>
      {children}
    </span>
  )
}

function QuestBadge({ quest, onOpen }) {
  const color = QUEST_STATUS_COLORS[quest.status] ?? '#9ca3af'
  return (
    <button onClick={() => onOpen?.(quest)}
      className="font-cinzel text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all"
      style={{ background: `${color}18`, border: `1px solid ${color}55`, color, cursor: onOpen ? 'pointer' : 'default' }}
      onMouseEnter={e => { if (onOpen) e.currentTarget.style.background = `${color}30` }}
      onMouseLeave={e => { if (onOpen) e.currentTarget.style.background = `${color}18` }}>
      {quest.title}
      {onOpen && <span style={{ opacity: 0.5, fontSize: 9 }}>→</span>}
    </button>
  )
}

function NpcSection({ title, children }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
      <div className="font-cinzel text-[10px] uppercase tracking-widest px-3 py-1.5"
        style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(226,201,126,0.2)', background: 'rgba(226,201,126,0.05)' }}>
        {title}
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}
