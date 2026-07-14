import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { listTasks, todayISO } from '../lib/db.js'
import { downloadIcs } from '../lib/ics.js'
import { monthHistory } from '../lib/habits.js'
import { getSelectedDay, onSelectedDay, setSelectedDay } from '../lib/selectedDay.js'
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
  const [selected, setSelected] = useState(getSelectedDay())
  const [history, setHistory] = useState({})
  const [tasks, setTasks] = useState([])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const cells = useMemo(() => buildGrid(year, month), [year, month])

  const load = useCallback(async () => {
    try {
      setHistory(await monthHistory(supabase, year, month))
      setTasks(await listTasks({ done: false }))
    } catch (err) {
      console.error('CalendarView:', err.message)
    }
  }, [year, month])

  useEffect(() => {
    load()
    return onRefresh(load, 'calendar')
  }, [load])

  useEffect(() => onSelectedDay(setSelected), [])

  function pickDay(iso) {
    setSelected(iso)
    setSelectedDay(iso)
  }

  const label = cursor.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  return (
    <section className="section">
      <div className="section-head">
        <h2>Calendario</h2>
        <button type="button" className="btn-ghost" onClick={() => downloadIcs(tasks)}>ICS</button>
      </div>
      <p className="section-desc">Clicca un giorno → check sopra.</p>

      <div className="tabs">
        <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Storico %</button>
        <button type="button" className={tab === 'agenda' ? 'active' : ''} onClick={() => setTab('agenda')}>Task</button>
      </div>

      <div className="cal-nav">
        <button type="button" className="btn-ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
        <span className="cal-label">{label}</span>
        <button type="button" className="btn-ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
      </div>

      <button type="button" className="btn-ghost btn-today" onClick={() => { const n = new Date(); setCursor(n); pickDay(todayISO(n)) }}>Oggi</button>

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
              onClick={() => pickDay(iso)}
            >
              <span className="cal-num">{day.getDate()}</span>
              {tab === 'history' && pct !== null && <span className={`heat heat-${Math.floor(pct / 25)}`}>{pct}%</span>}
              {tab === 'agenda' && taskCount > 0 && <span className="cal-dots">{'•'.repeat(Math.min(taskCount, 3))}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
