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
      <div className="bg-background px-[6vw] py-24 text-center transition-colors duration-300">
        <div className="inline-block border-3 border-primary border-t-transparent rounded-full w-10 h-10 animate-spin" />
        <p className="text-foreground/80 mt-4 font-mono text-[12px] tracking-[0.15em]">LOADING INITIATIVES...</p>
      </div>
    )
  }

  // If there are no upcoming events, we don't render a blank space but show a beautifully styled empty state
  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-[6vw] py-16 md:py-24 lg:py-32 font-['Syne'] bg-background text-foreground transition-colors duration-300"
    >
      {/* Background Blobs */}
      <div
        className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(201,245,59,0.04)_0%,transparent_70%)] pointer-events-none z-0"
      />

      <div className="relative z-10">
        {/* Header */}
        <div ref={headerRef} className="mb-12 md:mb-16 lg:mb-20">
          <p
            className="anim-text font-mono text-[11px] tracking-[0.4em] uppercase text-primary mb-4"
          >
            — Live & Direct
          </p>
          <h2
            className="anim-text text-4xl sm:text-5xl lg:text-6xl font-bold font-['Syne'] tracking-tight leading-[1.05] m-0 text-foreground"
          >
            Upcoming <em className="font-normal italic text-primary">Events</em>
          </h2>
          <p
            className="anim-text text-foreground/50 text-base mt-4 max-w-[500px] leading-relaxed"
          >
            Get involved in hackathons, innovation workshops, entrepreneurship camps, and funding pitches.
          </p>
        </div>

        {events.length === 0 ? (
          <div
            className="border border-dashed border-border/40 rounded-[24px] bg-muted/10 dark:bg-white/[0.02] px-10 py-16 text-center max-w-[800px] mx-auto"
          >
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-5" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Calm Before the Storm
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-[450px] mx-auto">
              We are curating high-impact hackathons and ideation programs. Check back soon or register in the dashboard to receive notifications.
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div
            ref={cardsRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                  className="event-card group flex flex-col bg-card border border-border/40 rounded-[20px] overflow-hidden transition-all duration-300 cubic-bezier(0.25,0.8,0.25,1) hover:border-primary hover:-translate-y-1.5 cursor-default relative text-foreground"
                >
                  {/* Poster Image — 3:4 portrait ratio */}
                  <div
                    className="relative overflow-hidden bg-muted/20 pb-[133.33%]"
                  >
                    {ev.posterUrl ? (
                      <div
                        className="event-img absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${ev.posterUrl})`,
                        }}
                      />
                    ) : (
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-background to-muted flex items-center justify-center"
                      >
                        <Calendar className="h-12 w-12 text-foreground/10" />
                      </div>
                    )}

                    {/* Date badge */}
                    <div
                      className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md border border-border/40 rounded-lg px-3 py-1.5 font-mono text-[11px] text-foreground tracking-wider"
                    >
                      {formattedDate} @ {formattedTime}
                    </div>

                    {/* Cost Badge */}
                    <div
                      className={`absolute top-4 right-4 border rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                        ev.registrationCost && ev.registrationCost > 0
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      }`}
                    >
                      {ev.registrationCost && ev.registrationCost > 0 ? `$${ev.registrationCost}` : "Free Entry"}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div
                    className="p-6 flex flex-col flex-grow justify-between"
                  >
                    <div className="flex-grow">
                      <h4
                        className="text-xl font-bold text-foreground m-0 mb-3 leading-snug"
                      >
                        {ev.name}
                      </h4>
                      <p
                        className="text-foreground/60 text-[13px] leading-relaxed m-0 mb-5 line-clamp-3"
                      >
                        {ev.description}
                      </p>
                    </div>

                    {/* Footer / Meta details */}
                    <div
                      className="border-t border-border/40 pt-4 mt-4"
                    >
                      {/* Coordinator details */}
                      <div
                        className="flex items-center justify-between mb-5"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <div>
                            <span className="text-[11px] text-muted-foreground block font-sans">Coordinator</span>
                            <span className="text-[12px] font-semibold text-foreground">{ev.contactName}</span>
                          </div>
                        </div>

                        <a href={`tel:${ev.contactPhone}`} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors duration-200">
                          <Phone className="h-3 w-3 text-muted-foreground/60" />
                          <span>{ev.contactPhone}</span>
                        </a>
                      </div>

                      {/* Register Button */}
                      <a
                        href={ev.registrationLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-background py-3 px-4 rounded-xl text-[13px] font-bold transition-all duration-200"
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
    </section>
  )
}
