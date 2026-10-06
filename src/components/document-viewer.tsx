'use client'

import { useRef, useSyncExternalStore } from 'react'
import { Download, Maximize, Minimize } from 'lucide-react'

import { useViewer, ViewerDialog, ViewerStage, type GalleryLabels } from '@/components/viewer'

export interface DocumentPage {
  key: string
  src: string
  width: number
  height: number
}

export interface DocumentLabels extends Pick<GalleryLabels, 'close' | 'previous' | 'next'> {
  /** e.g. "Page {page} of {pages}". */
  counter: string
  download: string
  fullscreen: string
  exitFullscreen: string
}

const noSubscribe = () => () => {}
const onFullscreenChange = (cb: () => void) => {
  document.addEventListener('fullscreenchange', cb)
  return () => document.removeEventListener('fullscreenchange', cb)
}

const pill =
  'bg-background text-foreground hover:text-primary inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold shadow-lg sm:px-4'

/**
 * A PDF as a page-at-a-time reader: the trigger (a document thumbnail, or a
 * tile's title) opens the shared viewer at page 1. Each page is fitted to the
 * screen; ← / →, swipe, and the buttons turn pages, and the next page is
 * fetched ahead so turning is instant. The original PDF is a download, and
 * the reader can go fullscreen where the browser allows it (not iPhone).
 */
export function DocumentViewer({
  title,
  pages,
  downloadHref,
  labels,
  triggerLabel,
  className,
  children,
}: {
  title: string
  pages: DocumentPage[]
  downloadHref?: string
  labels: DocumentLabels
  /** Accessible name for the trigger, e.g. "Brand manual (PDF, 13 pages)". */
  triggerLabel: string
  className?: string
  children: React.ReactNode
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const viewer = useViewer(pages.length)
  const { index, openAt, frameRef } = viewer
  const page = pages[index]
  const next = pages[index + 1]
  const counterFor = (i: number) => labels.counter.replace('{page}', String(i + 1)).replace('{pages}', String(pages.length))
  const counter = counterFor(index)

  const canFullscreen = useSyncExternalStore(noSubscribe, () => document.fullscreenEnabled, () => false)
  const isFullscreen = useSyncExternalStore(onFullscreenChange, () => !!document.fullscreenElement, () => false)
  const toggleFullscreen = () =>
    isFullscreen ? void document.exitFullscreen() : void frameRef.current?.requestFullscreen()

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => openAt(0)} aria-label={triggerLabel} className={className}>
        {children}
      </button>
      <ViewerDialog
        viewer={viewer}
        label={title}
        counter={
          <>
            {counter}
            <span aria-hidden className="hidden sm:inline"> · {title}</span>
          </>
        }
        srText={title}
        labels={labels}
        onClosed={() => {
          if (document.fullscreenElement) void document.exitFullscreen()
          triggerRef.current?.focus()
        }}
        actions={
          <>
            {downloadHref && (
              <a href={downloadHref} download aria-label={labels.download} className={pill}>
                <Download aria-hidden className="size-4" />
                <span aria-hidden className="hidden sm:inline">
                  {labels.download}
                </span>
              </a>
            )}
            {canFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
                className="bg-background text-foreground hover:text-primary flex size-10 items-center justify-center rounded-full shadow-lg"
              >
                {isFullscreen ? <Minimize aria-hidden className="size-4" /> : <Maximize aria-hidden className="size-4" />}
              </button>
            )}
          </>
        }
      >
        {page && (
          <div
            // The dim space around the page closes the reader, as elsewhere.
            onClick={(e) => e.target === e.currentTarget && viewer.close()}
            className="flex min-h-[calc(100svh-4.5rem)] items-center justify-center px-4 pb-6 sm:px-6"
          >
            <ViewerStage
              index={index}
              render={(i, leaving) => (
                // Plain <img>: page images are pre-sized by Sanity; fitted to the screen, not the width.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  onClick={(e) => e.stopPropagation()}
                  src={pages[i].src}
                  alt={leaving ? '' : `${title}, ${counterFor(i)}`}
                  width={pages[i].width}
                  height={pages[i].height}
                  decoding="async"
                  className="h-auto max-h-[calc(100svh-5.5rem)] w-auto max-w-full rounded-lg bg-paper shadow-2xl"
                />
              )}
            />
            {/* Fetch the next page ahead so turning to it is instant. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {next && <img src={next.src} alt="" hidden />}
          </div>
        )}
      </ViewerDialog>
    </>
  )
}
