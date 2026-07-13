import { supabase } from './supabaseClient.js'

function client() {
  if (!supabase) throw new Error('Supabase non configurato')
  return supabase
}

export async function listTasks({ done = false, priority } = {}) {
  let q = client().from('tasks').select('*').eq('done', done).order('due_date', { nullsFirst: false })
  if (priority) q = q.eq('priority', priority)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function createTask({ title, priority = 'next', due_date, due_time }) {
  const { data, error } = await client()
    .from('tasks')
    .insert({ title, priority, due_date: due_date || null, due_time: due_time || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTask(id, patch) {
  const { data, error } = await client().from('tasks').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTask(id) {
  const { error } = await client().from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function listNotes({ tag, search } = {}) {
  let q = client().from('notes').select('*').order('created_at', { ascending: false })
  if (tag && tag !== 'all') q = q.eq('tag', tag)
  const { data, error } = await q
  if (error) throw error
  let rows = data ?? []
  if (search?.trim()) {
    const s = search.trim().toLowerCase()
    rows = rows.filter(
      (n) => n.title?.toLowerCase().includes(s) || n.content?.toLowerCase().includes(s),
    )
  }
  return rows
}

export async function createNote({ title, content = '', tag = 'personal' }) {
  const { data, error } = await client()
    .from('notes')
    .insert({ title, content, tag })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateNote(id, patch) {
  const { data, error } = await client().from('notes').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteNote(id) {
  const { error } = await client().from('notes').delete().eq('id', id)
  if (error) throw error
}

export async function listResources({ tag, search } = {}) {
  let q = client().from('resources').select('*').order('created_at', { ascending: false })
  if (tag && tag !== 'all') q = q.eq('tag', tag)
  const { data, error } = await q
  if (error) throw error
  let rows = data ?? []
  if (search?.trim()) {
    const s = search.trim().toLowerCase()
    rows = rows.filter(
      (r) =>
        r.title?.toLowerCase().includes(s) ||
        r.url?.toLowerCase().includes(s) ||
        r.content?.toLowerCase().includes(s),
    )
  }
  return rows
}

export async function createResource({ title, url = '', content = '', tag = 'personal' }) {
  const { data, error } = await client()
    .from('resources')
    .insert({ title, url, content, tag })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateResource(id, patch) {
  const { data, error } = await client().from('resources').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteResource(id) {
  const { error } = await client().from('resources').delete().eq('id', id)
  if (error) throw error
}

export async function listScratchpad({ processed = false } = {}) {
  const { data, error } = await client()
    .from('scratchpad')
    .select('*')
    .eq('processed', processed)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addScratch(content) {
  const { data, error } = await client()
    .from('scratchpad')
    .insert({ content })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markScratchProcessed(id) {
  const { error } = await client().from('scratchpad').update({ processed: true }).eq('id', id)
  if (error) throw error
}

export async function deleteScratch(id) {
  const { error } = await client().from('scratchpad').delete().eq('id', id)
  if (error) throw error
}

export async function archiveItem({ title, content, original_type }) {
  const { error } = await client().from('archive').insert({ title, content, original_type })
  if (error) throw error
}

export function firstLine(text, max = 60) {
  const line = text.trim().split('\n')[0] || 'Senza titolo'
  return line.length > max ? `${line.slice(0, max)}…` : line
}

export function extractUrl(text) {
  const match = text.match(/https?:\/\/[^\s]+/)
  return match ? match[0].replace(/[.,)]+$/, '') : ''
}
