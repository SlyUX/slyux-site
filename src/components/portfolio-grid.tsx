import { CreativeTile, lightboxItems } from '@/components/content'
import { Lightbox } from '@/components/lightbox'
import { Section, SectionHeading } from '@/components/ui'
import { PORTFOLIO_KINDS, PROJECT_KINDS, type PortfolioKind } from '@/sanity/portfolio'
import type { CreativeWorkCard } from '@/lib/types'
import type { galleryLabels, SiteSettings } from '@/lib/site-settings'

type Row = { key: string; heading: string; content: React.ReactNode; action?: React.ReactNode }

/**
 * A portfolio section's pieces, grouped by kind (e.g. Brand → brand systems,
 * then logos), each group a full-width band. Bands alternate backgrounds,
 * starting on the surface tone, and each carries its heading, unless a lone
 * row's heading would only repeat the page title (an "Illustration" row alone
 * on the Illustration page). The headings name the kind, so the cards here
 * carry no kind chips. Featured pieces lead the page in a band of their own,
 * each a row with its image beside its summary, like the Case Studies page.
 */
export function PortfolioGrid({
  works,
  headings,
  matureLabel,
  labels,
  lead,
  pageTitle,
  featuredHeading,
}: {
  works: CreativeWorkCard[]
  headings: SiteSettings['creativeSections']
  matureLabel: string
  labels: ReturnType<typeof galleryLabels>
  /** A row before the kinds, e.g. the UX page's case studies, with an optional action beside its heading. */
  lead?: Row
  /** The page's own title, so a row heading never just repeats it. */
  pageTitle: string
  /** Heads the band of featured pieces at the top of the page. */
  featuredHeading: string
}) {
  // Featured pieces lead the page in a band of their own, each a row like the
  // Case Studies featured row, and leave their kind's row. Projects (brand
  // systems, UX pieces) sit side by side as equals, featured or not.
  const isFeatured = (w: CreativeWorkCard) => !!w.featured && !w.mature && !PROJECT_KINDS.includes(w.kind as PortfolioKind)
  const featured = works.filter(isFeatured)
  const groups = PORTFOLIO_KINDS.map((kind) => ({
    kind: kind.value,
    heading: headings[kind.value],
    items: works.filter((w) => w.kind === kind.value && !isFeatured(w)),
  })).filter((g) => g.items.length > 0)

  const rowCount = groups.length + (lead ? 1 : 0) + (featured.length ? 1 : 0)
  const showHeading = (heading: string) => rowCount > 1 || heading.trim().toLowerCase() !== pageTitle.trim().toLowerCase()
  const tile = (work: CreativeWorkCard, heading: string, shape?: 'large' | 'feature') => (
    <CreativeTile
      key={work._id}
      work={work}
      matureLabel={matureLabel}
      enlargeLabel={labels.enlarge}
      imageCountLabel={labels.imageCount}
      large={shape === 'large'}
      feature={shape === 'feature'}
      headingLevel={showHeading(heading) ? 'h3' : 'h2'}
    />
  )

  const rows: Row[] = [
    ...(lead ? [lead] : []),
    ...(featured.length
      ? [{
          key: 'featured',
          heading: featuredHeading,
          content: <div className="flex flex-col gap-16">{featured.map((work) => tile(work, featuredHeading, 'feature'))}</div>,
        }]
      : []),
    ...groups.map((group) => ({
      key: group.kind,
      heading: group.heading,
      content: PROJECT_KINDS.includes(group.kind) ? (
        <div className="grid gap-x-6 gap-y-10 md:grid-cols-2">{group.items.map((work) => tile(work, group.heading, 'large'))}</div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {group.items.map((work) => tile(work, group.heading))}
        </div>
      ),
    })),
  ]

  // One lightbox for the page; each card that doesn't link anywhere opens only its own images.
  return (
    <Lightbox items={lightboxItems(works)} labels={labels}>
      {rows.map((row, i) => (
        <Section
          key={row.key}
          tone={i % 2 === 0 ? 'surface' : 'default'}
          aria-labelledby={showHeading(row.heading) ? `group-${row.key}` : undefined}
        >
          {showHeading(row.heading) && (
            <SectionHeading id={`group-${row.key}`} action={row.action}>
              {row.heading}
            </SectionHeading>
          )}
          {row.content}
        </Section>
      ))}
    </Lightbox>
  )
}
