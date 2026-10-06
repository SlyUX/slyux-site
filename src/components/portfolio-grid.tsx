import { CreativeTile, lightboxItems } from '@/components/content'
import { Lightbox } from '@/components/lightbox'
import { Section } from '@/components/ui'
import { PORTFOLIO_KINDS, PROJECT_KINDS } from '@/sanity/portfolio'
import type { CreativeWorkCard } from '@/lib/types'
import type { galleryLabels, SiteSettings } from '@/lib/site-settings'

type Row = { key: string; heading: string; content: React.ReactNode; action?: React.ReactNode }

/**
 * A portfolio section's pieces, grouped by kind (e.g. Brand → brand systems,
 * then logos), each group a full-width band. Bands alternate backgrounds,
 * starting on the surface tone, and each carries its heading, unless a lone
 * row's heading would only repeat the page title (an "Illustration" row alone
 * on the Illustration page). The headings name the kind, so the cards here
 * carry no kind chips. A featured piece leads its group at full width.
 */
export function PortfolioGrid({
  works,
  headings,
  matureLabel,
  labels,
  lead,
  pageTitle,
}: {
  works: CreativeWorkCard[]
  headings: SiteSettings['creativeSections']
  matureLabel: string
  labels: ReturnType<typeof galleryLabels>
  /** A row before the kinds, e.g. the UX page's case studies, with an optional action beside its heading. */
  lead?: Row
  /** The page's own title, so a row heading never just repeats it. */
  pageTitle: string
}) {
  const groups = PORTFOLIO_KINDS.map((kind) => ({
    kind: kind.value,
    heading: headings[kind.value],
    items: works.filter((w) => w.kind === kind.value),
  })).filter((g) => g.items.length > 0)

  const rowCount = groups.length + (lead ? 1 : 0)
  const showHeading = (heading: string) => rowCount > 1 || heading.trim().toLowerCase() !== pageTitle.trim().toLowerCase()
  const tile = (work: CreativeWorkCard, heading: string, large = false) => (
    <CreativeTile
      key={work._id}
      work={work}
      matureLabel={matureLabel}
      enlargeLabel={labels.enlarge}
      large={large}
      headingLevel={showHeading(heading) ? 'h3' : 'h2'}
    />
  )

  const rows: Row[] = [
    ...(lead ? [lead] : []),
    ...groups.map((group) => {
      const [first, ...rest] = group.items
      // Projects (brand systems, UX pieces) sit side by side as equals, featured or not.
      if (PROJECT_KINDS.includes(group.kind)) {
        return {
          key: group.kind,
          heading: group.heading,
          content: <div className="grid gap-x-6 gap-y-10 md:grid-cols-2">{group.items.map((work) => tile(work, group.heading, true))}</div>,
        }
      }
      const hasLead = first.featured && !first.mature
      return {
        key: group.kind,
        heading: group.heading,
        content: (
          <>
            {hasLead && <div className="mb-10">{tile(first, group.heading, true)}</div>}
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {(hasLead ? rest : group.items).map((work) => tile(work, group.heading))}
            </div>
          </>
        ),
      }
    }),
  ]

  // One lightbox for the page: cards that don't link anywhere step through it together.
  return (
    <Lightbox items={lightboxItems(groups.flatMap((g) => g.items))} labels={labels}>
      {rows.map((row, i) => (
        <Section
          key={row.key}
          tone={i % 2 === 0 ? 'surface' : 'default'}
          aria-labelledby={showHeading(row.heading) ? `group-${row.key}` : undefined}
        >
          {showHeading(row.heading) && (
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 id={`group-${row.key}`} className="font-display text-3xl font-semibold">
                {row.heading}
              </h2>
              {row.action}
            </div>
          )}
          {row.content}
        </Section>
      ))}
    </Lightbox>
  )
}
