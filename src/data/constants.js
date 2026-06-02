// ─── СТАТУСЫ ЗДОРОВЬЯ ─────────────────────────────────────────────────────────
export const STATUS = {
  HEALTHY:  'healthy',
  WOUNDED:  'wounded',
  BLOODIED: 'bloodied',
  CRITICAL: 'critical',
  DYING:    'dying',
  STABLE:   'stable',
  DEAD:     'dead',
}

export const STATUS_LABEL = {
  healthy:  'Здоров',
  wounded:  'Ранен',
  bloodied: 'Окровавлен',
  critical: 'При смерти',
  dying:    'Умирает',
  stable:   'Стабилизирован',
  dead:     'Мёртв',
}

export const STATUS_PILL = {
  healthy:  'pill-healthy',
  wounded:  'pill-wounded',
  bloodied: 'pill-bloodied',
  critical: 'pill-critical',
  dying:    'pill-dying',
  stable:   'pill-stable',
  dead:     'pill-dead',
}

export function getStatus(c) {
  if (c.dead) return STATUS.DEAD
  if (c.hp.current === 0) {
    if (c.type === 'player') {
      if (c.deathSaves?.successes >= 3) return STATUS.STABLE
      return STATUS.DYING
    }
    return STATUS.DEAD
  }
  const pct = c.hp.current / c.hp.max
  if (pct <= 0.15) return STATUS.CRITICAL
  if (pct <= 0.50) return STATUS.BLOODIED
  if (pct <  1.00) return STATUS.WOUNDED
  return STATUS.HEALTHY
}

export function getHpBarColor(status) {
  switch (status) {
    case STATUS.HEALTHY:  return '#4ade80'
    case STATUS.WOUNDED:  return '#f59e0b'
    case STATUS.BLOODIED:
    case STATUS.CRITICAL: return '#ef4444'
    default:              return '#374151'
  }
}

export function getHpTextColor(status) {
  switch (status) {
    case STATUS.HEALTHY:  return 'text-green-400'
    case STATUS.WOUNDED:  return 'text-amber-400'
    case STATUS.BLOODIED:
    case STATUS.CRITICAL: return 'text-red-400'
    case STATUS.STABLE:   return 'text-blue-400'
    default:              return 'text-[var(--text-muted)]'
  }
}

// ─── ТИПЫ УРОНА ───────────────────────────────────────────────────────────────
export const DMG_TYPES = [
  // Физический
  { id: 'piercing',    label: 'Колющий',    css: 'dt-physical', group: 'phys' },
  { id: 'slashing',    label: 'Рубящий',    css: 'dt-physical', group: 'phys' },
  { id: 'bludgeoning', label: 'Дробящий',   css: 'dt-physical', group: 'phys' },
  // Элементальный
  { id: 'fire',        label: 'Огонь',      css: 'dt-fire',     group: 'elem' },
  { id: 'cold',        label: 'Холод',      css: 'dt-cold',     group: 'elem' },
  { id: 'lightning',   label: 'Молния',     css: 'dt-lightning',group: 'elem' },
  { id: 'acid',        label: 'Кислота',    css: 'dt-acid',     group: 'elem' },
  { id: 'poison',      label: 'Яд',         css: 'dt-poison',   group: 'elem' },
  { id: 'thunder',     label: 'Гром',       css: 'dt-thunder',  group: 'elem' },
  // Магический/энергетический
  { id: 'necrotic',    label: 'Некротический', css: 'dt-necrotic', group: 'magic' },
  { id: 'radiant',     label: 'Лучистый',   css: 'dt-radiant',  group: 'magic' },
  { id: 'psychic',     label: 'Психический',   css: 'dt-psychic',  group: 'magic' },
  { id: 'force',       label: 'Силовое поле',    css: 'dt-force',    group: 'magic' },
  // Магический физический (игнорирует сопротивление к физ. немагическому)
  { id: 'magic_p',     label: 'Маг. колющий',  css: 'dt-magic',    group: 'mphys' },
  { id: 'magic_s',     label: 'Маг. рубящий',  css: 'dt-magic',    group: 'mphys' },
  { id: 'magic_b',     label: 'Маг. дробящий', css: 'dt-magic',    group: 'mphys' },
]

export const DMG_TYPE_GROUPS = [
  { key: 'phys',  label: 'Физический' },
  { key: 'elem',  label: 'Элементальный' },
  { key: 'magic', label: 'Магический' },
  { key: 'mphys', label: 'Маг. физический' },
]

