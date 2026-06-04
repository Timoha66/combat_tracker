import Dexie from 'dexie'

export const partyDb = new Dexie('DMParty')
partyDb.version(1).stores({
  players: '++id, name',
})

export const PLAYER_SIZES = ['Крошечный','Маленький','Средний','Большой','Огромный','Исполинский']

export const EMPTY_PLAYER = {
  name:         '',
  playerClass:  '',
  level:        1,
  size:         'Средний',
  hp:           { max: 10, current: 10 },
  ac:           10,
  initiative:   0,
  speed:        '9 м',
  abilities:    { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  savingThrows: [],
  skills:       [],
  resistances:      [],
  immunities:       [],
  vulnerabilities:  [],
  conditionImmunities: [],
  senses:       '',
  languages:    'Общий',
  traits:       [],
  actions:      [],
  spellcasting: null,
  carryCapacity: '',
  exhaustion:   0,
  conditions:   '',
  notes:        '',
  // чекбоксы отображения в карточке
  showSpeed:        true,
  showSavingThrows: false,
  showSkills:       false,
  showResistances:  false,
  showSenses:       false,
  showTraits:       false,
  showActions:      true,
  showSpellcasting: false,
  showCarryCapacity:false,
  showExhaustion:   true,
  showConditions:   true,
  showNotes:        false,
}
