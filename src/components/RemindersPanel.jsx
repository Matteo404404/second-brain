import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function RemindersPanel() {
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('behavior_reminders')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) console.error('RemindersPanel:', error.message)
        else setItems(data ?? [])
      })
  }, [])

  return (
    <section className="section">
      <h2>Rules / Reminders</h2>
      <ul className="reminder-list">
        {items.map((item) => (
          <li key={item.id}>{item.body}</li>
        ))}
      </ul>
    </section>
  )
}
