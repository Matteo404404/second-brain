import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { startTaskNotifications } from './lib/taskNotifications.js'
import App from './App.jsx'
import './styles.css'

registerSW({ immediate: true })
startTaskNotifications()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
