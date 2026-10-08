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

type Open = (pieceKey: string, at?: number) => void

const LightboxContext = createContext<{ open: Open; buttons: Map<string, HTMLButtonElement> } | null>(null)

/**
 * Cards that don't link anywhere open their artwork here, larger. Each card is
 * its own gallery: ← / → (and swipe) step through that piece's images only, so
 * a campaign's six images stay together and a single ad shows on its own, with
 * no arrows. Images are fitted to the screen on white, so transparent artwork
 * reads as it does on its card.
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
  // The piece whose card opened the viewer; only its images are shown.
  const [pieceKey, setPieceKey] = useState<string | null>(null)
  const shown = pieceKey ? items.filter((it) => it.pieceKey === pieceKey) : []
  const viewer = useViewer(shown.length)
  const { index, openAt } = viewer
  const item = shown[index]
  // Each card's button, so closing returns focus to the piece last shown.
  // One Map for the component's life; buttons add and remove themselves.
  const [buttons] = useState(() => new Map<string, HTMLButtonElement>())

  const open: Open = (key, at = 0) => {
    if (!items.some((it) => it.pieceKey === key)) return
    setPieceKey(key)
    openAt(at)
  }

  return (
    <LightboxContext value={items.length ? { open, buttons } : null}>
      {children}
      {items.length > 0 && (
        <ViewerDialog
          viewer={viewer}
          label={item?.title ?? ''}
          counter={
            // The count only when the piece has more than one image.
            <>
              {shown.length > 1 && `${index + 1} / ${shown.length}`}
              {item && <span aria-hidden>{shown.length > 1 && ' · '}{item.title}</span>}
            </>
          }
          // The title alone when the image has no description of its own.
          srText={item && (item.alt === item.title ? item.title : `${item.title} — ${item.alt}`)}
          labels={labels}
          // Back to the thumbnail of the image last shown, or the card that opened the piece.
          onClosed={(i) => pieceKey && (buttons.get(`${pieceKey}#${i}`) ?? buttons.get(`${pieceKey}#0`))?.focus()}
        >
          <div
            // The dim space around the image closes the lightbox, as elsewhere.
            onClick={(e) => e.target === e.currentTarget && viewer.close()}
            className="flex min-h-[calc(100svh-4.5rem)] items-center justify-center px-4 pb-6 sm:px-6"
          >
            <ViewerStage
              // A fresh stage per piece, so opening one never animates out of another's image.
              key={pieceKey ?? ''}
              index={index}
              render={(i, leaving) =>
                shown[i] && (
                // Plain <img>: pre-sized by Sanity, and fitted to the screen rather than the width.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  onClick={(e) => e.stopPropagation()}
                  src={shown[i].src}
                  alt={leaving ? '' : shown[i].alt}
                  width={shown[i].width}
                  height={shown[i].height}
                  decoding="async"
                  className="bg-paper h-auto max-h-[calc(100svh-5.5rem)] w-auto max-w-full rounded-ui shadow-2xl"
                />
                )
              }
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
  at,
  label,
  className,
  children,
}: {
  pieceKey: string
  /** Which of the piece's images to open at; a gallery's thumbnails each open at their own. */
  at?: number
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
        if (el) lightbox.buttons.set(`${pieceKey}#${at ?? 0}`, el)
        else lightbox.buttons.delete(`${pieceKey}#${at ?? 0}`)
      }}
      type="button"
      aria-label={label}
      onClick={() => lightbox.open(pieceKey, at)}
      className={className}
    >
      {children}
    </button>
  )
}
