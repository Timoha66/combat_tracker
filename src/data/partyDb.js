import Dexie from 'dexie'

export const partyDb = new Dexie('DMParty')
partyDb.version(1).stores({ players: '++id, name' })

export const PLAYER_SIZES = ['Крошечный','Маленький','Средний','Большой','Огромный','Исполинский']

export const PLAYER_CLASSES = [
  'Варвар','Бард','Жрец','Друид','Воин','Монах',
  'Паладин','Следопыт','Плут','Чародей','Колдун','Волшебник','Изобретатель',
]

export const SPECIAL_SENSES = [
  { id: 'darkvision',  label: 'Тёмное зрение' },
  { id: 'blindsight',  label: 'Слепое зрение' },
  { id: 'tremorsense', label: 'Чувство вибрации' },
  { id: 'truesight',   label: 'Истинное зрение' },
]

// Навык → характеристика (D&D 5e)
export const SKILL_ABILITY = {
  'Акробатика':             'dex',
  'Анализ':                 'int',
  'Атлетика':               'str',
  'Внимание':               'wis',
  'Выживание':              'wis',
  'Запугивание':            'cha',
  'История':                'int',
  'Магия':                  'int',
  'Медицина':               'wis',
  'Обман':                  'cha',
  'Обращение с животными':  'wis',
  'Природа':                'int',
  'Проницательность':       'wis',
  'Религия':                'int',
  'Скрытность':             'dex',
  'Убеждение':              'cha',
  'Ловкость рук':           'dex',
}

export const SKILLS_LIST = Object.keys(SKILL_ABILITY)

// ─── Вспомогательные функции ──────────────────────────────────────────────────
export function totalLevel(player) {
  return (player.classes ?? []).reduce((s, c) => s + (Number(c.level) || 0), 0)
}

export function classLabel(player) {
  return (player.classes ?? []).filter(c => c.cls).map(c => `${c.cls} ${c.level}`).join(' / ')
}

export function profBonus(level) {
  return Math.floor((Math.max(1, level) - 1) / 4) + 2
}

export function abilityMod(val) {
  return Math.floor(((val ?? 10) - 10) / 2)
}

export function effectiveAC(player) {
  return (player.ac ?? 10) + (player.shield ? 2 : 0)
}

export function carryMax(player) {
  return (player.abilities?.str ?? 10) * 15
}

// ─── Пустой персонаж ──────────────────────────────────────────────────────────
export const EMPTY_PLAYER = {
  name:    '',
  classes: [{ cls: '', level: 1 }],
  size:    'Средний',

  // Боевые
  hp:         { max: 10 },
  ac:         10,
  shield:     false,
  initiative: 0,
  speed: { walk: 9, swim: null, fly: null, burrow: null, climb: null },

  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },

  // savingThrows: [{ ability: 'str', override: null }]
  savingThrows: [],
  // skills: [{ name: 'Акробатика', proficiency: 'proficient', override: null }]
  skills: [],

  resistances:         [],
  immunities:          [],
  vulnerabilities:     [],
  conditionImmunities: [],

  specialSenses: [],
  proficiencies: { languages: '', armor: '', weapons: '', tools: '' },

  traits:  [],
  actions: [],
  spellcasting: null,

  exhaustion: 0,
  conditions: '',
  notes:      '',

  // отображение в карточке
  showSpeed:         true,
  showSavingThrows:  false,
  showSkills:        false,
  showResistances:   false,
  showSenses:        false,
  showProficiencies: false,
  showTraits:        false,
  showActions:       true,
  showSpellcasting:  false,
  showExhaustion:    true,
  showConditions:    true,
  showCarry:         false,
  showNotes:         false,
}
