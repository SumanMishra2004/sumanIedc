'use client'

import { useState, useRef, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
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

export default function SignUpPage() {
  const [name, setName]                       = useState('')
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading]             = useState(false)
  const [error, setError]                     = useState('')
  const [showPass, setShowPass]               = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)

  const wrapRef  = useRef<HTMLDivElement>(null)
  const leftRef  = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const headRef  = useRef<HTMLHeadingElement>(null)
  const lineRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo(leftRef.current,  { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 1 })
        .fromTo(lineRef.current,  { scaleX: 0 },           { scaleX: 1, duration: 0.9, ease: 'expo.inOut' }, '-=0.6')
        .fromTo(headRef.current?.querySelectorAll('.hw') ?? [], { y: '110%', opacity: 0 }, { y: '0%', opacity: 1, stagger: 0.1, duration: 0.9 }, '-=0.6')
      tl.fromTo(rightRef.current, { x: 60, opacity: 0 },  { x: 0, opacity: 1, duration: 0.9 }, '-=1.1')
        .fromTo('.su-row', { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease:'power3.out' }, '-=0.5')
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setIsLoading(false); return }
      await signIn('credentials', { email, password, callbackUrl: '/dashboard' })
    } catch { setError('An unexpected error occurred.'); setIsLoading(false) }
  }

  const handleGoogle = async () => { setIsLoading(true); await signIn('google', { callbackUrl: '/dashboard' }) }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthMeta = [null,{label:'Weak',color:'#ef4444'},{label:'Fair',color:'#f59e0b'},{label:'Strong',color:'#c9f53b'}]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .ai { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:13px 44px 13px 16px; color:#f0ede6; font-family:'Space Grotesk',sans-serif; font-size:14px; outline:none; transition:border-color .2s,box-shadow .2s; }
        .ai::placeholder { color:rgba(240,237,230,0.2); }
        .ai:focus { border-color:rgba(201,245,59,0.5); box-shadow:0 0 0 3px rgba(201,245,59,0.07); }
        .ai:disabled { opacity:.45; cursor:not-allowed; }
        .lbl { display:block; font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:rgba(201,245,59,0.65); margin-bottom:8px; font-family:monospace; }
        .gbtn { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:13px 20px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#f0ede6; font-size:14px; font-weight:500; font-family:'Space Grotesk',sans-serif; cursor:pointer; transition:background .2s,border-color .2s; }
        .gbtn:hover:not(:disabled) { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); }
        .gbtn:disabled { opacity:.5; cursor:not-allowed; }
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

      <div ref={wrapRef} className="auth-wrap" style={{ minHeight:'100vh', background:'#080808', display:'flex', fontFamily:"'Space Grotesk',sans-serif", overflow:'hidden' }}>

        {/* ── LEFT PANEL ── */}
        <div ref={leftRef} className="auth-left" style={{
          width:'45%', minHeight:'100vh', position:'relative', display:'flex', flexDirection:'column',
          justifyContent:'space-between', padding:'48px 52px',
          background:'linear-gradient(160deg,#1a0e00 0%,#080808 60%)',
          borderRight:'1px solid rgba(201,245,59,0.08)',
          overflow:'hidden',
        }}>
          <div style={{ position:'absolute',inset:0, backgroundImage:'repeating-linear-gradient(0deg,rgba(201,245,59,0.025) 0,rgba(201,245,59,0.025) 1px,transparent 1px,transparent 56px),repeating-linear-gradient(90deg,rgba(201,245,59,0.025) 0,rgba(201,245,59,0.025) 1px,transparent 1px,transparent 56px)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute',top:'-10%',right:'-10%',width:460,height:460,borderRadius:'50%',background:'radial-gradient(circle,rgba(201,245,59,0.08) 0%,transparent 65%)',pointerEvents:'none',filter:'blur(4px)' }}/>

          {/* Logo */}
          <div>
            <Link href="/" style={{ textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10 }}>
              <div style={{ width:38,height:38,borderRadius:'50%',border:'2px solid rgba(201,245,59,0.5)',background:'rgba(201,245,59,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#c9f53b' }}>IEDC</div>
              <span style={{ fontSize:13,fontWeight:600,color:'rgba(201,245,59,0.7)',letterSpacing:'0.04em' }}>Research Lab</span>
            </Link>
          </div>

          {/* Headline */}
          <div>
            <div ref={lineRef} style={{ width:48,height:2,background:'#c9f53b',marginBottom:28,transformOrigin:'left' }}/>
            <h2 ref={headRef} style={{ fontSize:'clamp(2rem,3.5vw,3rem)',fontWeight:700,letterSpacing:'-0.04em',lineHeight:1.1 }}>
              {['Join the','frontier of','research.'].map((w,i) => (
                <div key={i} style={{ overflow:'hidden' }}>
                  <span className="hw" style={{ display:'inline-block', color:i===2?'#c9f53b':'#f0ede6', fontStyle:i===1?'italic':'normal', willChange:'transform' }}>{w}</span>
                </div>
              ))}
            </h2>
            <p style={{ marginTop:20,fontSize:14,color:'rgba(240,237,230,0.35)',lineHeight:1.7,maxWidth:300 }}>Create your account and contribute to a decade of innovation in computing and AI.</p>

            {/* Stats */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:36 }}>
              {[['500+','Papers'],['50+','Patents'],['10M+','Funding'],['300+','Alumni']].map(([v,l]) => (
                <div key={l} style={{ padding:'16px 20px',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,background:'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize:'clamp(1.2rem,2vw,1.5rem)',fontWeight:700,letterSpacing:'-0.03em',color:'#c9f53b' }}>{v}</div>
                  <div style={{ fontSize:11,color:'rgba(240,237,230,0.3)',marginTop:3,letterSpacing:'0.05em',fontFamily:'monospace' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:24 }}>
            <p style={{ fontSize:12,color:'rgba(240,237,230,0.2)',fontFamily:'monospace',letterSpacing:'0.05em' }}>IEDC · Dept. of CSE · Since 1999</p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div ref={rightRef} className="auth-right" style={{
          flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
          minHeight:'100vh', padding:'40px 24px', background:'#0a0a0a',
          overflowY:'auto',
        }}>
          <div style={{ width:'100%', maxWidth:400 }}>

            <div className="su-row" style={{ marginBottom:32 }}>
              <Link href="/" style={{ textDecoration:'none',fontSize:12,letterSpacing:'0.25em',textTransform:'uppercase',color:'rgba(201,245,59,0.5)',fontFamily:'monospace' }}>← Home</Link>
            </div>

            <div className="su-row" style={{ marginBottom:32 }}>
              <p style={{ fontSize:11,letterSpacing:'0.35em',textTransform:'uppercase',color:'rgba(201,245,59,0.55)',fontFamily:'monospace',marginBottom:10 }}>— New here</p>
              <h1 style={{ fontSize:'clamp(1.5rem,3vw,1.9rem)',fontWeight:700,letterSpacing:'-0.03em',color:'#f0ede6' }}>Create account</h1>
            </div>

            {/* Google */}
            <div className="su-row" style={{ marginBottom:20 }}>
              <button className="gbtn" onClick={handleGoogle} disabled={isLoading}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>
            </div>

            {/* Divider */}
            <div className="su-row" style={{ display:'flex',alignItems:'center',gap:12,marginBottom:20 }}>
              <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.06)' }}/>
              <span style={{ fontSize:10,color:'rgba(240,237,230,0.2)',letterSpacing:'0.12em',fontFamily:'monospace' }}>OR</span>
              <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.06)' }}/>
            </div>

            {error && (
              <div className="su-row" style={{ background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.18)',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#fca5a5' }}>{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Name + Email side by side */}
              <div className="su-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div>
                  <label className="lbl">First Name</label>
                  <input className="ai" type="text" placeholder="John" value={name} onChange={e=>setName(e.target.value)} required disabled={isLoading} style={{ paddingRight:16 }}/>
                </div>
                <div>
                  <label className="lbl">Last Name</label>
                  <input className="ai" type="text" placeholder="Doe" disabled={isLoading} style={{ paddingRight:16 }}/>
                </div>
              </div>

              <div className="su-row" style={{ marginBottom:16 }}>
                <label className="lbl">Email</label>
                <input className="ai" type="email" placeholder="name@example.com" value={email} onChange={e=>setEmail(e.target.value)} required disabled={isLoading}/>
              </div>

              <div className="su-row" style={{ marginBottom: password.length > 0 ? 8 : 16 }}>
                <label className="lbl">Password</label>
                <div style={{ position:'relative' }}>
                  <input className="ai" type={showPass?'text':'password'} placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)} required disabled={isLoading}/>
                  <button type="button" className="eye-btn" onClick={()=>setShowPass(v=>!v)}><EyeIcon open={showPass}/></button>
                </div>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="su-row" style={{ marginBottom:16 }}>
                  <div style={{ display:'flex',gap:4,marginBottom:5 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ flex:1,height:2.5,borderRadius:2,transition:'background .3s',background: i<=strength?(strengthMeta[strength]?.color??'#c9f53b'):'rgba(255,255,255,0.07)' }}/>
                    ))}
                  </div>
                  <span style={{ fontSize:10,letterSpacing:'0.1em',fontFamily:'monospace',color:strengthMeta[strength]?.color??'transparent' }}>{strengthMeta[strength]?.label}</span>
                </div>
              )}

              <div className="su-row" style={{ marginBottom:28 }}>
                <label className="lbl">Confirm Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    className="ai" type={showConfirm?'text':'password'} placeholder="Repeat password"
                    value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
                    required disabled={isLoading}
                    style={{ borderColor: confirmPassword&&confirmPassword!==password?'rgba(239,68,68,0.5)':undefined }}
                  />
                  <button type="button" className="eye-btn" onClick={()=>setShowConfirm(v=>!v)}><EyeIcon open={showConfirm}/></button>
                </div>
              </div>

              <div className="su-row">
                <button className="sbtn" type="submit" disabled={isLoading}>{isLoading?'Creating account…':'Create account'}</button>
              </div>
            </form>

            <div className="su-row" style={{ marginTop:28,paddingTop:24,borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',justifyContent:'center' }}>
              <span style={{ fontSize:13,color:'rgba(240,237,230,0.3)' }}>Already have an account?&nbsp;</span>
              <Link href="/auth/signin" style={{ fontSize:13,color:'#c9f53b',textDecoration:'none',fontWeight:600 }}>Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
