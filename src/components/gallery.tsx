import { GalleryViewer, type GalleryItem, type GalleryLabels, type ViewSlice } from '@/components/gallery-viewer'
import { urlFor } from '@/sanity/image'
import type { CaseStudyDetail } from '@/lib/types'

type GalleryData = NonNullable<CaseStudyDetail['galleries']>[number]
type GalleryImage = NonNullable<GalleryData['images']>[number]
type Size = { width: number; height: number }
type Source = Parameters<typeof urlFor>[0]

/** Tallest slice we request, in output pixels — comfortably under Sanity's 8192px cap. */
const MAX_SLICE = 4000

/**
 * Tall page captures get the same treatment as a "Screen (with full page)":
 * the thumbnail is the first screen, and the viewer shows the whole page.
 * First screens match the capture script's windows (1440 × 900 desktop,
 * 390 × 844 phone); anything no taller than TALL shows whole.
 */
const FIRST_SCREEN = { wide: 900 / 1440, phone: 844 / 390 }
const TALL = { wide: 1, phone: 2.4 }

const hasSize = (s: { width?: number | null; height?: number | null } | null | undefined): s is Size =>
  !!s?.width && !!s?.height

/**
 * Stacked WebP slices of an image for the viewer, plus the largest width it
 * can display at without being stretched. Sanity crops each region (`rect`)
 * at full resolution, then resizes it, so a 27,000px page capture stays sharp.
 *
 *  - Phone-width sources (≤1000px): served up to 780px. Retina captures
 *    (≥700px) display at half size — true phone width — and 1× screens at
 *    their native size, so nothing is scaled up.
 *  - Wider sources: served up to 2304px (retina at the 1152px content width)
 *    and displayed no wider than 1152px or their own width.
 */
function slices(source: Source, size: Size): GalleryItem['view'] {
  const narrow = size.width <= 1000
  const outWidth = Math.min(narrow ? 780 : 2304, size.width)
  const displayWidth = narrow
    ? size.width >= 700 ? Math.round(outWidth / 2) : outWidth
    : Math.min(1152, size.width >= 2000 ? Math.round(size.width / 2) : size.width)
  const scale = outWidth / size.width
  const step = Math.floor(MAX_SLICE / scale)
  const out: ViewSlice[] = []
  for (let y = 0; y < size.height; y += step) {
    const h = Math.min(step, size.height - y)
    out.push({
      src: urlFor(source).rect(0, y, size.width, h).width(outWidth).format('webp').quality(75).url(),
      width: outWidth,
      height: Math.round(h * scale),
    })
  }
  return { slices: out, narrow, displayWidth }
}

function toItem(img: GalleryImage, phone: boolean, rail: boolean, fallbackAlt: string): GalleryItem | undefined {
  if (!img.asset || !hasSize(img.size)) return undefined
  // Never ask for more pixels than the source has.
  const thumbWidth = Math.min(rail ? 600 : phone ? 600 : 1400, img.size.width)
  const full = 'fullPage' in img && img.fullPage?.asset && hasSize(img.fullPageSize) ? img.fullPage : undefined
  const shape = phone ? 'phone' : 'wide'
  const foldHeight =
    !full && img.size.height / img.size.width > TALL[shape]
      ? Math.round(img.size.width * FIRST_SCREEN[shape])
      : undefined
  const thumbSource = foldHeight ? urlFor(img).rect(0, 0, img.size.width, foldHeight) : urlFor(img)
  return {
    key: img._key,
    alt: img.alt || fallbackAlt,
    caption: img.caption,
    fullPage: !!full || !!foldHeight,
    thumb: {
      src: thumbSource.width(thumbWidth).url(),
      width: thumbWidth,
      height: Math.round((thumbWidth * (foldHeight ?? img.size.height)) / img.size.width),
    },
    view: full ? slices(full, img.fullPageSize as Size) : slices(img, img.size),
  }
}

/**
 * A titled group of images in a case study. The page decides placement:
 *
 *  - Full rows (the new design): `phone` is an even grid of app screens;
 *    `wide` is a two-column grid (row order) for desktop captures, wireframes, personas.
 *  - `rail` (the current state, beside the story): compact — desktop captures
 *    stack in one column, phone screens sit two across.
 *
 * Every thumbnail opens the shared viewer, where ← / → or a swipe steps through
 * the group.
 */
export function Gallery({
  gallery,
  id,
  labels,
  rail = false,
  headingAs = 'h2',
}: {
  gallery: GalleryData
  id: string
  labels: GalleryLabels
  rail?: boolean
  /** Inside the "How it started…" rail: a subheading, or none when it's the rail's only gallery. */
  headingAs?: 'h2' | 'h3' | 'none'
}) {
  const phone = gallery.layout === 'phone'
  const items = (gallery.images ?? []).flatMap((img) => toItem(img, phone, rail, gallery.heading) ?? [])
  if (!items.length) return null

  return (
    <section
      aria-labelledby={headingAs === 'none' ? undefined : id}
      aria-label={headingAs === 'none' ? gallery.heading : undefined}
      className={rail ? 'mt-8 first:mt-0' : 'mt-16 first:mt-0'}
    >
      {headingAs === 'h3' ? (
        <h3 id={id} className="text-foreground text-sm font-semibold">
          {gallery.heading}
        </h3>
      ) : headingAs === 'h2' ? (
        <h2 id={id} className={rail ? 'text-heading text-lg font-semibold' : 'font-display text-heading text-3xl font-semibold'}>
          {gallery.heading}
        </h2>
      ) : null}
      {gallery.intro && <p className={rail ? 'text-muted-foreground mt-1 text-sm' : 'text-muted-foreground mt-2'}>{gallery.intro}</p>}
      <div className={rail ? 'mt-4' : 'mt-8'}>
        <GalleryViewer items={items} layout={phone ? 'phone' : 'wide'} rail={rail} labels={labels} />
      </div>
    </section>
  )
}
