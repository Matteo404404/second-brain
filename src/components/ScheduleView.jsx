import { useCallback, useEffect, useMemo, useState } from 'react'
import { listTasks, updateTask } from '../lib/db.js'
import { downloadIcs } from '../lib/ics.js'
import { todayISO } from '../lib/supabaseClient.js'
import { onRefresh } from '../lib/events.js'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = (first.getDay() + 6) % 7
  const cells = []

  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
  return cells
}

function toIsoLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function ScheduleView() {
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState(todayISO())
  const [tasks, setTasks] = useState([])
  const [allMonthTasks, setAllMonthTasks] = useState([])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])

  const load = useCallback(async () => {
    try {
      const start = new Date(year, month, 1).toISOString().slice(0, 10)
      const end = new Date(year, month + 1, 0).toISOString().slice(0, 10)
      const rows = await listTasks({ done: false })
      setAllMonthTasks(rows.filter((t) => t.due_date && t.due_date >= start && t.due_date <= end))
    } catch (err) {
      console.error('ScheduleView:', err.message)
    }
  }, [year, month])

  useEffect(() => {
    load()
    return onRefresh(load, 'schedule')
  }, [load])

  useEffect(() => {
    setTasks(allMonthTasks.filter((t) => t.due_date === selected))
  }, [allMonthTasks, selected])

  function countOn(iso) {
    return allMonthTasks.filter((t) => t.due_date === iso).length
  }

  async function completeTask(id) {
    await updateTask(id, { done: true })
    load()
  }

  const label = cursor.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const selectedLabel = new Date(selected + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <section className="section schedule-section">
      <div className="section-head">
        <h2>Schedule</h2>
        <button type="button" className="btn-ghost" onClick={() => downloadIcs(allMonthTasks)}>
          ICS
        </button>
      </div>

      <div className="cal-nav">
        <button type="button" className="btn-ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          ‹
        </button>
        <span className="cal-label">{label}</span>
        <button type="button" className="btn-ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          ›
        </button>
      </div>

      <button
        type="button"
        className="btn-ghost btn-today"
        onClick={() => {
          const now = new Date()
          setCursor(now)
          setSelected(todayISO(now))
        }}
      >
        Oggi
      </button>

      <div className="cal-weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="cal-grid-pro">
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="cal-cell empty" />
          const iso = toIsoLocal(day)
          const count = countOn(iso)
          const isToday = iso === todayISO()
          const isSelected = iso === selected
          return (
            <button
              key={iso}
              type="button"
              className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${count ? 'has-tasks' : ''}`}
              onClick={() => setSelected(iso)}
            >
              <span className="cal-num">{day.getDate()}</span>
              {count > 0 && <span className="cal-dots">{count > 3 ? '•••' : '•'.repeat(count)}</span>}
            </button>
          )
        })}
      </div>

      <div className="agenda">
        <h3>{selectedLabel}</h3>
        {tasks.length === 0 && <p className="empty-hint">Nessun task in agenda.</p>}
        <ul className="agenda-list">
          {tasks.map((task) => (
            <li key={task.id} className="agenda-item">
              <button type="button" className="task-check small" onClick={() => completeTask(task.id)} />
              <div className="agenda-body">
                <span>{task.title}</span>
                <span className="agenda-meta">
                  {task.priority === 'top' ? 'top' : 'next'}
                  {task.due_time ? ` · ${task.due_time.slice(0, 5)}` : ''}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
