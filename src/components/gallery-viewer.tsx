'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ViewSlice {
  src: string
  width: number
  height: number
}

export interface GalleryItem {
  key: string
  alt: string
  caption?: string | null
  /** True when the viewer shows a full-length capture rather than the thumbnail's image. */
  fullPage: boolean
  thumb: { src: string; width: number; height: number }
  /** What the viewer shows: one slice for a plain image, several for a tall page. */
  view: { slices: ViewSlice[]; narrow: boolean; displayWidth: number }
}

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
 * A gallery's thumbnails plus one viewer for all of them.
 *
 * The viewer is a native <dialog> (showModal): Escape closes it, focus moves
 * in, and the page behind is inert. The dialog is the scroll container — one
 * scroll, never a scroll inside a scroll. Within it, ← / → (or a horizontal
 * swipe, or the buttons) step through the gallery; vertical scrolling is left
 * alone. Only the current item's image is loaded.
 */
export function GalleryViewer({
  items,
  layout,
  rail = false,
  labels,
}: {
  items: GalleryItem[]
  layout: 'phone' | 'wide'
  /** Compact thumbnails for the side rail. */
  rail?: boolean
  labels: GalleryLabels
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  const touch = useRef<{ x: number; y: number } | null>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const [index, setIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const phone = layout === 'phone'
  const item = items[index]

  const openAt = (i: number) => {
    setIndex(i)
    setIsOpen(true)
    dialogRef.current?.showModal()
    dialogRef.current?.scrollTo({ top: 0 })
  }
  const go = (delta: number) => {
    const next = index + delta
    if (next < 0 || next >= items.length) return
    // Reaching an end disables that button; if it had focus, focus would fall
    // to <body>. Hand it to the opposite button instead.
    const active = document.activeElement
    if (next === items.length - 1 && active === nextRef.current) prevRef.current?.focus()
    if (next === 0 && active === prevRef.current) nextRef.current?.focus()
    setIndex(next)
    dialogRef.current?.scrollTo({ top: 0 })
  }

  // ← / → while the viewer is open, wherever focus sits inside it.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // Re-bound per image so the listener always steps from the current one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, index])
  const close = () => dialogRef.current?.close()

  return (
    <>
      <div
        className={cn(
          rail
            ? phone
              ? 'grid grid-cols-2 gap-3'
              : 'space-y-4'
            : phone
              ? 'grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5'
              : // Row-by-row (not masonry) so items read left→right in list order.
                'grid items-start gap-x-6 gap-y-8 md:grid-cols-2',
        )}
      >
        {items.map((it, i) => (
          // One card, one click target: image, caption label, and the full-page cue.
          <div key={it.key}>
            <button
              ref={(el) => {
                thumbRefs.current[i] = el
              }}
              type="button"
              onClick={() => openAt(i)}
              aria-label={`${it.fullPage ? labels.fullPage : labels.enlarge}: ${it.caption ? `${it.caption} — ` : ''}${it.alt}`}
              className="group block w-full text-left"
            >
              <Image
                src={it.thumb.src}
                alt=""
                width={it.thumb.width}
                height={it.thumb.height}
                sizes={
                  rail
                    ? phone
                      ? '(max-width: 1024px) 50vw, 140px'
                      : '(max-width: 1024px) 100vw, 300px'
                    : phone
                      ? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw'
                      : '(max-width: 768px) 100vw, 50vw'
                }
                className={cn(
                  'border-border group-hover:border-primary h-auto w-full border transition-colors',
                  phone ? (rail ? 'rounded-xl shadow-sm' : 'rounded-[1.25rem] shadow-sm') : 'rounded-xl',
                )}
              />
              {it.caption && (
                <span aria-hidden className={cn('text-foreground mt-2 block font-semibold', rail ? 'text-xs' : 'text-sm')}>
                  {it.caption}
                </span>
              )}
              {it.fullPage && (
                <span
                  aria-hidden
                  className={cn(
                    'text-primary group-hover:text-foreground inline-flex items-center gap-1.5 font-semibold',
                    it.caption ? 'mt-1' : 'mt-2',
                    rail ? 'text-xs' : 'text-sm',
                  )}
                >
                  <Maximize2 className="size-3.5" />
                  {labels.fullPage}
                </span>
              )}
            </button>
          </div>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-label={item?.alt}
        onClose={() => {
          setIsOpen(false)
          thumbRefs.current[index]?.focus()
        }}
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }}
        onTouchEnd={(e) => {
          if (!touch.current) return
          const dx = e.changedTouches[0].clientX - touch.current.x
          const dy = e.changedTouches[0].clientY - touch.current.y
          touch.current = null
          // Horizontal and deliberate only — vertical drags are the page scrolling.
          if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
        }}
        // Clicking the dim area around the image closes; clicks on the image don't.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="backdrop:bg-ink/85 m-0 h-full max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-transparent p-0"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-3 sm:p-4">
          <p aria-live="polite" className="bg-background text-foreground rounded-full px-4 py-2 text-sm font-semibold tabular-nums shadow-lg">
            {index + 1} / {items.length}
            {item?.caption && <span aria-hidden> · {item.caption}</span>}
            <span className="sr-only">: {item?.caption ? `${item.caption} — ` : ''}{item?.alt}</span>
          </p>
          <div className="flex gap-2">
            {items.length > 1 && (
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
                  disabled={index === items.length - 1}
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
              className="bg-background text-foreground hover:text-primary inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-lg"
            >
              <X aria-hidden className="size-4" />
              {labels.close}
            </button>
          </div>
        </div>
        {isOpen && item && (
          <div
            onClick={(e) => e.stopPropagation()}
            // Never wider than the image's real resolution allows, nor the content width.
            style={{ width: item.view.displayWidth }}
            className="mx-auto mb-10 box-content max-w-[calc(100%-2rem)] px-4 sm:max-w-[calc(100%-3rem)] sm:px-6 lg:max-w-6xl"
          >
            <div className="overflow-hidden rounded-xl shadow-2xl">
              {item.view.slices.map((slice, i) => (
                // Plain <img>: slices are pre-sized by Sanity and must stack with no gaps.
                // A tall page is one image split for delivery, so only the first carries alt text.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={slice.src}
                  src={slice.src}
                  alt={i === 0 ? item.alt : ''}
                  width={slice.width}
                  height={slice.height}
                  decoding="async"
                  className="block h-auto w-full"
                />
              ))}
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
