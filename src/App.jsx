import { clearDeviceId } from './lib/deviceAuth.js'
import DeviceGate from './components/DeviceGate.jsx'
import TodayChecks from './components/TodayChecks.jsx'
import TopTasks from './components/TopTasks.jsx'
import NextTasks from './components/NextTasks.jsx'
import ScheduleView from './components/ScheduleView.jsx'
import QuickCapture from './components/QuickCapture.jsx'
import NotesPanel from './components/NotesPanel.jsx'
import RemindersPanel from './components/RemindersPanel.jsx'
import ArchivePanel from './components/ArchivePanel.jsx'

function lockDevice() {
  clearDeviceId()
  window.location.reload()
}

export default function App() {
  return (
    <DeviceGate>
      <div className="app">
        <header className="app-header">
          <h1 className="dot-title">Second Brain</h1>
          <button type="button" className="btn-ghost" onClick={lockDevice}>
            Blocca
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
    </DeviceGate>
  )
}
