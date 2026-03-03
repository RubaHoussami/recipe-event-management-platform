import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login, register } from '../api/auth'
import { getToken } from '../api/http'
import { useTheme } from '../contexts/ThemeContext'
import { IconDarkMode, IconEvents, IconLightMode, IconRecipes, IconShare, IconSparkles } from '../components/Icons'
import './LandingPage.css'

type Tab = 'login' | 'signup'

export function LandingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const authRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash === 'signup') {
      setTab('signup')
      setError(null)
    } else if (hash === 'login') {
      setTab('login')
      setError(null)
    }
  }, [navigate, location.hash])

  useEffect(() => {
    if (location.hash && authRef.current) {
      authRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash, tab])

  function goToAuth(newTab: Tab) {
    setTab(newTab)
    setError(null)
    window.history.replaceState(null, '', newTab === 'signup' ? '/#signup' : '/#login')
    authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
      <header className="landing__nav">
        <a href="/" className="landing__logo">Recipes & Events</a>
        <div className="landing__nav-actions">
          <button type="button" className="landing__theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <IconLightMode className="app-icon icon--sm" /> : <IconDarkMode className="app-icon icon--sm" />}
          </button>
          {getToken() ? (
            <Link to="/dashboard" className="landing__nav-btn landing__nav-btn--primary">Go to dashboard</Link>
          ) : (
            <>
              <button type="button" className="landing__nav-btn" onClick={() => goToAuth('login')}>Sign in</button>
              <button type="button" className="landing__nav-btn landing__nav-btn--primary" onClick={() => goToAuth('signup')}>Sign up</button>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="landing__hero">
          <div className="landing__hero-content">
            <h1>Your recipes and events, one place.</h1>
            <p className="landing__hero-lead">
              Save what you cook, plan what you host. Share with friends, tag and search, and let AI help you turn a block of text into a recipe in one click.
            </p>
            <div className="landing__hero-cta">
              <button type="button" className="landing__cta-primary" onClick={() => goToAuth('signup')}>Get started — it’s free</button>
              <button type="button" className="landing__cta-secondary" onClick={() => goToAuth('login')}>I already have an account</button>
            </div>
          </div>
          <div className="landing__hero-visual">
            <img src="/images/hero.jpg" alt="Recipes and cooking" className="landing__hero-img" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </div>
        </section>

        <section className="landing__about">
          <h2>Built for home cooks and hosts</h2>
          <p className="landing__about-lead">
            Whether you’re keeping a personal cookbook, planning a dinner party, or sharing a recipe with a friend, Recipes & Events keeps everything organized and easy to find.
          </p>
          <div className="landing__about-grid">
            <div className="landing__about-card">
              <div className="landing__about-img-wrap">
                <img src="/images/recipes.jpg" alt="Recipe collection" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <h3>Recipes that stick around</h3>
              <p>Add recipes one by one or paste from anywhere. Search, filter by cuisine or tags, and mark favorites or “to try.”</p>
            </div>
            <div className="landing__about-card">
              <div className="landing__about-img-wrap">
                <img src="/images/events.jpg" alt="Events and planning" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <h3>Events in one place</h3>
              <p>Create events, invite people, and keep track of what's coming up. No more scattered notes or lost invites.</p>
            </div>
            <div className="landing__about-card">
              <div className="landing__about-img-wrap">
                <img src="/images/share.jpg" alt="Sharing recipes" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <h3>Share and collaborate</h3>
              <p>Share a recipe as view-only or let others edit. Perfect for family cookbooks or cooking with friends.</p>
            </div>
          </div>
        </section>

        <section className="landing__features">
          <h2>Everything you need</h2>
          <div className="landing__features-grid">
            <div className="landing__feature">
              <span className="landing__feature-icon"><IconRecipes className="app-icon icon--lg" /></span>
              <strong>Recipes</strong>
              <span>One-by-one or bulk. Full control.</span>
            </div>
            <div className="landing__feature">
              <span className="landing__feature-icon"><IconEvents className="app-icon icon--lg" /></span>
              <strong>Events</strong>
              <span>Plan and invite in one place.</span>
            </div>
            <div className="landing__feature">
              <span className="landing__feature-icon"><IconShare className="app-icon icon--lg" /></span>
              <strong>Share</strong>
              <span>View or edit, your choice.</span>
            </div>
            <div className="landing__feature">
              <span className="landing__feature-icon"><IconSparkles className="app-icon icon--lg" /></span>
              <strong>AI parse</strong>
              <span>Paste text, get a recipe.</span>
            </div>
          </div>
        </section>

        <section className="landing__auth-section" id="auth" ref={authRef}>
          <h2>Sign in or create an account</h2>
          <div className="landing__auth">
            <div className="landing__tabs">
              <button type="button" className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setError(null); }}>Sign in</button>
              <button type="button" className={tab === 'signup' ? 'active' : ''} onClick={() => { setTab('signup'); setError(null); }}>Sign up</button>
            </div>
            {error && <div className="landing__error">{error}</div>}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="landing__form">
                <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required autoComplete="email" />
                <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required autoComplete="current-password" />
                <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
              </form>
            )}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="landing__form">
                <input type="email" placeholder="Email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required autoComplete="email" />
                <input type="text" placeholder="Name" value={signupName} onChange={(e) => setSignupName(e.target.value)} required autoComplete="name" />
                <input type="password" placeholder="Password (min 8 characters)" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
                <button type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Sign up'}</button>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
