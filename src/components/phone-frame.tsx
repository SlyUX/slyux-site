import { Fragment } from 'react'
import { ArrowBigUp, BatteryFull, Delete, Mic, Signal, Smile, Wifi } from 'lucide-react'

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
 * The iOS 26 keyboard's height on a Face ID iPhone, in points: 301 for the
 * keys and the emoji and dictation row under them, plus 45 for the
 * suggestion bar (reported by developers; Apple publishes no figure).
 */
const KEYBOARD = { height: 301, suggestions: 45 }
const KEY = { width: 33.1, height: 43, gap: 6, radius: 8.5 }

/** How much of the screen the keyboard covers, in points. */
export const keyboardHeight = (suggestions: boolean) => KEYBOARD.height + (suggestions ? KEYBOARD.suggestions : 0)

/**
 * The iPhone keyboard, up as while typing: suggestions (when given), the
 * letter keys, and the emoji and dictation buttons under them. Decorative
 * device chrome, like the status bar: the key labels are the iPhone's, not
 * content. The home indicator is drawn over it by the screen.
 */
export function Keyboard({ suggestions }: { suggestions: string[] }) {
  const row = { gap: pt(KEY.gap) }
  const icon = { width: pt(22), height: pt(22) }
  const letters = (keys: string) => [...keys].map((l) => <Key key={l}>{l}</Key>)
  return (
    <div
      aria-hidden
      className="bg-keyboard text-foreground pointer-events-none absolute inset-x-0 bottom-0 select-none"
      style={{
        height: pt(keyboardHeight(suggestions.length > 0)),
        borderTopLeftRadius: pt(27),
        borderTopRightRadius: pt(27),
        paddingInline: pt(4),
        fontSize: pt(23),
        lineHeight: 1,
      }}
    >
      {suggestions.length > 0 && (
        <div className="flex items-center" style={{ height: pt(KEYBOARD.suggestions), fontSize: pt(17) }}>
          {suggestions.map((s, i) => (
            <Fragment key={i}>
              {i > 0 && <span className="bg-keyboard-key-alt shrink-0" style={{ width: pt(1), height: pt(25) }} />}
              <span className="flex-1 truncate text-center">{s}</span>
            </Fragment>
          ))}
        </div>
      )}
      <div className="flex flex-col" style={{ gap: pt(11), paddingTop: pt(10) }}>
        <div className="flex justify-center" style={row}>
          {letters('qwertyuiop')}
        </div>
        <div className="flex justify-center" style={row}>
          {letters('asdfghjkl')}
        </div>
        <div className="flex justify-between">
          <Key alt width={44}>
            <ArrowBigUp style={icon} strokeWidth={1.75} />
          </Key>
          <div className="flex" style={row}>
            {letters('zxcvbnm')}
          </div>
          <Key alt width={44}>
            <Delete style={icon} strokeWidth={1.75} />
          </Key>
        </div>
        <div className="flex" style={{ ...row, fontSize: pt(16) }}>
          <Key alt width={88}>
            123
          </Key>
          <Key width="grow">space</Key>
          <Key alt width={88}>
            return
          </Key>
        </div>
      </div>
      <div className="text-muted-foreground flex justify-between" style={{ paddingInline: pt(18), paddingTop: pt(12) }}>
        <Smile style={{ width: pt(27), height: pt(27) }} strokeWidth={1.5} />
        <Mic style={{ width: pt(27), height: pt(27) }} strokeWidth={1.5} />
      </div>
    </div>
  )
}

/** One key: white for letters, gray (`alt`) for shift, delete, 123, and return. */
function Key({ alt = false, width = KEY.width, children }: { alt?: boolean; width?: number | 'grow'; children: React.ReactNode }) {
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center', alt ? 'bg-keyboard-key-alt' : 'bg-keyboard-key', width === 'grow' && 'grow')}
      style={{ height: pt(KEY.height), borderRadius: pt(KEY.radius), width: width === 'grow' ? undefined : pt(width) }}
    >
      {children}
    </span>
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
