import { useCallback, useEffect, useState } from 'react'
import {
  checkStats,
  fetchDailyState,
  syncTodayChecks,
  toggleCheckLog,
  updateDailyState,
} from '../lib/checks.js'
import { groupByCategory } from '../lib/checkEngine.js'
import { todayISO } from '../lib/supabaseClient.js'

export default function TodayChecks() {
  const [logs, setLogs] = useState([])
  const [dailyState, setDailyState] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [todayLogs, state] = await Promise.all([
        syncTodayChecks(),
        fetchDailyState(),
      ])
      setLogs(todayLogs)
      setDailyState(state)
    } catch (err) {
      console.error('TodayChecks:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleToggle(log) {
    await toggleCheckLog(log.id, !log.done)
    load()
  }

  async function handleStateFlag(key) {
    await updateDailyState(todayISO(), { [key]: !dailyState?.[key] })
    load()
  }

  const stats = checkStats(logs)
  const rows = logs
    .filter((l) => l.check_templates)
    .map((l) => ({ ...l.check_templates, log: l }))
  const byCategory = groupByCategory(rows).map((g) => ({
    category: g.category,
    items: g.items,
  }))

  return (
    <section className="section" id="oggi">
      <div className="section-head">
        <h2>Oggi</h2>
        <div className="stats dot-stat">
          <span className="dot-num">{stats.percent}</span>
          <span className="dot-label">%</span>
          <span className="muted stat-sub">
            {stats.done}/{stats.total}
          </span>
        </div>
      </div>

      <div className="daily-flags">
        <label className="flag">
          <input
            type="checkbox"
            className="custom-check"
            checked={dailyState?.handwriting_done ?? false}
            onChange={() => handleStateFlag('handwriting_done')}
          />
          <span>Scritto a mano oggi</span>
        </label>
        <label className="flag">
          <input
            type="checkbox"
            className="custom-check"
            checked={dailyState?.is_rest_day ?? false}
            onChange={() => handleStateFlag('is_rest_day')}
          />
          <span>Rest day</span>
        </label>
      </div>

      {loading && <p className="muted">Caricamento...</p>}

      {byCategory.map(({ category, items }) => (
        <div key={category} className="check-group">
          <h3>{category}</h3>
          <ul className="check-list">
            {items.map((item) => (
              <li key={item.log.id}>
                <label className="check-row">
                  <input
                    type="checkbox"
                    className="custom-check"
                    checked={item.log.done}
                    onChange={() => handleToggle(item.log)}
                  />
                  <span className={item.log.done ? 'done' : ''}>{item.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
