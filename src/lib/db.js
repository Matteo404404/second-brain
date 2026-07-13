import { supabase, todayISO } from './supabaseClient.js'
import { getDueHabits } from './habits.js'

function db() {
  if (!supabase) throw new Error('Supabase non configurato')
  return supabase
}

export { todayISO }

// habits
export async function fetchHabitTemplates() {
  const { data, error } = await db().from('habit_templates').select('*').eq('active', true).order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchAllHabitLogs() {
  const { data, error } = await db().from('habit_logs').select('*')
  if (error) throw error
  return data ?? []
}

export async function fetchDayHabitLogs(dateIso = todayISO()) {
  const { data, error } = await db()
    .from('habit_logs')
    .select('*, habit_templates(*)')
    .eq('log_date', dateIso)
  if (error) throw error
  return data ?? []
}

export async function fetchDailyState(dateIso = todayISO()) {
  const { data, error } = await db().from('daily_state').select('*').eq('log_date', dateIso).maybeSingle()
  if (error) throw error
  return data ?? { log_date: dateIso, handwriting_done: false }
}

export async function setHandwritingDone(dateIso, done) {
  const { data, error } = await db()
    .from('daily_state')
    .upsert({ log_date: dateIso, handwriting_done: done, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleHabitLog(id, done) {
  const { data, error } = await db().from('habit_logs').update({ done }).eq('id', id).select('*, habit_templates(*)').single()
  if (error) throw error
  return data
}

// tasks
export async function listTasks({ done = false } = {}) {
  const { data, error } = await db().from('tasks').select('*').eq('done', done).order('due_date', { nullsFirst: false })
  if (error) throw error
  return data ?? []
}

export async function getTask(id) {
  const { data, error } = await db().from('tasks').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createTask(payload) {
  const { data, error } = await db().from('tasks').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateTask(id, patch) {
  const { data, error } = await db().from('tasks').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function completeTask(id) {
  return updateTask(id, { done: true, done_at: new Date().toISOString() })
}

export async function deleteTask(id) {
  const { error } = await db().from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function listSubtasks(taskId) {
  const { data, error } = await db().from('task_subtasks').select('*').eq('task_id', taskId).order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function addSubtask(taskId, title) {
  const { data, error } = await db().from('task_subtasks').insert({ task_id: taskId, title }).select().single()
  if (error) throw error
  return data
}

export async function toggleSubtask(id, done) {
  const { error } = await db().from('task_subtasks').update({ done }).eq('id', id)
  if (error) throw error
}

export async function deleteSubtask(id) {
  const { error } = await db().from('task_subtasks').delete().eq('id', id)
  if (error) throw error
}

// library
export async function listNotes({ tag, search } = {}) {
  let q = db().from('notes').select('*').order('created_at', { ascending: false })
  if (tag && tag !== 'all') q = q.eq('tag', tag)
  const { data, error } = await q
  if (error) throw error
  let rows = data ?? []
  if (search?.trim()) {
    const s = search.trim().toLowerCase()
    rows = rows.filter((n) => n.title?.toLowerCase().includes(s) || n.content?.toLowerCase().includes(s))
  }
  return rows
}

export async function saveNote(row) {
  if (row.id) {
    const { data, error } = await db().from('notes').update(row).eq('id', row.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await db().from('notes').insert(row).select().single()
  if (error) throw error
  return data
}

export async function deleteNote(id) {
  const { error } = await db().from('notes').delete().eq('id', id)
  if (error) throw error
}

export async function listResources({ tag, search } = {}) {
  let q = db().from('resources').select('*').order('created_at', { ascending: false })
  if (tag && tag !== 'all') q = q.eq('tag', tag)
  const { data, error } = await q
  if (error) throw error
  let rows = data ?? []
  if (search?.trim()) {
    const s = search.trim().toLowerCase()
    rows = rows.filter(
      (r) => r.title?.toLowerCase().includes(s) || r.url?.toLowerCase().includes(s) || r.content?.toLowerCase().includes(s),
    )
  }
  return rows
}

export async function saveResource(row) {
  if (row.id) {
    const { data, error } = await db().from('resources').update(row).eq('id', row.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await db().from('resources').insert(row).select().single()
  if (error) throw error
  return data
}

export async function deleteResource(id) {
  const { error } = await db().from('resources').delete().eq('id', id)
  if (error) throw error
}

// inbox
export async function listInbox(processed = false) {
  const { data, error } = await db().from('inbox').select('*').eq('processed', processed).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addInbox(content) {
  const { data, error } = await db().from('inbox').insert({ content }).select().single()
  if (error) throw error
  return data
}

export async function processInbox(id) {
  const { error } = await db().from('inbox').update({ processed: true }).eq('id', id)
  if (error) throw error
}

export async function archiveFromInbox(item, type, title) {
  await db().from('archive').insert({ title, content: item.content, original_type: type })
  await db().from('inbox').update({ processed: true }).eq('id', item.id)
}

export function firstLine(text, max = 56) {
  const line = (text ?? '').trim().split('\n')[0] || 'Senza titolo'
  return line.length > max ? `${line.slice(0, max)}…` : line
}

export function extractUrl(text) {
  const m = (text ?? '').match(/https?:\/\/[^\s]+/)
  return m ? m[0].replace(/[.,)]+$/, '') : ''
}

// sync habits for a specific day; return only habits due that day
export async function syncDayHabits(dateIso = todayISO()) {
  const templates = await fetchHabitTemplates()
  const allLogs = await fetchAllHabitLogs()
  const dailyState = await fetchDailyState(dateIso)
  const due = getDueHabits(templates, dateIso, { logs: allLogs, dailyState, templates })
  const dueIds = new Set(due.map((t) => t.id))

  const existing = await fetchDayHabitLogs(dateIso)
  const have = new Set(existing.map((l) => l.template_id))
  const missing = due.filter((t) => !have.has(t.id)).map((t) => ({ template_id: t.id, log_date: dateIso, done: false }))
  if (missing.length) {
    const { error } = await db().from('habit_logs').insert(missing)
    if (error) throw error
  }

  const fresh = await fetchDayHabitLogs(dateIso)
  return fresh.filter((l) => dueIds.has(l.template_id))
}
