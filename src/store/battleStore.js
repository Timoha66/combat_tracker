import { create } from 'zustand'
import { getStatus, calcDamage, generateName, STATUS } from '../data/constants'

// ─── ФАБРИКА УЧАСТНИКА ────────────────────────────────────────────────────────
export function createCombatant(source, overrides = {}) {
  return {
    id:             crypto.randomUUID(),
    name:           source.name,
    type:           source.type ?? 'enemy',       // player | enemy | ally | npc
    initiative:     overrides.initiative ?? 10,
    hp: {
      current: source.hp ?? 10,
      max:     source.hp ?? 10,
      temp:    0,
    },
    ac: {
      base:    source.ac ?? 10,
      current: source.ac ?? 10,
    },
    conditions:     [],
    tempEffects:    [],
    deathSaves:     null,
    dead:           false,
    resistances:    source.resistances    ?? [],
    immunities:     source.immunities     ?? [],
    vulnerabilities:source.vulnerabilities ?? [],
    sourceId:       source.id ?? null,
    // ── Статистика боя ──
    damageDealt:    0,
    damageTaken:    0,
    kills:          0,
    ...overrides,
  }
}

// ─── ВЫЧИСЛЯЕМЫЙ КД ───────────────────────────────────────────────────────────
export function getEffectiveAC(combatant) {
  const shieldBonus = combatant.tempEffects
    .filter(fx => fx.name === 'Щит')
    .reduce((sum, fx) => sum + (fx.acBonus ?? 0), 0)
  return combatant.ac.current + shieldBonus
}

// ─── LIVE ORDER (только живые, по инициативе) ─────────────────────────────────
function getLiveOrder(combatants) {
  return [...combatants]
    .filter(c => getStatus(c) !== STATUS.DEAD)
    .sort((a, b) => b.initiative - a.initiative)
}

