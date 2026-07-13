function pad(n) {
  return String(n).padStart(2, '0')
}

function toIcsDate(dateIso, timeStr) {
  const [y, m, d] = dateIso.split('-').map(Number)
  if (!timeStr) {
    return `${y}${pad(m)}${pad(d)}`
  }
  const [hh, mm] = timeStr.split(':').map(Number)
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`
}

function escapeIcs(text) {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function tasksToIcs(tasks) {
  const withDate = tasks.filter((t) => t.due_date && !t.done)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Second Brain//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const task of withDate) {
    const uid = task.id
    const stamp = toIcsDate(new Date().toISOString().slice(0, 10))
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}@second-brain`)
    lines.push(`DTSTAMP:${stamp}`)
    if (task.due_time) {
      const start = toIcsDate(task.due_date, task.due_time)
      lines.push(`DTSTART:${start}`)
      lines.push(`DTEND:${start}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${toIcsDate(task.due_date)}`)
      lines.push(`DTEND;VALUE=DATE:${toIcsDate(task.due_date)}`)
    }
    lines.push(`SUMMARY:${escapeIcs(task.title)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(tasks, filename = 'second-brain.ics') {
  const blob = new Blob([tasksToIcs(tasks)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
