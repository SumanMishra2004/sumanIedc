'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { setupProfileAction, skipProfileSetupAction } from '@/lib/actions/auth'
import gsap from 'gsap'

// ─── tiny inline icons ────────────────────────────────────────────────────────
function ChevronIcon({ down }: { down: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      style={{ transition: 'transform .25s', transform: down ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─── shared field styles (inline so the page is self-contained) ──────────────
const S = {
  wrap: {
    minHeight: '100vh',
    background: '#080808',
    display: 'flex',
    fontFamily: "'Space Grotesk',sans-serif",
    overflow: 'hidden',
  } as React.CSSProperties,
  left: {
    width: '40%',
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '48px 52px',
    background: 'linear-gradient(160deg,#0e1a00 0%,#080808 60%)',
    borderRight: '1px solid rgba(201,245,59,0.08)',
    overflow: 'hidden',
  } as React.CSSProperties,
  right: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '56px 24px',
    background: '#0a0a0a',
    overflowY: 'auto',
  } as React.CSSProperties,
}

// ─── field group component ────────────────────────────────────────────────────
function Field({
  id,
  label,
  optional = true,
  children,
}: {
  id: string
  label: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: '10.5px',
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: 'rgba(201,245,59,0.65)',
          marginBottom: 7,
          fontFamily: 'monospace',
        }}
      >
        {label}
        {optional && (
          <span style={{ color: 'rgba(240,237,230,0.2)', marginLeft: 6, fontSize: '9px' }}>
            optional
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

// ─── collapsible section ──────────────────────────────────────────────────────
function Section({
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string
  badge?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 4 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(201,245,59,0.04)',
          border: '1px solid rgba(201,245,59,0.09)',
          borderRadius: open ? '8px 8px 0 0' : 8,
          padding: '10px 14px',
          cursor: 'pointer',
          color: '#f0ede6',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "'Space Grotesk',sans-serif",
          letterSpacing: '.04em',
          transition: 'background .2s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {badge && (
            <span
              style={{
                fontSize: 9,
                padding: '2px 7px',
                borderRadius: 999,
                background: 'rgba(201,245,59,0.12)',
                color: '#c9f53b',
                letterSpacing: '.08em',
                fontFamily: 'monospace',
              }}
            >
              {badge}
            </span>
          )}
          {title}
        </span>
        <ChevronIcon down={open} />
      </button>
      {open && (
        <div
          style={{
            border: '1px solid rgba(201,245,59,0.09)',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            padding: '16px 14px 12px',
            background: 'rgba(255,255,255,0.015)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function SetupProfilePage() {
  const { data: session, update, status } = useSession()
  const router = useRouter()

  // Redirect away if session is ready and profile already completed
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin')
    } else if (status === 'authenticated' && session.user.profileCompleted) {
      router.replace('/dashboard')
    }
  }, [status, session, router])

  const wrapRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo(leftRef.current, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 1 })
        .fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.inOut' }, '-=0.6')
        .fromTo(headRef.current?.querySelectorAll('.hw') ?? [], { y: '110%', opacity: 0 }, { y: '0%', opacity: 1, stagger: 0.1, duration: 0.9 }, '-=0.6')
      tl.fromTo(rightRef.current, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'expo.out' }, '-=1.2')
        .fromTo('.sp-row', { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.45, ease: 'power3.out' }, '-=0.7')
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  const [isLoading, setIsLoading] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const role = session?.user?.role ?? 'STUDENT'
  const isFaculty = role === 'FACULTY' || role === 'EDITOR' || role === 'ADMIN' || role === 'SUPERADMIN'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await setupProfileAction(formData)
      if ('error' in result) {
        setError(result.error)
      } else {
        setSuccess(true)
        await update({ profileCompleted: true })
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    setError('')
    setIsSkipping(true)
    try {
      const result = await skipProfileSetupAction()
      if ('error' in result) {
        setError(result.error)
      } else {
        await update({ profileCompleted: true })
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSkipping(false)
    }
  }

  // While session is loading, show a minimal dark screen
  if (status === 'loading') {
    return <div style={{ minHeight: '100vh', background: '#080808' }} />
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .sp-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px;
          padding: 11px 14px;
          color: #f0ede6;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .sp-input::placeholder { color: rgba(240,237,230,0.2); }
        .sp-input:focus {
          border-color: rgba(201,245,59,0.5);
          box-shadow: 0 0 0 3px rgba(201,245,59,0.07);
        }
        .sp-input:disabled { opacity: .45; cursor: not-allowed; }
        .sp-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px;
          padding: 11px 14px;
          color: #f0ede6;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          outline: none;
          resize: vertical;
          min-height: 80px;
          transition: border-color .2s, box-shadow .2s;
        }
        .sp-textarea::placeholder { color: rgba(240,237,230,0.2); }
        .sp-textarea:focus {
          border-color: rgba(201,245,59,0.5);
          box-shadow: 0 0 0 3px rgba(201,245,59,0.07);
        }
        .sp-textarea:disabled { opacity: .45; cursor: not-allowed; }
        .sp-btn-primary {
          flex: 1;
          padding: 12px;
          border-radius: 9px;
          border: none;
          background: #c9f53b;
          color: #0c0c0c;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: .04em;
          cursor: pointer;
          transition: opacity .2s, transform .15s;
        }
        .sp-btn-primary:hover:not(:disabled) { opacity: .88; }
        .sp-btn-primary:active:not(:disabled) { transform: scale(.98); }
        .sp-btn-primary:disabled { opacity: .45; cursor: not-allowed; }
        .sp-btn-secondary {
          flex: 1;
          padding: 12px;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: rgba(240,237,230,0.5);
          font-size: 13px;
          font-weight: 600;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: .04em;
          cursor: pointer;
          transition: border-color .2s, color .2s, transform .15s;
        }
        .sp-btn-secondary:hover:not(:disabled) { border-color: rgba(255,255,255,0.2); color: rgba(240,237,230,0.8); }
        .sp-btn-secondary:active:not(:disabled) { transform: scale(.98); }
        .sp-btn-secondary:disabled { opacity: .45; cursor: not-allowed; }
        .sp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 767px) {
          .auth-left  { display: none !important; }
          .auth-right { max-width: 100% !important; }
          .sp-grid-2  { grid-template-columns: 1fr; }
        }
      `}</style>

      <div ref={wrapRef} style={S.wrap}>
        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div ref={leftRef} className="auth-left" style={S.left}>
          {/* grid bg */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg,rgba(201,245,59,0.025) 0,rgba(201,245,59,0.025) 1px,transparent 1px,transparent 56px),repeating-linear-gradient(90deg,rgba(201,245,59,0.025) 0,rgba(201,245,59,0.025) 1px,transparent 1px,transparent 56px)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', left: '-10%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(201,245,59,0.09) 0%,transparent 65%)',
            pointerEvents: 'none', filter: 'blur(4px)',
          }} />

          {/* logo */}
          <div>
            <div style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                border: '2px solid rgba(201,245,59,0.5)',
                background: 'rgba(201,245,59,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#c9f53b', letterSpacing: '-0.01em',
              }}>IEDC</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(201,245,59,0.7)', letterSpacing: '0.04em' }}>
                Research Lab
              </span>
            </div>
          </div>

          {/* headline */}
          <div>
            <div ref={lineRef} style={{ width: 48, height: 2, background: '#c9f53b', marginBottom: 28, transformOrigin: 'left' }} />
            <h2 ref={headRef} style={{ fontSize: 'clamp(2rem,3.5vw,2.8rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              {['Set up', 'your', 'profile.'].map((w, i) => (
                <div key={i} style={{ overflow: 'hidden' }}>
                  <span className="hw" style={{ display: 'inline-block', color: i === 2 ? '#c9f53b' : '#f0ede6', fontStyle: i === 1 ? 'italic' : 'normal', willChange: 'transform' }}>
                    {w}
                  </span>
                </div>
              ))}
            </h2>
            <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(240,237,230,0.35)', lineHeight: 1.75, maxWidth: 280 }}>
              This helps us personalise your research dashboard and makes collaboration easier.
            </p>

            {/* role badge */}
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10, padding: '4px 11px', borderRadius: 999,
                border: '1px solid rgba(201,245,59,0.25)',
                color: '#c9f53b', fontFamily: 'monospace', letterSpacing: '.1em',
                background: 'rgba(201,245,59,0.06)',
              }}>
                {role}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(240,237,230,0.2)', fontFamily: 'monospace' }}>
                {session?.user?.email}
              </span>
            </div>

            {/* steps */}
            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { n: '01', label: 'Basic details' },
                { n: '02', label: isFaculty ? 'Faculty info' : 'Academic info' },
                { n: '03', label: 'Links & socials' },
              ].map(({ n, label }) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#c9f53b', minWidth: 18 }}>{n}</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(201,245,59,0.12)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(240,237,230,0.35)', fontFamily: 'monospace', letterSpacing: '.06em' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
            <p style={{ fontSize: 12, color: 'rgba(240,237,230,0.2)', fontFamily: 'monospace', letterSpacing: '.05em' }}>
              IEDC · Dept. of CSE · Since 1999
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
        <div ref={rightRef} className="auth-right" style={S.right}>
          <div style={{ width: '100%', maxWidth: 520 }}>

            {/* header */}
            <div className="sp-row" style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 11, letterSpacing: '.35em', textTransform: 'uppercase', color: 'rgba(201,245,59,0.55)', fontFamily: 'monospace', marginBottom: 8 }}>
                — One last step
              </p>
              <h1 style={{ fontSize: 'clamp(1.4rem,2.5vw,1.75rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#f0ede6', marginBottom: 6 }}>
                Complete your profile
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(240,237,230,0.35)', lineHeight: 1.6 }}>
                Fill in what you can — you can always update this later from settings.
              </p>
            </div>

            {/* error banner */}
            {error && (
              <div className="sp-row" style={{
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* ── 01 BASIC DETAILS ───────────────────────────────────── */}
              <div className="sp-row" style={{ marginBottom: 8 }}>
                <Section title="Basic details" badge="01" defaultOpen>

                  <Field id="sp-name" label="Full Name" optional={false}>
                    <input
                      id="sp-name"
                      name="name"
                      className="sp-input"
                      placeholder="e.g. Arjun Menon"
                      defaultValue={session?.user?.name ?? ''}
                      required
                      disabled={isLoading || isSkipping}
                    />
                  </Field>

                  <Field id="sp-dept" label="Department">
                    <input
                      id="sp-dept"
                      name="department"
                      className="sp-input"
                      placeholder="e.g. Computer Science & Engineering"
                      disabled={isLoading || isSkipping}
                    />
                  </Field>

                  <Field id="sp-inst" label="Institution">
                    <input
                      id="sp-inst"
                      name="institution"
                      className="sp-input"
                      placeholder="e.g. UEM Kolkata"
                      disabled={isLoading || isSkipping}
                    />
                  </Field>

                  <Field id="sp-phone" label="Phone">
                    <input
                      id="sp-phone"
                      name="phone"
                      className="sp-input"
                      placeholder="+91 98765 43210"
                      disabled={isLoading || isSkipping}
                    />
                  </Field>

                  <Field id="sp-bio" label="Brief Bio">
                    <textarea
                      id="sp-bio"
                      name="bio"
                      className="sp-textarea"
                      placeholder="Tell us a bit about yourself, your interests, current work..."
                      disabled={isLoading || isSkipping}
                      rows={3}
                    />
                  </Field>
                </Section>
              </div>

              {/* ── 02 ROLE-SPECIFIC DETAILS ───────────────────────────── */}
              <div className="sp-row" style={{ marginBottom: 8 }}>
                {isFaculty ? (
                  <Section title="Faculty information" badge="02" defaultOpen={false}>

                    <Field id="sp-designation" label="Designation">
                      <input
                        id="sp-designation"
                        name="designation"
                        className="sp-input"
                        placeholder="e.g. Assistant Professor"
                        disabled={isLoading || isSkipping}
                      />
                    </Field>

                    <div className="sp-grid-2">
                      <Field id="sp-exp" label="Years of Experience">
                        <input
                          id="sp-exp"
                          name="yearsOfExperience"
                          className="sp-input"
                          placeholder="e.g. 8"
                          disabled={isLoading || isSkipping}
                        />
                      </Field>
                      <Field id="sp-orcid" label="ORCID ID">
                        <input
                          id="sp-orcid"
                          name="orcidId"
                          className="sp-input"
                          placeholder="0000-0000-0000-0000"
                          disabled={isLoading || isSkipping}
                        />
                      </Field>
                    </div>

                    <Field id="sp-expertise" label="Areas of Expertise">
                      <input
                        id="sp-expertise"
                        name="areasOfExpertise"
                        className="sp-input"
                        placeholder="ML, Computer Vision, NLP  (comma-separated)"
                        disabled={isLoading || isSkipping}
                      />
                    </Field>

                    <Field id="sp-research-int" label="Research Interests">
                      <input
                        id="sp-research-int"
                        name="researchInterests"
                        className="sp-input"
                        placeholder="Deep Learning, Edge Computing  (comma-separated)"
                        disabled={isLoading || isSkipping}
                      />
                    </Field>
                  </Section>
                ) : (
                  <Section title="Academic information" badge="02" defaultOpen={false}>

                    <div className="sp-grid-2">
                      <Field id="sp-enroll" label="Enrollment No.">
                        <input
                          id="sp-enroll"
                          name="enrollmentNo"
                          className="sp-input"
                          placeholder="e.g. 12345678"
                          disabled={isLoading || isSkipping}
                        />
                      </Field>
                      <Field id="sp-degree" label="Degree">
                        <input
                          id="sp-degree"
                          name="degree"
                          className="sp-input"
                          placeholder="e.g. B.Tech"
                          disabled={isLoading || isSkipping}
                        />
                      </Field>
                    </div>

                    <div className="sp-grid-2">
                      <Field id="sp-year" label="Current Year">
                        <input
                          id="sp-year"
                          name="currentYear"
                          className="sp-input"
                          placeholder="e.g. 3rd"
                          disabled={isLoading || isSkipping}
                        />
                      </Field>
                      <Field id="sp-sem" label="Current Semester">
                        <input
                          id="sp-sem"
                          name="currentSemester"
                          className="sp-input"
                          placeholder="e.g. 6th"
                          disabled={isLoading || isSkipping}
                        />
                      </Field>
                    </div>

                    <div className="sp-grid-2">
                      <Field id="sp-gradyr" label="Graduation Year">
                        <input
                          id="sp-gradyr"
                          name="graduationYear"
                          className="sp-input"
                          placeholder="e.g. 2026"
                          disabled={isLoading || isSkipping}
                        />
                      </Field>
                      <Field id="sp-skills" label="Skills">
                        <input
                          id="sp-skills"
                          name="skills"
                          className="sp-input"
                          placeholder="Python, React  (comma-separated)"
                          disabled={isLoading || isSkipping}
                        />
                      </Field>
                    </div>

                    <Field id="sp-research-int" label="Research Interests">
                      <input
                        id="sp-research-int"
                        name="researchInterests"
                        className="sp-input"
                        placeholder="IoT, Blockchain  (comma-separated)"
                        disabled={isLoading || isSkipping}
                      />
                    </Field>
                  </Section>
                )}
              </div>

              {/* ── 03 LINKS & SOCIALS ─────────────────────────────────── */}
              <div className="sp-row" style={{ marginBottom: 20 }}>
                <Section title="Links & socials" badge="03" defaultOpen={false}>

                  <Field id="sp-linkedin" label="LinkedIn">
                    <input
                      id="sp-linkedin"
                      name="linkedinLink"
                      className="sp-input"
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      disabled={isLoading || isSkipping}
                    />
                  </Field>

                  <Field id="sp-github" label="GitHub">
                    <input
                      id="sp-github"
                      name="githubLink"
                      className="sp-input"
                      type="url"
                      placeholder="https://github.com/username"
                      disabled={isLoading || isSkipping}
                    />
                  </Field>

                  <div className="sp-grid-2">
                    <Field id="sp-portfolio" label="Portfolio">
                      <input
                        id="sp-portfolio"
                        name="portfolioLink"
                        className="sp-input"
                        type="url"
                        placeholder="https://yoursite.com"
                        disabled={isLoading || isSkipping}
                      />
                    </Field>
                    <Field id="sp-resume" label="Resume Link">
                      <input
                        id="sp-resume"
                        name="resumeLink"
                        className="sp-input"
                        type="url"
                        placeholder="https://drive.google.com/..."
                        disabled={isLoading || isSkipping}
                      />
                    </Field>
                  </div>
                </Section>
              </div>

              {/* ── ACTION BUTTONS ─────────────────────────────────────── */}
              <div className="sp-row" style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="sp-btn-secondary"
                  onClick={handleSkip}
                  disabled={isLoading || isSkipping || success}
                >
                  {isSkipping ? 'Skipping…' : 'Skip for now'}
                </button>
                <button
                  type="submit"
                  className="sp-btn-primary"
                  disabled={isLoading || isSkipping || success}
                >
                  {isLoading || success ? 'Saving…' : 'Save & continue →'}
                </button>
              </div>

            </form>

            {/* footer note */}
            <div className="sp-row" style={{ marginTop: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'rgba(240,237,230,0.18)', fontFamily: 'monospace', letterSpacing: '.06em' }}>
                You can edit everything later in Dashboard → Settings
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
