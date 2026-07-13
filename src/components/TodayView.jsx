import { useCallback, useEffect, useState } from 'react'
import {
  fetchAllHabitLogs,
  fetchDailyState,
  fetchHabitTemplates,
  markHabitOnDay,
  setHandwritingDone,
  syncDayHabits,
  todayISO,
  toggleHabitLog,
} from '../lib/db.js'
import { computeStreak, dayStats, getBacklog, groupBySection, trainingLossOn } from '../lib/habits.js'
import { getSelectedDay, onSelectedDay } from '../lib/selectedDay.js'
import { notifyRefresh, onRefresh } from '../lib/events.js'

export default function TodayView() {
  const [day, setDay] = useState(getSelectedDay())
  const [logs, setLogs] = useState([])
  const [backlog, setBacklog] = useState([])
  const [handwriting, setHandwriting] = useState(false)
  const [streak, setStreak] = useState(0)
  const [loss, setLoss] = useState(false)
  const [backlogOpen, setBacklogOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  const isToday = day === todayISO()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dayLogs, state, allLogs, templates] = await Promise.all([
        syncDayHabits(day),
        fetchDailyState(day),
        fetchAllHabitLogs(),
        fetchHabitTemplates(),
      ])
      setLogs(dayLogs)
      setHandwriting(state.handwriting_done ?? false)
      setStreak(computeStreak(allLogs, todayISO()))
      setLoss(trainingLossOn(day, templates, allLogs))
      setBacklog(getBacklog(templates, day, allLogs))
    } catch (err) {
      console.error('TodayView:', err.message)
    } finally {
      setLoading(false)
    }
  }, [day])

  useEffect(() => onSelectedDay(setDay), [])
  useEffect(() => {
    load()
    return onRefresh(load, 'habits')
  }, [load])

  async function onToggle(log) {
    await toggleHabitLog(log.id, !log.done)
    notifyRefresh('habits')
    notifyRefresh('calendar')
    load()
  }

  async function onBacklogDone(templateId) {
    await markHabitOnDay(templateId, day, true)
    notifyRefresh('habits')
    notifyRefresh('calendar')
    load()
  }

  async function onHandwriting(checked) {
    await setHandwritingDone(day, checked)
    notifyRefresh('habits')
    load()
  }

  const lossMisses = loss ? 2 : 0
  const stats = dayStats(logs, { lossMisses })
  const rows = logs.filter((l) => l.habit_templates).map((l) => ({ ...l.habit_templates, log: l }))
  const sections = groupBySection(rows)
  const dayLabel = new Date(day + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <section className="section today-section">
      <div className="today-hero">
        <div>
          <h2>{isToday ? 'Oggi' : dayLabel}</h2>
          {!isToday && <p className="section-desc">Backtrack su questo giorno.</p>}
        </div>
        <div className="today-metrics">
          <div className="metric">
            <span className="dot-num">{stats.percent}</span>
            <span className="metric-label">%</span>
          </div>
          {isToday && (
            <div className="metric">
              <span className="dot-num">{streak}</span>
              <span className="metric-label">streak</span>
            </div>
          )}
        </div>
      </div>

      {loss && <p className="loss-banner">Training mancato 2 giorni di fila (−2 nella %)</p>}

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${stats.percent}%` }} />
      </div>
      <p className="muted tiny">
        {stats.done}/{stats.total} completati
        {lossMisses > 0 && ` (include ${lossMisses} miss training)`}
      </p>

      <label className="flag handwriting-flag">
        <input type="checkbox" className="custom-check" checked={handwriting} onChange={(e) => onHandwriting(e.target.checked)} />
        <span>Scritto a mano (se no → stare al muro)</span>
      </label>

      {loading && <p className="muted">Caricamento...</p>}
      {!loading && logs.length === 0 && <p className="empty-hint">Nessun check oggi per questo giorno.</p>}

      {sections.map(({ section, items }) => (
        <div key={section} className="habit-group">
          <h3>{section}</h3>
          <ul className="check-list">
            {items.map((item) => (
              <li key={item.log.id}>
                <label className="check-row">
                  <input type="checkbox" className="custom-check" checked={item.log.done} onChange={() => onToggle(item.log)} />
                  <span className={item.log.done ? 'done' : ''}>{item.title}</span>
                  {item.frequency_type === 'every_other_day' && <span className="freq-badge">EOD</span>}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {backlog.length > 0 && (
        <div className="backlog-block">
          <button type="button" className="collapse-head" onClick={() => setBacklogOpen(!backlogOpen)}>
            <h3 className="sub-head">Backlog settimana/mese</h3>
            <span className="badge">{backlog.length}</span>
          </button>
          {backlogOpen && (
            <ul className="backlog-list">
              {backlog.map((b) => (
                <li key={b.template.id} className="backlog-item">
                  <span>
                    {b.template.title} <span className="muted">({b.done}/{b.quota} {b.period})</span>
                  </span>
                  <button type="button" className="btn-chip" onClick={() => onBacklogDone(b.template.id)}>
                    Segna oggi
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
