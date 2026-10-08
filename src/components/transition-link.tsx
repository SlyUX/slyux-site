'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * The site's one navigation motion: a blind, drawn over the page you're on.
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

type Motion = 'blind-rise' | 'blind-lower' | 'blind-across' | 'none'

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
