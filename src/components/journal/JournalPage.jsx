import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import {
  IconPlus, IconTrash, IconBold, IconItalic,
  IconList, IconListNumbers, IconH1, IconH2, IconTablePlus,
  IconDownload, IconUpload,
} from '@tabler/icons-react'
import { useJournalStore } from '../../store/journalStore'

// ─── ТУЛБАР ───────────────────────────────────────────────────────────────────
function Toolbar({ editor }) {
  if (!editor) return null

  const btn = (active) => ({
    background:   active ? 'var(--gold-dim)' : 'var(--bg-row)',
    color:        active ? 'var(--gold)'     : 'var(--text-muted)',
    border:       `1px solid ${active ? 'rgba(226,201,126,0.4)' : 'var(--border)'}`,
    borderRadius: 6,
    padding:      '4px 8px',
    cursor:       'pointer',
    display:      'flex',
    alignItems:   'center',
    gap:          4,
    transition:   'all 0.15s',
  })

  const div = <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b flex-wrap shrink-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
      <button style={btn(editor.isActive('bold'))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
        title="Жирный (Ctrl+B)"><IconBold size={14} /></button>
      <button style={btn(editor.isActive('italic'))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
        title="Курсив (Ctrl+I)"><IconItalic size={14} /></button>

      {div}

      <button style={btn(editor.isActive('heading', { level: 1 }))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }}
        title="Заголовок 1"><IconH1 size={14} /></button>
      <button style={btn(editor.isActive('heading', { level: 2 }))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
        title="Заголовок 2"><IconH2 size={14} /></button>

      {div}

      <button style={btn(editor.isActive('bulletList'))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
        title="Маркированный список"><IconList size={14} /></button>
      <button style={btn(editor.isActive('orderedList'))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
        title="Нумерованный список"><IconListNumbers size={14} /></button>

      {div}

      <button style={btn(editor.isActive('table'))}
        onMouseDown={e => {
          e.preventDefault()
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }}
        title="Вставить таблицу 3×3">
        <IconTablePlus size={14} />
        <span style={{ fontSize: 10, fontFamily: 'Cinzel, serif' }}>Таблица</span>
      </button>

      {editor.isActive('table') && (
        <>
          <button style={btn(false)}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().addColumnAfter().run() }}
            title="Добавить колонку">
            <span style={{ fontSize: 10, fontFamily: 'Cinzel, serif' }}>+Кол.</span>
          </button>
          <button style={btn(false)}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().addRowAfter().run() }}
            title="Добавить строку">
            <span style={{ fontSize: 10, fontFamily: 'Cinzel, serif' }}>+Стр.</span>
          </button>
          <button style={{ ...btn(false), color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().deleteTable().run() }}
            title="Удалить таблицу">
            <IconTrash size={12} />
          </button>
        </>
      )}

      <span className="ml-auto font-cinzel text-[9px]" style={{ color: 'var(--text-muted)' }}>
        автосохранение
      </span>
    </div>
  )
}

// ─── РЕДАКТОР СЕССИИ ──────────────────────────────────────────────────────────
function SessionEditor({ session }) {
  const updateSession = useJournalStore(s => s.updateSession)
  const saveTimer     = useRef(null)
  const titleRef      = useRef(null)
  const dateRef       = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: session.content || '',
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        updateSession(session.id, { content: editor.getHTML() })
      }, 800)
    },
  })

  useEffect(() => {
    if (titleRef.current) titleRef.current.value = session.title
    if (dateRef.current)  dateRef.current.value  = session.date
    if (editor) editor.commands.setContent(session.content || '')
  }, [session.id])

  const inputBase = { background: 'none', border: 'none', outline: 'none', color: 'var(--text)' }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Шапка */}
      <div className="px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
        <input ref={titleRef}
          className="w-full font-cinzel text-2xl font-bold mb-2"
          style={{ ...inputBase, color: 'var(--gold)' }}
          defaultValue={session.title}
          onBlur={e => updateSession(session.id, { title: e.target.value })}
          placeholder="Название сессии..."
        />
        <input ref={dateRef}
          type="date"
          className="font-cinzel text-sm"
          style={{ ...inputBase, color: 'var(--text-muted)' }}
          defaultValue={session.date}
          onChange={e => updateSession(session.id, { date: e.target.value })}
        />
      </div>

      {/* Тулбар */}
      <Toolbar editor={editor} />

      {/* Редактор */}
      <div className="flex-1 overflow-y-auto px-6 py-4 journal-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

