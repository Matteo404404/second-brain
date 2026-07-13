import { useCallback, useEffect, useState } from 'react'
import {
  createNote,
  createResource,
  deleteNote,
  deleteResource,
  listNotes,
  listResources,
  updateNote,
  updateResource,
} from '../lib/db.js'
import { onRefresh } from '../lib/events.js'
import Sheet from './ui/Sheet.jsx'
import Toast from './ui/Toast.jsx'

const TAGS = [
  { id: 'all', label: 'Tutti' },
  { id: 'personal', label: 'Personal' },
  { id: 'work', label: 'Work' },
]

function preview(text, max = 80) {
  if (!text) return ''
  const flat = text.replace(/\n/g, ' ')
  return flat.length > max ? `${flat.slice(0, max)}…` : flat
}

export default function KnowledgeBase() {
  const [tab, setTab] = useState('notes')
  const [tag, setTag] = useState('all')
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [editor, setEditor] = useState(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [itemTag, setItemTag] = useState('personal')
  const [url, setUrl] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [n, r] = await Promise.all([
        listNotes({ tag, search }),
        listResources({ tag, search }),
      ])
      setNotes(n)
      setResources(r)
    } catch (err) {
      console.error('KnowledgeBase:', err.message)
    } finally {
      setLoading(false)
    }
  }, [tag, search])

  useEffect(() => {
    load()
    return onRefresh(load, 'knowledge')
  }, [load])

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  function openNew() {
    setEditor({ mode: 'new', type: tab === 'resources' ? 'resource' : 'note' })
    setTitle('')
    setBody('')
    setUrl('')
    setItemTag('personal')
  }

  function openItem(item, type) {
    setEditor({ mode: 'edit', type, id: item.id })
    setTitle(item.title ?? '')
    setBody(type === 'note' ? item.content ?? '' : item.content ?? '')
    setUrl(item.url ?? '')
    setItemTag(item.tag ?? 'personal')
  }

  async function save() {
    const payload = {
      title: title.trim() || 'Senza titolo',
      tag: itemTag,
    }
    try {
      if (editor.type === 'note') {
        const notePayload = { ...payload, content: body }
        if (editor.mode === 'new') await createNote(notePayload)
        else await updateNote(editor.id, notePayload)
      } else {
        const resPayload = { ...payload, url: url.trim(), content: body }
        if (editor.mode === 'new') await createResource(resPayload)
        else await updateResource(editor.id, resPayload)
      }
      setEditor(null)
      flash('Salvato')
      load()
    } catch (err) {
      flash(err.message)
    }
  }

  async function remove() {
    if (!editor?.id || !confirm('Eliminare?')) return
    try {
      if (editor.type === 'note') await deleteNote(editor.id)
      else await deleteResource(editor.id)
      setEditor(null)
      flash('Eliminato')
      load()
    } catch (err) {
      flash(err.message)
    }
  }

  const items = tab === 'notes' ? notes : resources

  return (
    <section className="section kb-section">
      <div className="section-head">
        <h2>Notes &amp; Resources</h2>
        <button type="button" className="btn-ghost" onClick={openNew}>
          + Nuovo
        </button>
      </div>

      <input
        className="search-input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cerca..."
      />

      <div className="tabs">
        <button type="button" className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>
          Note ({notes.length})
        </button>
        <button
          type="button"
          className={tab === 'resources' ? 'active' : ''}
          onClick={() => setTab('resources')}
        >
          Resources ({resources.length})
        </button>
      </div>

      <div className="tag-filter">
        {TAGS.map((t) => (
          <button key={t.id} type="button" className={tag === t.id ? 'active' : ''} onClick={() => setTag(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="muted">Caricamento...</p>}
      {!loading && items.length === 0 && (
        <p className="empty-hint">
          {tab === 'notes' ? 'Nessuna nota.' : 'Nessuna resource.'} Tocca + Nuovo.
        </p>
      )}

      <div className="kb-list">
        {items.map((item) => (
          <button key={item.id} type="button" className="kb-card" onClick={() => openItem(item, tab === 'notes' ? 'note' : 'resource')}>
            <div className="kb-card-top">
              <strong>{item.title}</strong>
              {item.tag && <span className="tag">{item.tag}</span>}
            </div>
            {tab === 'resources' && item.url && (
              <span className="kb-url">{item.url.replace(/^https?:\/\//, '').slice(0, 40)}</span>
            )}
            <p className="kb-preview">{preview(tab === 'notes' ? item.content : item.content || item.url)}</p>
            <span className="kb-date">
              {new Date(item.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
            </span>
          </button>
        ))}
      </div>

      <Sheet
        open={Boolean(editor)}
        title={editor?.mode === 'new' ? 'Nuovo' : 'Modifica'}
        onClose={() => setEditor(null)}
      >
        <label className="field-label">Titolo</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <label className="field-label">Tag</label>
        <select value={itemTag} onChange={(e) => setItemTag(e.target.value)}>
          <option value="personal">personal</option>
          <option value="work">work</option>
        </select>
        {editor?.type === 'resource' && (
          <>
            <label className="field-label">URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            {url && (
              <a className="link-out" href={url} target="_blank" rel="noreferrer">
                Apri link
              </a>
            )}
          </>
        )}
        <label className="field-label">{editor?.type === 'note' ? 'Contenuto' : 'Note'}</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
        <div className="sheet-actions">
          <button type="button" onClick={save}>
            Salva
          </button>
          {editor?.mode === 'edit' && (
            <button type="button" className="btn-danger" onClick={remove}>
              Elimina
            </button>
          )}
        </div>
      </Sheet>

      <Toast message={toast} />
    </section>
  )
}
