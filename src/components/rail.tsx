'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The "How it started…" card. Beside the story (lg and up) it's always open.
 * Narrower, it sits inside the story folded to its title, a disclosure button
 * that opens it: the work keeps the focus, and the before half of the story
 * stays a tap away. Folding is CSS (`hidden lg:block`), so the server renders
 * each layout correctly and nothing shifts on load.
 */
export function Rail({
  heading,
  headingLevel: Heading = 'h2',
  className,
  children,
}: {
  heading: React.ReactNode
  /** The level, for a rail nested inside another section (the styleguide's example). */
  headingLevel?: 'h2' | 'h3' | 'h4'
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const contentId = useId()
  const headingId = useId()

  return (
    <aside aria-labelledby={headingId} className={cn('bg-surface self-start rounded-ui', className)}>
      <Heading id={headingId} className="font-display text-heading text-xl font-semibold">
        {/* One of these two shows at a time: the button folds the card on phones; beside the story it's a plain title. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between gap-3 rounded-ui p-5 text-left lg:hidden"
        >
          {heading}
          <ChevronDown aria-hidden className={cn('text-muted-foreground size-5 shrink-0 motion-safe:transition-transform', open && 'rotate-180')} />
        </button>
        <span className="hidden px-5 pt-5 lg:block">{heading}</span>
      </Heading>
      <div id={contentId} className={cn('px-5 pb-5 lg:mt-4 lg:block', !open && 'hidden')}>
        {children}
      </div>
    </aside>
  )
}
