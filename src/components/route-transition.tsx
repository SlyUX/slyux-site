'use client'

import { usePathname } from 'next/navigation'
import { ViewTransition } from 'react'

/**
 * Transition type → CSS class, one per motion and side in `globals.css`.
 * Entering and leaving pages get different classes so the moving one's
 * group can sit on top.
 */
const ENTER = {
  'blind-rise': 'blind-rise-in',
  'blind-lower': 'blind-lower-in',
  'blind-across': 'blind-across-in',
  default: 'none',
}
const EXIT = {
  'blind-rise': 'blind-rise-out',
  'blind-lower': 'blind-lower-out',
  'blind-across': 'blind-across-out',
  default: 'none',
}

/**
 * Wraps each page so every navigation is an exit + enter, which is what the
 * blind view transitions hook into.
 *
 * Keyed by the full pathname on purpose: a template only remounts when its
 * direct child segment changes, so /portfolio → /portfolio/brand (same
 * `portfolio` segment) would never exit or enter, and no blind would play.
 *
 * Types come from `TransitionLink` (grid-nav.tsx); first load and browser
 * back/forward carry none, so they don't animate. The wrapper is opaque so a
 * moving page never shows the page behind it, and it fills the height the
 * header leaves (with main and the footer inside, see template.tsx), so even
 * a short page moves as a full-height panel.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <ViewTransition key={pathname} enter={ENTER} exit={EXIT} default="none">
      <div className="bg-background flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  )
}
