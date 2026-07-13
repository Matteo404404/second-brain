import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const TAGS = ['all', 'personal', 'work']

export default function NotesPanel() {
  const [tag, setTag] = useState('all')
  const [notes, setNotes] = useState([])
  const [resources, setResources] = useState([])
  const [tab, setTab] = useState('notes')

  async function load() {
    if (!supabase) return
    let notesQuery = supabase.from('notes').select('*').order('created_at', { ascending: false })
    let resQuery = supabase.from('resources').select('*').order('created_at', { ascending: false })
    if (tag !== 'all') {
      notesQuery = notesQuery.eq('tag', tag)
      resQuery = resQuery.eq('tag', tag)
    }
    const [{ data: n }, { data: r }] = await Promise.all([notesQuery, resQuery])
    setNotes(n ?? [])
    setResources(r ?? [])
  }

  useEffect(() => {
    load()
  }, [tag])

  return (
    <section className="section">
      <h2>Notes &amp; Resources</h2>
      <div className="tabs">
        <button type="button" className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>
          Note
        </button>
        <button type="button" className={tab === 'resources' ? 'active' : ''} onClick={() => setTab('resources')}>
          Resources
        </button>
      </div>
      <div className="tag-filter">
        {TAGS.map((t) => (
          <button
            key={t}
            type="button"
            className={tag === t ? 'active' : ''}
            onClick={() => setTag(t)}
          >
            {t === 'all' ? 'tutti' : t}
          </button>
        ))}
      </div>
      {tab === 'notes' && (
        <ul className="item-list">
          {notes.map((note) => (
            <li key={note.id}>
              <strong>{note.title}</strong>
              {note.tag && <span className="tag">{note.tag}</span>}
              {note.content && <p className="muted">{note.content}</p>}
            </li>
          ))}
        </ul>
      )}
      {tab === 'resources' && (
        <ul className="item-list">
          {resources.map((res) => (
            <li key={res.id}>
              <strong>{res.title}</strong>
              {res.tag && <span className="tag">{res.tag}</span>}
              {res.url && (
                <a href={res.url} target="_blank" rel="noreferrer">
                  {res.url}
                </a>
              )}
              {res.content && <p className="muted">{res.content}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
