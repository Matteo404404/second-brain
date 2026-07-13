import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { onRefresh } from '../lib/events.js'

export default function ArchivePanel() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('archive')
      .select('*')
      .order('archived_at', { ascending: false })
      .limit(50)
    if (error) console.error('ArchivePanel:', error.message)
    else setItems(data ?? [])
  }, [])

  useEffect(() => {
    if (!open) return
    load()
    return onRefresh(load, 'archive')
  }, [open, load])

  return (
    <section className="section archive-section">
      <button type="button" className="collapse-head" onClick={() => setOpen(!open)}>
        <h2>Archive</h2>
        <span className="badge muted-badge">{open ? items.length : '…'}</span>
      </button>
      {open && (
        <div className="archive-list">
          {items.length === 0 && <p className="empty-hint">Niente in archivio.</p>}
          {items.map((item) => (
            <div key={item.id} className="archive-card">
              <strong>{item.title}</strong>
              <span className="tag">{item.original_type}</span>
              {item.content && <p className="kb-preview">{item.content}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
