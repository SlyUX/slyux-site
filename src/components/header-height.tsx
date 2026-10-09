'use client'

import { useEffect } from 'react'

/**
 * Publishes the sticky header's height as --header-h (globals.css has the
 * built default), so jump links and sticky headings sit below the header
 * even if its height changes, e.g. a different logo size.
 */
export function HeaderHeight() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]')
    if (!header) return
    const observer = new ResizeObserver(([entry]) =>
      document.documentElement.style.setProperty('--header-h', `${Math.round(entry.borderBoxSize[0].blockSize)}px`),
    )
    observer.observe(header)
    return () => observer.disconnect()
  }, [])
  return null
}
