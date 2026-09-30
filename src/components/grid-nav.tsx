'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The site map (a 3 × 3 of the main pages, which is also the phone menu) and
 * the site's one navigation motion: a blind, drawn over the page you're on.
 *
 *  - Parent → child (Home → Case Studies, Case Studies → a case study): the
 *    new page rises from the bottom.
 *  - Child → parent: the reverse — the page you're leaving lowers away.
 *  - Siblings, and any other move: the new page draws across from the right.
 *
 * The motion is passed as a view-transition type; `globals.css` turns it into
 * motion. Browser back/forward carries no transition type, so it swaps
 * instantly — the documented Next.js behavior, and fine for a history jump.
 */

export interface GridCell {
  _key: string
  label: string
  href: string
  cell: number
}

type Motion = 'blind-rise' | 'blind-lower' | 'blind-across' | 'none'

/** The map cell a path belongs to: exact match, or the deepest section prefix. */
export function cellForPath(pathname: string, cells: GridCell[]): number | undefined {
  let best: GridCell | undefined
  for (const c of cells) {
    const matches = c.href === '/' ? pathname === '/' : pathname === c.href || pathname.startsWith(`${c.href}/`)
    if (matches && (!best || c.href.length > best.href.length)) best = c
  }
  return best?.cell
}

/** Home parents every top-level page; otherwise it's the path prefix. */
const isAncestor = (parent: string, child: string) =>
  parent === '/' ? child !== '/' : child.startsWith(`${parent}/`)

function motionFor(from: string, to: string): Motion {
  if (from === to) return 'none'
  if (isAncestor(from, to)) return 'blind-rise'
  if (isAncestor(to, from)) return 'blind-lower'
  return 'blind-across'
}

/**
 * The site's internal link: picks the blind from where you are and where it
 * goes. `transitionTypes` must be known at render, so the motion is computed
 * from the current path.
 */
