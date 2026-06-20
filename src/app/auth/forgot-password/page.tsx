'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { forgotPasswordAction } from '@/lib/actions/auth'
import TurnstileWidget from '@/components/auth/TurnstileWidget'
import gsap from 'gsap'

function ForgotPasswordContent() {
  const [email, setEmail] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(wrapRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' })
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!turnstileToken && process.env.NODE_ENV !== 'development') {
      setError('Please complete the CAPTCHA')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('email', email.toLowerCase().trim())
      formData.append('turnstileToken', turnstileToken)

      const result = await forgotPasswordAction(formData)

      if ('error' in result) {
        setError(result.error)
      } else if ('success' in result) {
        setSuccess(result.message)
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
        body { background: #080808; }
        .ai { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:13px 16px; color:#f0ede6; font-family:'Space Grotesk',sans-serif; font-size:14px; outline:none; transition:border-color .2s,box-shadow .2s; }
        .ai::placeholder { color:rgba(240,237,230,0.2); }
        .ai:focus { border-color:rgba(201,245,59,0.5); box-shadow:0 0 0 3px rgba(201,245,59,0.07); }
        .ai:disabled { opacity:.45; cursor:not-allowed; }
        .lbl { display:block; font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:rgba(201,245,59,0.65); margin-bottom:8px; font-family:monospace; }
        .sbtn { width:100%; padding:13px; border-radius:10px; border:none; background:#c9f53b; color:#0c0c0c; font-size:14px; font-weight:700; font-family:'Space Grotesk',sans-serif; letter-spacing:.04em; cursor:pointer; transition:opacity .2s,transform .15s; }
        .sbtn:hover:not(:disabled) { opacity:.88; }
        .sbtn:active:not(:disabled) { transform:scale(.98); }
        .sbtn:disabled { opacity:.45; cursor:not-allowed; }
        .fp-card { width:100%; maxWidth:400px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:40px 36px; }
      `}</style>
      
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", padding: 20 }}>
        <div ref={wrapRef} className="fp-card">
          <div style={{ marginBottom: 32 }}>
            <Link href="/auth/signin" style={{ textDecoration: 'none', fontSize: 12, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(201,245,59,0.5)', fontFamily: 'monospace' }}>
              ← Back to Sign in
            </Link>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#f0ede6', marginBottom: 8 }}>
            Forgot Password
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(240,237,230,0.35)', lineHeight: 1.6, marginBottom: 24 }}>
            Enter your email address and we will send you a link to reset your password.
          </p>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(201,245,59,0.07)', border: '1px solid rgba(201,245,59,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#c9f53b' }}>
              {success}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
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

              <input type="hidden" name="turnstileToken" value={turnstileToken} />
              <TurnstileWidget onVerify={setTurnstileToken} />

              <div style={{ marginTop: 24 }}>
                <button className="sbtn" type="submit" disabled={isLoading || (!turnstileToken && process.env.NODE_ENV !== 'development')}>
                  {isLoading ? 'Sending link…' : 'Send reset link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#080808' }} />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
