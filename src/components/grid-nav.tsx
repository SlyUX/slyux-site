'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'

import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The 3 × 3 site map and its navigation motion. One rule, two motions:
 *
 *  - Across the map → PAN. The camera travels from one cell to another (old
 *    page slides out, new one slides in from the far side, blueprint grid
 *    scrolling behind). A landing page that isn't a cell but parents cells —
 *    /portfolio parents the top row — sits at the center of its children.
 *  - Within a section → BLIND. A child page rolls down over its parent and
 *    rolls back up on return; siblings (UX ↔ Illustration) roll down when
 *    moving later in reading order, up when moving earlier.
 *
 * Anything else fades. The direction is set as CSS variables on <html> just
 * before navigating; `globals.css` turns them into motion. Browser
 * back/forward carries no transition type, so it swaps instantly — the
 * documented Next.js behavior, and fine for a history jump.
 */

export interface GridCell {
  _key: string
  label: string
  href: string
  cell: number
}

type Motion = 'pan' | 'blind-down' | 'blind-up' | 'fade'
type Position = { col: number; row: number }

/** The map cell a path belongs to: exact match, or the deepest section prefix. */
export function cellForPath(pathname: string, cells: GridCell[]): number | undefined {
  let best: GridCell | undefined
  for (const c of cells) {
    const matches = c.href === '/' ? pathname === '/' : pathname === c.href || pathname.startsWith(`${c.href}/`)
    if (matches && (!best || c.href.length > best.href.length)) best = c
  }
  return best?.cell
}

const col = (cell: number) => (cell - 1) % 3
const row = (cell: number) => Math.floor((cell - 1) / 3)

/** Where a path sits on the map: its cell, or the center of the cells it parents. */
function positionForPath(pathname: string, cells: GridCell[]): Position | undefined {
  const cell = cellForPath(pathname, cells)
  if (cell) return { col: col(cell), row: row(cell) }
  const children = cells.filter((c) => c.href !== '/' && c.href.startsWith(`${pathname}/`))
  if (!children.length) return undefined
  const avg = (f: (n: number) => number) => children.reduce((sum, c) => sum + f(c.cell), 0) / children.length
  return { col: avg(col), row: avg(row) }
}

const isAncestor = (parent: string, child: string) => parent !== '/' && child.startsWith(`${parent}/`)

/** First path segment: "/portfolio/ux" → "portfolio". Home has none. */
const sectionOf = (path: string) => path.split('/')[1] || undefined

function motionFor(from: string, to: string, cells: GridCell[]): { motion: Motion; a?: Position; b?: Position } {
  if (from === to) return { motion: 'fade' }
  if (isAncestor(from, to)) return { motion: 'blind-down' }
  if (isAncestor(to, from)) return { motion: 'blind-up' }
  const a = positionForPath(from, cells)
  const b = positionForPath(to, cells)
  // Siblings and cousins within one section (UX ↔ Illustration, one case study
  // to the next) stay in the blind family: later in reading order rolls down,
  // earlier rolls up. Only moves between sections pan.
  const section = sectionOf(from)
  if (section && section === sectionOf(to)) {
    const order = (p?: Position) => (p ? p.row * 3 + p.col : 0)
    return { motion: order(b) < order(a) ? 'blind-up' : 'blind-down' }
  }
  if (a && b && (a.col !== b.col || a.row !== b.row)) return { motion: 'pan', a, b }
  return { motion: 'fade' }
}

/** Sets the pan vector for the next view transition. */
function preparePan(a: Position, b: Position) {
  const dx = b.col - a.col
  const dy = b.row - a.row
  const distance = Math.max(Math.abs(dx), Math.abs(dy))
  const root = document.documentElement.style
  root.setProperty('--pan-dx', String(dx))
  root.setProperty('--pan-dy', String(dy))
  // Longer trips take a little longer, so a diagonal across the map reads as travel.
  root.setProperty('--pan-duration', `${Math.round(500 + (distance - 1) * 200)}ms`)
}

/** The map, shared with every link on the page so any link can pick its motion. */
const SiteMapContext = createContext<GridCell[]>([])

export function SiteMapProvider({ cells, children }: { cells: GridCell[]; children: React.ReactNode }) {
  return <SiteMapContext.Provider value={cells}>{children}</SiteMapContext.Provider>
}

/**
 * The site's internal link. Picks pan / blind / fade from where you are and
 * where it goes. `transitionTypes` must be known at render, so the motion is
 * computed from the current path; the pan vector is set on click.
 */
export function PanLink({
  href,
  cells: cellsProp,
  className,
  children,
  onNavigate,
  ...rest
}: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string; cells?: GridCell[] }) {
  const pathname = usePathname()
  const contextCells = useContext(SiteMapContext)
  const cells = cellsProp ?? contextCells
  const { motion, a, b } = motionFor(pathname, href.split(/[?#]/)[0], cells)

  return (
    <Link
      href={href}
      className={className}
      transitionTypes={[motion]}
      onNavigate={(event) => {
        if (motion === 'pan' && a && b) preparePan(a, b)
        // The blind rolls from the part of the page that's actually on screen.
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
  cells,
  current,
}: {
  label: string
  href: string
  sections: GridCell[]
  cells: GridCell[]
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
      <PanLink
        href={href}
        cells={cells}
        aria-current={pathname === href ? 'page' : undefined}
        className={cn('hover:text-primary', inPortfolio && 'text-primary')}
      >
        {label}
      </PanLink>
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
              <PanLink
                href={c.href}
                cells={cells}
                onNavigate={() => setOpen(false)}
                aria-current={current === c.cell ? 'page' : undefined}
                className={cn(
                  'hover:bg-surface hover:text-primary block rounded-lg px-3 py-2 whitespace-nowrap',
                  current === c.cell && 'text-primary',
                )}
              >
                {c.label}
              </PanLink>
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
  // A landing page that parents cells (e.g. /portfolio → the top row) lights all of them, softer.
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
                <PortfolioNav label={portfolio.label} href={portfolio.href} sections={item.cells} cells={cells} current={current} />
              </li>
            ) : (
              <li key={item.cell._key}>
                <PanLink
                  href={item.cell.href}
                  cells={cells}
                  aria-current={current === item.cell.cell ? 'page' : undefined}
                  className={cn('hover:text-primary', current === item.cell.cell && 'text-primary')}
                >
                  {item.cell.label}
                </PanLink>
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
                i + 1 === current ? 'bg-fox' : parentOf.has(i + 1) ? 'bg-fox/60' : byCell.has(i + 1) ? 'bg-foreground/25' : 'bg-foreground/8',
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
                  <PanLink
                    href={c.href}
                    cells={cells}
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
                  </PanLink>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </nav>
  )
}
