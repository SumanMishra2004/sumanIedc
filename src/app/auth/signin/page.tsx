'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginAction } from '@/lib/actions/auth'
import TurnstileWidget from '@/components/auth/TurnstileWidget'
import gsap from 'gsap'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function SignInContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'

  const wrapRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLHeadingElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const tagsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo(leftRef.current, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 1 })
        .fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.inOut' }, '-=0.6')
        .fromTo(headRef.current?.querySelectorAll('.hw') ?? [], { y: '110%', opacity: 0 }, { y: '0%', opacity: 1, stagger: 0.1, duration: 0.9 }, '-=0.6')
        .fromTo(tagsRef.current?.querySelectorAll('.tag') ?? [], { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.5 }, '-=0.4')
      tl.fromTo(rightRef.current, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'expo.out' }, '-=1.2')
        .fromTo('.si-row', { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.55, ease: 'power3.out' }, '-=0.6')
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Ensure Turnstile token exists in production
    if (!turnstileToken && process.env.NODE_ENV !== 'development') {
      setError('Please complete the CAPTCHA')
      setIsLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('email', email.toLowerCase().trim())
      formData.append('password', password)
      formData.append('turnstileToken', turnstileToken)

      const result = await loginAction(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        window.location.href = callbackUrl
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .ai { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:13px 44px 13px 16px; color:#f0ede6; font-family:'Space Grotesk',sans-serif; font-size:14px; outline:none; transition:border-color .2s,box-shadow .2s; }
        .ai::placeholder { color:rgba(240,237,230,0.2); }
        .ai:focus { border-color:rgba(201,245,59,0.5); box-shadow:0 0 0 3px rgba(201,245,59,0.07); }
        .ai:disabled { opacity:.45; cursor:not-allowed; }
        .lbl { display:block; font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:rgba(201,245,59,0.65); margin-bottom:8px; font-family:monospace; }
        .sbtn { width:100%; padding:13px; border-radius:10px; border:none; background:#c9f53b; color:#0c0c0c; font-size:14px; font-weight:700; font-family:'Space Grotesk',sans-serif; letter-spacing:.04em; cursor:pointer; transition:opacity .2s,transform .15s; }
        .sbtn:hover:not(:disabled) { opacity:.88; }
        .sbtn:active:not(:disabled) { transform:scale(.98); }
        .sbtn:disabled { opacity:.45; cursor:not-allowed; }
        .eye-btn { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:rgba(240,237,230,0.3); line-height:1; padding:0; }
        .eye-btn:hover { color:rgba(240,237,230,0.6); }
        @media (max-width: 767px) {
          .auth-left  { display: none !important; }
          .auth-right { border-radius: 0 !important; border: none !important; max-width: 100% !important; min-height: 100vh !important; }
          .auth-wrap  { align-items: flex-start !important; }
        }
      `}</style>

      <div ref={wrapRef} className="auth-wrap" style={{ minHeight: '100vh', background: '#080808', display: 'flex', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden' }}>

        {/* ── LEFT PANEL ── */}
        <div ref={leftRef} className="auth-left" style={{
          width: '45%', minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '48px 52px',
          background: 'linear-gradient(160deg,#0e1a00 0%,#080808 60%)',
          borderRight: '1px solid rgba(201,245,59,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,rgba(201,245,59,0.025) 0,rgba(201,245,59,0.025) 1px,transparent 1px,transparent 56px),repeating-linear-gradient(90deg,rgba(201,245,59,0.025) 0,rgba(201,245,59,0.025) 1px,transparent 1px,transparent 56px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(201,245,59,0.09) 0%,transparent 65%)', pointerEvents: 'none', filter: 'blur(4px)' }} />

          <div>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid rgba(201,245,59,0.5)', background: 'rgba(201,245,59,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#c9f53b', letterSpacing: '-0.01em' }}>IEDC</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(201,245,59,0.7)', letterSpacing: '0.04em' }}>Research Lab</span>
            </Link>
          </div>

          <div>
            <div ref={lineRef} style={{ width: 48, height: 2, background: '#c9f53b', marginBottom: 28, transformOrigin: 'left' }} />
            <h2 ref={headRef} style={{ fontSize: 'clamp(2rem,3.5vw,3rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, overflow: 'hidden' }}>
              {['Sign in', 'to your', 'workspace.'].map((w, i) => (
                <div key={i} style={{ overflow: 'hidden' }}>
                  <span className="hw" style={{ display: 'inline-block', color: i === 2 ? '#c9f53b' : '#f0ede6', fontStyle: i === 1 ? 'italic' : 'normal', willChange: 'transform' }}>{w}</span>
                </div>
              ))}
            </h2>
            <p style={{ marginTop: 20, fontSize: 14, color: 'rgba(240,237,230,0.35)', lineHeight: 1.7, maxWidth: 300 }}>Access your research portfolio, publications, and collaboration tools.</p>
            <div ref={tagsRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
              {['Research', 'Publications', 'Patents', 'Dashboard'].map(t => (
                <span key={t} className="tag" style={{ fontSize: 11, padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(201,245,59,0.2)', color: 'rgba(201,245,59,0.6)', fontFamily: 'monospace', letterSpacing: '0.08em', background: 'rgba(201,245,59,0.04)' }}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
            <p style={{ fontSize: 12, color: 'rgba(240,237,230,0.2)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>IEDC · Dept. of CSE · Since 1999</p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div ref={rightRef} className="auth-right" style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          minHeight: '100vh', padding: '40px 24px',
          background: '#0a0a0a',
        }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div className="si-row" style={{ marginBottom: 32 }}>
              <Link href="/" style={{ textDecoration: 'none', fontSize: 12, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(201,245,59,0.5)', fontFamily: 'monospace' }}>
                ← Home
              </Link>
            </div>

            <div className="si-row" style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,245,59,0.55)', fontFamily: 'monospace', marginBottom: 10 }}>— Welcome back</p>
              <h1 style={{ fontSize: 'clamp(1.5rem,3vw,1.9rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#f0ede6' }}>Sign in</h1>
            </div>

            {error && (
              <div className="si-row" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="si-row" style={{ marginBottom: 16 }}>
                <label className="lbl" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="ai"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="si-row" style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="lbl" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                  <Link href="/auth/forgot-password" style={{ fontSize: 11, color: 'rgba(240,237,230,0.4)', textDecoration: 'none', fontFamily: 'monospace' }}>Forgot password?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    className="ai"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                    <EyeIcon open={showPass} />
                  </button>
                </div>
              </div>

              <input type="hidden" name="turnstileToken" value={turnstileToken} />
              <TurnstileWidget onVerify={setTurnstileToken} />

              <div className="si-row">
                <button className="sbtn" type="submit" disabled={isLoading || (!turnstileToken && process.env.NODE_ENV !== 'development')}>
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="si-row" style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, color: 'rgba(240,237,230,0.3)' }}>No account?&nbsp;</span>
              <a href="/auth/signup" style={{ fontSize: 13, color: '#c9f53b', textDecoration: 'none', fontWeight: 600 }}>Create one</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#080808' }} />}>
      <SignInContent />
    </Suspense>
  )
}