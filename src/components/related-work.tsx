import { CaseStudyTile, CreativeTile, lightboxItems } from '@/components/content'
import { Lightbox } from '@/components/lightbox'
import { Section, SectionHeading } from '@/components/ui'
import type { galleryLabels } from '@/lib/site-settings'
import type { CaseStudyCard as CaseStudyCardData, CreativeWorkCard } from '@/lib/types'

export type RelatedItem = ({ _type: 'caseStudy' } & CaseStudyCardData) | ({ _type: 'creativeWork' } & CreativeWorkCard)

const MAX = 3

/**
 * Related work at the bottom of a case study or portfolio page: the page's own
 * picks, then pieces that picked it, so a link set on either side shows on
 * both. One row of up to three cards, all 3:2 so a logo and a case study line
 * up. Cards behave as they do everywhere: a page opens, an image enlarges.
 */
export function RelatedWork({
  picks,
  back,
  heading,
  caseStudyLabel,
  kindLabels,
  labels,
}: {
  picks: (RelatedItem | null)[] | null | undefined
  back: RelatedItem[] | null | undefined
  heading: string
  caseStudyLabel: string
  kindLabels: Record<string, string>
  labels: ReturnType<typeof galleryLabels>
}) {
  const seen = new Set<string>()
  const items = [...(picks ?? []), ...(back ?? [])]
    .filter((item): item is RelatedItem => !!item?._id && !seen.has(item._id) && !!seen.add(item._id))
    .slice(0, MAX)
  if (!items.length) return null
  const pieces = items.filter((item): item is Extract<RelatedItem, { _type: 'creativeWork' }> => item._type === 'creativeWork')

  return (
    <Section tone="surface" aria-labelledby="related-heading">
      <SectionHeading id="related-heading">{heading}</SectionHeading>
      <Lightbox items={lightboxItems(pieces)} labels={labels}>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) =>
            item._type === 'caseStudy' ? (
              <CaseStudyTile key={item._id} study={item} label={caseStudyLabel} />
            ) : (
              <CreativeTile
                key={item._id}
                work={item}
                enlargeLabel={labels.enlarge}
                imageCountLabel={labels.imageCount}
                kindLabels={kindLabels}
                wide
              />
            ),
          )}
        </div>
      </Lightbox>
    </Section>
  )
}
