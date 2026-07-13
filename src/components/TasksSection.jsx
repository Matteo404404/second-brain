import { useCallback, useEffect, useState } from 'react'
import { createTask, deleteTask, listTasks, updateTask } from '../lib/db.js'
import { notifyRefresh, onRefresh } from '../lib/events.js'
import Sheet from './ui/Sheet.jsx'
import Toast from './ui/Toast.jsx'

function formatDue(task) {
  if (!task.due_date) return ''
  const d = new Date(task.due_date + 'T12:00:00')
  const label = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  return task.due_time ? `${label} ${task.due_time.slice(0, 5)}` : label
}

function TaskRow({ task, onEdit, onDone, onPromote }) {
  return (
    <div className="task-row">
      <button type="button" className="task-check" onClick={() => onDone(task.id)} aria-label="Completa" />
      <button type="button" className="task-body" onClick={() => onEdit(task)}>
        <span className="task-title">{task.title}</span>
        {task.due_date && <span className="task-due">{formatDue(task)}</span>}
      </button>
      <div className="task-actions">
        {task.priority === 'next' && (
          <button type="button" className="btn-icon" onClick={() => onPromote(task)} title="Promuovi a top">
            ↑
          </button>
        )}
        {task.priority === 'top' && (
          <button type="button" className="btn-icon" onClick={() => onPromote(task, 'next')} title="Sposta in next">
            ↓
          </button>
        )}
      </div>
    </div>
  )
}

export default function TasksSection() {
  const [top, setTop] = useState([])
  const [next, setNext] = useState([])
  const [nextOpen, setNextOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('next')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [editTask, setEditTask] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState('next')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [topRows, nextRows] = await Promise.all([
        listTasks({ priority: 'top' }),
        listTasks({ priority: 'next' }),
      ])
      setTop(topRows.slice(0, 3))
      setNext(nextRows)
    } catch (err) {
      console.error('TasksSection:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return onRefresh(load, 'tasks')
  }, [load])

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  async function handleAdd(event) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    try {
      await createTask({
        title,
        priority: newPriority,
        due_date: newDate || null,
        due_time: newTime || null,
      })
      setNewTitle('')
      setNewDate('')
      setNewTime('')
      setAdding(false)
      flash('Task aggiunto')
      load()
      notifyRefresh('schedule')
    } catch (err) {
      flash(err.message)
    }
  }

  async function handleDone(id) {
    await updateTask(id, { done: true })
    flash('Task completato')
    load()
    notifyRefresh('schedule')
  }

  async function handlePromote(task, priority = 'top') {
    await updateTask(task.id, { priority })
    load()
  }

  function openEdit(task) {
    setEditTask(task)
    setEditTitle(task.title)
    setEditPriority(task.priority)
    setEditDate(task.due_date ?? '')
    setEditTime(task.due_time ?? '')
  }

  async function saveEdit() {
    if (!editTask) return
    await updateTask(editTask.id, {
      title: editTitle.trim(),
      priority: editPriority,
      due_date: editDate || null,
      due_time: editTime || null,
    })
    setEditTask(null)
    flash('Task aggiornato')
    load()
    notifyRefresh('schedule')
  }

  async function removeEdit() {
    if (!editTask || !confirm('Eliminare questo task?')) return
    await deleteTask(editTask.id)
    setEditTask(null)
    flash('Task eliminato')
    load()
    notifyRefresh('schedule')
  }

  return (
    <>
      <section className="section">
        <div className="section-head">
          <h2>Top 3</h2>
          <button type="button" className="btn-ghost" onClick={() => setAdding(!adding)}>
            {adding ? 'Annulla' : '+ Task'}
          </button>
        </div>

        {adding && (
          <form className="task-form" onSubmit={handleAdd}>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Cosa devi fare?"
              autoFocus
            />
            <div className="form-row">
              <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                <option value="top">Top</option>
                <option value="next">Next</option>
              </select>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
            <button type="submit" disabled={!newTitle.trim()}>
              Aggiungi
            </button>
          </form>
        )}

        {loading && <p className="muted">Caricamento...</p>}
        {!loading && top.length === 0 && <p className="empty-hint">Nessun task top. Promuovi da next o aggiungine uno.</p>}
        <div className="task-stack">
          {top.map((task, i) => (
            <div key={task.id} className="task-top-wrap">
              <span className="task-rank dot-num">{i + 1}</span>
              <TaskRow task={task} onEdit={openEdit} onDone={handleDone} onPromote={handlePromote} />
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <button type="button" className="collapse-head" onClick={() => setNextOpen(!nextOpen)}>
          <h2>Next tasks</h2>
          <span className="badge">{next.length}</span>
        </button>
        {nextOpen && (
          <div className="task-stack">
            {next.length === 0 && <p className="empty-hint">Lista vuota.</p>}
            {next.map((task) => (
              <TaskRow key={task.id} task={task} onEdit={openEdit} onDone={handleDone} onPromote={handlePromote} />
            ))}
          </div>
        )}
      </section>

      <Sheet open={Boolean(editTask)} title="Modifica task" onClose={() => setEditTask(null)}>
        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
        <div className="form-row">
          <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
            <option value="top">Top</option>
            <option value="next">Next</option>
          </select>
          <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
          <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
        </div>
        <div className="sheet-actions">
          <button type="button" onClick={saveEdit}>
            Salva
          </button>
          <button type="button" className="btn-danger" onClick={removeEdit}>
            Elimina
          </button>
        </div>
      </Sheet>

      <Toast message={toast} />
    </>
  )
}
