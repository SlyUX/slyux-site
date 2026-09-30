'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface GalleryLabels {
  fullPage: string
  enlarge: string
  close: string
  previous: string
  next: string
}

/** Minimum horizontal travel, in px, for a swipe to count. */
const SWIPE = 60

/**
 * State for a viewer that steps through `count` items: which one is showing,
 * whether it's open, and ← / → while it is. Shared by the gallery and the PDF
 * reader so they behave identically.
 */
export function useViewer(count: number) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  /** Wraps the controls and the item: what goes fullscreen (a <dialog> can't). */
  const frameRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const openAt = (i: number) => {
    setIndex(i)
    setIsOpen(true)
    dialogRef.current?.showModal()
    dialogRef.current?.scrollTo({ top: 0 })
  }
  const go = (delta: number) => {
    const next = index + delta
    if (next < 0 || next >= count) return
    // Reaching an end disables that button; if it had focus, focus would fall
    // to <body>. Hand it to the opposite button instead.
    const active = document.activeElement
    if (next === count - 1 && active === nextRef.current) prevRef.current?.focus()
    if (next === 0 && active === prevRef.current) nextRef.current?.focus()
    setIndex(next)
    dialogRef.current?.scrollTo({ top: 0 })
  }
  const close = () => dialogRef.current?.close()

  // ← / → while the viewer is open, wherever focus sits inside it.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // Re-bound per item so the listener always steps from the current one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, index])

  return { dialogRef, prevRef, nextRef, frameRef, index, isOpen, setIsOpen, openAt, go, close, count }
}

export type Viewer = ReturnType<typeof useViewer>

/**
 * The viewer itself: a native <dialog> (showModal), so Escape closes it,
 * focus moves in, and the page behind is inert. The dialog is the scroll
 * container — one scroll, never a scroll inside a scroll. A horizontal swipe
 * or the buttons step through items; vertical scrolling is left alone.
 * `children` renders only while open, so only the current item loads.
 */
export function ViewerDialog({
  viewer,
  label,
  counter,
  srText,
  actions,
  labels,
  onClosed,
  children,
}: {
  viewer: Viewer
  /** Accessible name for the dialog. */
  label: string
  /** The visible counter, e.g. "3 / 12 · Home". */
  counter: React.ReactNode
  /** Extra screen-reader detail announced with the counter. */
  srText?: string
  /** Buttons shown before previous / next. */
  actions?: React.ReactNode
  labels: Pick<GalleryLabels, 'close' | 'previous' | 'next'>
  /** Runs after closing, e.g. to return focus to the thumbnail. */
  onClosed: (index: number) => void
  children: React.ReactNode
}) {
  const { dialogRef, prevRef, nextRef, frameRef, index, isOpen, setIsOpen, go, close, count } = viewer
  const touch = useRef<{ x: number; y: number } | null>(null)

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={() => {
        setIsOpen(false)
        onClosed(index)
      }}
      onTouchStart={(e) => {
        // One finger only: a pinch to zoom in on the item must never turn it.
        touch.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
      }}
      onTouchEnd={(e) => {
        if (!touch.current) return
        const dx = e.changedTouches[0].clientX - touch.current.x
        const dy = e.changedTouches[0].clientY - touch.current.y
        touch.current = null
        // Horizontal and deliberate only — vertical drags are the page scrolling.
        if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
      }}
      // Clicking the dim area around the item closes; clicks on the item don't.
      onClick={(e) => (e.target === e.currentTarget || e.target === frameRef.current) && close()}
      className="backdrop:bg-ink/85 m-0 h-full max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-transparent p-0"
    >
      {/* Scrolls only when fullscreen; otherwise the dialog is the one scroll container. */}
      <div ref={frameRef} className="min-h-full [&:fullscreen]:bg-ink [&:fullscreen]:overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-3 sm:p-4">
        <p aria-live="polite" className="bg-background text-foreground min-w-0 truncate rounded-full px-4 py-2 text-sm font-semibold tabular-nums shadow-lg">
          {counter}
          {srText && <span className="sr-only">: {srText}</span>}
        </p>
        <div className="flex shrink-0 gap-2">
          {actions}
          {count > 1 && (
            <>
              <button
                ref={prevRef}
                type="button"
                onClick={() => go(-1)}
                disabled={index === 0}
                aria-label={labels.previous}
                className="bg-background text-foreground hover:text-primary flex size-10 items-center justify-center rounded-full shadow-lg disabled:opacity-40"
              >
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <button
                ref={nextRef}
                type="button"
                onClick={() => go(1)}
                disabled={index === count - 1}
                aria-label={labels.next}
                className="bg-background text-foreground hover:text-primary flex size-10 items-center justify-center rounded-full shadow-lg disabled:opacity-40"
              >
                <ChevronRight aria-hidden className="size-5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="bg-background text-foreground hover:text-primary inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold shadow-lg sm:px-4"
          >
            <X aria-hidden className="size-4" />
            {/* Icon only on phones, where the counter needs the room. */}
            <span aria-hidden className="hidden sm:inline">
              {labels.close}
            </span>
          </button>
        </div>
      </div>
      {isOpen && children}
      </div>
    </dialog>
  )
}