// ─── STORE ────────────────────────────────────────────────────────────────────
export const useBattleStore = create((set, get) => ({
  combatants:      [],
  currentIdx:      0,
  round:           1,
  selectedTargets: [],           // массив id выбранных целей
  view:            'tracker',    // 'tracker' | 'summary'

  // ── УЧАСТНИКИ ───────────────────────────────────────────────────────────────
  addCombatants(sourceTemplate, count, initiative) {
    set(state => {
      const existingNames = state.combatants.map(c => c.name)
      const newCombatants = []
      for (let i = 0; i < count; i++) {
        const name = count === 1
          ? sourceTemplate.name
          : generateName(sourceTemplate.name, [...existingNames, ...newCombatants.map(c => c.name)])
        newCombatants.push(createCombatant(sourceTemplate, { name, initiative }))
      }
      const all = [...state.combatants, ...newCombatants]
        .sort((a, b) => b.initiative - a.initiative)
      return { combatants: all }
    })
  },

  removeCombatant(id) {
    set(state => ({
      combatants: state.combatants.filter(c => c.id !== id),
      selectedTargets: state.selectedTargets.filter(t => t !== id),
    }))
  },

  updateCombatant(id, updater) {
    set(state => ({
      combatants: state.combatants.map(c =>
        c.id === id ? (typeof updater === 'function' ? updater(c) : { ...c, ...updater }) : c
      ),
    }))
  },

  // ── ХОДЫ ────────────────────────────────────────────────────────────────────
  nextTurn() {
    const { combatants, currentIdx, round } = get()
    const live = getLiveOrder(combatants)
    if (!live.length) return
    const nextIdx = (currentIdx + 1) % live.length
    const nextRound = nextIdx === 0 ? round + 1 : round
    // Истечение эффектов на начало хода
    const nextC = live[nextIdx]
    set(state => ({
      currentIdx: nextIdx,
      round: nextRound,
      combatants: state.combatants.map(c =>
        c.id === nextC.id
          ? { ...c, tempEffects: c.tempEffects.filter(fx => !(fx.expireOn === 'turnStart' && fx.ownerId === c.id)) }
          : c
      ),
    }))
  },

  prevTurn() {
    const { combatants, currentIdx, round } = get()
    const live = getLiveOrder(combatants)
    if (!live.length) return
    const prevIdx = currentIdx === 0 ? live.length - 1 : currentIdx - 1
    const prevRound = currentIdx === 0 && round > 1 ? round - 1 : round
    const prevC = live[prevIdx]
    set(state => ({
      currentIdx: prevIdx,
      round: prevRound,
      combatants: state.combatants.map(c =>
        c.id === prevC.id
          ? { ...c, tempEffects: c.tempEffects.filter(fx => !(fx.expireOn === 'turnStart' && fx.ownerId === c.id)) }
          : c
      ),
    }))
  },

  getCurrentCombatant() {
    const { combatants, currentIdx } = get()
    const live = getLiveOrder(combatants)
    return live[currentIdx % live.length] ?? null
  },

  // ── УРОН / ЛЕЧЕНИЕ ──────────────────────────────────────────────────────────
  applyDamage(targetIds, rawAmount, typeId, manualMult = 1) {
    set(state => {
      const live      = getLiveOrder(state.combatants)
      const attacker  = live[state.currentIdx % live.length]
      let totalDealt  = 0

      const combatants = state.combatants.map(c => {
        if (!targetIds.includes(c.id)) return c
        let dmg = calcDamage(c, rawAmount, typeId, manualMult)
        let hp  = { ...c.hp }
        if (hp.temp > 0) {
          const absorbed = Math.min(hp.temp, dmg)
          hp.temp -= absorbed
          dmg -= absorbed
        }
        const actualDmg = Math.min(hp.current, dmg)
        hp.current = Math.max(0, hp.current - dmg)
        totalDealt += actualDmg

        let dead       = c.dead
        let deathSaves = c.deathSaves
        let kills      = 0
        if (hp.current === 0) {
          if (c.type === 'player' && !dead && !deathSaves) {
            deathSaves = { successes: 0, failures: 0 }
          } else if (c.type !== 'player' && !dead) {
            dead  = true
            kills = 1
          }
        }
        return { ...c, hp, dead, deathSaves, damageTaken: (c.damageTaken ?? 0) + actualDmg, _kills: kills }
      })

      // Записываем урон и убийства атакующему
      const updatedKills = combatants.reduce((sum, c) => sum + (c._kills ?? 0), 0)
      const final = combatants.map(c => {
        const { _kills, ...rest } = c
        if (attacker && c.id === attacker.id) {
          return {
            ...rest,
            damageDealt: (rest.damageDealt ?? 0) + totalDealt,
            kills:       (rest.kills ?? 0) + updatedKills,
          }
        }
        return rest
      })

      return { combatants: final }
    })
  },

  applyHeal(targetIds, amount) {
    set(state => ({
      combatants: state.combatants.map(c => {
        if (!targetIds.includes(c.id)) return c
        const hp = { ...c.hp, current: Math.min(c.hp.max, c.hp.current + amount) }
        const recovered = hp.current > 0
        return {
          ...c,
          hp,
          dead: recovered ? false : c.dead,
          deathSaves: recovered ? null : c.deathSaves,
        }
      }),
    }))
  },

  setTempHp(targetIds, amount) {
    set(state => ({
      combatants: state.combatants.map(c =>
        targetIds.includes(c.id)
          ? { ...c, hp: { ...c.hp, temp: Math.max(c.hp.temp, amount) } }
          : c
      ),
    }))
  },

  // ── СПАСБРОСКИ СМЕРТИ ───────────────────────────────────────────────────────
  addDeathSave(id, type) {
    set(state => ({
      combatants: state.combatants.map(c => {
        if (c.id !== id || !c.deathSaves) return c
        const ds = { ...c.deathSaves }
        if (type === 'success') {
          ds.successes = Math.min(3, ds.successes + 1)
          if (ds.successes >= 3) {
            return { ...c, hp: { ...c.hp, current: 1 }, deathSaves: null }
          }
        } else {
          ds.failures = Math.min(3, ds.failures + 1)
          if (ds.failures >= 3) {
            return { ...c, dead: true, deathSaves: null }
          }
        }
        return { ...c, deathSaves: ds }
      }),
    }))
  },

  // ── ВОСКРЕШЕНИЕ ─────────────────────────────────────────────────────────────
  revive(id, hpAmount = 1) {
    set(state => ({
      combatants: state.combatants.map(c =>
        c.id === id
          ? { ...c, hp: { ...c.hp, current: Math.max(1, Math.min(c.hp.max, hpAmount)) }, dead: false, deathSaves: null }
          : c
      ),
    }))
  },

  // ── КД ──────────────────────────────────────────────────────────────────────
  setInitiative(id, value) {
    set(state => ({
      combatants: [...state.combatants]
        .map(c => c.id === id ? { ...c, initiative: value } : c)
        .sort((a, b) => b.initiative - a.initiative),
    }))
  },

  setAc(id, value) {
    set(state => ({
      combatants: state.combatants.map(c =>
        c.id === id ? { ...c, ac: { ...c.ac, current: value } } : c
      ),
    }))
  },

  revertAc(id) {
    set(state => ({
      combatants: state.combatants.map(c =>
        c.id === id ? { ...c, ac: { ...c.ac, current: c.ac.base } } : c
      ),
    }))
  },

  // ── СОСТОЯНИЯ ───────────────────────────────────────────────────────────────
  toggleCondition(id, conditionId) {
    set(state => ({
      combatants: state.combatants.map(c => {
        if (c.id !== id) return c
        const conditions = c.conditions.includes(conditionId)
          ? c.conditions.filter(x => x !== conditionId)
          : [...c.conditions, conditionId]
        return { ...c, conditions }
      }),
    }))
  },

  removeCondition(id, conditionId) {
    set(state => ({
      combatants: state.combatants.map(c =>
        c.id === id ? { ...c, conditions: c.conditions.filter(x => x !== conditionId) } : c
      ),
    }))
  },

  // ── ЩИТ (РЕАКЦИЯ) ───────────────────────────────────────────────────────────
  toggleShield(id) {
    set(state => ({
      combatants: state.combatants.map(c => {
        if (c.id !== id) return c
        const hasShield = c.tempEffects.some(fx => fx.name === 'Щит')
        const tempEffects = hasShield
          ? c.tempEffects.filter(fx => fx.name !== 'Щит')
          : [...c.tempEffects, { name: 'Щит', acBonus: 5, expireOn: 'turnStart', ownerId: id }]
        return { ...c, tempEffects }
      }),
    }))
  },

  // ── ВЫДЕЛЕНИЕ ЦЕЛЕЙ ──────────────────────────────────────────────────────────
  toggleTarget(id) {
    set(state => ({
      selectedTargets: state.selectedTargets.includes(id)
        ? state.selectedTargets.filter(t => t !== id)
        : [...state.selectedTargets, id],
    }))
  },

  clearTargets() {
    set({ selectedTargets: [] })
  },

  // ── ВИД ─────────────────────────────────────────────────────────────────────
  setView(v) {
    set({ view: v })
  },

  clearBattle() {
    set({ combatants: [], currentIdx: 0, round: 1, selectedTargets: [], view: 'tracker' })
  },
}))
