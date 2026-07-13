import { useCallback, useEffect, useState } from 'react'
import {
  fetchAllHabitLogs,
  fetchDailyState,
  setHandwritingDone,
  syncDayHabits,
  todayISO,
  toggleHabitLog,
} from '../lib/db.js'
import { computeStreak, dayStats, groupBySection } from '../lib/habits.js'
import { onRefresh } from '../lib/events.js'

export default function TodayView() {
  const [logs, setLogs] = useState([])
  const [handwriting, setHandwriting] = useState(false)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const today = todayISO()
      const [dayLogs, state, allLogs] = await Promise.all([
        syncDayHabits(today),
        fetchDailyState(today),
        fetchAllHabitLogs(),
      ])
      setLogs(dayLogs)
      setHandwriting(state.handwriting_done ?? false)
      setStreak(computeStreak(allLogs, today))
    } catch (err) {
      console.error('TodayView:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return onRefresh(load, 'habits')
  }, [load])

  async function onToggle(log) {
    await toggleHabitLog(log.id, !log.done)
    load()
  }

  async function onHandwriting(checked) {
    await setHandwritingDone(todayISO(), checked)
    load()
  }

  const stats = dayStats(logs)
  const rows = logs.filter((l) => l.habit_templates).map((l) => ({ ...l.habit_templates, log: l }))
  const sections = groupBySection(rows)

  return (
    <section className="section today-section">
      <div className="today-hero">
        <div>
          <h2>Oggi</h2>
          <p className="section-desc">Routine con frequenze tue. Niente rest day manuale.</p>
        </div>
        <div className="today-metrics">
          <div className="metric">
            <span className="dot-num">{stats.percent}</span>
            <span className="metric-label">%</span>
          </div>
          <div className="metric">
            <span className="dot-num">{streak}</span>
            <span className="metric-label">streak</span>
          </div>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${stats.percent}%` }} />
      </div>
      <p className="muted tiny">{stats.done}/{stats.total} completati</p>

      <label className="flag handwriting-flag">
        <input
          type="checkbox"
          className="custom-check"
          checked={handwriting}
          onChange={(e) => onHandwriting(e.target.checked)}
        />
        <span>Scritto a mano oggi (se no → compare stare al muro)</span>
      </label>

      {loading && <p className="muted">Caricamento...</p>}

      {sections.map(({ section, items }) => (
        <div key={section} className="habit-group">
          <h3>{section}</h3>
          <ul className="check-list">
            {items.map((item) => (
              <li key={item.log.id}>
                <label className="check-row">
                  <input
                    type="checkbox"
                    className="custom-check"
                    checked={item.log.done}
                    onChange={() => onToggle(item.log)}
                  />
                  <span className={item.log.done ? 'done' : ''}>{item.title}</span>
                  {item.frequency_type === 'times_per_week' && (
                    <span className="freq-badge">/sett</span>
                  )}
                  {item.frequency_type === 'times_per_month' && (
                    <span className="freq-badge">/mese</span>
                  )}
                  {item.frequency_type === 'every_other_day' && (
                    <span className="freq-badge">EOD</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
