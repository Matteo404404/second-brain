// decide which check_templates apply on a given date

function dateOnly(d) {
  return d.toISOString().slice(0, 10)
}

function parseDate(iso) {
  const [y, m, day] = iso.split('-').map(Number)
  return new Date(y, m - 1, day)
}

function daysBetween(a, b) {
  const ms = parseDate(b).getTime() - parseDate(a).getTime()
  return Math.round(ms / 86_400_000)
}

function weekStartMonday(iso) {
  const d = parseDate(iso)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - (day - 1))
  return dateOnly(d)
}

function logsForTemplate(templateId, logs) {
  return logs.filter((l) => l.template_id === templateId)
}

function doneCountInRange(templateId, logs, from, to) {
  return logsForTemplate(templateId, logs).filter(
    (l) => l.done && l.log_date >= from && l.log_date <= to,
  ).length
}

function lastDoneDate(templateId, logs, beforeIso) {
  const done = logsForTemplate(templateId, logs)
    .filter((l) => l.done && l.log_date < beforeIso)
    .map((l) => l.log_date)
    .sort()
  return done.at(-1) ?? null
}

function everyOtherDayDue(template, dateIso, logs) {
  const last = lastDoneDate(template.id, logs, dateIso)
  if (!last) return true
  return daysBetween(last, dateIso) >= 2
}

function timesPerWeekDue(template, dateIso, logs) {
  const quota = template.frequency_value ?? 1
  const weekStart = weekStartMonday(dateIso)
  const done = doneCountInRange(template.id, logs, weekStart, dateIso)
  if (done >= quota) return false

  const d = parseDate(dateIso)
  const dow = d.getDay()

  if (template.preferred_rule === 'even_days_preferred') {
    return true
  }
  if (template.preferred_rule === 'thursday_preferred') {
    if (dow === 4) return true
    if (dow >= 5) return true
    return dow <= 3
  }
  return true
}

function timesPerMonthDue(template, dateIso, logs) {
  const quota = template.frequency_value ?? 1
  const month = dateIso.slice(0, 7)
  const done = logsForTemplate(template.id, logs).filter(
    (l) => l.done && l.log_date.startsWith(month) && l.log_date <= dateIso,
  ).length
  return done < quota
}

function isTrainingDueToday(trainingTemplate, dateIso, logs, allTemplates) {
  if (!trainingTemplate) return false
  return templateDueOn(trainingTemplate, dateIso, {
    logs,
    dailyState: null,
    allTemplates,
  })
}

function conditionalDue(template, dateIso, ctx) {
  const { logs, dailyState, allTemplates } = ctx
  const rule = template.preferred_rule

  if (rule === 'no_handwriting') {
    return !dailyState?.handwriting_done
  }

  if (rule === 'rest_day') {
    if (dailyState?.is_rest_day) return true
    const training = allTemplates.find((t) => t.title === 'Training')
    return !isTrainingDueToday(training, dateIso, logs, allTemplates)
  }

  return false
}

export function templateDueOn(template, dateIso, ctx) {
  if (!template.active) return false

  const { logs, dailyState, allTemplates } = ctx

  switch (template.frequency_type) {
    case 'daily':
      return true
    case 'daily_except_sunday':
      return parseDate(dateIso).getDay() !== 0
    case 'weekdays':
      return parseDate(dateIso).getDay() >= 1 && parseDate(dateIso).getDay() <= 5
    case 'every_other_day':
      return everyOtherDayDue(template, dateIso, logs)
    case 'times_per_week':
      return timesPerWeekDue(template, dateIso, logs)
    case 'times_per_month':
      return timesPerMonthDue(template, dateIso, logs)
    case 'conditional':
      return conditionalDue(template, dateIso, { logs, dailyState, allTemplates })
    default:
      return false
  }
}

export function getDueTemplates(templates, dateIso, ctx) {
  return templates
    .filter((t) => templateDueOn(t, dateIso, ctx))
    .sort((a, b) => a.sort_order - b.sort_order)
}

export const CATEGORY_ORDER = ['Morning', 'Body', 'Mind', 'Evening']

export function groupByCategory(items) {
  const groups = {}
  for (const cat of CATEGORY_ORDER) {
    groups[cat] = []
  }
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  }
  return CATEGORY_ORDER.filter((c) => groups[c]?.length).map((c) => ({
    category: c,
    items: groups[c],
  }))
}

// ponytail: smallest self-check
if (typeof console !== 'undefined' && console.assert) {
  const t = {
    id: '1',
    title: 'Training',
    active: true,
    frequency_type: 'times_per_week',
    frequency_value: 3,
    preferred_rule: 'even_days_preferred',
    sort_order: 1,
    category: 'Body',
  }
  console.assert(
    templateDueOn(t, '2026-07-14', { logs: [], dailyState: {}, allTemplates: [t] }),
    'times_per_week due check failed',
  )
}
