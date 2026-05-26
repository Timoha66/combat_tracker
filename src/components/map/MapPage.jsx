import { useEffect, useRef, useState, useCallback } from 'react'
import {
  IconMapPin, IconMapPinOff, IconPlus, IconX, IconTrash, IconPencil,
  IconBuildingCastle, IconSword, IconBuildingArch, IconAnchor, IconTree,
  IconTool, IconSkull, IconTent, IconAlertTriangle, IconQuestionMark,
  IconNote, IconBolt, IconShip, IconPaw, IconDiamond, IconCheck,
  IconDownload, IconUpload,
} from '@tabler/icons-react'
import { useMapStore } from '../../store/mapStore'
import { useLocationsStore } from '../../store/locationsStore'

const MAP_URL = `${import.meta.env.BASE_URL}chult_map.jpg`
const IMG_W   = 1611
const IMG_H   = 2160

export const PIN_TYPES = [
  { id: 'city',       label: 'Город',           Icon: IconBuildingCastle, color: '#1e3a5f', accent: '#60a5fa' },
  { id: 'fort',       label: 'Форт',            Icon: IconSword,          color: '#3b2a1a', accent: '#f59e0b' },
  { id: 'ruins',      label: 'Руины',           Icon: IconBuildingArch,   color: '#2d1b3d', accent: '#c4b5fd' },
  { id: 'bay',        label: 'Бухта',           Icon: IconAnchor,         color: '#1a3340', accent: '#67e8f9' },
  { id: 'nature',     label: 'Природа',         Icon: IconTree,           color: '#1a2e1a', accent: '#4ade80' },
  { id: 'structure',  label: 'Сооружение',      Icon: IconTool,           color: '#2a2018', accent: '#fbbf24' },
  { id: 'undead',     label: 'Нежить',          Icon: IconSkull,          color: '#3d1a1a', accent: '#fca5a5' },
  { id: 'camp',       label: 'Лагерь',          Icon: IconTent,           color: '#2a2a1a', accent: '#fde68a' },
  { id: 'danger',     label: 'Опасность',       Icon: IconAlertTriangle,  color: '#3d1a1a', accent: '#fdba74' },
  { id: 'unknown',    label: '❓ Неизвестное',  Icon: IconQuestionMark,   color: '#1a2040', accent: '#c4b5fd' },
  { id: 'note',       label: 'Заметка',         Icon: IconNote,           color: '#1a2535', accent: '#93c5fd' },
  { id: 'event',      label: 'Событие',         Icon: IconBolt,           color: '#2a1a3d', accent: '#f0abfc' },
  { id: 'shipwreck',  label: 'Кораблекрушение', Icon: IconShip,           color: '#1a2535', accent: '#7dd3fc' },
  { id: 'monster',    label: 'Монстр',          Icon: IconPaw,            color: '#3a1a2a', accent: '#f9a8d4' },
  { id: 'treasure',   label: 'Сокровище',       Icon: IconDiamond,        color: '#1a3a2a', accent: '#6ee7b7' },
]

