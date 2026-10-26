'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { Maximize2, Smartphone } from 'lucide-react'

import { cn } from '@/lib/utils'
import { preloadImage } from '@/components/blind-dialog'
import { PrototypeDialog, type PrototypeLabels } from '@/components/prototype-viewer'
import { returnFocus } from '@/components/return-focus'
import { buttonVariants } from '@/components/ui'
import { useViewer, ViewerDialog, ViewerStage, type GalleryLabels } from '@/components/viewer'
import type { PrototypeView } from '@/lib/prototype'

export type { GalleryLabels }

export interface ViewSlice {
  src: string
  width: number
  height: number
}

export interface GalleryItem {
  key: string
  /** The Sanity image behind it, to match prototype screens. */
  assetRef?: string
  /** The prototype screen this image is, when the case study has a prototype. */
  screen?: number
  alt: string
  caption?: string | null
  /** True when the viewer shows a full-length capture rather than the thumbnail's image. */
  fullPage: boolean
  thumb: { src: string; width: number; height: number }
  /** What the viewer shows: one slice for a plain image, several for a tall page. */
  view: { slices: ViewSlice[]; narrow: boolean; displayWidth: number }
}

/**
 * A gallery's thumbnails plus one viewer for all of them (see ViewerDialog:
 * ← / →, swipe, Escape; only the current item's image loads). With a
 * prototype, its screens open the prototype instead, at that screen, and a
 * "Try the prototype" button starts it from the beginning.
 */
export function GalleryViewer({
  items,
  layout,
  rail = false,
  labels,
  prototype,
  prototypeLabels,
}: {
  items: GalleryItem[]
  layout: 'phone' | 'wide'
  /** Compact thumbnails for the side rail. */
  rail?: boolean
  labels: GalleryLabels
  prototype?: PrototypeView
  prototypeLabels?: PrototypeLabels
}) {
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  const viewer = useViewer(items.length)
  const proto = useViewer(prototype?.screens.length ?? 0)
  /** What opened the prototype (a thumbnail or the button), to hand focus back on close. */
  const protoOpener = useRef<HTMLElement | null>(null)
  const playable = prototype && prototypeLabels ? { prototype, labels: prototypeLabels } : undefined
  /** The prototype screen a thumbnail opens, if it opens the prototype. */
  const screenSrc = (it: GalleryItem) => (playable && it.screen !== undefined ? playable.prototype.screens[it.screen]?.image.src : undefined)
  const { index, openAt } = viewer
  const phone = layout === 'phone'
  const item = items[index]
  // On phones, a desktop gallery of two or more becomes one swipe row, the next
  // capture peeking in, instead of a tall stack. Wider screens keep the grid.
  const swipe = !rail && !phone && items.length > 1

  return (
    <>
      {playable && (
        <button
          type="button"
          onClick={(e) => {
            protoOpener.current = e.currentTarget
            proto.openAt(0)
          }}
          onPointerEnter={() => preloadImage(playable.prototype.screens[0]?.image.src)}
          className={cn(buttonVariants({ variant: 'secondary' }), 'mb-8')}
        >
          <Smartphone aria-hidden className="size-4" />
          {playable.labels.open}
        </button>
      )}
      <div
        className={cn(
          rail
            ? phone
              ? 'grid grid-cols-2 gap-3'
              : 'space-y-4'
            : phone
              ? 'grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5'
              : swipe
                ? // Phones: a snap-scrolling row bleeding to the screen edges. md+: the two-column grid.
                  '-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:items-start md:gap-x-6 md:gap-y-8 md:overflow-visible md:px-0 md:pb-0'
                : // Row-by-row (not masonry) so items read left→right in list order.
                  'grid items-start gap-x-6 gap-y-8 md:grid-cols-2',
        )}
      >
        {items.map((it, i) => (
          // One card, one click target: image, caption label, and the full-page cue.
          <div key={it.key} className={swipe ? 'w-[85%] shrink-0 snap-start md:w-auto' : undefined}>
            <button
              ref={(el) => {
                thumbRefs.current[i] = el
              }}
              type="button"
              onClick={(e) => {
                if (playable && it.screen !== undefined) {
                  protoOpener.current = e.currentTarget
                  proto.openAt(it.screen)
                } else openAt(i)
              }}
              // Loads what the viewer will show first on hover or focus, ahead of its slide.
              onPointerEnter={() => preloadImage(screenSrc(it) ?? it.view.slices[0]?.src)}
              onFocus={() => preloadImage(screenSrc(it) ?? it.view.slices[0]?.src)}
              aria-label={`${playable && it.screen !== undefined ? playable.labels.open : it.fullPage ? labels.fullPage : labels.enlarge}: ${it.caption ? `${it.caption} — ` : ''}${it.alt}`}
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
                  'bg-paper border-border group-hover:border-primary h-auto w-full border transition-colors',
                  phone ? (rail ? 'rounded-xl shadow-sm' : 'rounded-[1.25rem] shadow-sm') : 'rounded-ui',
                )}
              />
              {it.caption && (
                <span aria-hidden className={cn('text-foreground mt-2 block font-semibold', rail ? 'text-xs' : 'text-sm')}>
                  {it.caption}
                </span>
              )}
              {playable && it.screen !== undefined ? (
                <span
                  aria-hidden
                  className={cn(
                    'text-primary group-hover:text-foreground inline-flex items-center gap-1.5 font-semibold',
                    it.caption ? 'mt-1' : 'mt-2',
                    rail ? 'text-xs' : 'text-sm',
                  )}
                >
                  <Smartphone className="size-3.5" />
                  {playable.labels.open}
                </span>
              ) : it.fullPage && (
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

      {playable && (
        <PrototypeDialog
          prototype={playable.prototype}
          viewer={proto}
          labels={labels}
          hint={playable.labels.hint}
          onClosed={() => returnFocus(protoOpener.current)}
        />
      )}

      <ViewerDialog
        viewer={viewer}
        label={item?.alt ?? ''}
        counter={
          <>
            {index + 1} / {items.length}
            {item?.caption && <span aria-hidden> · {item.caption}</span>}
          </>
        }
        srText={`${item?.caption ? `${item.caption} — ` : ''}${item?.alt ?? ''}`}
        labels={labels}
        onClosed={(i) => returnFocus(thumbRefs.current[i])}
      >
        <ViewerStage
          index={index}
          render={(i, leaving) => {
            const it = items[i]
            return (
              <div
                // The gutter around the image is backdrop: a click there closes (see ViewerDialog).
                data-viewer-backdrop
                // Never wider than the image's real resolution allows, nor the content width.
                style={{ width: it.view.displayWidth }}
                className="mx-auto mb-10 box-content max-w-[calc(100%-2rem)] px-4 sm:max-w-[calc(100%-3rem)] sm:px-6 lg:max-w-6xl"
              >
                <div className="bg-paper rounded-ui overflow-hidden shadow-2xl">
                  {it.view.slices.map((slice, si) => (
                    // Plain <img>: slices are pre-sized by Sanity and must stack with no gaps.
                    // A tall page is one image split for delivery, so only the first carries alt text.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={slice.src}
                      src={slice.src}
                      alt={si === 0 && !leaving ? it.alt : ''}
                      width={slice.width}
                      height={slice.height}
                      decoding="async"
                      className="block h-auto w-full"
                    />
                  ))}
                </div>
              </div>
            )
          }}
        />
      </ViewerDialog>
    </>
  )
}
