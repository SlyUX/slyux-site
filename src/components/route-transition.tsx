'use client'

import { usePathname } from 'next/navigation'
import { ViewTransition } from 'react'

/** Transition type → CSS class, one per motion in `globals.css`. */
const MOTIONS = {
  pan: 'pan',
  'blind-down': 'blind-down',
  'blind-up': 'blind-up',
  fade: 'fade',
  default: 'none',
}

/**
 * Wraps each page so every navigation is an exit + enter, which is what the
 * pan / blind / fade view transitions hook into.
 *
 * Keyed by the full pathname on purpose: a template only remounts when its
 * direct child segment changes, so /portfolio → /portfolio/brand (same
 * `portfolio` segment) would never exit or enter — and neither blind nor a
 * pan between two portfolio sections would play.
 *
 * Types come from `PanLink` (grid-nav.tsx); first load and browser
 * back/forward carry none, so they don't animate. The wrapper is opaque so a
 * moving page never shows the page behind it.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <ViewTransition key={pathname} enter={MOTIONS} exit={MOTIONS} default="none">
      <div className="bg-background">{children}</div>
    </ViewTransition>
  )
}
