import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function TopTasks() {
  const [tasks, setTasks] = useState([])

  async function load() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('done', false)
      .eq('priority', 'top')
      .order('due_date', { nullsFirst: false })
      .limit(3)
    if (error) {
      console.error('TopTasks:', error.message)
      return
    }
    setTasks(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function markDone(id) {
    if (!supabase) return
    await supabase.from('tasks').update({ done: true }).eq('id', id)
    load()
  }

  return (
    <section className="section">
      <h2>Top 3 task</h2>
      <ol className="task-list numbered">
        {tasks.map((task) => (
          <li key={task.id}>
            <span>{task.title}</span>
            <button type="button" className="btn-ghost" onClick={() => markDone(task.id)}>
              fatto
            </button>
          </li>
        ))}
      </ol>
      {tasks.length === 0 && <p className="muted">Nessun task top oggi.</p>}
    </section>
  )
}
