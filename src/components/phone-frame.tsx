import { BatteryFull, Signal, Wifi } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PHONE } from '@/lib/prototype'

/** Bezel around the screen, and the corner radii, in points (an iPhone 16, roughly). */
const BEZEL = 11
const SCREEN_RADIUS = 55

/**
 * A length in phone points. The frame sets `--pt` to one point at its current
 * size (a share of its container's width), so everything inside scales
 * together: island, status bar, screens, and tap areas.
 */
export const pt = (n: number) => `calc(var(--pt) * ${n})`

/**
 * A current iPhone drawn in CSS: bezel, screen, and Dynamic Island.
 * `children` are the screen's layers (see ScreenLayer in prototype-viewer.tsx);
 * each brings its own status bar and home indicator so their colors can
 * follow the screen. Sized to fit the window: never taller than the space
 * under the viewer's controls, never wider than a real phone.
 */
export function PhoneFrame({ contentHeight, className, children }: { contentHeight: number; className?: string; children: React.ReactNode }) {
  const outerWidth = PHONE.width + BEZEL * 2
  const outerHeight = PHONE.safeTop + contentHeight + BEZEL * 2
  return (
    <div className={cn('@container w-full', className)} style={{ maxWidth: `min(${outerWidth}px, calc((100dvh - 10rem) * ${outerWidth / outerHeight}))` }}>
      <div
        className="bg-ink ring-ink-foreground/25 relative shadow-2xl ring-1"
        style={
          {
            '--pt': `calc(100cqw / ${outerWidth})`,
            aspectRatio: `${outerWidth} / ${outerHeight}`,
            borderRadius: pt(SCREEN_RADIUS + BEZEL),
          } as React.CSSProperties
        }
      >
        <div className="bg-paper absolute isolate overflow-hidden" style={{ inset: pt(BEZEL), borderRadius: pt(SCREEN_RADIUS) }}>
          {children}
          {/* The Dynamic Island, over every screen. Decorative. */}
          <div aria-hidden className="bg-ink pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 rounded-full" style={{ top: pt(11), width: pt(126), height: pt(37) }} />
        </div>
      </div>
    </div>
  )
}

/**
 * The status bar beside the island: time, signal, Wi-Fi, battery. Light text
 * on a dark screen top, dark on a light one. Decorative device chrome; "9:41"
 * is Apple's demo time, not content.
 */
export function StatusBar({ dark }: { dark: boolean }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between font-semibold', dark ? 'text-ink-foreground' : 'text-ink')}
      style={{ height: pt(PHONE.safeTop - 4), paddingInline: pt(34), fontSize: pt(17) }}
    >
      <span className="tabular-nums">9:41</span>
      <span className="flex items-center" style={{ gap: pt(6) }}>
        <Signal style={{ width: pt(18), height: pt(18) }} strokeWidth={2.5} />
        <Wifi style={{ width: pt(18), height: pt(18) }} strokeWidth={2.5} />
        <BatteryFull style={{ width: pt(26), height: pt(26) }} strokeWidth={2} />
      </span>
    </div>
  )
}

/**
 * The home indicator along the bottom edge. iOS tints it to what's under it;
 * here it follows the status bar (light on a dark screen, dark on a light
 * one), which matches for screens with one background color top to bottom.
 */
export function HomeIndicator({ dark }: { dark: boolean }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-full', dark ? 'bg-ink-foreground' : 'bg-ink')}
      style={{ bottom: pt(8), width: pt(139), height: pt(5) }}
    />
  )
}
