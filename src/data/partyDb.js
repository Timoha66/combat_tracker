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

export const EMPTY_PLAYER = {
  name:    '',
  classes: [{ cls: '', level: 1 }],   // мультикласс
  size:    'Средний',
  hp:          { max: 10 },
  ac:          10,
  initiative:  0,
  speed:       '9 м',
  abilities:   { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  savingThrows:       [],
  skills:             [],
  resistances:        [],
  immunities:         [],
  vulnerabilities:    [],
  conditionImmunities:[],
  specialSenses: [],         // [{ type: 'darkvision', range: 60 }]
  proficiencies: { languages: '', armor: '', weapons: '', tools: '' },
  traits:  [],               // { name, description, actionType }
  actions: [],               // { name, section, attackBonus, reach, range, damages: [{count,die,dmgType,bonuses:[]}], description }
  spellcasting: null,
  carryCapacity: '',
  exhaustion:    0,
  conditions:    '',
  notes:         '',
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
  showCarryCapacity: false,
  showExhaustion:    true,
  showConditions:    true,
  showNotes:         false,
}

export function totalLevel(player) {
  return (player.classes ?? []).reduce((s, c) => s + (Number(c.level) || 0), 0)
}

export function classLabel(player) {
  const cls = player.classes ?? []
  if (cls.length === 0) return ''
  return cls.filter(c => c.cls).map(c => `${c.cls} ${c.level}`).join(' / ')
}