export function TransitionLink({
  href,
  className,
  children,
  onNavigate,
  ...rest
}: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const pathname = usePathname()
  const motion = motionFor(pathname, href.split(/[?#]/)[0])

  return (
    <Link
      href={href}
      className={className}
      transitionTypes={[motion]}
      onNavigate={(event) => {
        // The blind covers the part of the page that's actually on screen.
        document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`)
        onNavigate?.(event)
      }}
      {...rest}
    >
      {children}
    </Link>
  )
}

type NavItem = { kind: 'link'; cell: GridCell } | { kind: 'portfolio'; cells: GridCell[] }

/**
 * Text-nav order: map cells in reading order, minus Home, with every
 * portfolio section collapsed into one item where the first of them sits.
 */
function groupPortfolio(cells: GridCell[], portfolioHref: string): NavItem[] {
  const items: NavItem[] = []
  let group: GridCell[] | undefined
  for (const c of [...cells].sort((a, b) => a.cell - b.cell)) {
    if (c.href === '/') continue
    if (c.href.startsWith(`${portfolioHref}/`)) {
      if (!group) items.push({ kind: 'portfolio', cells: (group = []) })
      group.push(c)
    } else items.push({ kind: 'link', cell: c })
  }
  return items
}

/**
 * Split button: "Portfolio" is a real link to the landing page; the chevron
 * beside it is a separate button that discloses the sections. No hover-open,
 * so it never flickers as the pointer crosses the nav.
 */
function PortfolioNav({
  label,
  href,
  sections,
  current,
}: {
  label: string
  href: string
  sections: GridCell[]
  current: number | undefined
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inPortfolio = pathname === href || pathname.startsWith(`${href}/`)

  // Close on Escape (focus back to the chevron) or on a click outside.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1.5">
      <TransitionLink
        href={href}
        aria-current={pathname === href ? 'page' : undefined}
        className={cn('hover:text-primary', inPortfolio && 'text-primary')}
      >
        {label}
      </TransitionLink>
      {/* Divider between the link and its menu button — decorative. */}
      <span aria-hidden className="bg-foreground/25 h-4 w-px" />
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        // a11y-only name; the visible label is the link beside it.
        aria-label={`${label} sections`}
        onClick={() => setOpen((o) => !o)}
        className="hover:text-primary hover:bg-surface -my-2 -mr-2 flex size-9 items-center justify-center rounded-lg transition-colors"
      >
        <ChevronDown aria-hidden className={cn('size-5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul
          id={menuId}
          className="bg-background border-border absolute top-full left-0 z-50 mt-3 min-w-48 rounded-xl border p-1.5 shadow-lg"
        >
          {sections.map((c) => (
            <li key={c._key}>
              <TransitionLink
                href={c.href}
                onNavigate={() => setOpen(false)}
                aria-current={current === c.cell ? 'page' : undefined}
                className={cn(
                  'hover:bg-surface hover:text-primary block rounded-lg px-3 py-2 whitespace-nowrap',
                  current === c.cell && 'text-primary',
                )}
              >
                {c.label}
              </TransitionLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Header map: a tiny 3 × 3 that marks where you are and opens the labeled map. */
export function GridNav({
  cells,
  label,
  portfolio,
}: {
  cells: GridCell[]
  label: string
  /** Map cells under this path are grouped behind one "Portfolio" item in the text nav. */
  portfolio: { label: string; href: string }
}) {
  const pathname = usePathname()
  const topLevel = groupPortfolio(cells, portfolio.href)
  const current = cellForPath(pathname, cells)
  // A landing page that parents cells (e.g. /portfolio → the top row) lights all of them.
  const parentOf = new Set(
    current ? [] : cells.filter((c) => c.href !== '/' && c.href.startsWith(`${pathname}/`)).map((c) => c.cell),
  )
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const byCell = new Map(cells.map((c) => [c.cell, c]))

  // Close on Escape and return focus to the button.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <nav aria-label={label} className="relative">
      <div className="flex items-center gap-5">
        <ul className="hidden items-center gap-5 text-sm font-medium lg:flex">
          {topLevel.map((item) =>
            item.kind === 'portfolio' ? (
              <li key="portfolio">
                <PortfolioNav label={portfolio.label} href={portfolio.href} sections={item.cells} current={current} />
              </li>
            ) : (
              <li key={item.cell._key}>
                <TransitionLink
                  href={item.cell.href}
                  aria-current={current === item.cell.cell ? 'page' : undefined}
                  className={cn('hover:text-primary', current === item.cell.cell && 'text-primary')}
                >
                  {item.cell.label}
                </TransitionLink>
              </li>
            ),
          )}
        </ul>

        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={label}
          onClick={() => setOpen((o) => !o)}
          className="border-border hover:border-primary grid size-10 shrink-0 grid-cols-3 gap-0.5 rounded-lg border p-1.5 transition-colors"
        >
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                'rounded-[2px] transition-colors',
                i + 1 === current ? 'bg-fox' : parentOf.has(i + 1) ? 'bg-fox' : byCell.has(i + 1) ? 'bg-foreground/25' : 'bg-foreground/8',
              )}
            />
          ))}
        </button>
      </div>

      {open && (
        <div
          id={panelId}
          className="bg-ink text-ink-foreground border-ink-foreground/10 absolute top-full right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border p-3 shadow-2xl"
        >
          <ul className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, i) => {
              const c = byCell.get(i + 1)
              if (!c) return <li key={i} aria-hidden className="border-ink-foreground/10 aspect-square rounded-xl border border-dashed" />
              const here = current === c.cell
              return (
                <li key={c._key}>
                  <TransitionLink
                    href={c.href}
                    onNavigate={() => setOpen(false)}
                    aria-current={here ? 'page' : undefined}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-xl border p-2 text-center text-xs leading-tight font-semibold transition-colors',
                      here
                        ? 'border-fox bg-fox text-ink'
                        : 'border-ink-foreground/15 hover:border-fox hover:text-fox',
                    )}
                  >
                    {c.label}
                  </TransitionLink>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </nav>
  )
}
