import { useState } from 'react'
import { signInWithMagicLink } from '../lib/auth.js'
import { ALLOWED_EMAIL } from '../lib/supabaseClient.js'

export default function AuthLogin() {
  const [email, setEmail] = useState(ALLOWED_EMAIL)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithMagicLink(email)
      setSent(true)
    } catch (err) {
      setError(err.message ?? 'Errore login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <h1 className="dot-title">Second Brain</h1>
      <p className="muted">Magic link, niente password.</p>
      {sent ? (
        <p className="auth-msg">Controlla la mail e clicca il link.</p>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Invio...' : 'Invia link'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  )
}
