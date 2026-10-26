'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { preloadImage } from '@/components/blind-dialog'
import { HomeIndicator, Keyboard, keyboardHeight, PhoneFrame, pt, StatusBar } from '@/components/phone-frame'
import { ViewerDialog, type GalleryLabels, type Viewer } from '@/components/viewer'
import { PHONE, type PrototypeHotspot, type PrototypeScreen, type PrototypeView } from '@/lib/prototype'
import { cn } from '@/lib/utils'

export interface PrototypeLabels {
  /** "Try the prototype": the gallery button and each screen's cue. */
  open: string
  /** Under the phone: how to find the links. */
  hint: string
}

/** How long a tap outside the links shows them all, as the design tool does. */
const HINT_MS = 900

/**
 * A clickable prototype in the shared viewer: a current iPhone showing one
 * screen at a time. Tap areas move between screens; ← / →, the buttons, or a
 * swipe step through them in order, as in the gallery.
 */
export function PrototypeDialog({
  prototype,
  viewer,
  labels,
  hint,
  onClosed,
}: {
  prototype: PrototypeView
  viewer: Viewer
  labels: Pick<GalleryLabels, 'close' | 'previous' | 'next'>
  hint: string
  onClosed: (index: number) => void
}) {
  const screen = prototype.screens[viewer.index]
  return (
    <ViewerDialog
      viewer={viewer}
      label={prototype.title}
      counter={
        <>
          {viewer.index + 1} / {prototype.screens.length}
          {screen && <span aria-hidden> · {screen.name}</span>}
        </>
      }
      srText={screen ? `${screen.name} — ${screen.alt}` : undefined}
      labels={labels}
      onClosed={onClosed}
    >
      <PrototypeStage prototype={prototype} index={viewer.index} onNavigate={viewer.goTo} hint={hint} />
    </ViewerDialog>
  )
}

function PrototypeStage({ prototype, index, onNavigate, hint }: { prototype: PrototypeView; index: number; onNavigate: (i: number) => void; hint: string }) {
  // The outgoing screen stays underneath until the new one has faded in (the ViewerStage pattern).
  const [shown, setShown] = useState(index)
  const [leaving, setLeaving] = useState<number | null>(null)
  if (index !== shown) {
    setLeaving(shown)
    setShown(index)
  }
  const [hints, setHints] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  /** The screen a tap area just opened: it takes focus as it arrives, so it's announced. */
  const [focusScreen, setFocusScreen] = useState<number | null>(null)
  const screen = prototype.screens[index]

  useEffect(() => () => clearTimeout(timer.current), [])
  // Wherever this screen leads, load it now, so the next screen is ready when it fades in.
  useEffect(() => {
    for (const h of screen?.hotspots ?? []) {
      const next = prototype.screens[h.target]
      preloadImage(next?.full?.src ?? next?.image.src)
    }
  }, [screen, prototype])

  const showHints = () => {
    setHints(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setHints(false), HINT_MS)
  }
  const navigate = (i: number) => {
    setFocusScreen(i)
    setHints(false)
    onNavigate(i)
  }

  return (
    // Around the phone is backdrop: a click there closes, as in any lightbox (see ViewerDialog).
    <div data-viewer-backdrop className="mx-auto mb-10 flex w-full flex-col items-center gap-4 px-4 sm:px-6">
      <PhoneFrame contentHeight={prototype.contentHeight}>
        {leaving !== null && (
          <ScreenLayer key={`out-${leaving}`} screen={prototype.screens[leaving]} contentHeight={prototype.contentHeight} nav={prototype.nav} leaving />
        )}
        {screen && (
          <ScreenLayer
            key={`in-${index}`}
            screen={screen}
            contentHeight={prototype.contentHeight}
            nav={prototype.nav}
            entering={leaving !== null}
            onEntered={() => setLeaving(null)}
            hints={hints}
            onMiss={showHints}
            onNavigate={navigate}
            autoFocus={focusScreen === index}
            onFocused={() => setFocusScreen(null)}
          />
        )}
      </PhoneFrame>
      <p data-viewer-backdrop className="text-ink-foreground/80 text-center text-sm">
        {hint}
      </p>
    </div>
  )
}

