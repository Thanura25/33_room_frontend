import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getSetupStatus, register } from '../services/authService'

export default function Login() {
  const { login } = useAuth()
  const [needsSetup, setNeedsSetup] = useState(false)
  const [checking, setChecking] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    getSetupStatus().then(result => {
      if (active) { setNeedsSetup(result.needsSetup); setError('') }
    }).catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [retry])

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (needsSetup) {
        await register({ name, email, password })
        setNeedsSetup(false)
      }
      await login({ email, password })
    } catch (err) {
      setError(err.message)
    } finally { setBusy(false) }
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <span className="login-brand">33<span>room</span></span>
        <p className="panel-kicker">Boarding House Management System</p>
        <h1>Monthly Bill &amp;<br />Expense Portal</h1>
        <p>Complete monthly bill distribution across Electricity, Water, Telecom, Restaurant, and Other Expenses, with automated WhatsApp notices and payment receipts.</p>
        <ol className="login-steps">
          <li><strong>5 Bill Categories</strong> — Electricity, Water, Telecom, Restaurant, Other</li>
          <li><strong>Equal Share Split</strong> — Select members with automatic cent-perfect calculation</li>
          <li><strong>WhatsApp Notices</strong> — Instant notification with click-to-chat fallback</li>
          <li><strong>Member Dashboard</strong> — Personalized breakdown, balances, and payment receipts</li>
        </ol>
      </section>
      <form className="panel login-card" onSubmit={handleSubmit}>
        <p className="panel-kicker">Room 33 Portal</p>
        <h2>{checking ? 'Connecting…' : needsSetup ? 'Set up your workspace' : 'Welcome back'}</h2>
        <p>{needsSetup ? 'Create the first administrator account to get started.' : 'Sign in as Administrator or Boarding Member.'}</p>
        <fieldset disabled={checking || busy}>
          {needsSetup && <label className="field"><span>Your name</span><input required autoComplete="name" value={name} onChange={event => setName(event.target.value)} /></label>}
          <label className="field">
            <span>Email address or Phone number</span>
            <input required type="text" placeholder="name@example.com or 077..." autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input required type="password" minLength={needsSetup ? 8 : undefined} autoComplete={needsSetup ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">{busy ? 'Please wait…' : needsSetup ? 'Create account & sign in' : 'Sign in to Portal'}</button>
        </fieldset>
        {error && <div className="login-error" role="alert"><p>{error}</p><button className="ghost-button" type="button" disabled={busy || checking} onClick={() => { setChecking(true); setRetry(value => value + 1) }}>Retry connection</button></div>}
      </form>
    </main>
  )
}
