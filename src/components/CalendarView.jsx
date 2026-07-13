import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { listTasks, todayISO } from '../lib/db.js'
import { downloadIcs } from '../lib/ics.js'
import { monthHistory } from '../lib/habits.js'
import { onRefresh } from '../lib/events.js'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function buildGrid(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const pad = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < pad; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
  return cells
}

function isoLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarView() {
  const [tab, setTab] = useState('history')
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState(todayISO())
  const [history, setHistory] = useState({})
  const [tasks, setTasks] = useState([])
  const [dayLogs, setDayLogs] = useState([])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const cells = useMemo(() => buildGrid(year, month), [year, month])

  const load = useCallback(async () => {
    try {
      const hist = await monthHistory(supabase, year, month)
      setHistory(hist)
      const all = await listTasks({ done: false })
      setTasks(all)
    } catch (err) {
      console.error('CalendarView:', err.message)
    }
  }, [year, month])

  useEffect(() => {
    load()
    return onRefresh(load, 'calendar')
  }, [load])

  useEffect(() => {
    if (!supabase || tab !== 'history') return
    supabase
      .from('habit_logs')
      .select('*, habit_templates(title, section)')
      .eq('log_date', selected)
      .then(({ data }) => setDayLogs(data ?? []))
  }, [selected, tab])

  const label = cursor.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const futureTasks = tasks.filter((t) => t.due_date === selected)

  return (
    <section className="section">
      <div className="section-head">
        <h2>Calendario</h2>
        <button type="button" className="btn-ghost" onClick={() => downloadIcs(tasks)}>
          ICS
        </button>
      </div>

      <div className="tabs">
        <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          Storico routine
        </button>
        <button type="button" className={tab === 'agenda' ? 'active' : ''} onClick={() => setTab('agenda')}>
          Agenda task
        </button>
      </div>

      <div className="cal-nav">
        <button type="button" className="btn-ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
        <span className="cal-label">{label}</span>
        <button type="button" className="btn-ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
      </div>

      <button type="button" className="btn-ghost btn-today" onClick={() => { const n = new Date(); setCursor(n); setSelected(todayISO(n)) }}>
        Oggi
      </button>

      <div className="cal-weekdays">{WEEKDAYS.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="cal-grid-pro">
        {cells.map((day, i) => {
          if (!day) return <div key={`p${i}`} className="cal-cell empty" />
          const iso = isoLocal(day)
          const h = history[iso]
          const pct = h?.total ? Math.round((h.done / h.total) * 100) : null
          const taskCount = tasks.filter((t) => t.due_date === iso).length
          return (
            <button
              key={iso}
              type="button"
              className={`cal-cell ${iso === todayISO() ? 'today' : ''} ${iso === selected ? 'selected' : ''}`}
              onClick={() => setSelected(iso)}
            >
              <span className="cal-num">{day.getDate()}</span>
              {tab === 'history' && pct !== null && (
                <span className={`heat heat-${Math.floor(pct / 25)}`}>{pct}%</span>
              )}
              {tab === 'agenda' && taskCount > 0 && <span className="cal-dots">{'•'.repeat(Math.min(taskCount, 3))}</span>}
            </button>
          )
        })}
      </div>

      <div className="day-detail">
        <h3>{new Date(selected + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
        {tab === 'history' && (
          <>
            {!dayLogs.length && <p className="empty-hint">Nessun dato routine per questo giorno.</p>}
            <ul className="detail-list">
              {dayLogs.map((l) => (
                <li key={l.id} className={l.done ? 'done' : 'missed'}>
                  <span>{l.habit_templates?.title}</span>
                  <span className="tag">{l.done ? 'fatto' : 'mancato'}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {tab === 'agenda' && (
          <>
            {!futureTasks.length && <p className="empty-hint">Nessun task in scadenza.</p>}
            <ul className="detail-list">
              {futureTasks.map((t) => (
                <li key={t.id}>
                  <span>{t.title}</span>
                  <span className="tag">{t.priority}{t.due_time ? ` ${t.due_time.slice(0, 5)}` : ''}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