// ─── PIN MARKER ───────────────────────────────────────────────────────────────
function PinMarker({ pin, onClick, onDrag, selected }) {
  const pt = PIN_TYPES.find(p => p.id === pin.type) ?? PIN_TYPES[9]
  const { Icon } = pt
  const isDragging = useRef(false)
  const didDrag    = useRef(false)

  function onMouseDown(e) {
    if (e.button !== 0) return
    e.stopPropagation()
    isDragging.current = true
    didDrag.current    = false

    function onMove(ev) {
      if (!isDragging.current) return
      didDrag.current = true
      const img  = document.querySelector('[data-mapimg]')
      if (!img) return
      const rect = img.getBoundingClientRect()
      const nx   = (ev.clientX - rect.left) / rect.width
      const ny   = (ev.clientY - rect.top)  / rect.height
      onDrag(pin.id, Math.max(0, Math.min(1, nx)), Math.max(0, Math.min(1, ny)))
    }
    function onUp(ev) {
      isDragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      // Если не было перемещения — считаем кликом
      if (!didDrag.current) onClick(pin)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position:  'absolute',
        left:      pin.x * IMG_W,
        top:       pin.y * IMG_H,
        transform: 'translate(-50%, -100%)',
        cursor:    'grab',
        zIndex:    selected ? 20 : 10,
      }}
    >
      {/* Pin body */}
      <div
        style={{ cursor: 'grab', filter: selected ? 'drop-shadow(0 0 6px rgba(226,201,126,0.8))' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))', transition: 'filter 0.15s' }}
        title={pin.label || pt.label}
      >
        <svg width="20" height="26" viewBox="0 0 26 32">
          <path d="M13 0 C5.8 0 0 5.8 0 13 C0 21 13 32 13 32 C13 32 26 21 26 13 C26 5.8 20.2 0 13 0Z"
            fill={pt.color} stroke={selected ? '#e2c97e' : `${pt.accent}99`} strokeWidth={selected ? 1.5 : 1}/>
          <circle cx="13" cy="13" r="7" fill={`${pt.accent}20`}/>
        </svg>
        <div style={{ position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
          <Icon size={10} color={pt.accent} />
        </div>
      </div>

      {/* Label */}
      {pin.label && (
        <div style={{
          position: 'absolute', top: 27, left: '50%', transform: 'translateX(-50%)',
          whiteSpace: 'nowrap', fontFamily: 'Cinzel, serif', fontSize: 9,
          color: pt.accent, background: 'rgba(13,17,23,0.88)',
          padding: '1px 5px', borderRadius: 3,
          border: `0.5px solid ${pt.accent}44`, pointerEvents: 'none',
        }}>
          {pin.label}
        </div>
      )}
    </div>
  )
}

// ─── TOKEN ────────────────────────────────────────────────────────────────────
function Token({ x, y, onDragEnd }) {
  const isDragging = useRef(false)

  function onMouseDown(e) {
    e.stopPropagation()
    isDragging.current = true

    function onMove(ev) {
      if (!isDragging.current) return
      const img  = document.querySelector('[data-mapimg]')
      if (!img) return
      const rect = img.getBoundingClientRect()
      const nx   = (ev.clientX - rect.left) / rect.width
      const ny   = (ev.clientY - rect.top)  / rect.height
      onDragEnd(Math.max(0, Math.min(1, nx)), Math.max(0, Math.min(1, ny)))
    }
    function onUp() {
      isDragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left:     x * IMG_W,
        top:      y * IMG_H,
        transform:'translate(-50%, -50%)',
        cursor:   'grab',
        zIndex:   30,
        filter:   'drop-shadow(0 0 6px rgba(226,201,126,0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
      }}
      title="Жетон партии (перетаскивай)"
    >
      <svg width="26" height="26" viewBox="0 0 48 48">
        <defs>
          <linearGradient id="hexGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#f5e6a0" />
            <stop offset="40%"  stopColor="#e2c97e" />
            <stop offset="100%" stopColor="#9a7a2a" />
          </linearGradient>
        </defs>
        {/* Flat-top hexagon */}
        <polygon points="46,24 35,5 13,5 2,24 13,43 35,43"
          fill="url(#hexGold)" stroke="#f0d060" strokeWidth="2"/>
        <polygon points="42,24 33,9 15,9 6,24 15,39 33,39"
          fill="none" stroke="rgba(255,240,150,0.4)" strokeWidth="1"/>
        <text x="24" y="30" textAnchor="middle"
          fontFamily="serif" fontSize="16" fill="#3a2800" fontWeight="bold">⚔</text>
      </svg>
    </div>
  )
}

