import { getDueTemplates } from './checkEngine.js'
import { supabase, todayISO } from './supabaseClient.js'

export async function fetchTemplates() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('check_templates')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchAllLogs() {
  if (!supabase) return []
  const { data, error } = await supabase.from('check_logs').select('*')
  if (error) throw error
  return data ?? []
}

export async function fetchTodayLogs(dateIso = todayISO()) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('check_logs')
    .select('*, check_templates(*)')
    .eq('log_date', dateIso)
  if (error) throw error
  return data ?? []
}

export async function fetchDailyState(dateIso = todayISO()) {
  if (!supabase) return { log_date: dateIso, handwriting_done: false, is_rest_day: false }
  const { data, error } = await supabase
    .from('daily_state')
    .select('*')
    .eq('log_date', dateIso)
    .maybeSingle()
  if (error) throw error
  return data ?? { log_date: dateIso, handwriting_done: false, is_rest_day: false }
}

export async function updateDailyState(dateIso, patch) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('daily_state')
    .upsert({ log_date: dateIso, ...patch, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function syncTodayChecks(dateIso = todayISO()) {
  const templates = await fetchTemplates()
  const allLogs = await fetchAllLogs()
  const dailyState = await fetchDailyState(dateIso)
  const due = getDueTemplates(templates, dateIso, {
    logs: allLogs,
    dailyState,
    allTemplates: templates,
  })

  const existing = await fetchTodayLogs(dateIso)
  const existingIds = new Set(existing.map((l) => l.template_id))

  const toInsert = due
    .filter((t) => !existingIds.has(t.id))
    .map((t) => ({ template_id: t.id, log_date: dateIso, done: false }))

  if (toInsert.length > 0) {
    const { error } = await supabase.from('check_logs').insert(toInsert)
    if (error) throw error
  }

  // ponytail: stale logs for templates no longer due stay in DB for history
  return fetchTodayLogs(dateIso)
}

export async function toggleCheckLog(logId, done) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('check_logs')
    .update({ done })
    .eq('id', logId)
    .select('*, check_templates(*)')
    .single()
  if (error) throw error
  return data
}

export function checkStats(logs) {
  const total = logs.length
  const done = logs.filter((l) => l.done).length
  const percent = total ? Math.round((done / total) * 100) : 0
  return { total, done, percent }
}
