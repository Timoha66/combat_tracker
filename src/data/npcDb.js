import Dexie from 'dexie'

export const npcDb = new Dexie('DMNpcs')

npcDb.version(1).stores({
  factions: '++id, slug, title, status',
  npcs:     '++id, factionId, factionSlug, name',
})

export const FACTION_STATUSES = [
  { id: 'ally',     label: 'Союзник',        icon: '✅', color: '#4ade80' },
  { id: 'friendly', label: 'Дружелюбная',    icon: '🤝', color: '#60a5fa' },
  { id: 'neutral',  label: 'Нейтральная',    icon: '😐', color: '#9ca3af' },
  { id: 'wary',     label: 'Настороженная',  icon: '🤨', color: '#f59e0b' },
  { id: 'hostile',  label: 'Враждебная',     icon: '⚠️', color: '#f87171' },
  { id: 'enemy',    label: 'Смертельный враг', icon: '💀', color: '#ef4444' },
  { id: 'unknown',  label: 'Неизвестная',    icon: '❓', color: '#6b7280' },
]

export const FACTION_STATUS_MAP = Object.fromEntries(FACTION_STATUSES.map(s => [s.id, s]))

export const EMPTY_FACTION = {
  slug:        '',
  title:       '',
  type:        '',
  status:      'unknown',
  tags:        [],
  description: '',
  info:        [],
  quests:      [],
  dmNotes:     '',
}

export const EMPTY_NPC = {
  factionIds:  [],
  name:        '',
  nameEn:      '',
  role:        '',
  alignment:   '',
  classTags:   [],
  character:   '',
  secret:      '',
  phrases:     [],
  conditions:  '',
  knowledge:   '',
  trade:       [],
  tradeNote:   '',
  quest:       '',
  tags:        [],
  dmNotes:     '',
}
