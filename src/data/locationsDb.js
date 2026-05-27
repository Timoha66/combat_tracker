import Dexie from 'dexie'

export const locDb = new Dexie('DMLocations')

locDb.version(1).stores({
  locations: '++id, title, cat, *tags',
})

export const LOCATION_CATEGORIES = [
  { id: 'cities',     label: 'Города и поселения',  icon: '🏙' },
  { id: 'forts',      label: 'Форты и лагери',       icon: '⚔' },
  { id: 'ruins',      label: 'Руины и святилища',    icon: '🏛' },
  { id: 'coasts',     label: 'Бухты и побережье',    icon: '⚓' },
  { id: 'nature',     label: 'Природные локации',    icon: '🌿' },
  { id: 'structures', label: 'Сооружения',           icon: '🔧' },
]

export const CAT_MAP = Object.fromEntries(LOCATION_CATEGORIES.map(c => [c.id, c]))

export const QUEST_STATUSES = [
  { id: 'inactive', label: 'Не выдан',  icon: '📋', color: 'var(--text-muted)' },
  { id: 'active',   label: 'Активен',   icon: '⚡', color: '#f59e0b' },
  { id: 'done',     label: 'Выполнен',  icon: '✅', color: '#4ade80' },
  { id: 'failed',   label: 'Провален',  icon: '❌', color: '#f87171' },
  { id: 'waiting',  label: 'Ожидание',  icon: '⏳', color: '#60a5fa' },
]

export const QUEST_STATUS_MAP = Object.fromEntries(QUEST_STATUSES.map(s => [s.id, s]))

export const QUICK_TAGS = [
  'Союзный', 'Враждебный', 'Нейтральный',
  'Исследована', 'Не исследована', 'Опасно',
  'Долина', 'Ущелье', 'Река', 'Озеро', 'Остров', 'Болото', 'Пустошь', 'Воронка',
  'Залив', 'Бухта', 'Пляж', 'Пиратская база',
  'Зиккурат', 'Подводный', 'Деревня-призрак', 'Летающий остров',
  'Башня', 'Корабль', 'Шахта', 'Монастырь', 'Кузница',
]

export const EMPTY_LOCATION = {
  title:      '',
  en:         '',
  cat:        'cities',
  type:       '',
  tags:       [],
  atmosphere: '',
  chars:      '',
  npcs:       [],
  questIds:   [],
  points:     [],
  dmNotes:    '',
}
