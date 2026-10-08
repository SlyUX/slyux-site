'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { ChevronDown, ChevronRight } from 'lucide-react'

import { TransitionLink } from '@/components/transition-link'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  href: string
}

/**
 * Where a child page sits. Wider screens show a white card holding the parent
 * (a bold, capitalized link), then its children: a row of tabs with the current
 * one raised (portfolio sections), or, for a long list (case studies), one
 * raised tab that opens a menu of them all. Phones show a plain trail:
 * Parent › Child › Page.
 *
 * The tabs sit in a 3px track, so they take the inner radius and their
 * corners stay concentric with it.
 */
export function Breadcrumb({
  parent,
  items,
  current,
  page,
  menu = false,
}: {
  parent: Crumb
  /** The parent's children, in order. */
  items: Crumb[]
  /** The child this page is, or belongs to. */
  current: string
  /** The page's own title, when it sits below the current child (a piece in a section). */
  page?: string
  /** Show the children as one tab that opens a menu, for lists too long for tabs. */
  menu?: boolean
}) {
  const here = items.find((it) => it.href === current)
  const ariaCurrent = (href: string) => (href === current ? (page ? 'location' : 'page') : undefined)
  const tab = 'rounded-ui-inner block px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors'

  return (
    // aria-label is a11y-only text, not CMS copy.
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm md:hidden">
        <li>
          <TransitionLink href={parent.href} className="hover:text-primary font-medium">
            {parent.label}
          </TransitionLink>
        </li>
        {here && (
          <>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li>
              {page ? (
                <TransitionLink href={here.href} aria-current="location" className="hover:text-primary font-medium">
                  {here.label}
                </TransitionLink>
              ) : (
                <span aria-current="page" className="text-foreground font-medium">
                  {here.label}
                </span>
              )}
            </li>
          </>
        )}
        {page && (
          <>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="text-foreground font-medium">
              {page}
            </li>
          </>
        )}
      </ol>

      {/* A white card, 10px around its contents; the track inside keeps its own 7px corners. */}
      <ol className="bg-paper rounded-ui hidden items-center gap-4 p-2.5 pl-3.5 md:inline-flex">
        <li>
          <TransitionLink href={parent.href} className="text-subtle-foreground hover:text-primary text-sm font-bold tracking-wide uppercase">
            {parent.label}
          </TransitionLink>
        </li>
        <li>
          {menu ? (
            <CrumbMenu parent={parent} items={items} current={current} tab={tab} />
          ) : (
            <ul className="bg-surface rounded-ui flex gap-[3px] p-[3px]">
              {items.map((it) => (
                <li key={it.href}>
                  <TransitionLink
                    href={it.href}
                    aria-current={ariaCurrent(it.href)}
                    className={cn(
                      tab,
                      it.href === current ? 'bg-paper text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {it.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          )}
        </li>
      </ol>
    </nav>
  )
}

/** One raised tab naming the current child; it opens a list of every child. */
function CrumbMenu({ parent, items, current, tab }: { parent: Crumb; items: Crumb[]; current: string; tab: string }) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const here = items.find((it) => it.href === current)

  // Close on Escape (focus back to the button) or on a click outside.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        buttonRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open, close])

  return (
    <div ref={wrapRef} className="relative">
      <div className="bg-surface rounded-ui p-[3px]">
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
          className={cn(tab, 'bg-paper text-foreground hover:text-primary flex items-center gap-1.5 shadow-sm')}
        >
          {/* Screen readers hear "Case Studies: JesusCalling.com". */}
          <span className="sr-only">{parent.label}: </span>
          {here?.label}
          <ChevronDown aria-hidden className={cn('size-4 transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      {open && (
        <ul id={listId} className="bg-background border-border rounded-ui absolute top-full left-0 z-30 mt-2 min-w-64 border p-[3px] shadow-lg">
          {items.map((it) => (
            <li key={it.href}>
              <TransitionLink
                href={it.href}
                onNavigate={close}
                aria-current={it.href === current ? 'page' : undefined}
                className={cn(
                  'hover:bg-surface hover:text-primary rounded-ui-inner block px-3 py-2 text-sm',
                  it.href === current && 'text-primary font-medium',
                )}
              >
                {it.label}
              </TransitionLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
