// habit due logic — only what applies on the selected day; no future/past flags

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateOnly(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(iso, n) {
  const d = parseDate(iso)
  d.setDate(d.getDate() + n)
  return dateOnly(d)
}

function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86_400_000)
}

function weekStartMonday(iso) {
  const d = parseDate(iso)
  const dow = d.getDay() || 7
  d.setDate(d.getDate() - (dow - 1))
  return dateOnly(d)
}

function logsAsOf(logs, dateIso) {
  return logs.filter((l) => l.log_date <= dateIso)
}

function logsForTemplate(id, logs) {
  return logs.filter((l) => l.template_id === id)
}

function doneOnDate(templateId, logs, iso) {
  return logsForTemplate(templateId, logs).some((l) => l.log_date === iso && l.done)
}

function doneCountWeek(templateId, logs, iso) {
  const start = weekStartMonday(iso)
  return logsForTemplate(templateId, logs).filter((l) => l.done && l.log_date >= start && l.log_date <= iso).length
}

function doneCountMonth(templateId, logs, iso) {
  const month = iso.slice(0, 7)
  return logsForTemplate(templateId, logs).filter(
    (l) => l.done && l.log_date.startsWith(month) && l.log_date <= iso,
  ).length
}

function lastDoneBefore(templateId, logs, iso) {
  const dates = logsForTemplate(templateId, logs)
    .filter((l) => l.done && l.log_date < iso)
    .map((l) => l.log_date)
    .sort()
  return dates.at(-1) ?? null
}

function findTemplate(templates, title) {
  return templates.find((t) => t.title === title || t.title.startsWith(title))
}

export function isTrainingScheduled(dateIso, templates, logs) {
  const L = logsAsOf(logs, dateIso)
  const training = findTemplate(templates, 'Training')
  if (!training) return false
  if (doneOnDate(training.id, L, dateIso)) return false
  if (doneOnDate(training.id, L, addDays(dateIso, -1))) return false

  const weekDone = doneCountWeek(training.id, L, dateIso)
  const quota = training.frequency_value ?? 3
  if (weekDone >= quota) return false

  const d = parseDate(dateIso)
  if (d.getDate() % 2 === 0) return true
  if (d.getDay() >= 4 && weekDone < quota) return true
  return false
}

export function isRestDay(dateIso, templates, logs) {
  const L = logsAsOf(logs, dateIso)
  const training = findTemplate(templates, 'Training')
  if (training && doneOnDate(training.id, L, dateIso)) return false
  if (training && doneOnDate(training.id, L, addDays(dateIso, -1))) return true
  return !isTrainingScheduled(dateIso, templates, L)
}

function everyOtherDayDue(template, dateIso, logs) {
  const last = lastDoneBefore(template.id, logs, dateIso)
  if (!last) return true
  return daysBetween(last, dateIso) >= 2
}

function conditionalDue(template, dateIso, ctx) {
  const { logs, dailyState, templates } = ctx
  if (template.preferred_rule === 'no_handwriting') {
    return !dailyState?.handwriting_done
  }
  if (template.preferred_rule === 'rest_only') {
    return isRestDay(dateIso, templates, logs)
  }
  return false
}

export function habitDueOn(template, dateIso, ctx) {
  if (!template.active) return false
  const logs = logsAsOf(ctx.logs, dateIso)
  const scoped = { ...ctx, logs }

  switch (template.frequency_type) {
    case 'daily':
      return true
    case 'weekdays':
      return parseDate(dateIso).getDay() >= 1 && parseDate(dateIso).getDay() <= 5
    case 'daily_except_sunday':
      return parseDate(dateIso).getDay() !== 0
    case 'every_other_day':
      return everyOtherDayDue(template, dateIso, logs)
    case 'times_per_week':
      return template.title.startsWith('Training') && isTrainingScheduled(dateIso, scoped.templates, logs)
    case 'times_per_month':
      return false
    case 'conditional':
      return conditionalDue(template, dateIso, scoped)
    default:
      return false
  }
}

export const SECTION_ORDER = ['Morning', 'Body', 'Mind', 'Work', 'Evening', 'Rest']

export function getDueHabits(templates, dateIso, ctx) {
  return templates
    .filter((t) => habitDueOn(t, dateIso, ctx))
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function groupBySection(habits) {
  const map = {}
  for (const s of SECTION_ORDER) map[s] = []
  for (const h of habits) {
    const section = h.preferred_rule === 'rest_only' ? 'Rest' : h.section
    if (!map[section]) map[section] = []
    map[section].push(h)
  }
  return SECTION_ORDER.filter((s) => map[s]?.length).map((s) => ({ section: s, items: map[s] }))
}

export function getBacklog(templates, dateIso, logs) {
  const L = logsAsOf(logs, dateIso)
  const items = []
  for (const t of templates) {
    if (!t.active) continue
    if (t.frequency_type === 'times_per_week' && !t.title.startsWith('Training')) {
      const done = doneCountWeek(t.id, L, dateIso)
      const quota = t.frequency_value ?? 1
      if (done < quota) items.push({ template: t, done, quota, period: 'sett' })
    }
    if (t.frequency_type === 'times_per_month') {
      const done = doneCountMonth(t.id, L, dateIso)
      const quota = t.frequency_value ?? 1
      if (done < quota) items.push({ template: t, done, quota, period: 'mese' })
    }
  }
  return items
}

export function dayStats(logs) {
  const total = logs.length
  const done = logs.filter((l) => l.done).length
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 }
}

export function computeStreak(allLogs, todayIso) {
  let streak = 0
  const cursor = parseDate(todayIso)
  while (true) {
    const iso = dateOnly(cursor)
    const dayLogs = allLogs.filter((l) => l.log_date === iso)
    if (dayLogs.length === 0) break
    if (dayStats(dayLogs).percent < 80) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export async function monthHistory(supabase, year, month) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const end = dateOnly(new Date(year, month + 1, 0))
  const { data, error } = await supabase
    .from('habit_logs')
    .select('log_date, done')
    .gte('log_date', start)
    .lte('log_date', end)
  if (error) throw error
  const byDay = {}
  for (const row of data ?? []) {
    if (!byDay[row.log_date]) byDay[row.log_date] = { total: 0, done: 0 }
    byDay[row.log_date].total++
    if (row.done) byDay[row.log_date].done++
  }
  return byDay
}

export const FREQ_TYPES = [
  { id: 'daily', label: 'Ogni giorno' },
  { id: 'weekdays', label: 'Lun–Ven' },
  { id: 'daily_except_sunday', label: 'Ogni giorno tranne domenica' },
  { id: 'every_other_day', label: 'A giorni alterni (EOD)' },
  { id: 'times_per_week', label: 'X volte a settimana (backlog se non Training)' },
  { id: 'times_per_month', label: 'X volte al mese (solo backlog)' },
  { id: 'conditional', label: 'Condizionale' },
]

export const PREFERRED_RULES = [
  { id: '', label: '—' },
  { id: 'no_handwriting', label: 'Stare al muro se non scrivi a mano' },
  { id: 'rest_only', label: 'Solo giorno di rest' },
  { id: 'thursday_preferred', label: 'Giovedì preferito (backlog)' },
]

if (typeof console !== 'undefined' && console.assert) {
  const templates = [{ id: 't1', title: 'Training', active: true, frequency_type: 'times_per_week', frequency_value: 3, sort_order: 1, section: 'Body' }]
  const logs = [{ template_id: 't1', log_date: '2026-07-14', done: true }]
  console.assert(isRestDay('2026-07-14', templates, logs) === false)
  console.assert(isRestDay('2026-07-15', templates, logs) === true)
}
