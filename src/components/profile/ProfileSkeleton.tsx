export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero card skeleton */}
      <div className="rounded-2xl border border-border/30 bg-card/60 overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-muted/40" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-full bg-muted/60 border-4 border-card" />
            {/* Buttons */}
            <div className="flex gap-2 pb-1">
              <div className="h-8 w-20 rounded-lg bg-muted/40" />
              <div className="h-8 w-28 rounded-lg bg-muted/40" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-7 w-48 rounded-lg bg-muted/50" />
              <div className="h-5 w-20 rounded-full bg-muted/40" />
            </div>
            <div className="flex gap-5">
              <div className="h-4 w-36 rounded bg-muted/40" />
              <div className="h-4 w-44 rounded bg-muted/40" />
            </div>
            <div className="h-4 w-full max-w-lg rounded bg-muted/30" />
            <div className="h-4 w-3/4 max-w-md rounded bg-muted/30" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-card/60 p-4 space-y-2">
            <div className="h-9 w-9 rounded-lg bg-muted/50" />
            <div className="h-7 w-10 rounded bg-muted/50" />
            <div className="h-3 w-16 rounded bg-muted/30" />
          </div>
        ))}
      </div>

      {/* Feed skeleton */}
      <div className="rounded-2xl border border-border/30 bg-card/60 overflow-hidden">
        {/* Tabs bar */}
        <div className="px-6 pt-5 pb-4 flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-t-lg bg-muted/40" />
          ))}
        </div>
        <div className="h-px bg-border/30 mx-6" />
        <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/30 bg-card/40 p-5 space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full bg-muted/50" />
                <div className="h-5 w-24 rounded-full bg-muted/40" />
              </div>
              <div className="h-5 w-3/4 rounded bg-muted/50" />
              <div className="h-4 w-1/2 rounded bg-muted/30" />
              <div className="h-4 w-full rounded bg-muted/30" />
              <div className="h-4 w-5/6 rounded bg-muted/25" />
              <div className="flex gap-1.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-5 w-16 rounded-full bg-muted/30" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
