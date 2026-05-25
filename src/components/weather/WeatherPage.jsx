import { useEffect, useState } from 'react'
import { IconRefresh, IconAnchor, IconX, IconPlayerPlay, IconDownload, IconUpload } from '@tabler/icons-react'
import { useWeatherStore } from '../../store/weatherStore'
import { WEATHER, WEATHER_SCALE, PACE, PACE_SCALE, STABILITY_LEVELS, TAG_GROUPS, getNavResult } from '../../data/weatherData'

export default function WeatherPage() {
  const {
    currentWeather, currentFlavour, weatherStreak, dayCount,
    anchorWeather, anchorDaysLeft,
    stability, setStability,
    selectedPace, setSelectedPace,
    navRoll, setNavRoll, navResult,
    history,
    nextDay, setWeatherManual, rerollFlavour, setAnchor, clearAnchor, resetAll,
    exportHistory, importHistory,
  } = useWeatherStore()

  const [anchorModal,  setAnchorModal]  = useState(false)
  const [forceModal,   setForceModal]   = useState(false)
  const [anchorKey,    setAnchorKey]    = useState('storm')
  const [anchorDays,   setAnchorDays]   = useState(7)
  const [localRoll,    setLocalRoll]    = useState(navRoll)

  const weather = WEATHER[currentWeather]
  const pace    = PACE[selectedPace]

  // Инициализируем флейвор при первом открытии
  useEffect(() => {
    if (!currentFlavour) rerollFlavour()
  }, [])

  const dc = (pace?.dc ?? 15) + (weather?.dcMod ?? 0)

  function handleRollInput(e) {
    const val = e.target.value
    setLocalRoll(val)
    setNavRoll(val)
  }

  function handleResolve() {
    const total = parseInt(localRoll)
    if (isNaN(total) || total < 2) return
    // Натуральный бросок для крит-проверки — только если значение 2-19
    const natural = total <= 19 ? total : 19
    const result = getNavResult(natural, total, dc)
    useWeatherStore.setState({ navResult: result })
  }

  function handleAnchorConfirm() {
    setAnchor(anchorKey, anchorDays)
    setAnchorModal(false)
  }

  function formatDay(day) { return `День ${day}` }

  const weatherScaleColors = {
    clear: '#f59e0b', humid: '#fbbf24', drizzle: '#94a3b8',
    rain: '#60a5fa', storm: '#818cf8', front: '#a78bfa', disaster: '#f87171',
  }

  // Проверяем что текущий темп разрешён погодой
  const currentPaceIdx = PACE_SCALE.indexOf(selectedPace)
  const paceBlocked = weather?.maxPace === 0 || currentPaceIdx >= (weather?.maxPace ?? 4)

  // Помеха: либо погодная, либо комбинация погода+темп
  const comboDisadv =
    (currentWeather === 'rain'  && selectedPace === 'fast')   ||
    (currentWeather === 'storm' && selectedPace === 'normal')
  const hasDisadv = weather?.disadv || comboDisadv

  return (
    <div className="flex flex-1 overflow-hidden" style={{ minWidth: 0 }}>

      {/* ── ЛЕВАЯ КОЛОНКА: Погода ── */}
      <div className="flex flex-col overflow-y-auto p-4 gap-4" style={{ width: '50%', minWidth: 340, borderRight: '1px solid var(--border)', flexShrink: 0 }}>

        {/* Шапка с текущей погодой */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${weatherScaleColors[currentWeather]}55`, background: `${weatherScaleColors[currentWeather]}0a` }}>
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-cinzel text-3xl mb-1">{weather?.icon}</div>
                <h2 className="font-cinzel text-2xl font-bold" style={{ color: 'var(--gold)' }}>{weather?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>{formatDay(dayCount)}</span>
                  {weatherStreak > 1 && (
                    <span className="font-cinzel text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${weatherScaleColors[currentWeather]}22`, color: weatherScaleColors[currentWeather], border: `0.5px solid ${weatherScaleColors[currentWeather]}55` }}>
                      {weatherStreak}-й день подряд
                    </span>
                  )}
                  {anchorWeather && anchorDaysLeft > 0 && (
                    <span className="font-cinzel text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: '0.5px solid rgba(167,139,250,0.4)' }}>
                      ⚓ Якорь: {anchorDaysLeft} дн.
                    </span>
                  )}
                </div>
              </div>
              <button className="icon-btn" onClick={rerollFlavour} title="Новый флейвор"><IconRefresh size={15} /></button>
            </div>

            {/* Флейвор */}
            {currentFlavour && (
              <p className="text-base leading-relaxed italic mb-3" style={{ color: 'var(--text-dim)', borderLeft: `2px solid ${weatherScaleColors[currentWeather]}66`, paddingLeft: 10 }}>
                {currentFlavour}
              </p>
            )}

            {/* Теги по группам */}
            <div className="flex flex-wrap gap-1.5 mb-3 overflow-y-auto" style={{ maxHeight: 140 }}>
              {(weather?.tags ?? []).map((tag, i) => {
                const grp = TAG_GROUPS[tag.g] ?? TAG_GROUPS.danger
                return (
                  <span key={i} className="font-cinzel text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                    style={{ background: `${grp.color}18`, color: grp.color, border: `1px solid ${grp.color}55` }}>
                    <span style={{ fontSize: 10 }}>{grp.dot}</span>{tag.t}
                  </span>
                )
              })}
            </div>

            {/* Легенда */}
            <div className="flex flex-wrap gap-2">
              {Object.values(TAG_GROUPS).map(grp => (
                <span key={grp.label} className="font-cinzel flex items-center gap-1"
                  style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: 9 }}>{grp.dot}</span>
                  <span style={{ color: grp.color }}>{grp.label}</span>
                </span>
              ))}
            </div>

          {/* Характеристики погоды */}
            <div className="flex gap-3 text-xs font-cinzel pb-4" style={{ color: 'var(--text-muted)' }}>
              <span>Мод. СЛ: <strong style={{ color: weather?.dcMod > 0 ? '#f87171' : 'var(--text)' }}>+{weather?.dcMod}</strong></span>
              <span>Макс. темп: <strong style={{ color: 'var(--text)' }}>{PACE[PACE_SCALE[weather?.maxPace - 1]]?.name}</strong></span>
            </div>
          </div>
        </div>

        {/* Погодный фронт + Жёсткость — рядом */}
        <div className="flex gap-3">

          {/* Шкала погодного фронта */}
          <div className="rounded-xl p-3 flex-1" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
            <div className="font-cinzel text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Погодный фронт</div>
            <div className="flex gap-1 mb-2">
              {WEATHER_SCALE.map(key => {
                const isActive = key === currentWeather
                const isAnchor = key === anchorWeather
                const w        = WEATHER[key]
                return (
                  <button key={key}
                    onClick={() => setWeatherManual(key)}
                    title={w.name}
                    className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all cursor-pointer"
                    style={{
                      background: isActive ? `${weatherScaleColors[key]}25` : 'var(--bg-row)',
                      border: `1px solid ${isActive ? weatherScaleColors[key] : isAnchor ? 'rgba(167,139,250,0.5)' : 'var(--border)'}`,
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    }}>
                    <span style={{ fontSize: 14 }}>{w.icon}</span>
                    {isAnchor && <span style={{ fontSize: 7, color: '#c4b5fd' }}>⚓</span>}
                  </button>
                )
              })}
            </div>
            <div className="font-cinzel text-[9px] text-center" style={{ color: 'var(--text-muted)' }}>
              Нажми на иконку для смены
            </div>
          </div>

          {/* Жёсткость фронта */}
          <div className="rounded-xl p-3" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', minWidth: 180 }}>
            <div className="font-cinzel text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Жёсткость</div>
            <div className="flex flex-col gap-1">
              {STABILITY_LEVELS.map(s => (
                <button key={s.id} onClick={() => setStability(s.id)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-all cursor-pointer"
                  style={{
                    background: stability === s.id ? 'var(--gold-dim)' : 'var(--bg-row)',
                    border: `1px solid ${stability === s.id ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
                  }}>
                  <span className="font-cinzel text-xs font-semibold" style={{ color: stability === s.id ? 'var(--gold)' : 'var(--text)', minWidth: 80 }}>{s.name}</span>
                  <span className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Якорь и сброс */}
        <div className="flex gap-2">
          <button className="btn btn-ghost flex-1 justify-center" style={{ fontSize: 11 }}
            onClick={() => setAnchorModal(true)}>
            <IconAnchor size={13} /> Установить якорь
          </button>
          {anchorWeather && (
            <button className="btn btn-ghost justify-center" style={{ fontSize: 11, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
              onClick={clearAnchor}>
              <IconX size={13} /> Снять якорь
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost flex-1 justify-center" style={{ fontSize: 11 }} onClick={exportHistory}>
            <IconDownload size={13} /> Экспорт истории
          </button>
          <label className="btn btn-ghost flex-1 justify-center cursor-pointer" style={{ fontSize: 11 }}>
            <IconUpload size={13} /> Импорт истории
            <input type="file" accept=".json" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) importHistory(f); e.target.value = '' }} />
          </label>
        </div>
        <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11, color: 'var(--text-muted)' }}
          onClick={() => { if (confirm('Сбросить всё — день 1, история, якорь?')) resetAll() }}>
          <IconRefresh size={13} /> Сбросить кампанию
        </button>
      </div>

      {/* ── СРЕДНЯЯ КОЛОНКА: Навигация ── */}
      <div className="flex flex-col overflow-y-auto p-4 gap-4" style={{ flex: 1, minWidth: 280, borderRight: '1px solid var(--border)', flexShrink: 1 }}>
        <div className="font-cinzel text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Навигация</div>

        {/* Темп */}
        <div className="rounded-xl p-3" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
          <div className="font-cinzel text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Темп передвижения</div>
          <div className="flex flex-col gap-1">
            {PACE_SCALE.map(key => {
              const p        = PACE[key]
              const isActive = selectedPace === key
              const paceIdx  = PACE_SCALE.indexOf(key)
              const disabled = paceIdx >= (weather?.maxPace ?? 4)
              return (
                <button key={key}
                  onClick={() => setSelectedPace(key)}
                  disabled={disabled && !isActive}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all cursor-pointer"
                  style={{
                    background: isActive ? 'var(--gold-dim)' : 'var(--bg-row)',
                    border: `1px solid ${isActive ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
                    opacity: (disabled && !isActive) ? 0.4 : 1,
                  }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-cinzel text-sm font-semibold" style={{ color: isActive ? 'var(--gold)' : 'var(--text)' }}>{p.name}</div>
                    <div className="font-cinzel text-xs" style={{ color: isActive ? 'var(--gold)' : '#7dd3fc' }}>
                      {p.hexes} гекс/день · СЛ {p.dc}
                    </div>
                  </div>
                  {p.perks.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-end shrink-0">
                      {p.perks.map(perk => {
                        const isHide    = perk.includes('Скрытное')
                        const isPerc    = perk.includes('Восприятию')
                        const isExhaust = perk.includes('истощения')
                        const color     = isHide ? '#4ade80' : isPerc ? '#f59e0b' : '#f87171'
                        return (
                          <span key={perk} className="font-cinzel text-[9px] px-1.5 py-0.5 rounded"
                            style={{ background: `${color}18`, color, border: `0.5px solid ${color}44` }}>
                            {isHide ? '👁 ' : isPerc ? '⚠️ ' : '💀 '}{perk}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Итоговая СЛ */}
        <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
          {weather?.maxPace === 0 ? (
            <>
              <div className="font-cinzel text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Навигация</div>
              <div className="font-cinzel text-xl font-bold" style={{ color: '#ef4444' }}>⛔ Движение невозможно</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Катастрофа — укрытие обязательно</div>
            </>
          ) : (
            <>
              <div className="font-cinzel text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Итоговая СЛ навигации</div>
              <div className="font-cinzel text-5xl font-bold" style={{ color: 'var(--gold)' }}>{dc}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                СЛ {pace?.dc} (темп) + {weather?.dcMod} (погода)
              </div>
              {hasDisadv && (
                <div className="mt-2 font-cinzel text-xs px-3 py-1 rounded-lg"
                  style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: '0.5px solid rgba(167,139,250,0.4)' }}>
                  ⚠️ Помеха на бросок навигации
                </div>
              )}
            </>
          )}
        </div>

        {/* Бросок */}
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
          <div className="font-cinzel text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Результат проверки</div>

          {/* Крит кнопки */}
          <div className="flex gap-2 mb-2">
            <button className="flex-1 btn font-cinzel text-xs py-2 justify-center rounded-lg cursor-pointer"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)', opacity: paceBlocked ? 0.35 : 1, cursor: paceBlocked ? 'not-allowed' : 'pointer' }}
              disabled={paceBlocked}
              onClick={() => { setLocalRoll('1'); useWeatherStore.setState({ navResult: getNavResult(1, 1, dc) }) }}>
              💀 Крит-провал (1)
            </button>
            <button className="flex-1 btn font-cinzel text-xs py-2 justify-center rounded-lg cursor-pointer"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)', opacity: paceBlocked ? 0.35 : 1, cursor: paceBlocked ? 'not-allowed' : 'pointer' }}
              disabled={paceBlocked}
              onClick={() => { setLocalRoll('20'); useWeatherStore.setState({ navResult: getNavResult(20, 20, dc) }) }}>
              ⭐ Крит-успех (20)
            </button>
          </div>

          {paceBlocked && (
            <div className="font-cinzel text-xs text-center mb-2 py-1.5 rounded-lg"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.3)' }}>
              ⚠️ {weather?.maxPace === 0 ? 'Движение невозможно при катастрофе' : `Выбранный темп недоступен при ${weather?.name}`}
            </div>
          )}

          {/* Обычный бросок */}
          <div className="font-cinzel text-[10px] mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Или введи результат (может быть выше 20 с бонусами):
          </div>
          <div className="flex gap-2 mb-3">
            <input
              type="number" min="2" max="99"
              value={localRoll}
              onChange={handleRollInput}
              onKeyDown={e => e.key === 'Enter' && handleResolve()}
              placeholder="Итог броска"
              className="flex-1 rounded-lg px-3 py-2 text-center font-cinzel text-xl font-bold outline-none"
              style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
            />
            <button className="btn btn-add px-4" onClick={handleResolve} title="Применить (Enter)"
              disabled={paceBlocked} style={{ opacity: paceBlocked ? 0.35 : 1 }}>
              <IconPlayerPlay size={18} />
            </button>
          </div>

          {/* Результат */}
          {navResult && (
            <div className="rounded-xl px-4 py-3 mb-3" style={{ background: `${navResult.color}12`, border: `1px solid ${navResult.color}44` }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 20 }}>{navResult.icon}</span>
                <span className="font-cinzel text-sm font-bold" style={{ color: navResult.color }}>{navResult.label}</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{navResult.text}</p>
            </div>
          )}

          {/* Следующий день */}
          <button className="btn btn-add w-full justify-center" onClick={nextDay}>
            ☀️ Следующий день
          </button>
        </div>
      </div>

      {/* ── ПРАВАЯ КОЛОНКА: История ── */}
      <div className="flex-1 overflow-y-auto p-4" style={{ minWidth: 180 }}>
        <div className="font-cinzel text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>История дней</div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-muted)', minHeight: 200 }}>
            <div className="text-3xl mb-2">📅</div>
            <div className="font-cinzel text-xs">История пуста</div>
            <div className="text-xs mt-1">Начни новый день чтобы вести лог</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((entry, i) => {
              const w   = WEATHER[entry.weather]
              const p   = PACE[entry.pace]
              const col = { clear: '#f59e0b', humid: '#fbbf24', drizzle: '#94a3b8', rain: '#60a5fa', storm: '#818cf8', front: '#a78bfa', disaster: '#f87171' }[entry.weather]
              const navRes = entry.result ? [
                { id: 'crit-fail', label: 'Крит-провал', color: '#ef4444', icon: '💀' },
                { id: 'fail-big',  label: 'Провал (7+)', color: '#f87171', icon: '❌' },
                { id: 'fail-mid',  label: 'Провал (4–6)', color: '#f59e0b', icon: '⚠️' },
                { id: 'fail-small',label: 'Провал (1–3)', color: '#fbbf24', icon: '🔶' },
                { id: 'pass',      label: 'Успех', color: '#4ade80', icon: '✅' },
                { id: 'crit-pass', label: 'Крит-успех', color: '#34d399', icon: '⭐' },
              ].find(r => r.id === entry.result) : null

              return (
                <div key={i} className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-panel)', border: `1px solid ${col}33` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-cinzel text-xs font-bold" style={{ color: 'var(--text-muted)', minWidth: 50 }}>День {entry.day}</span>
                    <span>{w?.icon}</span>
                    <span className="font-cinzel text-sm" style={{ color: col }}>{w?.name}</span>
                    {entry.streak > 1 && (
                      <span className="font-cinzel text-[10px] ml-auto px-2 py-0.5 rounded-full"
                        style={{
                          background: `${col}22`,
                          color: col,
                          border: `1px solid ${col}55`,
                          fontWeight: 600,
                        }}>
                        🔁 {entry.streak} дня подряд
                      </span>
                    )}
                  </div>
                  {(entry.pace || entry.roll) && (
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {p && <span>{p.icon} {p.name}</span>}
                      {entry.roll && <span>Бросок: {entry.roll}</span>}
                      {navRes && (
                        <span style={{ color: navRes.color }}>{navRes.icon} {navRes.label}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── МОДАЛКА ЯКОРЯ ── */}
      {anchorModal && (
        <div className="overlay" style={{ zIndex: 300 }}>
          <div className="modal" style={{ width: 380 }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>⚓ Установить якорь погоды</span>
              <button className="icon-btn ml-auto" onClick={() => setAnchorModal(false)}><IconX size={15} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
              Якорь удерживает погоду в выбранном состоянии на несколько дней. Смена возможна, но маловероятна.
            </p>
            <div className="mb-3">
              <div className="font-cinzel text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Погода</div>
              <div className="grid grid-cols-4 gap-1">
                {WEATHER_SCALE.map(key => (
                  <button key={key} onClick={() => setAnchorKey(key)}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg cursor-pointer"
                    style={{
                      background: anchorKey === key ? 'var(--gold-dim)' : 'var(--bg-row)',
                      border: `1px solid ${anchorKey === key ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
                    }}>
                    <span style={{ fontSize: 18 }}>{WEATHER[key].icon}</span>
                    <span className="font-cinzel text-[9px]" style={{ color: anchorKey === key ? 'var(--gold)' : 'var(--text-muted)' }}>{WEATHER[key].name.split('/')[0].trim()}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="font-cinzel text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Количество дней: {anchorDays}</div>
              <input type="range" min="1" max="14" value={anchorDays} onChange={e => setAnchorDays(Number(e.target.value))}
                className="w-full" style={{ accentColor: 'var(--gold)' }} />
              <div className="flex justify-between font-cinzel text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>1 день</span><span>7 дней</span><span>14 дней</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-cancel flex-1 justify-center" onClick={() => setAnchorModal(false)}><IconX size={14} /> Отмена</button>
              <button className="btn btn-add flex-1 justify-center" onClick={handleAnchorConfirm}><IconAnchor size={14} /> Установить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