function ScreenLayer({
  screen,
  contentHeight,
  nav,
  leaving = false,
  entering = false,
  onEntered,
  hints = false,
  onMiss,
  onNavigate,
  autoFocus = false,
  onFocused,
}: {
  screen: PrototypeScreen
  contentHeight: number
  /** The prototype's floating nav, drawn when this screen asks for it. */
  nav?: PrototypeView['nav']
  leaving?: boolean
  entering?: boolean
  onEntered?: () => void
  hints?: boolean
  onMiss?: () => void
  onNavigate?: (i: number) => void
  /** Take focus on arrival (the screen a tap area opened), then report it. */
  autoFocus?: boolean
  onFocused?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  // With the keyboard up, the screen ends at its top edge.
  const kb = screen.keyboard ? keyboardHeight(screen.keyboard.suggestions.length > 0) : 0
  const visible = contentHeight - kb
  // A full-length screen with the keyboard up opens at its end, as a chat does: the latest message just above the field.
  useLayoutEffect(() => {
    if (kb && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
  }, [kb])
  useEffect(() => {
    if (leaving || !autoFocus) return
    ref.current?.focus({ preventScroll: true })
    onFocused?.()
    // Once, as this screen arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A tap area: a real button, named for screen readers and keyboard users. No box
  // for mouse or touch (the site's link rule) except while the hints flash.
  const hotspot = (h: PrototypeHotspot) => (
    <button
      key={h.key}
      type="button"
      aria-label={h.label}
      title={h.label}
      onClick={(e) => {
        e.stopPropagation()
        onNavigate?.(h.target)
      }}
      className={cn(
        'focus-visible:outline-primary pointer-events-auto absolute cursor-pointer transition-colors focus-visible:outline-2',
        hints && 'bg-primary/20 outline-primary outline-2',
      )}
      style={{ left: pt(h.x), top: pt(h.y), width: pt(h.w), height: pt(h.h), borderRadius: pt(8) }}
    />
  )
  const full = screen.full
  // The tab bar that floats over the app: above the content (which scrolls behind it), under the tab links.
  const floatingNav =
    screen.floatingNav && nav ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={nav.src}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute max-w-none"
        style={{ left: pt(nav.x), top: pt(nav.y), width: pt(nav.w), height: pt(nav.h) }}
      />
    ) : null
  // The pinned bottom (a message field) rides up on the keyboard, its tap areas with it; whatever the keyboard covers is gone.
  const lift = (h: PrototypeHotspot) => (full && kb && h.y >= contentHeight - full.pinnedBottom - 1 ? { ...h, y: h.y - kb } : h)
  const shown = (h: PrototypeHotspot) => h.y < visible
  const scrolling = full ? screen.hotspots.filter((h) => !h.fixed) : screen.hotspots.filter(shown)
  const pinned = full ? screen.hotspots.filter((h) => h.fixed).map(lift).filter(shown) : []

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="group"
      aria-label={screen.name}
      inert={leaving || undefined}
      aria-hidden={leaving || undefined}
      onAnimationEnd={(e) => e.target === e.currentTarget && onEntered?.()}
      className={cn('absolute inset-0 outline-none', leaving ? 'prototype-leaving' : entering && 'prototype-fade-in')}
    >
      {/* Behind the Dynamic Island: the screen's own top color, as iOS draws it. */}
      <div className="absolute inset-x-0 top-0" style={{ height: pt(PHONE.safeTop), background: screen.topColor }} />
      <StatusBar dark={screen.dark} />
      {/* A tap that misses every link flashes them all. */}
      <div className="absolute inset-x-0 overflow-hidden" style={{ top: pt(PHONE.safeTop), height: pt(visible) }} onClick={onMiss}>
        {full ? (
          <>
            <div ref={scroller} className="absolute inset-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="relative" style={{ height: pt(full.height) }}>
                {/* Plain <img>: sized by the phone, not by next/image. Its own header and tab bar are
                    clipped away: the pinned copies below stand in for them, so a bounce past either end
                    shows background, not a second header. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={full.src}
                  alt={screen.alt}
                  draggable={false}
                  className="block w-full"
                  style={{ clipPath: `inset(${pt(full.pinnedTop)} 0 ${pt(full.pinnedBottom)} 0)` }}
                />
                {scrolling.map(hotspot)}
              </div>
            </div>
            {/* The header and tab bar stay put while the screen scrolls: bands cut from the same image. */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" style={{ height: pt(full.pinnedTop) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={full.src} alt="" draggable={false} className="block w-full" />
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: pt(full.pinnedBottom) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={full.src} alt="" draggable={false} className="absolute bottom-0 block w-full" />
            </div>
            <div className="pointer-events-none absolute inset-0">
              {floatingNav}
              {pinned.map(hotspot)}
            </div>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={screen.image.src} alt={screen.alt} draggable={false} className="block w-full" />
            {floatingNav}
            {scrolling.map(hotspot)}
          </>
        )}
      </div>
      {screen.keyboard && (
        // Decorative: a tap on it, like any tap off the links, flashes them.
        <div onClick={onMiss}>
          <Keyboard suggestions={screen.keyboard.suggestions} />
        </div>
      )}
      <HomeIndicator dark={screen.keyboard ? false : screen.dark} />
    </div>
  )
}
