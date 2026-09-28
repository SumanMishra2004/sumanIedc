'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyEmailAction } from '@/lib/actions/auth'
import gsap from 'gsap'

function NewVerificationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(5)

  const wrapRef    = useRef<HTMLDivElement>(null)
  const calledRef  = useRef(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(wrapRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' })
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token. Please use the link from your email.')
      return
    }
    if (calledRef.current) return
    calledRef.current = true

    verifyEmailAction(token)
      .then((result) => {
        if ('error' in result) {
          setStatus('error')
          setMessage(result.error)
        } else {
          setStatus('success')
          setMessage(result.message)
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      })
  }, [token])

  // Auto-redirect to signin on success
  useEffect(() => {
    if (status !== 'success') return
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          window.location.href = '/auth/signin'
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [status])

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; }
        .nv-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 40px 36px;
          text-align: center;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#080808',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Space Grotesk',sans-serif", padding: 20,
      }}>
        <div ref={wrapRef} className="nv-card">
          {/* Logo */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '2px solid rgba(201,245,59,0.5)',
              background: 'rgba(201,245,59,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#c9f53b',
            }}>IEDC</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(201,245,59,0.7)', letterSpacing: '0.04em' }}>
              Research Lab
            </span>
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#f0ede6', marginBottom: 24 }}>
            {status === 'loading' ? 'Verifying your email…' : status === 'success' ? 'Email verified!' : 'Verification failed'}
          </h1>

          {/* Spinner */}
          {status === 'loading' && (
            <div style={{
              width: 32, height: 32, margin: '0 auto 16px',
              border: '2px solid rgba(201,245,59,0.2)',
              borderTop: '2px solid #c9f53b',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div style={{
                background: 'rgba(201,245,59,0.07)', border: '1px solid rgba(201,245,59,0.2)',
                borderRadius: 8, padding: '12px 14px', marginBottom: 16,
                fontSize: 13, color: '#c9f53b', lineHeight: 1.6,
              }}>
                {message}
              </div>
              <p style={{ fontSize: 12, color: 'rgba(240,237,230,0.35)', marginBottom: 20, fontFamily: 'monospace' }}>
                Redirecting to sign in in {countdown}s…
              </p>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
              borderRadius: 8, padding: '12px 14px', marginBottom: 20,
              fontSize: 13, color: '#fca5a5', lineHeight: 1.6,
            }}>
              {message}
            </div>
          )}

          <Link
            href="/auth/signin"
            style={{ fontSize: 13, color: '#c9f53b', textDecoration: 'none', fontWeight: 600 }}
          >
            {status === 'success' ? 'Sign in now →' : 'Back to Sign in'}
          </Link>
        </div>
      </div>
    </>
  )
}

export default function NewVerificationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#080808' }} />}>
      <NewVerificationContent />
    </Suspense>
  )
}
