'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { setupProfileAction, skipProfileSetupAction } from '@/lib/actions/auth'
import { uploadFile } from '@/lib/appwrite'
import gsap from 'gsap'

export default function SetupProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const [name, setName]             = useState('')
  const [bio, setBio]               = useState('')
  const [department, setDepartment] = useState('')
  const [phone, setPhone]           = useState('')
  const [image, setImage]           = useState('')
  const [isLoading, setIsLoading]   = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError]           = useState('')

  const wrapRef = useRef<HTMLDivElement>(null)

  // Pre-fill name from session
  useEffect(() => {
    if (session?.user?.name && session.user.name !== 'New User') {
      setName(session.user.name)
    }
  }, [session])

  // GSAP entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.sp-card',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out' },
      )
      gsap.fromTo('.sp-row',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, duration: 0.55, ease: 'power3.out', delay: 0.2 },
      )
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  // Safety net — middleware handles the primary redirect, but guard here too
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.profileCompleted) {
      router.replace('/dashboard')
    }
  }, [session, status, router])

  // ── Image handler ───────────────────────────────────────────────────────────
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError('')
    try {
      const url = await uploadFile(file)
      setImage(url)
    } catch (err) {
      console.error(err)
      setError('Failed to upload image to Appwrite. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) { setError('Full name is required.'); return }
    if (isUploading) { setError('Please wait for image to finish uploading.'); return }
    setError('')
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await setupProfileAction(formData)

    if ('error' in result) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    // Update session on client side so proxy.ts sees profileCompleted: true
    await update({ 
      name, 
      image: image.trim() || undefined,
      profileCompleted: true 
    })

    // Success — navigate on the client (server action returned {success:true})
    router.push('/dashboard')
    router.refresh()
  }

  // ── Skip handler ────────────────────────────────────────────────────────────
  const handleSkip = async () => {
    setError('')
    setIsLoading(true)

    const result = await skipProfileSetupAction()

    if ('error' in result) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    // Update session on client side so proxy.ts sees profileCompleted: true
    await update({ profileCompleted: true })

    // Success — navigate on the client
    router.push('/dashboard')
    router.refresh()
  }

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(201,245,59,0.2)', borderTop: '2px solid #c9f53b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const previewImage = image.trim()
    ? image.trim()
    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; }
        .sp-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:13px 16px; color:#f0ede6; font-family:'Space Grotesk',sans-serif; font-size:14px; outline:none; transition:border-color .2s,box-shadow .2s; resize:vertical; }
        .sp-input::placeholder { color:rgba(240,237,230,0.2); }
        .sp-input:focus { border-color:rgba(201,245,59,0.5); box-shadow:0 0 0 3px rgba(201,245,59,0.07); }
        .sp-input:disabled { opacity:.45; cursor:not-allowed; }
        .sp-lbl { display:block; font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:rgba(201,245,59,0.65); margin-bottom:8px; font-family:monospace; }
        .sp-btn-primary { width:100%; padding:13px; border-radius:10px; border:none; background:#c9f53b; color:#0c0c0c; font-size:14px; font-weight:700; font-family:'Space Grotesk',sans-serif; letter-spacing:.04em; cursor:pointer; transition:opacity .2s,transform .15s; }
        .sp-btn-primary:hover:not(:disabled) { opacity:.88; }
        .sp-btn-primary:active:not(:disabled) { transform:scale(.98); }
        .sp-btn-primary:disabled { opacity:.45; cursor:not-allowed; }
        .sp-btn-skip { width:100%; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(240,237,230,0.4); font-size:13px; font-family:'Space Grotesk',sans-serif; cursor:pointer; transition:background .2s,color .2s; margin-top:10px; }
        .sp-btn-skip:hover:not(:disabled) { background:rgba(255,255,255,0.05); color:rgba(240,237,230,0.6); }
        .sp-btn-skip:disabled { opacity:.4; cursor:not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div ref={wrapRef} style={{
        minHeight: '100vh', background: '#080808', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
        fontFamily: "'Space Grotesk',sans-serif",
      }}>
        <div className="sp-card" style={{
          width: '100%', maxWidth: 480,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '40px 36px',
        }}>
          {/* Header */}
          <div className="sp-row" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid rgba(201,245,59,0.5)', background: 'rgba(201,245,59,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#c9f53b' }}>IEDC</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(201,245,59,0.7)', letterSpacing: '0.04em' }}>Research Lab</span>
            </div>
            <p style={{ fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,245,59,0.55)', fontFamily: 'monospace', marginBottom: 8 }}>— One last step</p>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#f0ede6', lineHeight: 1.2 }}>Complete your profile</h1>
            <p style={{ marginTop: 8, fontSize: 13, color: 'rgba(240,237,230,0.35)', lineHeight: 1.6 }}>This information helps colleagues find and connect with you.</p>
          </div>

          {/* Avatar preview */}
          <div className="sp-row" style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Profile preview"
                width={80}
                height={80}
                style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(201,245,59,0.35)', objectFit: 'cover', background: '#111' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`
                }}
              />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#c9f53b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="sp-row" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="sp-row" style={{ marginBottom: 16 }}>
              <label className="sp-lbl" htmlFor="sp-name">Full Name *</label>
              <input
                id="sp-name"
                name="name"
                className="sp-input"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="name"
              />
            </div>

            {/* Image File */}
            <div className="sp-row" style={{ marginBottom: 16 }}>
              <label className="sp-lbl" htmlFor="sp-image">
                Profile Image <span style={{ color: 'rgba(240,237,230,0.25)', textTransform: 'none', letterSpacing: 0, fontFamily: 'sans-serif' }}>(optional)</span>
              </label>
              <input
                id="sp-image"
                className="sp-input"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
                disabled={isLoading || isUploading}
                style={{ padding: '9px 16px' }}
              />
              <input type="hidden" name="image" value={image} />
              <p style={{ marginTop: 6, fontSize: 11, color: isUploading ? '#c9f53b' : 'rgba(240,237,230,0.25)', fontFamily: 'monospace' }}>
                {isUploading ? 'Uploading image securely to Appwrite...' : 'Leave blank to use auto-generated initials avatar'}
              </p>
            </div>

            {/* Department */}
            <div className="sp-row" style={{ marginBottom: 16 }}>
              <label className="sp-lbl" htmlFor="sp-dept">
                Department <span style={{ color: 'rgba(240,237,230,0.25)', textTransform: 'none', letterSpacing: 0, fontFamily: 'sans-serif' }}>(optional)</span>
              </label>
              <input
                id="sp-dept"
                name="department"
                className="sp-input"
                type="text"
                placeholder="e.g. Computer Science & Engineering"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Phone */}
            <div className="sp-row" style={{ marginBottom: 16 }}>
              <label className="sp-lbl" htmlFor="sp-phone">
                Phone <span style={{ color: 'rgba(240,237,230,0.25)', textTransform: 'none', letterSpacing: 0, fontFamily: 'sans-serif' }}>(optional)</span>
              </label>
              <input
                id="sp-phone"
                name="phone"
                className="sp-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Bio */}
            <div className="sp-row" style={{ marginBottom: 28 }}>
              <label className="sp-lbl" htmlFor="sp-bio">
                Bio <span style={{ color: 'rgba(240,237,230,0.25)', textTransform: 'none', letterSpacing: 0, fontFamily: 'sans-serif' }}>(optional)</span>
              </label>
              <textarea
                id="sp-bio"
                name="bio"
                className="sp-input"
                placeholder="Tell your colleagues a bit about yourself…"
                value={bio}
                onChange={e => setBio(e.target.value)}
                disabled={isLoading}
                rows={3}
                style={{ minHeight: 80 }}
              />
              <p style={{ marginTop: 4, fontSize: 11, color: 'rgba(240,237,230,0.2)', fontFamily: 'monospace', textAlign: 'right' }}>{bio.length}/500</p>
            </div>

            {/* Actions */}
            <div className="sp-row">
              <button className="sp-btn-primary" type="submit" disabled={isLoading || isUploading}>
                {isLoading ? 'Saving…' : isUploading ? 'Uploading Image...' : 'Complete profile'}
              </button>
              <button
                type="button"
                className="sp-btn-skip"
                onClick={handleSkip}
                disabled={isLoading}
              >
                {isLoading ? 'Please wait…' : "Skip for now — I'll do this later"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
