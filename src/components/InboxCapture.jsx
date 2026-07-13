import { useCallback, useEffect, useState } from 'react'
import {
  addInbox,
  archiveFromInbox,
  createTask,
  extractUrl,
  firstLine,
  listInbox,
  processInbox,
  saveNote,
  saveResource,
} from '../lib/db.js'
import { notifyRefresh, onRefresh } from '../lib/events.js'
import Toast from './ui/Toast.jsx'

export default function InboxCapture() {
  const [text, setText] = useState('')
  const [items, setItems] = useState([])
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setItems(await listInbox(false))
  }, [])

  useEffect(() => {
    load().catch(console.error)
    return onRefresh(load, 'inbox')
  }, [load])

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  async function capture(e) {
    e?.preventDefault()
    const content = text.trim()
    if (!content) return
    await addInbox(content)
    setText('')
    flash('In inbox')
    load()
  }

  async function toNote(item) {
    await saveNote({ title: firstLine(item.content), content: item.content, tag: 'personal', kind: 'text' })
    await processInbox(item.id)
    flash('→ Nota')
    load()
    notifyRefresh('library')
  }

  async function toResource(item) {
    await saveResource({
      title: firstLine(item.content),
      url: extractUrl(item.content),
      content: item.content,
      tag: 'personal',
      kind: extractUrl(item.content) ? 'link' : 'list',
    })
    await processInbox(item.id)
    flash('→ Resource')
    load()
    notifyRefresh('library')
  }

  async function toTask(item) {
    await createTask({ title: firstLine(item.content), notes: item.content, priority: 'next', tag: 'personal' })
    await processInbox(item.id)
    flash('→ Task')
    load()
    notifyRefresh('tasks')
  }

  return (
    <section className="section">
      <h2>Inbox</h2>
      <p className="section-desc">Cattura veloce. Smista in nota, resource o task.</p>
      <form className="capture-form" onSubmit={capture}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Scrivi e smista dopo..." rows={2} />
        <button type="submit" disabled={!text.trim()}>Cattura</button>
      </form>
      <ul className="inbox-list">
        {items.map((item) => (
          <li key={item.id} className="inbox-item">
            <p className="inbox-text">{item.content}</p>
            <div className="inbox-actions">
              <button type="button" className="btn-chip" onClick={() => toNote(item)}>Nota</button>
              <button type="button" className="btn-chip" onClick={() => toResource(item)}>Resource</button>
              <button type="button" className="btn-chip" onClick={() => toTask(item)}>Task</button>
              <button type="button" className="btn-chip" onClick={() => processInbox(item.id).then(load)}>Fatto</button>
              <button type="button" className="btn-chip muted-chip" onClick={() => archiveFromInbox(item, 'inbox', firstLine(item.content)).then(load)}>Archivia</button>
            </div>
          </li>
        ))}
      </ul>
      <Toast message={toast} />
    </section>
  )
}
