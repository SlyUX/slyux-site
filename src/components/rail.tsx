'use client'

import { useSyncExternalStore } from 'react'
import { ChevronDown } from 'lucide-react'

/** Tailwind's `lg`: from here the rail sits beside the story. */
const BESIDE = '(min-width: 64rem)'

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(BESIDE)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * The "How it started…" card. Beside the story it's an open <aside>. On
 * narrower screens it follows the story, folded to its title: the work keeps
 * the focus, and the before half of the story stays a tap away. The server
 * renders the open card; narrow screens fold it once hydrated, out of view
 * below the story.
 */
export function Rail({ heading, children }: { heading: React.ReactNode; children: React.ReactNode }) {
  const beside = useSyncExternalStore(subscribe, () => window.matchMedia(BESIDE).matches, () => true)
  const title = (
    <h2 id="how-it-started" className="font-display text-heading text-xl font-semibold">
      {heading}
    </h2>
  )

  if (beside) {
    return (
      <aside aria-labelledby="how-it-started" className="bg-surface self-start rounded-2xl p-5">
        {title}
        <div className="mt-4">{children}</div>
      </aside>
    )
  }
  return (
    <details className="group bg-surface rounded-2xl">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-5 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown aria-hidden className="text-muted-foreground size-5 shrink-0 group-open:rotate-180 motion-safe:transition-transform" />
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  )
}
