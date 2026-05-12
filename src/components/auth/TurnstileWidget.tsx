'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

export default function TurnstileWidget({ 
  onVerify 
}: { 
  onVerify: (token: string) => void 
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) {
      console.warn('Turnstile site key missing. Providing dummy token for dev.')
      onVerify('dummy-token-for-dev')
      return
    }

    if (isLoaded && containerRef.current && (window as any).turnstile && !widgetIdRef.current) {
      try {
        const id = (window as any).turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: function(token: string) {
            onVerify(token)
          },
          theme: 'dark'
        })
        widgetIdRef.current = id
      } catch (e) {
        console.error('Turnstile render error', e)
      }
    }
    
    return () => {
      // Don't unmount on cleanup in strict mode as turnstile removes the node completely
      // which causes hydration mismatches or crash.
    }
  }, [isLoaded, siteKey, onVerify])

  if (!siteKey) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" 
        strategy="afterInteractive"
        onLoad={() => setIsLoaded(true)}
      />
      <div ref={containerRef} />
    </div>
  )
}
