import { useEffect, useState } from 'react'
import { isDeviceTrusted, pairDevice } from '../lib/deviceAuth.js'
import { supabase } from '../lib/supabaseClient.js'

export default function DeviceGate({ children }) {
  const [status, setStatus] = useState('loading')
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function check() {
    if (!supabase) {
      setStatus('no_config')
      return
    }
    const ok = await isDeviceTrusted(supabase)
    setStatus(ok ? 'ok' : 'pair')
  }

  useEffect(() => {
    check()
  }, [])

  async function handlePair(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await pairDevice(supabase, code, label)
      setStatus('ok')
    } catch (err) {
      setError(err.message ?? 'Errore pairing')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="auth-screen muted">Caricamento...</div>
  }

  if (status === 'no_config') {
    return (
      <div className="auth-screen">
        <h1 className="dot-title">Second Brain</h1>
        <p className="error">Supabase non configurato.</p>
      </div>
    )
  }

  if (status === 'pair') {
    return (
      <div className="auth-screen">
        <h1 className="dot-title">Second Brain</h1>
        <p className="muted">Prima volta su questo dispositivo. Inserisci il codice pairing (una volta sola).</p>
        <form className="auth-form" onSubmit={handlePair}>
          <input
            type="password"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Codice pairing"
            required
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nome device (es. PC, Nothing)"
          />
          <button type="submit" disabled={loading || !code.trim()}>
            {loading ? 'Registro...' : 'Registra dispositivo'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    )
  }

  return children
}