// ─── ГЛАВНАЯ СТРАНИЦА ─────────────────────────────────────────────────────────
export default function JournalPage() {
  const { loadAll, sessions, loading, addSession, deleteSession,
          selectedSessionId, setSelectedSession, getSelectedSession,
          exportJournal, importJournal } = useJournalStore()

  useEffect(() => { loadAll() }, [])

  const selected = getSelectedSession()

  // Сортировка по дате (новые сверху)
  const sorted = [...sessions].sort((a, b) => {
    const da = a.date || '0000-00-00'
    const db = b.date || '0000-00-00'
    return db.localeCompare(da)
  })

  async function handleNew() {
    const num = sessions.length + 1
    await addSession({
      title:   `Сессия ${num}`,
      date:    new Date().toISOString().slice(0, 10),
      content: '',
    })
  }

  async function handleDelete(s, e) {
    e.stopPropagation()
    if (confirm(`Удалить «${s.title}»?`)) await deleteSession(s.id)
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}.${m}.${y}`
  }

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── ЛЕВАЯ ПАНЕЛЬ ── */}
      <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: 280, borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
        <div className="px-3 pt-3 pb-2 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="font-cinzel text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Журнал кампании</div>
          <button className="btn btn-add w-full justify-center mb-2" style={{ fontSize: 12 }} onClick={handleNew}>
            <IconPlus size={13} /> Новая сессия
          </button>
          <div className="flex gap-1">
            <button className="btn btn-ghost flex-1 justify-center" style={{ fontSize: 10 }} onClick={exportJournal}>
              <IconDownload size={11} /> Экспорт
            </button>
            <label className="btn btn-ghost flex-1 justify-center cursor-pointer" style={{ fontSize: 10 }}>
              <IconUpload size={11} /> Импорт
              <input type="file" accept=".json" className="hidden"
                onChange={e => {
                  const f = e.target.files[0]
                  if (f) importJournal(f).catch(err => alert('Ошибка: ' + err.message))
                  e.target.value = ''
                }} />
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && <div className="text-center py-8 font-cinzel text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>}
          {!loading && sessions.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <div className="text-3xl mb-2">📖</div>
              <div className="font-cinzel text-xs">Нет записей</div>
              <div className="text-xs mt-1">Создай первую сессию</div>
            </div>
          )}
          {sorted.map(s => {
            const isActive = selectedSessionId === s.id
            return (
              <div key={s.id}
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-all"
                style={{ background: isActive ? 'var(--gold-dim)' : 'var(--bg-row)', border: `1px solid ${isActive ? 'rgba(226,201,126,0.35)' : 'var(--border)'}` }}
                onClick={() => setSelectedSession(s.id)}>
                <div className="flex-1 min-w-0">
                  <div className="font-cinzel text-sm font-semibold truncate" style={{ color: isActive ? 'var(--gold)' : 'var(--text)' }}>{s.title}</div>
                  <div className="font-cinzel text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(s.date)}</div>
                </div>
                <button className="icon-btn shrink-0 mt-0.5" style={{ width: 20, height: 20 }}
                  onClick={e => handleDelete(s, e)}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '' }}>
                  <IconTrash size={11} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ПРАВАЯ ПАНЕЛЬ ── */}
      <div className="flex-1 overflow-hidden">
        {selected
          ? <SessionEditor key={selected.id} session={selected} />
          : (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
              <div className="text-center">
                <div className="text-4xl mb-3">📖</div>
                <div className="font-cinzel text-sm mb-1">Выбери сессию из списка</div>
                <div className="font-cinzel text-xs">или создай новую</div>
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}
