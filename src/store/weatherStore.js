import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { rollNextWeather, rollAnchorWeather, randomFlavour, WEATHER_SCALE, WEATHER, PACE, getNavResult } from '../data/weatherData'

export const useWeatherStore = create(
  persist(
    (set, get) => ({
      // ── Текущее состояние ───────────────────────────────────────────────────
      currentWeather: 'humid',
      currentFlavour: '',
      weatherStreak:  1,
      dayCount:       1,

      // ── Якорь ───────────────────────────────────────────────────────────────
      anchorWeather:  null,
      anchorDaysLeft: 0,

      // ── Настройки ───────────────────────────────────────────────────────────
      stability: 3,

      // ── Навигация ───────────────────────────────────────────────────────────
      selectedPace:   'normal',
      navRoll:        '',
      navResult:      null,

      // ── История ─────────────────────────────────────────────────────────────
      history: [],

      // ── ACTIONS ─────────────────────────────────────────────────────────────
      nextDay() {
        const { currentWeather, dayCount, weatherStreak, anchorWeather, anchorDaysLeft, stability, selectedPace, navRoll, navResult, history } = get()

        // Сохраняем текущий день в историю (если был результат навигации)
        const entry = {
          day:     dayCount,
          weather: currentWeather,
          streak:  weatherStreak,
          pace:    selectedPace,
          roll:    navRoll,
          result:  navResult?.id ?? null,
        }
        const newHistory = [entry, ...history].slice(0, 20)

        // Новая погода
        let newWeather
        let newAnchorDaysLeft = anchorDaysLeft

        if (anchorWeather && anchorDaysLeft > 0) {
          newWeather        = rollAnchorWeather(anchorWeather)
          newAnchorDaysLeft = anchorDaysLeft - 1
        } else {
          newWeather = rollNextWeather(currentWeather, stability)
          if (newAnchorDaysLeft > 0) newAnchorDaysLeft = 0
        }

        const newStreak = newWeather === currentWeather ? weatherStreak + 1 : 1

        set({
          currentWeather:  newWeather,
          currentFlavour:  randomFlavour(newWeather),
          weatherStreak:   newStreak,
          dayCount:        dayCount + 1,
          anchorDaysLeft:  newAnchorDaysLeft,
          anchorWeather:   newAnchorDaysLeft > 0 ? anchorWeather : null,
          navRoll:         '',
          navResult:       null,
          history:         newHistory,
        })
      },

      setWeatherManual(weatherKey) {
        set({
          currentWeather: weatherKey,
          currentFlavour: randomFlavour(weatherKey),
          weatherStreak:  1,
          anchorWeather:  null,
          anchorDaysLeft: 0,
        })
      },

      rerollFlavour() {
        const { currentWeather } = get()
        set({ currentFlavour: randomFlavour(currentWeather) })
      },

      setAnchor(weatherKey, days) {
        set({
          anchorWeather:   weatherKey,
          anchorDaysLeft:  days,
          currentWeather:  weatherKey,
          currentFlavour:  randomFlavour(weatherKey),
          weatherStreak:   1,
        })
      },

      clearAnchor() {
        set({ anchorWeather: null, anchorDaysLeft: 0 })
      },

      setStability(v)   { set({ stability: v }) },
      setSelectedPace(v){ set({ selectedPace: v, navResult: null, navRoll: '' }) },
      setNavRoll(v)     { set({ navRoll: v }) },

      resolveNavigation() {
        const { navRoll, selectedPace, currentWeather } = get()
        const roll = parseInt(navRoll)
        if (isNaN(roll) || roll < 1) return
        const dc = (PACE[selectedPace]?.dc ?? 15) + (WEATHER[currentWeather]?.dcMod ?? 0)
        const natural = roll <= 20 ? roll : 19
        const result = getNavResult(natural, roll, dc)
        set({ navResult: result })
      },

      resetAll() {
        set({
          currentWeather: 'humid', currentFlavour: '', weatherStreak: 1, dayCount: 1,
          anchorWeather: null, anchorDaysLeft: 0, stability: 3,
          selectedPace: 'normal', navRoll: '', navResult: null, history: [],
        })
      },
    }),
    { name: 'dm-weather' }
  )
)
