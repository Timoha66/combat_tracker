import Dexie from 'dexie'

export const questDb = new Dexie('DMQuests')

questDb.version(1).stores({
  quests: '++id, type, status, questGiverNpcId',
})

export const QUEST_TYPES = [
  { id: 'main',     label: 'Основной',    icon: '⭐', color: '#f59e0b' },
  { id: 'side',     label: 'Побочный',    icon: '📋', color: '#60a5fa' },
  { id: 'faction',  label: 'Фракционный', icon: '⚔️', color: '#c4b5fd' },
  { id: 'personal', label: 'Личный',      icon: '👤', color: '#4ade80' },
]

export const QUEST_STATUSES = [
  { id: 'inactive', label: 'Не выдан',  icon: '📋', color: '#6b7280' },
  { id: 'active',   label: 'Активен',   icon: '⚡', color: '#f59e0b' },
  { id: 'done',     label: 'Выполнен',  icon: '✅', color: '#4ade80' },
  { id: 'failed',   label: 'Провален',  icon: '❌', color: '#f87171' },
  { id: 'waiting',  label: 'Ожидание',  icon: '⏳', color: '#60a5fa' },
]

export const QUEST_STATUS_MAP = Object.fromEntries(QUEST_STATUSES.map(s => [s.id, s]))
export const QUEST_TYPE_MAP   = Object.fromEntries(QUEST_TYPES.map(t => [t.id, t]))

export const EMPTY_QUEST = {
  title:             '',
  type:              'side',
  status:            'inactive',
  description:       '',
  conditionsGet:     '',
  conditionsDone:    '',
  reward:            '',
  questGiverNpcId:   null,
  relatedNpcIds:     [],
  relatedLocationIds:[],
  notes:             '',
}
