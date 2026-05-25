import { useEffect, useRef, useState, useCallback } from 'react'
import {
  IconMapPin, IconMapPinOff, IconPlus, IconX, IconTrash, IconPencil,
  IconBuildingCastle, IconSword, IconBuildingArch, IconAnchor, IconTree,
  IconTool, IconSkull, IconTent, IconAlertTriangle, IconQuestionMark,
  IconNote, IconBolt, IconShip, IconPaw, IconDiamond, IconCheck,
} from '@tabler/icons-react'
import { useMapStore } from '../../store/mapStore'
import { useLocationsStore } from '../../store/locationsStore'

const MAP_URL = `${import.meta.env.BASE_URL}chult_map.jpg`
const IMG_W   = 1611
const IMG_H   = 2160

export const PIN_TYPES = [
  { id: 'city',       label: 'Город',            Icon: IconBuildingCastle, color: '#1e3a5f', accent: '#60a5fa' },
  { id: 'fort',       label: 'Форт',             Icon: IconSword,          color: '#3b2a1a', accent: '#f59e0b' },
  { id: 'ruins',      label: 'Руины',            Icon: IconBuildingArch,   color: '#2d1b3d', accent: '#c4b5fd' },
  { id: 'bay',        label: 'Бухта',            Icon: IconAnchor,         color: '#1a3340', accent: '#67e8f9' },
  { id: 'nature',     label: 'Природа',          Icon: IconTree,           color: '#1a2e1a', accent: '#4ade80' },
  { id: 'structure',  label: 'Сооружение',       Icon: IconTool,           color: '#2a2018', accent: '#fbbf24' },
  { id: 'undead',     label: 'Нежить',           Icon: IconSkull,          color: '#3d1a1a', accent: '#fca5a5' },
  { id: 'camp',       label: 'Лагерь',           Icon: IconTent,           color: '#2a2a1a', accent: '#fde68a' },
  { id: 'danger',     label: 'Опасность',        Icon: IconAlertTriangle,  color: '#3d1a1a', accent: '#fdba74' },
  { id: 'unknown',    label: 'Неизвестное ❓',   Icon: IconQuestionMark,   color: '#1a2040', accent: '#c4b5fd' },
  { id: 'note',       label: 'Заметка',          Icon: IconNote,           color: '#1a2535', accent: '#93c5fd' },
  { id: 'event',      label: 'Событие',          Icon: IconBolt,           color: '#2a1a3d', accent: '#f0abfc' },
  { id: 'shipwreck',  label: 'Кораблекрушение',  Icon: IconShip,           color: '#1a2535', accent: '#7dd3fc' },
  { id: 'monster',    label: 'Монстр',           Icon: IconPaw,            color: '#3a1a2a', accent: '#f9a8d4' },
  { id: 'treasure',   label: 'Сокровище',        Icon: IconDiamond,        color: '#1a3a2a', accent: '#6ee7b7' },
]

