import Dexie from 'dexie'

export const spellDb = new Dexie('DMSpells')
spellDb.version(1).stores({
  spells: '++id, name, level, school, source',
})

export const SPELL_SCHOOLS = [
  { id: 'abjuration',    label: 'Ограждение' },
  { id: 'conjuration',   label: 'Вызов' },
  { id: 'divination',    label: 'Прорицание' },
  { id: 'enchantment',   label: 'Очарование' },
  { id: 'evocation',     label: 'Воплощение' },
  { id: 'illusion',      label: 'Иллюзия' },
  { id: 'necromancy',    label: 'Некромантия' },
  { id: 'transmutation', label: 'Преобразование' },
]
export const SPELL_SCHOOL_MAP = Object.fromEntries(SPELL_SCHOOLS.map(s => [s.id, s]))

export const SPELL_CLASSES = [
  'Варвар', 'Бард', 'Жрец', 'Друид', 'Воин', 'Монах',
  'Паладин', 'Следопыт', 'Плут', 'Чародей', 'Колдун', 'Волшебник', 'Изобретатель',
]

export const SPELL_SOURCES = [
  { id: 'PHB',    label: "PHB — Player's Handbook" },
  { id: 'XGE',    label: "XGE — Xanathar's Guide to Everything" },
  { id: 'TCE',    label: "TCE — Tasha's Cauldron of Everything" },
  { id: 'BMT',    label: 'BMT — Book of Many Things' },
  { id: 'IDRotF', label: 'IDRotF — Icewind Dale: Rime of the Frostmaiden' },
  { id: 'UA',     label: 'UA — Unearthed Arcana' },
  { id: 'HB',     label: 'HB — Homebrew' },
]

export const CASTING_TIME_UNITS = [
  { id: 'action',   label: 'действие',          hasCount: false },
  { id: 'bonus',    label: 'бонусное действие',  hasCount: false },
  { id: 'reaction', label: 'реакция',            hasCount: false, hasCondition: true },
  { id: 'minute',   label: 'минута',             hasCount: true },
  { id: 'hour',     label: 'час',                hasCount: true },
  { id: 'special',  label: 'специальное',        hasCount: false, hasCondition: true },
]

export const RANGE_TYPES = [
  { id: 'self',      label: 'На себя',     hasValue: false },
  { id: 'touch',     label: 'Касание',     hasValue: false },
  { id: 'feet',      label: 'Футы',        hasValue: true },
  { id: 'miles',     label: 'Мили',        hasValue: true },
  { id: 'sight',     label: 'Видимость',   hasValue: false },
  { id: 'unlimited', label: 'Любая',       hasValue: false },
  { id: 'special',   label: 'Специальная', hasValue: false, hasCondition: true },
]

export const DURATION_TYPES = [
  { id: 'instant',         label: 'Мгновенная',       hasValue: false },
  { id: 'rounds',          label: 'Раундов',           hasValue: true },
  { id: 'minutes',         label: 'Минут',             hasValue: true },
  { id: 'hours',           label: 'Часов',             hasValue: true },
  { id: 'days',            label: 'Дней',              hasValue: true },
  { id: 'until_dispelled', label: 'Пока не рассеётся', hasValue: false },
  { id: 'special',         label: 'Специальная',       hasValue: false, hasCondition: true },
]

// ─── ЭФФЕКТЫ ──────────────────────────────────────────────────────────────────
export const EFFECT_TYPES = [
  { id: '',         label: '— не выбрано —' },
  { id: 'save',     label: 'Спасбросок' },
  { id: 'damage',   label: 'Урон' },           // объединяет рукопашную и дальнобойную атаки
  { id: 'utility',  label: 'Вспомогательное' },
  { id: 'healing',  label: 'Лечение' },
  { id: 'special',  label: 'Специальное' },
]

export const SAVE_ABILITIES = [
  { id: 'str', label: 'Сила' },
  { id: 'dex', label: 'Ловкость' },
  { id: 'con', label: 'Телосложение' },
  { id: 'int', label: 'Интеллект' },
  { id: 'wis', label: 'Мудрость' },
  { id: 'cha', label: 'Харизма' },
]
export const SAVE_ABILITY_MAP = Object.fromEntries(SAVE_ABILITIES.map(a => [a.id, a.label]))

export const DIE_SIZES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']

// ─── ПУСТЫЕ ШАБЛОНЫ ───────────────────────────────────────────────────────────
export const EMPTY_EFFECT = {
  type: '',
  saveAbility: '',
  damages: [{ count: 1, die: 'd6', dmgType: '' }],
  specialText: '',
}

export const EMPTY_UPCAST = {
  enabled: false,
  progressionType: 'extra_target', // 'extra_target' | 'extra_damage'
  cantripLevels: { 5: '', 11: '', 17: '' },
  customText: '',
}

export const EMPTY_SPELL = {
  name:          '',
  nameEn:        '',
  level:         0,
  school:        'evocation',
  castingTime:   { unit: 'action', value: 1, condition: '' },
  range:         { type: 'feet', value: 30, condition: '' },
  duration:      { type: 'instant', value: 1, condition: '' },
  concentration: false,
  ritual:        false,
  components:    { verbal: false, somatic: false, material: false, materialDesc: '' },
  description:   '',
  higherLevels:  '',
  effects:       [{ ...EMPTY_EFFECT }],
  upcast:        { ...EMPTY_UPCAST },
  classes:       [],
  source:        'PHB',
}

