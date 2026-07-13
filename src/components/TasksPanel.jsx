import { useCallback, useEffect, useState } from 'react'
import {
  addSubtask,
  completeTask,
  createTask,
  deleteSubtask,
  deleteTask,
  listSubtasks,
  listTasks,
  toggleSubtask,
  updateTask,
} from '../lib/db.js'
import { notifyRefresh, onRefresh } from '../lib/events.js'
import { supabase } from '../lib/supabaseClient.js'
import Sheet from './ui/Sheet.jsx'
import Toast from './ui/Toast.jsx'

const PRIORITIES = ['top', 'next', 'someday']
const TAGS = ['personal', 'work', 'uni']

const emptyForm = {
  title: '',
  notes: '',
  tag: 'personal',
  priority: 'next',
  due_date: '',
  due_time: '',
  recurrence: '',
}

export default function TasksPanel() {
  const [open, setOpen] = useState([])
  const [active, setActive] = useState(null)
  const [subtasks, setSubtasks] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [toast, setToast] = useState('')
  const [showNew, setShowNew] = useState(false)

  const load = useCallback(async () => {
    try {
      setOpen(await listTasks({ done: false }))
    } catch (err) {
      console.error('TasksPanel:', err.message)
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

  const top = open.filter((t) => t.priority === 'top').slice(0, 3)
  const next = open.filter((t) => t.priority === 'next')
  const someday = open.filter((t) => t.priority === 'someday')

  async function openTask(task) {
    setActive(task)
    setForm({
      title: task.title,
      notes: task.notes ?? '',
      tag: task.tag ?? 'personal',
      priority: task.priority,
      due_date: task.due_date ?? '',
      due_time: task.due_time ?? '',
      recurrence: task.recurrence ?? '',
    })
    setSubtasks(await listSubtasks(task.id))
  }

  async function saveTask() {
    try {
      if (active?.id) {
        await updateTask(active.id, {
          title: form.title.trim(),
          notes: form.notes,
          tag: form.tag,
          priority: form.priority,
          due_date: form.due_date || null,
          due_time: form.due_time || null,
          recurrence: form.recurrence || null,
        })
        flash('Task aggiornato')
      } else {
        await createTask({
          title: form.title.trim(),
          notes: form.notes,
          tag: form.tag,
          priority: form.priority,
          due_date: form.due_date || null,
          due_time: form.due_time || null,
          recurrence: form.recurrence || null,
        })
        flash('Task creato')
      }
      setActive(null)
      setShowNew(false)
      load()
      notifyRefresh('calendar')
    } catch (err) {
      flash(err.message)
    }
  }

  async function doneTask(id) {
    await completeTask(id)
    await archiveCompleted(id)
    flash('Completato')
    setActive(null)
    load()
    notifyRefresh('calendar')
  }

  async function archiveCompleted(id) {
    const task = open.find((t) => t.id === id)
    if (!task || !supabase) return
    await supabase.from('archive').insert({
      title: task.title,
      content: task.notes ?? '',
      original_type: 'task',
    })
  }

  async function removeTask() {
    if (!active?.id || !confirm('Eliminare task?')) return
    await deleteTask(active.id)
    setActive(null)
    load()
    notifyRefresh('calendar')
  }

  async function addSub() {
    const title = prompt('Sotto-task')
    if (!title?.trim() || !active?.id) return
    await addSubtask(active.id, title.trim())
    setSubtasks(await listSubtasks(active.id))
  }

  function TaskRow({ task }) {
    return (
      <div className="task-row">
        <button type="button" className="task-check" onClick={() => doneTask(task.id)} />
        <button type="button" className="task-body" onClick={() => openTask(task)}>
          <span className="task-title">{task.title}</span>
          <span className="task-meta">
            {task.tag} · {task.due_date || 'no scadenza'}
            {task.due_time ? ` ${task.due_time.slice(0, 5)}` : ''}
          </span>
        </button>
      </div>
    )
  }

  return (
    <>
      <section className="section">
        <div className="section-head">
          <h2>Task</h2>
          <button type="button" className="btn-ghost" onClick={() => { setShowNew(true); setActive({}); setForm(emptyForm); setSubtasks([]) }}>
            + Nuovo
          </button>
        </div>
        <p className="section-desc">Impegni veri (lavoro, uni). Separati dalla routine.</p>

        <h3 className="sub-head">Top 3</h3>
        {top.length === 0 && <p className="empty-hint">Nessun top task.</p>}
        <div className="task-stack">{top.map((t) => <TaskRow key={t.id} task={t} />)}</div>

        <h3 className="sub-head">Next</h3>
        <div className="task-stack">{next.map((t) => <TaskRow key={t.id} task={t} />)}</div>

        <h3 className="sub-head">Someday</h3>
        <div className="task-stack">{someday.map((t) => <TaskRow key={t.id} task={t} />)}</div>
      </section>

      <Sheet open={showNew || Boolean(active?.id)} title={active?.id ? 'Task' : 'Nuovo task'} onClose={() => { setActive(null); setShowNew(false) }}>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titolo" />
        <div className="form-row">
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
            {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-row">
          <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <input type="time" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })} />
        </div>
        <input value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })} placeholder="Ricorrenza (es. weekly, monthly)" />
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Note sul task" rows={4} />

        {active?.id && (
          <div className="subtasks-block">
            <div className="section-head">
              <span className="sub-head">Sotto-task</span>
              <button type="button" className="btn-ghost" onClick={addSub}>+</button>
            </div>
            {subtasks.map((s) => (
              <label key={s.id} className="check-row">
                <input type="checkbox" className="custom-check" checked={s.done} onChange={() => toggleSubtask(s.id, !s.done)} />
                <span className={s.done ? 'done' : ''}>{s.title}</span>
                <button type="button" className="btn-icon" onClick={() => deleteSubtask(s.id).then(() => listSubtasks(active.id).then(setSubtasks))}>×</button>
              </label>
            ))}
          </div>
        )}

        <div className="sheet-actions">
          <button type="button" onClick={saveTask}>Salva</button>
          {active?.id && <button type="button" className="btn-ghost" onClick={() => doneTask(active.id)}>Completa</button>}
          {active?.id && <button type="button" className="btn-danger" onClick={removeTask}>Elimina</button>}
        </div>
      </Sheet>

      <Toast message={toast} />
    </>
  )
}