/** Возвращает множитель урона с учётом типа и свойств существа */
export function getTypeMult(combatant, typeId) {
  if (!typeId) return null
  const t = DMG_TYPES.find(x => x.id === typeId)
  if (!t) return null

  const isPhys      = t.group === 'phys'
  const isMagicPhys = t.group === 'mphys'

  const { immunities = [], resistances = [], vulnerabilities = [] } = combatant

  // Иммунитет
  if (immunities.includes(typeId)) return 0
  if (immunities.includes('physical') && (isPhys || isMagicPhys)) return 0

  // Уязвимость
  if (vulnerabilities.includes(typeId)) return 2
  if (vulnerabilities.includes('physical') && (isPhys || isMagicPhys)) return 2

  // Сопротивление (магический физический НЕ режется 'physical' сопротивлением)
  if (resistances.includes(typeId)) return 0.5
  if (resistances.includes('physical') && isPhys) return 0.5

  return 1
}

export function calcDamage(combatant, rawAmount, typeId, manualMult = 1) {
  const typeMult = getTypeMult(combatant, typeId) ?? 1
  return Math.floor(rawAmount * typeMult * manualMult)
}

// ─── СОСТОЯНИЯ ────────────────────────────────────────────────────────────────
export const CONDITIONS = [
  { id: 'charmed',       label: 'Очарован',         css: 'cond-purple', group: 'base' },
  { id: 'frightened',    label: 'Испуган',          css: 'cond-red',    group: 'base' },
  { id: 'paralyzed',     label: 'Парализован',      css: 'cond-red',    group: 'base' },
  { id: 'petrified',     label: 'Окаменел',         css: 'cond-red',    group: 'base' },
  { id: 'poisoned',      label: 'Отравлен',         css: 'cond-amber',  group: 'base' },
  { id: 'stunned',       label: 'Ошеломлён',        css: 'cond-amber',  group: 'base' },
  { id: 'exhaustion',    label: 'Истощён',          css: 'cond-amber',  group: 'base' },
  { id: 'blinded',       label: 'Ослеплён',         css: 'cond-amber',  group: 'base' },
  { id: 'deafened',      label: 'Оглохший',         css: 'cond-gray',   group: 'base' },
  { id: 'prone',         label: 'Сбит с ног',       css: 'cond-gray',   group: 'base' },
  { id: 'grappled',      label: 'Схвачен',          css: 'cond-gray',   group: 'base' },
  { id: 'invisible',     label: 'Невидим',          css: 'cond-blue',   group: 'base' },
  { id: 'incapacitated', label: 'Недееспособен',    css: 'cond-red',    group: 'base' },
  { id: 'restrained',    label: 'Обездвижен',       css: 'cond-blue',   group: 'base' },
  { id: 'unconscious',   label: 'Без сознания',     css: 'cond-blue',   group: 'base' },
  // Боевые состояния
  { id: 'rage',          label: 'Ярость',           css: 'cond-red',    group: 'combat' },
  { id: 'blessed',       label: 'Благословление',   css: 'cond-blue',   group: 'combat' },
  { id: 'hasted',        label: 'Ускорение',        css: 'cond-blue',   group: 'combat' },
  { id: 'concentrating', label: 'Концентрация',     css: 'cond-purple', group: 'combat' },
  { id: 'bane',          label: 'Порча',            css: 'cond-purple', group: 'combat' },
  { id: 'guidance',      label: 'Наставление',      css: 'cond-blue',   group: 'combat' },
  { id: 'bardic_insp',   label: 'Бард. вдохновение',css: 'cond-amber',  group: 'combat' },
  { id: 'lethargy',      label: 'Летаргия',         css: 'cond-gray',   group: 'combat' },
  { id: 'slowed',        label: 'Замедлен',         css: 'cond-blue',   group: 'combat' },
  { id: 'hex',           label: 'Сглаз',            css: 'cond-blue',   group: 'combat' },
  { id: 'sanctuary',     label: 'Убежище',          css: 'cond-blue',   group: 'combat' },
]

export const CONDITIONS_BASE   = CONDITIONS.filter(c => c.group === 'base')
export const CONDITIONS_COMBAT = CONDITIONS.filter(c => c.group === 'combat')

export const CONDITION_MAP = Object.fromEntries(CONDITIONS.map(c => [c.id, c]))

// ─── ПРИЛАГАТЕЛЬНЫЕ ДЛЯ ИМЁН ─────────────────────────────────────────────────
export const ADJECTIVES = [
  'Трусливый', 'Злобный', 'Одноглазый', 'Хромой', 'Рваное Ухо',
  'Громкий', 'Тихий', 'Шустрый', 'Рыжий', 'Дерзкий',
  'Кривой', 'Меченый', 'Мелкий', 'Старый', 'Зубастый',
  'Косматый', 'Драный', 'Горбатый', 'Безносый', 'Седой',
]

/** Генерирует уникальное имя для группы одинаковых существ */
export function generateName(baseName, existingNames) {
  const usedAdjs = existingNames
    .filter(n => n.startsWith(baseName + ' '))
    .map(n => n.replace(baseName + ' ', ''))
  const free = ADJECTIVES.find(a => !usedAdjs.includes(a))
  return free ? `${baseName} ${free}` : `${baseName} ${Math.floor(Math.random() * 99) + 1}`
}
