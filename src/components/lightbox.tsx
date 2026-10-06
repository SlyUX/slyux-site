'use client'

import { createContext, useContext, useState } from 'react'

import { useViewer, ViewerDialog, ViewerStage, type GalleryLabels } from '@/components/viewer'

export interface LightboxItem {
  key: string
  /** The piece the image belongs to; its card opens the lightbox here. */
  pieceKey: string
  title: string
  alt: string
  src: string
  width: number
  height: number
}

type Open = (pieceKey: string) => void

const LightboxContext = createContext<{ open: Open; buttons: Map<string, HTMLButtonElement> } | null>(null)

/**
 * Cards that don't link anywhere open their artwork here, larger: one viewer
 * for a whole group of cards, so ← / → (and swipe) step from piece to piece,
 * through each piece's extra images. Images are fitted to the screen on white,
 * so transparent artwork reads as it does on its card.
 */
export function Lightbox({
  items,
  labels,
  children,
}: {
  items: LightboxItem[]
  labels: Pick<GalleryLabels, 'close' | 'previous' | 'next'>
  children: React.ReactNode
}) {
  const viewer = useViewer(items.length)
  const { index, openAt } = viewer
  const item = items[index]
  // Each card's button, so closing returns focus to the piece last shown.
  // One Map for the component's life; buttons add and remove themselves.
  const [buttons] = useState(() => new Map<string, HTMLButtonElement>())

  const open: Open = (pieceKey) => {
    const i = items.findIndex((it) => it.pieceKey === pieceKey)
    if (i >= 0) openAt(i)
  }

  return (
    <LightboxContext value={items.length ? { open, buttons } : null}>
      {children}
      {items.length > 0 && (
        <ViewerDialog
          viewer={viewer}
          label={item?.title ?? ''}
          counter={
            <>
              {index + 1} / {items.length}
              {item && <span aria-hidden> · {item.title}</span>}
            </>
          }
          // The title alone when the image has no description of its own.
          srText={item && (item.alt === item.title ? item.title : `${item.title} — ${item.alt}`)}
          labels={labels}
          onClosed={(i) => buttons.get(items[i].pieceKey)?.focus()}
        >
          <div
            // The dim space around the image closes the lightbox, as elsewhere.
            onClick={(e) => e.target === e.currentTarget && viewer.close()}
            className="flex min-h-[calc(100svh-4.5rem)] items-center justify-center px-4 pb-6 sm:px-6"
          >
            <ViewerStage
              index={index}
              render={(i, leaving) => (
                // Plain <img>: pre-sized by Sanity, and fitted to the screen rather than the width.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  onClick={(e) => e.stopPropagation()}
                  src={items[i].src}
                  alt={leaving ? '' : items[i].alt}
                  width={items[i].width}
                  height={items[i].height}
                  decoding="async"
                  className="bg-paper h-auto max-h-[calc(100svh-5.5rem)] w-auto max-w-full rounded-lg shadow-2xl"
                />
              )}
            />
          </div>
        </ViewerDialog>
      )}
    </LightboxContext>
  )
}

/**
 * The card's title as the button that opens its artwork larger. Its
 * `after:` layer stretches over the card, so the whole card is the target.
 * Outside a Lightbox (or with nothing to show) it's plain text.
 */
export function LightboxButton({
  pieceKey,
  label,
  className,
  children,
}: {
  pieceKey: string
  /** Accessible name, e.g. "View larger: Wheelhouse Marketing". */
  label: string
  className?: string
  children: React.ReactNode
}) {
  const lightbox = useContext(LightboxContext)
  if (!lightbox) return <>{children}</>
  return (
    <button
      ref={(el) => {
        if (el) lightbox.buttons.set(pieceKey, el)
        else lightbox.buttons.delete(pieceKey)
      }}
      type="button"
      aria-label={label}
      onClick={() => lightbox.open(pieceKey)}
      className={className}
    >
      {children}
    </button>
  )
}
