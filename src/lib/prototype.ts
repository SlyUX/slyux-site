import { stegaClean } from 'next-sanity'

import { urlFor } from '@/sanity/image'
import type { CaseStudyDetail } from '@/lib/types'

type PrototypeDoc = NonNullable<CaseStudyDetail['prototype']>
type Size = { width: number; height: number }

/**
 * The phone a prototype plays in: a current iPhone (16), in points. The
 * designs' own status bar is cropped off and this phone's drawn instead, so
 * the content starts under its Dynamic Island.
 */
export const PHONE = { width: 393, safeTop: 59 }

/** Widest image we request: 3× a 375pt design, plenty for the phone's 393pt. */
const MAX_WIDTH = 1179

export interface PrototypeHotspot {
  key: string
  label: string
  /** Index of the screen it opens. */
  target: number
  /** Phone points, from the top-left of the content under the status bar. */
  x: number
  y: number
  w: number
  h: number
  /** Stays put while a full-length screen scrolls. */
  fixed: boolean
}

export interface PrototypeScreen {
  key: string
  name: string
  alt: string
  /** The Sanity asset behind the first screen: gallery images with the same one open the prototype here. */
  assetRef?: string
  /** Behind the Dynamic Island; `dark` picks light status bar text. */
  topColor?: string
  dark: boolean
  /** The first screen, status bar cropped, and its height in phone points. */
  image: { src: string; height: number }
  /** A full-length screen that scrolls, with the bands that stay put (phone points). */
  full?: { src: string; height: number; pinnedTop: number; pinnedBottom: number }
  hotspots: PrototypeHotspot[]
}

export interface PrototypeView {
  title: string
  /** Height of the content area under the status bar, in phone points. */
  contentHeight: number
  screens: PrototypeScreen[]
}

const hasSize = (s: Partial<Size> | null | undefined): s is Size => !!s?.width && !!s?.height

/** Relative luminance of a #rrggbb color, 0 (black) to 1 (white). */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** A screen image with the designed status bar cropped off, as WebP. */
function cropped(source: Parameters<typeof urlFor>[0], size: Size, statusPx: number) {
  return urlFor(source)
    .rect(0, statusPx, size.width, size.height - statusPx)
    .width(Math.min(MAX_WIDTH, size.width))
    .format('webp')
    .quality(80)
    .url()
}

/** Turns a Sanity prototype into what the viewer draws: cropped screens and tap areas in phone points. */
export function buildPrototype(doc: PrototypeDoc | null | undefined): PrototypeView | undefined {
  if (!doc?.screens?.length) return undefined
  const designWidth = doc.designWidth || 375
  const status = doc.statusBarHeight ?? 0
  const scale = PHONE.width / designWidth
  // Only screens with an image play; tap areas point at their place in this list.
  const playable = doc.screens.flatMap((s) => (s.image?.asset && hasSize(s.image.size) ? [{ ...s, image: { asset: s.image.asset, size: s.image.size } }] : []))
  const names = playable.map((s) => stegaClean(s.name))

  const screens = playable.map((s): PrototypeScreen => {
    const perPt = s.image.size.width / designWidth
    const toPhone = (pt: number) => Math.round(pt * scale * 100) / 100
    const topColor = stegaClean(s.topColor) || undefined
    const full =
      s.fullPage?.asset && hasSize(s.fullPage.size)
        ? {
            src: cropped(s.fullPage, s.fullPage.size, Math.round(status * (s.fullPage.size.width / designWidth))),
            height: toPhone(s.fullPage.size.height / (s.fullPage.size.width / designWidth) - status),
            pinnedTop: toPhone(Math.max(0, (s.pinnedTop ?? status) - status)),
            pinnedBottom: toPhone(s.pinnedBottom ?? 0),
          }
        : undefined
    return {
      key: s._key,
      name: s.name,
      alt: s.alt,
      assetRef: s.image.asset._ref,
      topColor,
      dark: topColor ? luminance(topColor) < 0.4 : false,
      image: { src: cropped(s.image, s.image.size, Math.round(status * perPt)), height: toPhone(s.image.size.height / perPt - status) },
      full,
      hotspots: (s.hotspots ?? []).flatMap((h) => {
        const target = names.indexOf(stegaClean(h.target))
        if (target < 0) return []
        // A tap area reaching into the cropped status bar starts under it instead.
        const top = Math.max(h.y, status)
        return [
          {
            key: h._key,
            label: stegaClean(h.label),
            target,
            x: toPhone(h.x),
            y: toPhone(top - status),
            w: toPhone(h.width),
            h: toPhone(h.y + h.height - top),
            fixed: !!h.fixed,
          },
        ]
      }),
    }
  })
  if (!screens.length) return undefined
  return { title: doc.title, contentHeight: Math.max(...screens.map((s) => s.image.height)), screens }
}
