import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function ArchivePanel() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!open || !supabase) return
    supabase
      .from('archive')
      .select('*')
      .order('archived_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) console.error('ArchivePanel:', error.message)
        else setItems(data ?? [])
      })
  }, [open])

  return (
    <section className="section archive-section">
      <button type="button" className="collapse-head" onClick={() => setOpen(!open)}>
        <h2>Archive</h2>
        <span className="muted">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span className="muted"> · {item.original_type}</span>
              {item.content && <p className="muted">{item.content}</p>}
            </li>
          ))}
          {items.length === 0 && <p className="muted">Niente in archivio.</p>}
        </ul>
      )}
    </section>
  )
}
