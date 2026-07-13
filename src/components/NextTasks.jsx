import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function NextTasks() {
  const [open, setOpen] = useState(false)
  const [tasks, setTasks] = useState([])

  async function load() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('done', false)
      .eq('priority', 'next')
      .order('due_date', { nullsFirst: false })
    if (error) {
      console.error('NextTasks:', error.message)
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
    <section className="section collapsible">
      <button type="button" className="collapse-head" onClick={() => setOpen(!open)}>
        <h2>Next tasks</h2>
        <span className="muted">{tasks.length}</span>
      </button>
      {open && (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <span>{task.title}</span>
              <button type="button" className="btn-ghost" onClick={() => markDone(task.id)}>
                fatto
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && tasks.length === 0 && <p className="muted">Lista vuota.</p>}
    </section>
  )
}
