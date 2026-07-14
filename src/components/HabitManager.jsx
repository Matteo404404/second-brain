import { useCallback, useEffect, useState } from 'react'
import { deleteHabitTemplate, fetchAllHabitTemplates, saveHabitTemplate } from '../lib/db.js'
import { FREQ_TYPES, PREFERRED_RULES, SECTION_ORDER } from '../lib/habits.js'
import { notifyRefresh } from '../lib/events.js'
import Sheet from './ui/Sheet.jsx'

const empty = {
  title: '',
  section: 'Body',
  frequency_type: 'daily',
  frequency_value: null,
  preferred_rule: '',
  allow_multi: false,
  active: true,
  sort_order: 500,
}

export default function HabitManager() {
  const [open, setOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [habits, setHabits] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)

  const load = useCallback(async () => {
    setHabits(await fetchAllHabitTemplates())
  }, [])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  function startNew() {
    setEditId(null)
    setForm({ ...empty })
    setSheetOpen(true)
  }

  function startEdit(h) {
    setEditId(h.id)
    setForm({
      title: h.title,
      section: h.section,
      frequency_type: h.frequency_type,
      frequency_value: h.frequency_value,
      preferred_rule: h.preferred_rule ?? '',
      allow_multi: h.allow_multi ?? false,
      active: h.active,
      sort_order: h.sort_order,
    })
    setSheetOpen(true)
  }

  async function save() {
    const row = {
      ...form,
      preferred_rule: form.preferred_rule || null,
      frequency_value: form.frequency_value ? Number(form.frequency_value) : null,
    }
    if (editId) row.id = editId
    await saveHabitTemplate(row)
    setSheetOpen(false)
    load()
    notifyRefresh('habits')
  }

  async function remove(id) {
    if (!confirm('Eliminare questa abitudine?')) return
    await deleteHabitTemplate(id)
    load()
    notifyRefresh('habits')
  }

  return (
    <section className="section">
      <button type="button" className="collapse-head" onClick={() => setOpen(!open)}>
        <h2>Gestisci routine</h2>
        <span className="muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <p className="section-desc">Aggiungi, modifica, disattiva abitudini senza SQL.</p>
          <button type="button" className="btn-ghost" onClick={startNew}>+ Nuova abitudine</button>
          <ul className="habit-admin-list">
            {habits.map((h) => (
              <li key={h.id} className={h.active ? '' : 'inactive'}>
                <button type="button" className="habit-admin-btn" onClick={() => startEdit(h)}>
                  {h.title} · {h.frequency_type} {!h.active && '(off)'}
                </button>
                <button type="button" className="btn-icon" onClick={() => remove(h.id)}>×</button>
              </li>
            ))}
          </ul>
        </>
      )}

      <Sheet open={sheetOpen} title={editId ? 'Modifica' : 'Nuova abitudine'} onClose={() => setSheetOpen(false)}>
        <input placeholder="Titolo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
          {[...SECTION_ORDER, 'Monthly'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={form.frequency_type} onChange={(e) => setForm({ ...form, frequency_type: e.target.value })}>
          {FREQ_TYPES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        {(form.frequency_type === 'times_per_week' || form.frequency_type === 'times_per_month') && (
          <input type="number" min="1" placeholder="Quante volte" value={form.frequency_value ?? ''} onChange={(e) => setForm({ ...form, frequency_value: e.target.value })} />
        )}
        <select value={form.preferred_rule ?? ''} onChange={(e) => setForm({ ...form, preferred_rule: e.target.value })}>
          {PREFERRED_RULES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <label className="flag">
          <input type="checkbox" checked={form.allow_multi} onChange={(e) => setForm({ ...form, allow_multi: e.target.checked })} />
          <span>Loggabile più volte al giorno (+)</span>
        </label>
        <button type="button" onClick={save} disabled={!form.title.trim()}>Salva</button>
      </Sheet>
    </section>
  )
}
