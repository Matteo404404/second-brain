import { clearDeviceId } from './lib/deviceAuth.js'
import DeviceGate from './components/DeviceGate.jsx'
import TodayView from './components/TodayView.jsx'
import TasksPanel from './components/TasksPanel.jsx'
import CalendarView from './components/CalendarView.jsx'
import InboxCapture from './components/InboxCapture.jsx'
import Library from './components/Library.jsx'
import HabitManager from './components/HabitManager.jsx'
import RemindersPanel from './components/RemindersPanel.jsx'
import ArchivePanel from './components/ArchivePanel.jsx'

export default function App() {
  return (
    <DeviceGate>
      <div className="app">
        <header className="app-header">
          <h1 className="dot-title">Second Brain</h1>
          <button
            type="button"
            className="btn-ghost"
            title="Dimentica questo dispositivo (serve il codice pairing di nuovo)"
            onClick={() => {
              clearDeviceId()
              window.location.reload()
            }}
          >
            Rimuovi device
          </button>
        </header>

        <main className="stack">
          <CalendarView />
          <TodayView />
          <TasksPanel />
          <InboxCapture />
          <Library />
          <RemindersPanel />
          <HabitManager />
          <ArchivePanel />
        </main>
      </div>
    </DeviceGate>
  )
}
