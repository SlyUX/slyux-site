import Image from 'next/image'

import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/image'
import type { CaseStudyDetail } from '@/lib/types'

type GalleryData = NonNullable<CaseStudyDetail['galleries']>[number]

/**
 * A titled group of images after a case study's story.
 *
 *  - `phone`: an even grid of app screens, framed like devices.
 *  - `wide`:  a two-column masonry for desktop captures, wireframes, personas —
 *             mixed aspect ratios stack without cropping anything.
 *
 * Intrinsic sizes come from the asset metadata so nothing shifts on load.
 */
export function Gallery({ gallery, id }: { gallery: GalleryData; id: string }) {
  const images = (gallery.images ?? []).filter((img) => img.asset && img.size?.width && img.size?.height)
  if (!images.length) return null
  const phone = gallery.layout === 'phone'

  return (
    <section aria-labelledby={id} className="mt-16">
      <h2 id={id} className="font-display text-heading text-3xl font-semibold">
        {gallery.heading}
      </h2>
      {gallery.intro && <p className="text-muted-foreground mt-2 max-w-2xl">{gallery.intro}</p>}
      <div
        className={cn(
          'mt-8',
          phone ? 'grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5' : 'gap-6 space-y-6 md:columns-2',
        )}
      >
        {images.map((img) => {
          const width = phone ? 600 : 1400
          const { width: w, height: h } = img.size as { width: number; height: number }
          return (
            <figure key={img._key} className={cn(!phone && 'break-inside-avoid')}>
              <Image
                src={urlFor(img).width(width).url()}
                alt={img.alt ?? ''}
                width={width}
                height={Math.round((width * h) / w)}
                sizes={phone ? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw' : '(max-width: 768px) 100vw, 50vw'}
                className={cn(
                  'h-auto w-full',
                  phone ? 'border-border rounded-[1.25rem] border shadow-sm' : 'border-border rounded-xl border',
                )}
              />
              {img.caption && <figcaption className="text-muted-foreground mt-2 text-sm">{img.caption}</figcaption>}
            </figure>
          )
        })}
      </div>
    </section>
  )
}
