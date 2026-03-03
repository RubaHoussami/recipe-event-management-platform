import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { getToken } from '../api/http'
import './LandingPage.css'

type Tab = 'login' | 'signup'

export function LandingPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  useEffect(() => {
    if (getToken()) navigate('/dashboard', { replace: true })
  }, [navigate])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(loginEmail, loginPassword)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const d = err && typeof err === 'object' && 'detail' in err ? (err as { detail: unknown }).detail : 'Login failed'
      setError(typeof d === 'string' ? d : JSON.stringify(d))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(signupEmail, signupName, signupPassword)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const d = err && typeof err === 'object' && 'detail' in err ? (err as { detail: unknown }).detail : 'Registration failed'
      setError(typeof d === 'string' ? d : JSON.stringify(d))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      <div className="landing__wrap">
        <div className="landing__hero">
          <h1>Recipes & Events</h1>
          <p>One place to manage your recipes and events. Create, share, and organize—with optional AI to parse recipes from text.</p>
        </div>
        <div className="landing__features">
          <div className="landing__feature"><span>📋</span><strong>Recipes</strong></div>
          <div className="landing__feature"><span>📅</span><strong>Events</strong></div>
          <div className="landing__feature"><span>🔗</span><strong>Share</strong></div>
          <div className="landing__feature"><span>✨</span><strong>AI parse</strong></div>
        </div>
        <div className="landing__auth">
          <div className="landing__tabs">
            <button type="button" className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setError(null); }}>Log in</button>
            <button type="button" className={tab === 'signup' ? 'active' : ''} onClick={() => { setTab('signup'); setError(null); }}>Sign up</button>
          </div>
          {error && <div className="landing__error">{error}</div>}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="landing__form">
              <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required autoComplete="email" />
              <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required autoComplete="current-password" />
              <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Log in'}</button>
            </form>
          )}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="landing__form">
              <input type="email" placeholder="Email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required autoComplete="email" />
              <input type="text" placeholder="Name" value={signupName} onChange={(e) => setSignupName(e.target.value)} required autoComplete="name" />
              <input type="password" placeholder="Password (min 8)" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
              <button type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Sign up'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
