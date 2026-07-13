import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function QuickCapture() {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const content = text.trim()
    if (!content || !supabase) return

    const { error } = await supabase.from('scratchpad').insert({ content })
    if (error) {
      console.error('QuickCapture:', error.message)
      return
    }

    setText('')
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <section className="section">
      <h2>Quick capture</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pensiero veloce, link, idea..."
          rows={3}
        />
        <div className="row">
          <button type="submit" disabled={!text.trim()}>
            Salva
          </button>
          {saved && <span className="muted">salvato su scratchpad</span>}
        </div>
      </form>
    </section>
  )
}
