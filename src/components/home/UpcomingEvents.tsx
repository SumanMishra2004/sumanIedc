"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Calendar, User, Phone, ArrowUpRight, ShieldAlert, Sparkles } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

interface Event {
  id: string
  name: string
  posterUrl: string | null
  registrationCost: number | null
  description: string
  registrationLink: string
  contactName: string
  contactPhone: string
  eventDate: string
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/public/events")
        if (res.ok) {
          const data = await res.json()
          setEvents(data.events || [])
        }
      } catch (err) {
        console.error("Error fetching homepage events:", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEvents()
  }, [])

  // Entry animations
  useEffect(() => {
    if (isLoading || events.length === 0) return

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.querySelectorAll(".anim-text"),
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 80%",
            },
          }
        )
      }

      if (cardsRef.current) {
        gsap.fromTo(
          cardsRef.current.querySelectorAll(".event-card"),
          { y: 70, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.15,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cardsRef.current,
              start: "top 75%",
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [isLoading, events])

  if (isLoading) {
    return (
      <div style={{ background: "#080808", padding: "100px 6vw", textAlign: "center" }}>
        <div style={{ display: "inline-block", border: "3px solid #c9f53b", borderTopColor: "transparent", borderRadius: "50%", width: 40, height: 40, animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#f0ede6", marginTop: 16, fontFamily: "monospace", fontSize: 12, letterSpacing: "0.15em" }}>LOADING INITIATIVES...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // If there are no upcoming events, we don't render a blank space but show a beautifully styled empty state
  return (
    <section
      ref={sectionRef}
      style={{
        background: "#080808",
        padding: "clamp(60px,10vw,120px) 6vw",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {/* Background Blobs */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "-10%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,245,59,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div ref={headerRef} style={{ marginBottom: "clamp(40px,6vw,80px)" }}>
          <p
            className="anim-text"
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "#c9f53b",
              marginBottom: "16px",
            }}
          >
            — Live & Direct
          </p>
          <h2
            className="anim-text"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#f0ede6",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Upcoming <em style={{ fontStyle: "italic", color: "#c9f53b" }}>Events</em>
          </h2>
          <p
            className="anim-text"
            style={{
              color: "rgba(240,237,230,0.5)",
              fontSize: "16px",
              marginTop: "16px",
              maxWidth: "500px",
              lineHeight: 1.6,
            }}
          >
            Get involved in hackathons, innovation workshops, entrepreneurship camps, and funding pitches.
          </p>
        </div>

        {events.length === 0 ? (
          <div
            style={{
              border: "1px border-dashed rgba(255,255,255,0.1)",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.02)",
              padding: "60px 40px",
              textAlign: "center",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            <Sparkles className="h-10 w-10 text-[#c9f53b] mx-auto" style={{ marginBottom: "20px" }} />
            <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#f0ede6", marginBottom: "8px" }}>
              Calm Before the Storm
            </h3>
            <p style={{ color: "rgba(240,237,230,0.4)", fontSize: "14px", lineHeight: 1.6, maxWidth: "450px", margin: "0 auto" }}>
              We are curating high-impact hackathons and ideation programs. Check back soon or register in the dashboard to receive notifications.
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div
            ref={cardsRef}
            className="events-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: "32px",
            }}
          >
            {events.map((ev) => {
              const formattedDate = new Date(ev.eventDate).toLocaleDateString("default", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              const formattedTime = new Date(ev.eventDate).toLocaleTimeString("default", {
                hour: "2-digit",
                minute: "2-digit",
              })

              return (
                <div
                  key={ev.id}
                  className="event-card"
                  style={{
                    background: "#0f0f0f",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "20px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    cursor: "default",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget
                    el.style.borderColor = "#c9f53b"
                    el.style.transform = "translateY(-5px)"
                    const img = el.querySelector(".event-img") as HTMLDivElement
                    if (img) img.style.transform = "scale(1.05)"
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget
                    el.style.borderColor = "rgba(255,255,255,0.08)"
                    el.style.transform = "translateY(0)"
                    const img = el.querySelector(".event-img") as HTMLDivElement
                    if (img) img.style.transform = "scale(1)"
                  }}
                >
                  {/* Poster Image — 3:4 portrait ratio */}
                  <div
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      background: "rgba(255,255,255,0.02)",
                      /* 3:4 → paddingBottom = (4/3)*100 = 133.33% */
                      paddingBottom: "133.33%",
                    }}
                  >
                    {ev.posterUrl ? (
                      <div
                        className="event-img"
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundImage: `url(${ev.posterUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          transition: "transform 0.5s ease",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(135deg, #121212 0%, #1e1e1e 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Calendar className="h-12 w-12 text-white/10" />
                      </div>
                    )}

                    {/* Date badge */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "16px",
                        left: "16px",
                        background: "rgba(8,8,8,0.75)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontSize: "11px",
                        color: "#f0ede6",
                        fontFamily: "monospace",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {formattedDate} @ {formattedTime}
                    </div>

                    {/* Cost Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        background: ev.registrationCost && ev.registrationCost > 0 ? "rgba(201,245,59,0.15)" : "rgba(16,185,129,0.15)",
                        border: ev.registrationCost && ev.registrationCost > 0 ? "1px solid rgba(201,245,59,0.3)" : "1px solid rgba(16,185,129,0.3)",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: ev.registrationCost && ev.registrationCost > 0 ? "#c9f53b" : "#34d399",
                      }}
                    >
                      {ev.registrationCost && ev.registrationCost > 0 ? `$${ev.registrationCost}` : "Free Entry"}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div
                    style={{
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: 1,
                      justifyContent: "between",
                    }}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <h4
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#f0ede6",
                          margin: "0 0 12px",
                          lineHeight: 1.25,
                        }}
                      >
                        {ev.name}
                      </h4>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "rgba(240,237,230,0.55)",
                          lineHeight: 1.5,
                          margin: "0 0 20px",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {ev.description}
                      </p>
                    </div>

                    {/* Footer / Meta details */}
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: "16px",
                        marginTop: "16px",
                      }}
                    >
                      {/* Coordinator details */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "20px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <User className="h-4 w-4 text-[#c9f53b]" />
                          <div>
                            <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.4)", display: "block" }}>Coordinator</span>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#f0ede6" }}>{ev.contactName}</span>
                          </div>
                        </div>

                        <a href={`tel:${ev.contactPhone}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Phone className="h-3 w-3 text-white/50" />
                          <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.4)" }}>{ev.contactPhone}</span>
                        </a>
                      </div>

                      {/* Register Button */}
                      <a
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          width: "100%",
                          background: "#c9f53b",
                          color: "#080808",
                          textDecoration: "none",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          fontSize: "13px",
                          fontWeight: 700,
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#d6ff47"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#c9f53b"
                        }}
                      >
                        Register For Event <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .events-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