// ─── PIN MODAL ────────────────────────────────────────────────────────────────
function PinModal({ pin, onClose, onSave, onDelete, locations }) {
  const isNew = !pin.id
  const [form, setForm] = useState({
    type:       pin.type       ?? 'unknown',
    label:      pin.label      ?? '',
    notes:      pin.notes      ?? '',
    locationId: pin.locationId ?? null,
  })

  return (
    <div className="overlay" style={{ zIndex: 400 }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-md)', width: 480, maxWidth: '95vw', maxHeight: '85vh' }}>

        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="font-cinzel text-base font-semibold" style={{ color: 'var(--text)' }}>
            {isNew ? 'Новый пин' : 'Редактировать пин'}
          </span>
          <button className="icon-btn ml-auto" onClick={onClose}><IconX size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div>
            <div className="font-cinzel text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Тип пина</div>
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {PIN_TYPES.map(pt => {
                const active = form.type === pt.id
                return (
                  <button key={pt.id}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg cursor-pointer transition-all"
                    style={{ background: active ? `${pt.accent}18` : 'var(--bg-row)', border: `1px solid ${active ? pt.accent + '66' : 'var(--border)'}` }}
                    onClick={() => setForm(f => ({ ...f, type: pt.id }))}>
                    <pt.Icon size={16} color={active ? pt.accent : 'var(--text-muted)'} />
                    <span className="font-cinzel text-[9px] text-center leading-tight"
                      style={{ color: active ? pt.accent : 'var(--text-muted)' }}>
                      {pt.label.replace(' ❓', '').replace('❓ ', '')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Название</div>
            <input className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
              value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="Название пина..." />
          </div>

          <div>
            <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Привязка к локации</div>
            <select className="w-full rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer"
              style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
              value={form.locationId ?? ''}
              onChange={e => setForm(f => ({ ...f, locationId: e.target.value ? Number(e.target.value) : null }))}>
              <option value="">— Без привязки —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>

          <div>
            <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Заметки ДМ</div>
            <textarea className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)', minHeight: 70 }}
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Заметки о месте..." />
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          {!isNew && (
            <button className="btn btn-ghost" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={onDelete}>
              <IconTrash size={14} /> Удалить
            </button>
          )}
          <button className="btn btn-cancel flex-1 justify-center" onClick={onClose}><IconX size={14} /> Отмена</button>
          <button className="btn btn-gold flex-1 justify-center" onClick={() => onSave(form)}>
            <IconCheck size={14} /> Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── VIEW PIN CARD ────────────────────────────────────────────────────────────
function PinCard({ pin, locations, onEdit, onDelete, onClose, onOpenLocation }) {
  const pt  = PIN_TYPES.find(p => p.id === pin.type) ?? PIN_TYPES[9]
  const loc = locations.find(l => l.id === pin.locationId)
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 300, width: 340,
      background: 'var(--bg-panel)', border: `1px solid ${pt.accent}55`,
      borderRadius: 16, overflow: 'hidden',
      boxShadow: `0 8px 32px rgba(0,0,0,0.6)`,
    }}>
      <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)', background: `${pt.color}aa` }}>
        <pt.Icon size={16} color={pt.accent} />
        <span className="font-cinzel text-sm font-bold flex-1" style={{ color: pt.accent }}>{pin.label || pt.label}</span>
        <button className="btn btn-ghost" style={{ fontSize: 10, padding: '2px 8px' }} onClick={onEdit}>
          <IconPencil size={12} /> Изменить
        </button>
        <button className="btn btn-ghost" style={{ fontSize: 10, padding: '2px 8px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
          onClick={() => onDelete(pin.id)}>
          <IconTrash size={12} /> Удалить
        </button>
        <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={onClose}><IconX size={12} /></button>
      </div>
      {pin.notes && <div className="px-4 py-2 text-sm" style={{ color: 'var(--text-dim)' }}>{pin.notes}</div>}
      {loc && (
        <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11, color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)' }}
            onClick={() => { onClose(); if (onOpenLocation) onOpenLocation(loc) }}>
            <IconMapPin size={12} /> Открыть: {loc.title}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── MAIN MAP PAGE ────────────────────────────────────────────────────────────
export default function MapPage({ onNavigateToLocation }) {
  const { pins, showPins, tokenX, tokenY, transformX, transformY, transformScale,
          loadPins, addPin, updatePin, deletePin, setTokenPos, togglePins,
          setMapTransform, exportMap, importMap } = useMapStore()
  const locations    = useLocationsStore(s => s.locations)
  const loadLocations = useLocationsStore(s => s.loadAll)

  const containerRef = useRef(null)
  const [transform, setTransform] = useState({ x: transformX, y: transformY, scale: transformScale })
  const [addMode,      setAddMode]      = useState(false)
  const [selectedPin,  setSelectedPin]  = useState(null)
  const [editingPin,   setEditingPin]   = useState(null)
  const [newPinCoords, setNewPinCoords] = useState(null)

  const isPanning = useRef(false)
  const panStart  = useRef({ mx: 0, my: 0, tx: 0, ty: 0 })

  useEffect(() => {
    loadPins()
    loadLocations()
    // Центрируем только если зум ещё не был сохранён (первый визит)
    if (transformScale === 0.35 && transformX === 0 && containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect()
      const initX = width / 2 - IMG_W * 0.35 / 2
      setTransform({ x: initX, y: 20, scale: 0.35 })
      setMapTransform(initX, 20, 0.35)
    }
  }, [])

  const saveTimer = useRef(null)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setMapTransform(transform.x, transform.y, transform.scale)
    }, 500)
  }, [transform.x, transform.y, transform.scale])

  const handleWheel = useCallback(e => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(t => {
      const newScale = Math.max(0.15, Math.min(4, t.scale * delta))
      const rect     = containerRef.current.getBoundingClientRect()
      const mx       = e.clientX - rect.left
      const my       = e.clientY - rect.top
      return { x: mx - (mx - t.x) * (newScale / t.scale), y: my - (my - t.y) * (newScale / t.scale), scale: newScale }
    })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  function onMouseDown(e) {
    if (addMode || e.button !== 0) return
    isPanning.current = true
    panStart.current  = { mx: e.clientX, my: e.clientY, tx: transform.x, ty: transform.y }
  }
  function onMouseMove(e) {
    if (!isPanning.current) return
    setTransform(t => ({ ...t, x: panStart.current.tx + e.clientX - panStart.current.mx, y: panStart.current.ty + e.clientY - panStart.current.my }))
  }
  function onMouseUp() { isPanning.current = false }

  function onMapClick(e) {
    if (!addMode) return
    if (e.target.closest('[data-pin]') || e.target.closest('[data-token]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const nx   = (e.clientX - rect.left) / rect.width
    const ny   = (e.clientY - rect.top)  / rect.height
    setNewPinCoords({ x: Math.max(0, Math.min(1, nx)), y: Math.max(0, Math.min(1, ny)) })
    setEditingPin({ type: 'unknown', label: '', notes: '', locationId: null })
    setAddMode(false)
  }

  async function handleDragPin(id, x, y) {
    await updatePin(id, { x, y })
  }

  async function handleSavePin(formData) {
    if (editingPin?.id) { await updatePin(editingPin.id, formData); setSelectedPin(null) }
    else if (newPinCoords) { await addPin({ ...formData, x: newPinCoords.x, y: newPinCoords.y }); setNewPinCoords(null) }
    setEditingPin(null)
  }

  async function handleDeletePin(id) {
    await deletePin(id)
    if (selectedPin?.id === id) setSelectedPin(null)
    if (editingPin?.id  === id) setEditingPin(null)
  }

  async function handleDeletePinWithConfirm(id) {
    if (!confirm('Удалить пин?')) return
    await handleDeletePin(id)
  }

  const btnStyle = (active, danger) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
    fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 600,
    border: `1px solid ${active ? 'rgba(226,201,126,0.6)' : danger ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.15)'}`,
    background: active ? 'rgba(226,201,126,0.2)' : danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)',
    color: active ? '#e2c97e' : danger ? '#f87171' : '#cbd5e1',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0d1117' }}>

      {/* ── TOOLBAR ── */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        zIndex: 100, display: 'flex', gap: 8, alignItems: 'center',
        background: 'rgba(10,12,20,0.95)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, padding: '8px 14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}>
        <button style={btnStyle(addMode, false)}
          onClick={() => setAddMode(m => !m)}>
          <IconPlus size={15} />
          {addMode ? 'Кликни на карту...' : 'Добавить пин'}
        </button>

        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.12)' }} />

        <button style={btnStyle(false, !showPins)} onClick={togglePins}>
          {showPins ? <IconMapPin size={15} /> : <IconMapPinOff size={15} />}
          {showPins ? 'Пины видны' : 'Пины скрыты'}
        </button>

        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.12)' }} />

        <button style={btnStyle(false, false)} onClick={exportMap} title="Экспорт карты">
          <IconDownload size={15} /> Экспорт
        </button>
        <label style={{ ...btnStyle(false, false), cursor: 'pointer' }} title="Импорт карты">
          <IconUpload size={15} /> Импорт
          <input type="file" accept=".json" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files[0]; if (f) importMap(f).catch(err => alert('Ошибка: ' + err.message)); e.target.value = '' }} />
        </label>

        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.12)' }} />

        <span style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: '#64748b' }}>
          🖱 Колёсико — зум · Drag — перемещение · ⚔ перетаскивается
        </span>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', cursor: addMode ? 'crosshair' : 'grab', userSelect: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
          onClick={onMapClick}
        >
          <img data-mapimg src={MAP_URL} alt="Карта Чульта"
            width={IMG_W} height={IMG_H}
            style={{ display: 'block', userSelect: 'none', pointerEvents: 'none' }}
            draggable={false} />

          <div data-token style={{ position: 'absolute', top: 0, left: 0 }}>
            <Token x={tokenX} y={tokenY} onDragEnd={setTokenPos} />
          </div>

          {showPins && pins.map(pin => (
            <div key={pin.id} data-pin style={{ position: 'absolute', top: 0, left: 0 }}>
              <PinMarker
                pin={pin}
                selected={selectedPin?.id === pin.id}
                onClick={p => setSelectedPin(selectedPin?.id === p.id ? null : p)}
                onDrag={handleDragPin}
              />
            </div>
          ))}
        </div>
      </div>

      {selectedPin && !editingPin && (
        <PinCard
          pin={selectedPin} locations={locations}
          onEdit={() => setEditingPin(selectedPin)}
          onDelete={handleDeletePin}
          onClose={() => setSelectedPin(null)}
          onOpenLocation={onNavigateToLocation}
        />
      )}

      {editingPin && (
        <PinModal
          pin={editingPin} locations={locations}
          onClose={() => { setEditingPin(null); setNewPinCoords(null) }}
          onSave={handleSavePin}
          onDelete={() => handleDeletePinWithConfirm(editingPin.id)}
        />
      )}

      {addMode && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(226,201,126,0.15)', border: '1px solid rgba(226,201,126,0.5)',
          borderRadius: 10, padding: '8px 16px', zIndex: 200,
          fontFamily: 'Cinzel, serif', fontSize: 12, color: '#e2c97e',
        }}>
          Кликни на карту чтобы разместить пин · ESC для отмены
        </div>
      )}
    </div>
  )
}
