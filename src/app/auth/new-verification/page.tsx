'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyEmailAction } from '@/lib/actions/auth'
import gsap from 'gsap'

function NewVerificationContent() {
  const searchParams = useSearchParams()
const token = searchParams.get('token')

const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()
  
  const wrapRef = useRef<HTMLDivElement>(null)
  const verifiedRef = useRef(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(wrapRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' })
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    if (verifiedRef.current) return
    verifiedRef.current = true

    verifyEmailAction(token)
      .then((data) => {
        if ('error' in data) {
          setSuccess((prevSuccess) => {
            if (prevSuccess) return prevSuccess
            setError(data.error)
            return prevSuccess
          })
        } else if ('success' in data) {
          setSuccess(data.message)
          setError(undefined)
        }
      })
      .catch((err) => {
        console.error("Verification error:", err)
        setSuccess((prevSuccess) => {
          if (prevSuccess) return prevSuccess
          setError('Something went wrong!')
          return prevSuccess
        })
      })
  }, [token])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; }
        .nv-card { width:100%; maxWidth:400px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:40px 36px; text-align:center; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", padding: 20 }}>
        <div ref={wrapRef} className="nv-card">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid rgba(201,245,59,0.5)', background: 'rgba(201,245,59,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#c9f53b' }}>IEDC</div>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#f0ede6', marginBottom: 24 }}>
            Verifying Email
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {!success && !error && (
              <div style={{ width: 32, height: 32, border: '2px solid rgba(201,245,59,0.2)', borderTop: '2px solid #c9f53b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            )}
            
            {success && (
              <div style={{ background: 'rgba(201,245,59,0.07)', border: '1px solid rgba(201,245,59,0.2)', borderRadius: 8, padding: '10px 14px', width: '100%', fontSize: 13, color: '#c9f53b' }}>
                {success}
              </div>
            )}
            
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '10px 14px', width: '100%', fontSize: 13, color: '#fca5a5' }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ marginTop: 32 }}>
            <Link href="/auth/signin" style={{ fontSize: 13, color: '#c9f53b', textDecoration: 'none', fontWeight: 600 }}>
              Back to Sign in
            </Link>
          </div>
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
