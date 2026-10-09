'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Phones only: below this the header hides while scrolling down. */
const PHONE = '(max-width: 767px)'
/** Scroll travel, in px, before the header reacts: no flicker on small nudges. */
const DOWN_PX = 12
const UP_PX = 6

/**
 * The sticky header's two behaviors:
 *  - Publishes its height as --header-h (globals.css has the built default),
 *    so jump links and sticky headings sit below it even if it changes.
 *  - On phones, it slides up out of view while you scroll down and comes back
 *    as soon as you scroll up (data-hidden; the slide is CSS). It stays put
 *    near the top of the page and while its menu is open; keyboard focus
 *    inside it shows it too (:focus-within, in CSS).
 */
export function HeaderHeight() {
  const pathname = usePathname()

  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]')
    if (!header) return
    const observer = new ResizeObserver(([entry]) =>
      document.documentElement.style.setProperty('--header-h', `${Math.round(entry.borderBoxSize[0].blockSize)}px`),
    )
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]')
    if (!header) return
    const phone = window.matchMedia(PHONE)
    let anchor = window.scrollY
    let frame = 0
    const show = () => delete header.dataset.hidden

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = window.scrollY
        const menuOpen = !!header.querySelector('[aria-expanded="true"]')
        if (!phone.matches || menuOpen || y <= header.offsetHeight) {
          show()
          anchor = y
        } else if (y - anchor > DOWN_PX) {
          header.dataset.hidden = 'true'
          anchor = y
        } else if (anchor - y > UP_PX) {
          show()
          anchor = y
        } else if (header.dataset.hidden ? y > anchor : y < anchor) {
          // Still travelling the same way: move the anchor with it.
          anchor = y
        }
      })
    }

    show() // A new page starts at the top, header showing.
    window.addEventListener('scroll', onScroll, { passive: true })
    phone.addEventListener('change', show)
    return () => {
      window.removeEventListener('scroll', onScroll)
      phone.removeEventListener('change', show)
      cancelAnimationFrame(frame)
    }
  }, [pathname])

  return null
}
