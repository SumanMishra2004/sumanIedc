'use client'

import { signIn } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
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

export default function SignInPage() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState('')
  const [showPass, setShowPass]   = useState(false)

  const wrapRef    = useRef<HTMLDivElement>(null)
  const leftRef    = useRef<HTMLDivElement>(null)
  const rightRef   = useRef<HTMLDivElement>(null)
  const headRef    = useRef<HTMLHeadingElement>(null)
  const lineRef    = useRef<HTMLDivElement>(null)
  const tagsRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Left panel — stagger text lines in
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo(leftRef.current,  { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 1 })
        .fromTo(lineRef.current,  { scaleX: 0 },           { scaleX: 1, duration: 0.9, ease: 'expo.inOut' }, '-=0.6')
        .fromTo(headRef.current?.querySelectorAll('.hw') ?? [], { y: '110%', opacity: 0 }, { y: '0%', opacity: 1, stagger: 0.1, duration: 0.9 }, '-=0.6')
        .fromTo(tagsRef.current?.querySelectorAll('.tag') ?? [], { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.5 }, '-=0.4')

      // Right panel — slide from right
      tl.fromTo(rightRef.current, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'expo.out' }, '-=1.2')
        .fromTo('.si-row', { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.55, ease: 'power3.out' }, '-=0.6')
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await signIn('credentials', { email, password, callbackUrl: '/dashboard', redirect: false })
      if (res?.error) setError('Invalid email or password.')
      else if (res?.url) window.location.href = res.url
    } catch { setError('Something went wrong. Try again.') }
    finally { setIsLoading(false) }
  }

  const handleGoogle = async () => { setIsLoading(true); await signIn('google', { callbackUrl: '/dashboard' }) }

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
          background:'linear-gradient(160deg,#0e1a00 0%,#080808 60%)',
          borderRight:'1px solid rgba(201,245,59,0.08)',
          overflow:'hidden',
        }}>
          {/* Grid texture */}
          <div style={{ position:'absolute',inset:0, backgroundImage:'repeating-linear-gradient(0deg,rgba(201,245,59,0.025) 0,rgba(201,245,59,0.025) 1px,transparent 1px,transparent 56px),repeating-linear-gradient(90deg,rgba(201,245,59,0.025) 0,rgba(201,245,59,0.025) 1px,transparent 1px,transparent 56px)', pointerEvents:'none' }}/>
          {/* Glow */}
          <div style={{ position:'absolute',bottom:'-10%',left:'-10%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(201,245,59,0.09) 0%,transparent 65%)',pointerEvents:'none',filter:'blur(4px)' }}/>

          {/* Top — logo */}
          <div>
            <Link href="/" style={{ textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10 }}>
              <div style={{ width:38,height:38,borderRadius:'50%',border:'2px solid rgba(201,245,59,0.5)',background:'rgba(201,245,59,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#c9f53b',letterSpacing:'-0.01em' }}>IEDC</div>
              <span style={{ fontSize:13,fontWeight:600,color:'rgba(201,245,59,0.7)',letterSpacing:'0.04em' }}>Research Lab</span>
            </Link>
          </div>

          {/* Middle — headline */}
          <div>
            <div ref={lineRef} style={{ width:48,height:2,background:'#c9f53b',marginBottom:28,transformOrigin:'left' }}/>
            <h2 ref={headRef} style={{ fontSize:'clamp(2rem,3.5vw,3rem)',fontWeight:700,letterSpacing:'-0.04em',lineHeight:1.1,overflow:'hidden' }}>
              {['Sign in', 'to your', 'workspace.'].map((w,i) => (
                <div key={i} style={{ overflow:'hidden' }}>
                  <span className="hw" style={{ display:'inline-block', color: i===2?'#c9f53b':'#f0ede6', fontStyle:i===1?'italic':'normal', willChange:'transform' }}>{w}</span>
                </div>
              ))}
            </h2>
            <p style={{ marginTop:20,fontSize:14,color:'rgba(240,237,230,0.35)',lineHeight:1.7,maxWidth:300 }}>Access your research portfolio, publications, and collaboration tools.</p>

            <div ref={tagsRef} style={{ display:'flex',flexWrap:'wrap',gap:8,marginTop:28 }}>
              {['Research','Publications','Patents','Dashboard'].map(t => (
                <span key={t} className="tag" style={{ fontSize:11,padding:'5px 12px',borderRadius:999,border:'1px solid rgba(201,245,59,0.2)',color:'rgba(201,245,59,0.6)',fontFamily:'monospace',letterSpacing:'0.08em',background:'rgba(201,245,59,0.04)' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Bottom — quote */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:24 }}>
            <p style={{ fontSize:12,color:'rgba(240,237,230,0.2)',fontFamily:'monospace',letterSpacing:'0.05em' }}>IEDC · Dept. of CSE · Since 1999</p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div ref={rightRef} className="auth-right" style={{
          flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
          minHeight:'100vh', padding:'40px 24px',
          background:'#0a0a0a',
        }}>
          <div style={{ width:'100%', maxWidth:400 }}>
            {/* Mobile back link */}
            <div className="si-row" style={{ marginBottom:32, display:'block' }}>
              <Link href="/" style={{ textDecoration:'none', fontSize:12, letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(201,245,59,0.5)', fontFamily:'monospace' }}>
                ← Home
              </Link>
            </div>

            {/* Heading */}
            <div className="si-row" style={{ marginBottom:32 }}>
              <p style={{ fontSize:11,letterSpacing:'0.35em',textTransform:'uppercase',color:'rgba(201,245,59,0.55)',fontFamily:'monospace',marginBottom:10 }}>— Welcome back</p>
              <h1 style={{ fontSize:'clamp(1.5rem,3vw,1.9rem)',fontWeight:700,letterSpacing:'-0.03em',color:'#f0ede6' }}>Sign in</h1>
            </div>

            {/* Google */}
            <div className="si-row" style={{ marginBottom:20 }}>
              <button className="gbtn" onClick={handleGoogle} disabled={isLoading}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="si-row" style={{ display:'flex',alignItems:'center',gap:12,marginBottom:20 }}>
              <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.06)' }}/>
              <span style={{ fontSize:10,color:'rgba(240,237,230,0.2)',letterSpacing:'0.12em',fontFamily:'monospace' }}>OR</span>
              <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.06)' }}/>
            </div>

            {/* Error */}
            {error && (
              <div className="si-row" style={{ background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.18)',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#fca5a5' }}>{error}</div>
            )}

            {/* Form */}
            <form onSubmit={handleCredentialsSignIn}>
              <div className="si-row" style={{ marginBottom:16 }}>
                <label className="lbl">Email</label>
                <input className="ai" type="email" placeholder="name@example.com" value={email} onChange={e=>setEmail(e.target.value)} required disabled={isLoading}/>
              </div>

              <div className="si-row" style={{ marginBottom:28 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                  <label className="lbl" style={{ margin:0 }}>Password</label>
                </div>
                <div style={{ position:'relative' }}>
                  <input className="ai" type={showPass?'text':'password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required disabled={isLoading}/>
                  <button type="button" className="eye-btn" onClick={()=>setShowPass(v=>!v)}><EyeIcon open={showPass}/></button>
                </div>
              </div>

              <div className="si-row">
                <button className="sbtn" type="submit" disabled={isLoading}>{isLoading?'Signing in…':'Sign in'}</button>
              </div>
            </form>

            {/* Footer */}
            <div className="si-row" style={{ marginTop:28,paddingTop:24,borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',justifyContent:'center' }}>
              <span style={{ fontSize:13,color:'rgba(240,237,230,0.3)' }}>No account?&nbsp;</span>
              <Link href="/auth/signup" style={{ fontSize:13,color:'#c9f53b',textDecoration:'none',fontWeight:600 }}>Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}