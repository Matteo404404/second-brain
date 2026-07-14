import { useCallback, useEffect, useState } from 'react'
import {
  deleteNote,
  deleteResource,
  extractUrl,
  firstLine,
  listNotes,
  listResources,
  saveNote,
  saveResource,
} from '../lib/db.js'
import { onRefresh } from '../lib/events.js'
import Sheet from './ui/Sheet.jsx'
import Toast from './ui/Toast.jsx'

const NOTE_KINDS = [
  { id: 'text', label: 'Testo rapido' },
  { id: 'list', label: 'Lista' },
  { id: 'work_prompt', label: 'Prompt lavoro' },
  { id: 'screenshot', label: 'Screenshot / chat' },
]

const RES_KINDS = [
  { id: 'link', label: 'Link' },
  { id: 'libro', label: 'Libro' },
  { id: 'list', label: 'Lista' },
  { id: 'app', label: 'App' },
]

const TOPICS = [
  'all', 'idee', 'salute', 'casa', 'streaming', 'dev', 'lavoro', 'uni', 'uni-corsi',
  'semiotica', 'media', 'decisioni', 'bioetica', 'fisica', 'quantum', 'matematica',
  'tecnologia', 'istituzioni', 'economia', 'reti', 'microeconomia', 'game-theory',
  'ottimizzazione', 'informatica', 'algoritmi', 'storia-economia', 'ML', 'probabilita',
  'econometria', 'biologia', 'neuroscienze', 'filosofia-scienza', 'fumetti', 'generale',
]

function groupByTopic(items) {
  const map = {}
  for (const item of items) {
    const t = item.topic || 'generale'
    if (!map[t]) map[t] = []
    map[t].push(item)
  }
  return Object.keys(map).sort().map((topic) => ({ topic, items: map[topic] }))
}

export default function Library() {
  const [tab, setTab] = useState('notes')
  const [tag, setTag] = useState('all')
  const [topic, setTopic] = useState('all')
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState([])
  const [resources, setResources] = useState([])
  const [editor, setEditor] = useState(null)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    const [n, r] = await Promise.all([listNotes({ tag, topic, search }), listResources({ tag, topic, search })])
    setNotes(n)
    setResources(r)
  }, [tag, topic, search])

  useEffect(() => {
    load().catch(console.error)
    return onRefresh(load, 'library')
  }, [load])

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  function openNew(type) {
    setEditor({ type, mode: 'new', kind: type === 'note' ? 'text' : 'link', tag: 'personal', topic: 'generale', title: '', content: '', url: '' })
  }

  function openItem(item, type) {
    setEditor({
      type,
      mode: 'edit',
      id: item.id,
      kind: item.kind ?? (type === 'note' ? 'text' : 'link'),
      tag: item.tag ?? 'personal',
      topic: item.topic ?? 'generale',
      title: item.title,
      content: item.content ?? '',
      url: item.url ?? '',
    })
  }

  async function save() {
    if (!editor) return
    const row = {
      id: editor.id,
      title: editor.title.trim() || 'Senza titolo',
      content: editor.content,
      tag: editor.tag,
      topic: editor.topic,
      kind: editor.kind,
      url: editor.url,
    }
    try {
      if (editor.type === 'note') await saveNote(row)
      else await saveResource(row)
      setEditor(null)
      flash('Salvato')
      load()
    } catch (err) {
      flash(err.message)
    }
  }

  async function remove() {
    if (!editor?.id || !confirm('Eliminare?')) return
    if (editor.type === 'note') await deleteNote(editor.id)
    else await deleteResource(editor.id)
    setEditor(null)
    load()
  }

  const items = tab === 'notes' ? notes : resources
  const grouped = topic === 'all' ? groupByTopic(items) : [{ topic: topic, items }]

  return (
    <section className="section">
      <div className="section-head">
        <h2>Libreria</h2>
        <button type="button" className="btn-ghost" onClick={() => openNew(tab === 'notes' ? 'note' : 'resource')}>
          + Nuovo
        </button>
      </div>
      <p className="section-desc">Note personali e lavoro. Niente progetti/aree.</p>

      <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca..." />

      <div className="tabs">
        <button type="button" className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>Note ({notes.length})</button>
        <button type="button" className={tab === 'resources' ? 'active' : ''} onClick={() => setTab('resources')}>Resources ({resources.length})</button>
      </div>

      <div className="tag-filter">
        {['all', 'personal', 'work', 'uni'].map((t) => (
          <button key={t} type="button" className={tag === t ? 'active' : ''} onClick={() => setTag(t)}>{t}</button>
        ))}
      </div>
      <div className="tag-filter topic-scroll">
        {TOPICS.map((t) => (
          <button key={t} type="button" className={topic === t ? 'active' : ''} onClick={() => setTopic(t)}>{t}</button>
        ))}
      </div>

      {grouped.map(({ topic: grp, items: grpItems }) => (
        <div key={grp} className="topic-group">
          {topic === 'all' && grpItems.length > 0 && <h3 className="topic-head">{grp}</h3>}
          <div className="kb-list">
            {grpItems.map((item) => (
              <button key={item.id} type="button" className="kb-card" onClick={() => openItem(item, tab === 'notes' ? 'note' : 'resource')}>
                <div className="kb-card-top">
                  <strong>{item.title}</strong>
                  <span className="tag">{item.kind || 'text'}</span>
                </div>
                <p className="kb-preview">{item.content || item.url || '—'}</p>
              </button>
            ))}
          </div>
        </div>
      ))}

      <Sheet open={Boolean(editor)} title={editor?.mode === 'new' ? 'Nuovo' : 'Modifica'} onClose={() => setEditor(null)}>
        {editor && (
          <>
            <select value={editor.kind} onChange={(e) => setEditor({ ...editor, kind: e.target.value })}>
              {(editor.type === 'note' ? NOTE_KINDS : RES_KINDS).map((k) => (
                <option key={k.id} value={k.id}>{k.label}</option>
              ))}
            </select>
            <input value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} placeholder="Titolo" />
            <select value={editor.tag} onChange={(e) => setEditor({ ...editor, tag: e.target.value })}>
              <option value="personal">personal</option>
              <option value="work">work</option>
              <option value="uni">uni</option>
            </select>
            <input value={editor.topic} onChange={(e) => setEditor({ ...editor, topic: e.target.value })} placeholder="Argomento (idee, libri, uni...)" />
            {editor.type === 'resource' && (
              <input value={editor.url} onChange={(e) => setEditor({ ...editor, url: e.target.value })} placeholder="URL" />
            )}
            <textarea value={editor.content} onChange={(e) => setEditor({ ...editor, content: e.target.value })} rows={8} placeholder="Contenuto, lista, testo incollato..." />
            <div className="sheet-actions">
              <button type="button" onClick={save}>Salva</button>
              {editor.mode === 'edit' && <button type="button" className="btn-danger" onClick={remove}>Elimina</button>}
            </div>
          </>
        )}
      </Sheet>

      <Toast message={toast} />
    </section>
  )
}
