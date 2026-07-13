import { useCallback, useEffect, useState } from 'react'
import {
  addScratch,
  archiveItem,
  createNote,
  createResource,
  createTask,
  deleteScratch,
  extractUrl,
  firstLine,
  listScratchpad,
  markScratchProcessed,
} from '../lib/db.js'
import { notifyRefresh, onRefresh } from '../lib/events.js'
import Sheet from './ui/Sheet.jsx'
import Toast from './ui/Toast.jsx'

export default function QuickCapture() {
  const [inbox, setInbox] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [convertItem, setConvertItem] = useState(null)
  const [convertType, setConvertType] = useState('note')
  const [convertTitle, setConvertTitle] = useState('')
  const [convertTag, setConvertTag] = useState('personal')
  const [convertUrl, setConvertUrl] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setInbox(await listScratchpad({ processed: false }))
    } catch (err) {
      console.error('QuickCapture:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return onRefresh(load, 'capture')
  }, [load])

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const content = text.trim()
    if (!content) return
    try {
      await addScratch(content)
      setText('')
      flash('Catturato')
      load()
    } catch (err) {
      flash(err.message)
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      handleSubmit(event)
    }
  }

  function openConvert(item, type) {
    const url = extractUrl(item.content)
    setConvertItem(item)
    setConvertType(type)
    setConvertTitle(firstLine(item.content))
    setConvertTag('personal')
    setConvertUrl(url)
  }

  async function confirmConvert() {
    if (!convertItem) return
    try {
      if (convertType === 'note') {
        await createNote({
          title: convertTitle.trim() || firstLine(convertItem.content),
          content: convertItem.content,
          tag: convertTag,
        })
        notifyRefresh('knowledge')
      } else if (convertType === 'resource') {
        await createResource({
          title: convertTitle.trim() || firstLine(convertItem.content),
          url: convertUrl,
          content: convertItem.content,
          tag: convertTag,
        })
        notifyRefresh('knowledge')
      } else {
        await createTask({ title: convertTitle.trim() || firstLine(convertItem.content), priority: 'next' })
        notifyRefresh('tasks')
      }
      await markScratchProcessed(convertItem.id)
      setConvertItem(null)
      flash('Spostato e archiviato da inbox')
      load()
    } catch (err) {
      flash(err.message)
    }
  }

  async function processOnly(id) {
    await markScratchProcessed(id)
    flash('Segnato come processato')
    load()
  }

  async function archiveOnly(item) {
    await archiveItem({
      title: firstLine(item.content),
      content: item.content,
      original_type: 'scratchpad',
    })
    await deleteScratch(item.id)
    flash('Archiviato')
    load()
    notifyRefresh('archive')
  }

  return (
    <section className="section capture-section">
      <h2>Quick capture</h2>
      <p className="section-desc">Inbox veloce. Ctrl+Invio per salvare.</p>

      <form className="capture-form" onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Pensiero, link, idea, codice..."
          rows={2}
        />
        <button type="submit" className="btn-capture" disabled={!text.trim()}>
          Cattura
        </button>
      </form>

      <div className="inbox-head">
        <span>Inbox</span>
        <span className="badge">{inbox.length}</span>
      </div>

      {loading && <p className="muted">Caricamento...</p>}
      {!loading && inbox.length === 0 && (
        <p className="empty-hint">Inbox vuota. Tutto processato.</p>
      )}

      <ul className="inbox-list">
        {inbox.map((item) => (
          <li key={item.id} className="inbox-item">
            <p className="inbox-text">{item.content}</p>
            <span className="inbox-time">
              {new Date(item.created_at).toLocaleString('it-IT', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="inbox-actions">
              <button type="button" className="btn-chip" onClick={() => openConvert(item, 'note')}>
                Nota
              </button>
              <button type="button" className="btn-chip" onClick={() => openConvert(item, 'resource')}>
                Resource
              </button>
              <button type="button" className="btn-chip" onClick={() => openConvert(item, 'task')}>
                Task
              </button>
              <button type="button" className="btn-chip" onClick={() => processOnly(item.id)}>
                Fatto
              </button>
              <button type="button" className="btn-chip muted-chip" onClick={() => archiveOnly(item)}>
                Archivia
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Sheet
        open={Boolean(convertItem)}
        title={`Converti in ${convertType}`}
        onClose={() => setConvertItem(null)}
      >
        <label className="field-label">Titolo</label>
        <input value={convertTitle} onChange={(e) => setConvertTitle(e.target.value)} />
        {convertType !== 'task' && (
          <>
            <label className="field-label">Tag</label>
            <select value={convertTag} onChange={(e) => setConvertTag(e.target.value)}>
              <option value="personal">personal</option>
              <option value="work">work</option>
            </select>
          </>
        )}
        {convertType === 'resource' && (
          <>
            <label className="field-label">URL</label>
            <input value={convertUrl} onChange={(e) => setConvertUrl(e.target.value)} placeholder="https://..." />
          </>
        )}
        <label className="field-label">Contenuto</label>
        <textarea value={convertItem?.content ?? ''} readOnly rows={4} className="readonly" />
        <button type="button" onClick={confirmConvert}>
          Conferma
        </button>
      </Sheet>

      <Toast message={toast} />
    </section>
  )
}
