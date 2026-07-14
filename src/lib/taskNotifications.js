// ponytail: native Notification API, solo task con due_date; app aperta/PWA

import { listTasks } from './db.js'

const fired = new Set()

function taskKey(task) {
  return `${task.id}:${task.due_date}:${task.due_time ?? ''}`
}

function dueMoment(task) {
  if (!task.due_date) return null
  const t = task.due_time ? task.due_time.slice(0, 5) : '09:00'
  return new Date(`${task.due_date}T${t}:00`)
}

export async function checkTaskNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const now = Date.now()
  const tasks = await listTasks({ done: false })

  for (const task of tasks) {
    if (!task.due_date) continue
    const key = taskKey(task)
    if (fired.has(key)) continue

    const due = dueMoment(task)
    if (!due || Number.isNaN(due.getTime())) continue

    const diff = due.getTime() - now
    // notifica entro 1 min prima o fino a 5 min dopo
    if (diff <= 60_000 && diff >= -300_000) {
      new Notification('Second Brain — task', {
        body: task.due_time ? `${task.due_time.slice(0, 5)} · ${task.title}` : `Oggi · ${task.title}`,
        tag: key,
      })
      fired.add(key)
    }
  }
}

export function startTaskNotifications() {
  if (!('Notification' in window)) return

  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }

  checkTaskNotifications().catch(console.error)
  window.setInterval(() => checkTaskNotifications().catch(console.error), 60_000)
}
