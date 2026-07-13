import { todayISO } from './supabaseClient.js'

let selected = todayISO()
const listeners = new Set()

export function getSelectedDay() {
  return selected
}

export function setSelectedDay(iso) {
  selected = iso
  listeners.forEach((fn) => fn(iso))
}

export function onSelectedDay(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
