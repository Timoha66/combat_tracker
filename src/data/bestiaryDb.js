import Dexie from 'dexie'

// ─── БАЗА ДАННЫХ ──────────────────────────────────────────────────────────────
export const db = new Dexie('DMTracker')

db.version(1).stores({
  creatures: '++id, name, type, cr, source, *tags',
})

// ─── СТРУКТУРА СУЩЕСТВА ───────────────────────────────────────────────────────
// Для врагов / НПС / компаньонов / питомцев:
// {
//   id (auto),
//   name: string,
//   type: 'enemy' | 'npc' | 'companion' | 'pet',
//   size: 'Крошечный' | 'Маленький' | 'Средний' | 'Большой' | 'Огромный' | 'Исполинский',
//   creatureType: string,       // 'Гуманоид', 'Зверь', 'Нежить' и т.д.
//   cr: string,                 // '0', '1/8', '1/4', '1/2', '1'...'30'
//   proficiencyBonus: number,
//
//   hp: { average: number, formula: string },   // { average: 45, formula: '7к8+14' }
//   ac: { value: number, note: string },        // { value: 15, note: 'кожаный доспех' }
//   speed: string,              // '9 м, плавание 9 м'
//   initiative: number,         // бонус инициативы (обычно мод. Ловкости)
//
//   abilities: { str, dex, con, int, wis, cha },  // значения 1-30
//
//   savingThrows: [{ ability: 'str'|'dex'|..., bonus: number }],
//   skills: [{ name: string, bonus: number }],
//
//   resistances: string[],
//   immunities: string[],
//   vulnerabilities: string[],
//   conditionImmunities: string[],
//
//   senses: string,
//   languages: string,
//
//   traits: [{ name: string, description: string }],
//
//   actions: [{
//     name: string,
//     section: 'action' | 'bonus' | 'reaction' | 'legendary' | 'lair',
//     attackBonus: number | null,
//     damage: string | null,      // '2к6+4'
//     damageType: string | null,
//     description: string,
//   }],
//
//   legendaryResistances: number | null,
//   legendaryActionCount: number | null,
//
//   tags: string[],
//   source: 'official' | 'homebrew',
//   notes: string,
// }
//
// Для игроков (type: 'player'):
// {
//   id, name, type: 'player',
//   hp: { max: number },
//   ac: number,
//   initiative: number,   // бонус
//   abilities: { str, dex, con, int, wis, cha },
// }

export const EMPTY_CREATURE = {
  name: '',
  type: 'enemy',
  size: 'Средний',
  creatureType: 'Гуманоид',
  cr: '1',
  proficiencyBonus: 2,
  hp: { average: 10, formula: '2к8+2' },
  ac: { value: 12, note: '' },
  speed: '9 м',
  initiative: 0,
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  savingThrows: [],
  skills: [],
  resistances: [],
  immunities: [],
  vulnerabilities: [],
  conditionImmunities: [],
  senses: '',
  languages: 'Общий',
  traits: [],
  actions: [],
  legendaryResistances: null,
  legendaryActionCount: null,
  spellcasting: null,
  tags: [],
  source: 'homebrew',
  notes: '',
}

export const EMPTY_PLAYER = {
  name: '',
  type: 'player',
  hp: { max: 20 },
  ac: 12,
  initiative: 0,
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
}