// ─── НОРМАЛИЗАЦИЯ СТАРЫХ ДАННЫХ ───────────────────────────────────────────────
function normalizeEffect(e) {
  if (!e) return { ...EMPTY_EFFECT }
  let type = e.type ?? ''
  // Старые типы → новый тип 'damage'
  if (type === 'melee_attack' || type === 'ranged_attack') type = 'damage'
  // Нормализуем массив урона
  const rawDmg = e.damages ?? (e.damage ? [{ formula: e.damage, dmgType: e.damageType }] : [])
  const damages = rawDmg.map(d => {
    if (d.die) return d // уже новый формат
    // Парсим старый формат: "2d6", "1d8+4", "3d10"
    const m = (d.formula || '').match(/^(\d+)(d\d+)/i)
    if (m) return { count: parseInt(m[1]), die: m[2].toLowerCase(), dmgType: d.dmgType || d.type || '' }
    if (d.formula) return { count: 1, die: 'd6', dmgType: d.dmgType || '' }
    return { count: 1, die: 'd6', dmgType: d.dmgType || '' }
  }).filter(d => d)
  return {
    type,
    saveAbility: e.saveAbility ?? '',
    damages:     damages.length ? damages : [{ count: 1, die: 'd6', dmgType: '' }],
    specialText: e.specialText ?? '',
  }
}

export function normalizeSpell(raw) {
  if (!raw) return { ...EMPTY_SPELL }
  let s = { ...raw }
  // effect → effects[]
  if (!s.effects) {
    s.effects = s.effect ? [normalizeEffect(s.effect)] : [{ ...EMPTY_EFFECT }]
  } else {
    s.effects = s.effects.map(normalizeEffect)
  }
  // upcast
  if (!s.upcast) {
    s.upcast = { ...EMPTY_UPCAST }
  }
  return s
}

// ─── ФОРМАТИРОВАНИЕ УРОНА ─────────────────────────────────────────────────────
export function formatDieFormula(d) {
  if (!d) return ''
  if (d.die) return `${d.count || 1}${d.die}` // новый формат
  return d.formula || ''                        // старый формат
}

// ─── ФОРМАТИРОВАНИЕ АПКАСТА ───────────────────────────────────────────────────
const ORD_GEN = { 2:'второго',3:'третьего',4:'четвёртого',5:'пятого',6:'шестого',7:'седьмого',8:'восьмого',9:'девятого' }
function ordGen(n) { return ORD_GEN[n] || `${n}-го` }

export function formatUpcast(spell) {
  const u = spell.upcast
  if (!u?.enabled) return spell.higherLevels || ''
  if (spell.level === 0) {
    const cl = u.cantripLevels ?? {}
    const parts = []
    if (cl[5])  parts.push(`на 5 уровне — ${cl[5]}`)
    if (cl[11]) parts.push(`на 11 уровне — ${cl[11]}`)
    if (cl[17]) parts.push(`на 17 уровне — ${cl[17]}`)
    return parts.length ? 'Урон заговора увеличивается: ' + parts.join(', ') + '.' : ''
  }
  if (u.progressionType === 'extra_target') {
    const next = spell.level + 1
    return `Если вы накладываете это заклинание, используя ячейку ${ordGen(next)} уровня или выше, вы можете сделать целью одно дополнительное существо за каждый уровень ячейки выше ${spell.level}.`
  }
  return u.customText || ''
}

// ─── ФОРМАТИРОВАНИЕ ВРЕМЕНИ / ДИСТАНЦИИ / ДЛИТЕЛЬНОСТИ ───────────────────────
export function formatCastingTime(ct) {
  if (!ct) return '—'
  if (ct.unit === 'action')   return '1 действие'
  if (ct.unit === 'bonus')    return '1 бонусное действие'
  if (ct.unit === 'reaction') return ct.condition ? `1 реакция, ${ct.condition}` : '1 реакция'
  if (ct.unit === 'special')  return ct.condition || 'Специальное'
  const v = ct.value ?? 1
  if (ct.unit === 'minute') return `${v} ${v === 1 ? 'минута' : v < 5 ? 'минуты' : 'минут'}`
  if (ct.unit === 'hour')   return `${v} ${v === 1 ? 'час' : v < 5 ? 'часа' : 'часов'}`
  return '—'
}

export function formatRange(r) {
  if (!r) return '—'
  if (r.type === 'self')      return 'На себя'
  if (r.type === 'touch')     return 'Касание'
  if (r.type === 'sight')     return 'Видимость'
  if (r.type === 'unlimited') return 'Любая'
  if (r.type === 'feet')      return `${r.value ?? 30} футов`
  if (r.type === 'miles')     { const v = r.value ?? 1; return `${v} ${v === 1 ? 'миля' : v < 5 ? 'мили' : 'миль'}` }
  if (r.type === 'special')   return r.condition || 'Специальная'
  return '—'
}

export function formatDuration(d, concentration) {
  if (!d) return '—'
  let base = ''
  if      (d.type === 'instant')         base = 'Мгновенная'
  else if (d.type === 'rounds')     { const v = d.value ?? 1; base = `${v} ${v === 1 ? 'раунд' : v < 5 ? 'раунда' : 'раундов'}` }
  else if (d.type === 'minutes')    { const v = d.value ?? 1; base = `${v} ${v === 1 ? 'минута' : v < 5 ? 'минуты' : 'минут'}` }
  else if (d.type === 'hours')      { const v = d.value ?? 1; base = `${v} ${v === 1 ? 'час' : v < 5 ? 'часа' : 'часов'}` }
  else if (d.type === 'days')       { const v = d.value ?? 1; base = `${v} ${v === 1 ? 'день' : v < 5 ? 'дня' : 'дней'}` }
  else if (d.type === 'until_dispelled') base = 'Пока не рассеётся'
  else if (d.type === 'special')    base = d.condition || 'Специальная'
  if (concentration && d.type !== 'instant') return `Концентрация, вплоть до ${base.toLowerCase()}`
  return base
}
