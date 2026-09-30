'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resetPasswordAction } from '@/lib/actions/auth'
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

function getStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  return score as 0 | 1 | 2 | 3
}

const strengthMeta: Record<number, { label: string; color: string }> = {
  1: { label: 'Weak', color: '#ef4444' },
  2: { label: 'Fair', color: '#f59e0b' },
  3: { label: 'Strong', color: '#c9f53b' },
}

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const searchParams = useSearchParams()
  const token = searchParams.get('token')
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
    
    if (!token) {
      setError('Missing reset token.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('password', password)
      formData.append('confirmPassword', confirmPassword)
      formData.append('token', token)

      const result = await resetPasswordAction(formData)

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

  const strength = getStrength(password)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; }
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
        .rp-card { width:100%; maxWidth:400px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:40px 36px; }
      `}</style>
      
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", padding: 20 }}>
        <div ref={wrapRef} className="rp-card">
          <div style={{ marginBottom: 32 }}>
            <Link href="/auth/signin" style={{ textDecoration: 'none', fontSize: 12, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(201,245,59,0.5)', fontFamily: 'monospace' }}>
              ← Back to Sign in
            </Link>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#f0ede6', marginBottom: 8 }}>
            Reset Password
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(240,237,230,0.35)', lineHeight: 1.6, marginBottom: 24 }}>
            Choose a new, strong password for your account.
          </p>

          {!token && !success && (
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>
              Missing reset token. Please use the link sent to your email.
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: 'rgba(201,245,59,0.07)', border: '1px solid rgba(201,245,59,0.2)', borderRadius: 8, padding: '16px 14px', marginBottom: 24, fontSize: 14, color: '#c9f53b' }}>
                {success}
              </div>
              <Link href="/auth/signin">
                <button className="sbtn">Go to Sign in</button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: password.length > 0 ? 8 : 16 }}>
                <label className="lbl" htmlFor="password">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    className="ai"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading || !token}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                    <EyeIcon open={showPass} />
                  </button>
                </div>
              </div>

              {password.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, transition: 'background .3s', background: i <= strength ? (strengthMeta[strength]?.color ?? '#c9f53b') : 'rgba(255,255,255,0.07)' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10, letterSpacing: '0.1em', fontFamily: 'monospace', color: strengthMeta[strength]?.color ?? 'transparent' }}>{strengthMeta[strength]?.label}</span>
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <label className="lbl" htmlFor="confirmPassword">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    className="ai"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading || !token}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>

              <button className="sbtn" type="submit" disabled={isLoading || !token}>
                {isLoading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#080808' }} />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
