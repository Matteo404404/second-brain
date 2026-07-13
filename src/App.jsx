import { useEffect, useState } from 'react'
import { onAuthChange, signOut } from './lib/auth.js'
import AuthLogin from './components/AuthLogin.jsx'
import TodayChecks from './components/TodayChecks.jsx'
import TopTasks from './components/TopTasks.jsx'
import NextTasks from './components/NextTasks.jsx'
import ScheduleView from './components/ScheduleView.jsx'
import QuickCapture from './components/QuickCapture.jsx'
import NotesPanel from './components/NotesPanel.jsx'
import RemindersPanel from './components/RemindersPanel.jsx'
import ArchivePanel from './components/ArchivePanel.jsx'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => onAuthChange(setSession), [])

  if (session === undefined) {
    return <div className="auth-screen muted">Caricamento...</div>
  }

  if (!session) {
    return <AuthLogin />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="dot-title">Second Brain</h1>
        <button type="button" className="btn-ghost" onClick={signOut}>
          Esci
        </button>
      </header>

      <main className="stack">
        <TodayChecks />
        <TopTasks />
        <NextTasks />
        <ScheduleView />
        <QuickCapture />
        <NotesPanel />
        <RemindersPanel />
        <ArchivePanel />
      </main>
    </div>
  )
}
