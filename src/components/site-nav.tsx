'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { ChevronDown, Menu, X } from 'lucide-react'

import { returnFocus } from '@/components/return-focus'
import { TransitionLink } from '@/components/transition-link'
import { cn } from '@/lib/utils'
import { PORTFOLIO_SECTIONS } from '@/sanity/portfolio'

/**
 * The header navigation. Wide screens show the pages as text, with the
 * portfolio sections behind a disclosure beside "Portfolio"; narrower screens
 * show a menu button that opens the same pages as a list. The pages and their
 * order come from Site settings → Navigation.
 */

export interface NavEntry {
  _key: string
  label: string
  href: string
  /** Position in the navigation; lower comes first. */
  cell: number
}

/** The entry a path belongs to: exact match, or the deepest section prefix. */
function entryForPath(pathname: string, entries: NavEntry[]): NavEntry | undefined {
  let best: NavEntry | undefined
  for (const e of entries) {
    const matches = e.href === '/' ? pathname === '/' : pathname === e.href || pathname.startsWith(`${e.href}/`)
    if (matches && (!best || e.href.length > best.href.length)) best = e
  }
  return best
}

type NavItem = { kind: 'link'; entry: NavEntry } | { kind: 'portfolio'; entries: NavEntry[] }

/** A portfolio section's place on the Portfolio page, so every menu lists them the same way. */
const sectionRank = (href: string) => {
  const i = (PORTFOLIO_SECTIONS as readonly string[]).indexOf(href.split('/')[2] ?? '')
  return i < 0 ? PORTFOLIO_SECTIONS.length : i
}

/**
 * Entries in order, minus Home (the logo links home), with every portfolio
 * section collapsed into one item where the first of them sits. The sections
 * follow the Portfolio page's order, as the breadcrumb tabs do.
 */
function groupPortfolio(entries: NavEntry[], portfolioHref: string): NavItem[] {
  const items: NavItem[] = []
  let group: NavEntry[] | undefined
  for (const e of [...entries].sort((a, b) => a.cell - b.cell)) {
    if (e.href === '/') continue
    if (e.href.startsWith(`${portfolioHref}/`)) {
      if (!group) items.push({ kind: 'portfolio', entries: (group = []) })
      group.push(e)
    } else items.push({ kind: 'link', entry: e })
  }
  group?.sort((a, b) => sectionRank(a.href) - sectionRank(b.href))
  return items
}

/** Closes a popover on Escape (returning focus to its button) or on a click outside it. */
function useDismiss(open: boolean, close: () => void, wrapRef: React.RefObject<HTMLElement | null>, buttonRef: React.RefObject<HTMLButtonElement | null>) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        returnFocus(buttonRef.current)
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
  }, [open, close, wrapRef, buttonRef])
}

/**
 * Split button: "Portfolio" is a real link to the landing page; the chevron
 * beside it is a separate button that discloses the sections. No hover-open,
 * so it never flickers as the pointer crosses the nav.
 */
function PortfolioNav({ label, href, sections, current }: { label: string; href: string; sections: NavEntry[]; current?: NavEntry }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inPortfolio = pathname === href || pathname.startsWith(`${href}/`)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, wrapRef, buttonRef)

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
        className="hover:text-primary hover:bg-surface rounded-ui -my-2 -mr-2 flex size-9 items-center justify-center transition-colors"
      >
        <ChevronDown aria-hidden className={cn('size-5 transition-transform', open && 'rotate-180')} />
      </button>
      {/* Always rendered so it can roll back up; closed, it's hidden (no focus, no reading). See .menu-blind. */}
      <ul id={menuId} data-open={open} className="menu-blind bg-background border-border rounded-ui absolute top-full left-0 z-50 mt-3 min-w-48 border p-[3px] shadow-lg">
          {sections.map((e) => (
            <li key={e._key}>
              <TransitionLink
                href={e.href}
                onNavigate={close}
                aria-current={current?._key === e._key ? 'page' : undefined}
                className={cn(
                  'hover:bg-surface hover:text-primary rounded-ui-inner block px-3 py-2 whitespace-nowrap',
                  current?._key === e._key && 'text-primary',
                )}
              >
                {e.label}
              </TransitionLink>
            </li>
          ))}
      </ul>
    </div>
  )
}

/** The phone and tablet menu: every page in order, with the portfolio sections under Portfolio. */
function MobileMenu({ items, portfolio, current }: { items: NavItem[]; portfolio: { label: string; href: string }; current?: NavEntry }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, wrapRef, buttonRef)
  const Icon = open ? X : Menu

  const link = (href: string, label: string, here: boolean, sub = false) => (
    <TransitionLink
      href={href}
      onNavigate={close}
      aria-current={here ? 'page' : undefined}
      className={cn(
        'hover:bg-surface hover:text-primary rounded-ui-inner block px-3 py-2.5',
        sub && 'text-muted-foreground pl-7 text-sm',
        here && 'text-primary',
      )}
    >
      {label}
    </TransitionLink>
  )

  return (
    <div ref={wrapRef} className="relative lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        // a11y-only name; the button shows an icon.
        aria-label="Menu"
        onClick={() => setOpen((o) => !o)}
        className="border-border hover:border-primary hover:text-primary rounded-ui flex size-10 items-center justify-center border transition-colors"
      >
        <Icon aria-hidden className="size-5" />
      </button>
      {/* Always rendered so it can roll back up (see .menu-blind). */}
      <ul
          id={panelId}
          data-open={open}
          className="menu-blind bg-background border-border rounded-ui absolute top-full right-0 z-50 mt-3 w-[min(18rem,calc(100vw-2rem))] border p-[3px] font-medium shadow-xl"
        >
          {items.map((item) =>
            item.kind === 'portfolio' ? (
              <li key="portfolio">
                {link(portfolio.href, portfolio.label, pathname === portfolio.href)}
                <ul>
                  {item.entries.map((e) => (
                    <li key={e._key}>{link(e.href, e.label, current?._key === e._key, true)}</li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={item.entry._key}>{link(item.entry.href, item.entry.label, current?._key === item.entry._key)}</li>
            ),
          )}
      </ul>
    </div>
  )
}

export function SiteNav({
  entries,
  label,
  portfolio,
}: {
  entries: NavEntry[]
  /** The navigation landmark's name for assistive tech. */
  label: string
  /** Entries under this path are grouped behind one "Portfolio" item. */
  portfolio: { label: string; href: string }
}) {
  const pathname = usePathname()
  const items = groupPortfolio(entries, portfolio.href)
  const current = entryForPath(pathname, entries)

  return (
    <nav aria-label={label}>
      <ul className="hidden items-center gap-5 text-sm font-medium lg:flex">
        {items.map((item) =>
          item.kind === 'portfolio' ? (
            <li key="portfolio">
              <PortfolioNav label={portfolio.label} href={portfolio.href} sections={item.entries} current={current} />
            </li>
          ) : (
            <li key={item.entry._key}>
              <TransitionLink
                href={item.entry.href}
                aria-current={current?._key === item.entry._key ? 'page' : undefined}
                className={cn('hover:text-primary', current?._key === item.entry._key && 'text-primary')}
              >
                {item.entry.label}
              </TransitionLink>
            </li>
          ),
        )}
      </ul>
      <MobileMenu items={items} portfolio={portfolio} current={current} />
    </nav>
  )
}
