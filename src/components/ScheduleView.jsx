import { useEffect, useMemo, useState } from 'react'
import { downloadIcs } from '../lib/ics.js'
import { supabase } from '../lib/supabaseClient.js'

function monthDays(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days = []
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  return { first, days }
}

export default function ScheduleView() {
  const [tasks, setTasks] = useState([])
  const [cursor, setCursor] = useState(() => new Date())

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const { days } = useMemo(() => monthDays(year, month), [year, month])

  async function load() {
    if (!supabase) return
    const start = new Date(year, month, 1).toISOString().slice(0, 10)
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .gte('due_date', start)
      .lte('due_date', end)
      .eq('done', false)
    if (error) {
      console.error('ScheduleView:', error.message)
      return
    }
    setTasks(data ?? [])
  }

  useEffect(() => {
    load()
  }, [year, month])

  function tasksOn(day) {
    const iso = day.toISOString().slice(0, 10)
    return tasks.filter((t) => t.due_date === iso)
  }

  const label = cursor.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  return (
    <section className="section">
      <div className="section-head">
        <h2>Schedule</h2>
        <button type="button" className="btn-ghost" onClick={() => downloadIcs(tasks)}>
          Esporta ICS
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
      <div className="cal-grid">
        {days.map((day) => {
          const dayTasks = tasksOn(day)
          const iso = day.toISOString().slice(0, 10)
          const isToday = iso === new Date().toISOString().slice(0, 10)
          return (
            <div key={iso} className={`cal-day ${isToday ? 'today' : ''} ${dayTasks.length ? 'has-tasks' : ''}`}>
              <span className="cal-num dot-num">{day.getDate()}</span>
              {dayTasks.map((t) => (
                <div key={t.id} className="cal-task">
                  {t.due_time ? `${t.due_time.slice(0, 5)} ` : ''}
                  {t.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}