// ─── PIN MARKER ───────────────────────────────────────────────────────────────
function PinMarker({ pin, onClick, selected }) {
  const pt = PIN_TYPES.find(p => p.id === pin.type) ?? PIN_TYPES[9]
  const { Icon } = pt
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(pin) }}
      style={{
        position:  'absolute',
        left:      pin.x * IMG_W,
        top:       pin.y * IMG_H,
        transform: 'translate(-50%, -100%)',
        cursor:    'pointer',
        zIndex:    selected ? 20 : 10,
        filter:    selected ? 'drop-shadow(0 0 8px rgba(226,201,126,0.9))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
        transition: 'filter 0.15s, transform 0.15s',
      }}
      title={pin.label || pt.label}
    >
      <svg width="34" height="42" viewBox="0 0 34 42" style={{ display: 'block' }}>
        <path d="M17 0 C7.6 0 0 7.6 0 17 C0 28 17 42 17 42 C17 42 34 28 34 17 C34 7.6 26.4 0 17 0Z"
          fill={pt.color} stroke={selected ? '#e2c97e' : `${pt.accent}88`} strokeWidth={selected ? 2 : 1.5}/>
        <circle cx="17" cy="17" r="10" fill={`${pt.accent}22`} />
      </svg>
      <div style={{
        position:  'absolute', top: 5, left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }}>
        <Icon size={16} color={pt.accent} />
      </div>
      {pin.label && (
        <div style={{
          position:    'absolute',
          top:         44,
          left:        '50%',
          transform:   'translateX(-50%)',
          whiteSpace:  'nowrap',
          fontFamily:  'Cinzel, serif',
          fontSize:    10,
          color:       pt.accent,
          background:  'rgba(13,17,23,0.85)',
          padding:     '1px 6px',
          borderRadius: 4,
          border:      `0.5px solid ${pt.accent}44`,
          pointerEvents: 'none',
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
  const startMouse = useRef({ x: 0, y: 0 })
  const startPos   = useRef({ x, y })
  const imgRef     = useRef(null)

  function onMouseDown(e) {
    e.stopPropagation()
    isDragging.current  = true
    startMouse.current  = { x: e.clientX, y: e.clientY }
    startPos.current    = { x, y }
    imgRef.current      = e.currentTarget.closest('[data-mapimg]')

    function onMove(ev) {
      if (!isDragging.current) return
      const img   = document.querySelector('[data-mapimg]')
      if (!img) return
      const rect  = img.getBoundingClientRect()
      const nx    = (ev.clientX - rect.left) / rect.width
      const ny    = (ev.clientY - rect.top)  / rect.height
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
        position:  'absolute',
        left:      x * IMG_W,
        top:       y * IMG_H,
        transform: 'translate(-50%, -50%)',
        cursor:    'grab',
        zIndex:    30,
        filter:    'drop-shadow(0 0 10px rgba(226,201,126,0.7))',
      }}
      title="Партия"
    >
      <svg width="48" height="48" viewBox="0 0 52 52">
        <polygon points="26,4 48,16 48,36 26,48 4,36 4,16"
          fill="rgba(226,201,126,0.15)" stroke="#e2c97e" strokeWidth="2"/>
        <polygon points="26,10 43,19 43,33 26,42 9,33 9,19"
          fill="none" stroke="rgba(226,201,126,0.3)" strokeWidth="1"/>
        <text x="26" y="32" textAnchor="middle"
          fontFamily="serif" fontSize="18" fill="#e2c97e">⚔</text>
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

          {/* Тип */}
          <div>
            <div className="font-cinzel text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Тип пина</div>
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {PIN_TYPES.map(pt => {
                const active = form.type === pt.id
                return (
                  <button key={pt.id}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: active ? `${pt.accent}18` : 'var(--bg-row)',
                      border: `1px solid ${active ? pt.accent + '66' : 'var(--border)'}`,
                    }}
                    onClick={() => setForm(f => ({ ...f, type: pt.id }))}>
                    <pt.Icon size={16} color={active ? pt.accent : 'var(--text-muted)'} />
                    <span className="font-cinzel text-[9px] text-center leading-tight"
                      style={{ color: active ? pt.accent : 'var(--text-muted)' }}>
                      {pt.label.replace(' ❓', '')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Название */}
          <div>
            <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Название (необязательно)</div>
            <input className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
              value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="Название пина..." />
          </div>

          {/* Привязка к локации */}
          <div>
            <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Привязка к локации (необязательно)</div>
            <select className="w-full rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer"
              style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)' }}
              value={form.locationId ?? ''}
              onChange={e => setForm(f => ({ ...f, locationId: e.target.value ? Number(e.target.value) : null }))}>
              <option value="">— Без привязки —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>

          {/* Заметки */}
          <div>
            <div className="font-cinzel text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Заметки ДМ</div>
            <textarea className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-md)', color: 'var(--text)', minHeight: 80 }}
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Заметки о месте..." />
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          {!isNew && (
            <button className="btn btn-ghost" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
              onClick={onDelete}>
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
function PinCard({ pin, locations, onEdit, onClose, onOpenLocation }) {
  const pt  = PIN_TYPES.find(p => p.id === pin.type) ?? PIN_TYPES[9]
  const loc = locations.find(l => l.id === pin.locationId)

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 300, width: 340,
      background: 'var(--bg-panel)', border: `1px solid ${pt.accent}55`,
      borderRadius: 16, overflow: 'hidden',
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${pt.accent}22`,
    }}>
      <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)', background: `${pt.color}88` }}>
        <pt.Icon size={18} color={pt.accent} />
        <span className="font-cinzel text-sm font-bold flex-1" style={{ color: pt.accent }}>
          {pin.label || pt.label}
        </span>
        <button className="btn btn-ghost" style={{ fontSize: 10, padding: '2px 8px' }} onClick={onEdit}>
          <IconPencil size={12} /> Изменить
        </button>
        <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={onClose}><IconX size={13} /></button>
      </div>
      {pin.notes && (
        <div className="px-4 py-2 text-sm" style={{ color: 'var(--text-dim)' }}>{pin.notes}</div>
      )}
      {loc && (
        <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-ghost w-full justify-center" style={{ fontSize: 11, color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)' }}
            onClick={() => onOpenLocation(loc)}>
            <IconMapPin size={13} /> Открыть локацию: {loc.title}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── MAIN MAP PAGE ────────────────────────────────────────────────────────────
export default function MapPage({ onNavigateToLocation }) {
  const { pins, showPins, tokenX, tokenY, loadPins, addPin, updatePin, deletePin, setTokenPos, togglePins } = useMapStore()
  const locations = useLocationsStore(s => s.locations)
  const loadLocations = useLocationsStore(s => s.loadAll)

  const containerRef = useRef(null)
  const [transform,   setTransform]   = useState({ x: 0, y: 0, scale: 0.35 })
  const [addMode,     setAddMode]     = useState(false)
  const [selectedPin, setSelectedPin] = useState(null)
  const [editingPin,  setEditingPin]  = useState(null) // null | pin | 'new'+coords
  const [newPinCoords,setNewPinCoords]= useState(null)

  const isPanning = useRef(false)
  const panStart  = useRef({ mx: 0, my: 0, tx: 0, ty: 0 })

  useEffect(() => {
    loadPins()
    loadLocations()
    // Центрируем карту при загрузке
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      setTransform({ x: width / 2 - IMG_W * 0.35 / 2, y: 20, scale: 0.35 })
    }
  }, [])

  // ── Wheel zoom ──
  const handleWheel = useCallback(e => {
    e.preventDefault()
    const delta    = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(t => {
      const newScale = Math.max(0.15, Math.min(4, t.scale * delta))
      const rect     = containerRef.current.getBoundingClientRect()
      const mx       = e.clientX - rect.left
      const my       = e.clientY - rect.top
      const nx       = mx - (mx - t.x) * (newScale / t.scale)
      const ny       = my - (my - t.y) * (newScale / t.scale)
      return { x: nx, y: ny, scale: newScale }
    })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ── Pan ──
  function onMouseDown(e) {
    if (addMode) return
    if (e.button !== 0) return
    isPanning.current = true
    panStart.current  = { mx: e.clientX, my: e.clientY, tx: transform.x, ty: transform.y }
    e.currentTarget.style.cursor = 'grabbing'
  }

  function onMouseMove(e) {
    if (!isPanning.current) return
    const dx = e.clientX - panStart.current.mx
    const dy = e.clientY - panStart.current.my
    setTransform(t => ({ ...t, x: panStart.current.tx + dx, y: panStart.current.ty + dy }))
  }

  function onMouseUp(e) {
    isPanning.current = false
    if (containerRef.current) containerRef.current.style.cursor = addMode ? 'crosshair' : 'grab'
  }

  // ── Click on map to add pin ──
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

  async function handleSavePin(formData) {
    if (editingPin?.id) {
      await updatePin(editingPin.id, formData)
      setSelectedPin(null)
    } else if (newPinCoords) {
      await addPin({ ...formData, x: newPinCoords.x, y: newPinCoords.y })
      setNewPinCoords(null)
    }
    setEditingPin(null)
  }

  async function handleDeletePin() {
    if (editingPin?.id) {
      await deletePin(editingPin.id)
      setEditingPin(null)
      setSelectedPin(null)
    }
  }

  function handleTokenDrag(x, y) {
    setTokenPos(x, y)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0d1117' }}>

      {/* ── TOOLBAR ── */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        zIndex: 100, display: 'flex', gap: 8, alignItems: 'center',
        background: 'rgba(13,17,23,0.92)', border: '1px solid var(--border-md)',
        borderRadius: 12, padding: '8px 12px', backdropFilter: 'blur(8px)',
      }}>
        <button
          className="btn font-cinzel"
          style={{
            fontSize: 11, gap: 6,
            background: addMode ? 'rgba(226,201,126,0.2)' : 'var(--bg-row)',
            color: addMode ? 'var(--gold)' : 'var(--text-muted)',
            border: `1px solid ${addMode ? 'rgba(226,201,126,0.5)' : 'var(--border)'}`,
            animation: addMode ? 'pulse 1.5s infinite' : 'none',
          }}
          onClick={() => setAddMode(m => !m)}
        >
          <IconPlus size={14} />
          {addMode ? 'Кликни на карту...' : 'Добавить пин'}
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        <button
          className="btn font-cinzel"
          style={{
            fontSize: 11, gap: 6,
            background: showPins ? 'var(--bg-row)' : 'rgba(248,113,113,0.1)',
            color: showPins ? 'var(--text-muted)' : '#f87171',
            border: `1px solid ${showPins ? 'var(--border)' : 'rgba(248,113,113,0.3)'}`,
          }}
          onClick={togglePins}
        >
          {showPins ? <IconMapPin size={14} /> : <IconMapPinOff size={14} />}
          {showPins ? 'Пины видны' : 'Пины скрыты'}
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        <span className="font-cinzel text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Прокрутка — зум · Перетащи карту · Жетон ⚔ перетаскивается
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
        {/* Transformed map layer */}
        <div
          style={{
            position:  'absolute',
            transformOrigin: '0 0',
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
          onClick={onMapClick}
        >
          {/* Map image */}
          <img
            data-mapimg
            src={MAP_URL}
            alt="Карта Чульта"
            width={IMG_W}
            height={IMG_H}
            style={{ display: 'block', userSelect: 'none', pointerEvents: 'none' }}
            draggable={false}
          />

          {/* Token */}
          <div data-token style={{ position: 'absolute', top: 0, left: 0 }}>
            <Token x={tokenX} y={tokenY} onDragEnd={handleTokenDrag} />
          </div>

          {/* Pins */}
          {showPins && pins.map(pin => (
            <div key={pin.id} data-pin style={{ position: 'absolute', top: 0, left: 0 }}>
              <PinMarker
                pin={pin}
                selected={selectedPin?.id === pin.id}
                onClick={p => {
                  if (selectedPin?.id === p.id) setSelectedPin(null)
                  else setSelectedPin(p)
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── PIN CARD (view) ── */}
      {selectedPin && !editingPin && (
        <PinCard
          pin={selectedPin}
          locations={locations}
          onEdit={() => { setEditingPin(selectedPin) }}
          onClose={() => setSelectedPin(null)}
          onOpenLocation={loc => {
            setSelectedPin(null)
            if (onNavigateToLocation) onNavigateToLocation(loc)
          }}
        />
      )}

      {/* ── PIN MODAL (edit/create) ── */}
      {editingPin && (
        <PinModal
          pin={editingPin}
          locations={locations}
          onClose={() => { setEditingPin(null); setNewPinCoords(null) }}
          onSave={handleSavePin}
          onDelete={handleDeletePin}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(226,201,126,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(226,201,126,0); }
        }
      `}</style>
    </div>
  )
}
