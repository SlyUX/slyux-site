'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { Maximize2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useViewer, ViewerDialog, ViewerStage, type GalleryLabels } from '@/components/viewer'

export type { GalleryLabels }

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

/**
 * A gallery's thumbnails plus one viewer for all of them (see ViewerDialog:
 * ← / →, swipe, Escape; only the current item's image loads).
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
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  const viewer = useViewer(items.length)
  const { index, openAt } = viewer
  const phone = layout === 'phone'
  const item = items[index]

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
                  'bg-paper border-border group-hover:border-primary h-auto w-full border transition-colors',
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
        onClosed={(i) => thumbRefs.current[i]?.focus()}
      >
        <ViewerStage
          index={index}
          render={(i, leaving) => {
            const it = items[i]
            return (
              <div
                onClick={(e) => e.stopPropagation()}
                // Never wider than the image's real resolution allows, nor the content width.
                style={{ width: it.view.displayWidth }}
                className="mx-auto mb-10 box-content max-w-[calc(100%-2rem)] px-4 sm:max-w-[calc(100%-3rem)] sm:px-6 lg:max-w-6xl"
              >
                <div className="bg-paper overflow-hidden rounded-xl shadow-2xl">
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
