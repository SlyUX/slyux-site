import { CreativeTile, lightboxItems } from '@/components/content'
import { Lightbox } from '@/components/lightbox'
import { PORTFOLIO_KINDS, PROJECT_KINDS } from '@/sanity/portfolio'
import type { CreativeWorkCard } from '@/lib/types'
import type { galleryLabels, SiteSettings } from '@/lib/site-settings'

/**
 * A portfolio section's pieces, grouped by kind (e.g. Brand → brand systems,
 * then logos). Group headings only appear when a section has more than one
 * group — a lone "Illustration" heading under an "Illustration" page is noise.
 * A featured piece leads its group at full width.
 */
export function PortfolioGrid({
  works,
  headings,
  matureLabel,
  kindLabels,
  labels,
  lead,
}: {
  works: CreativeWorkCard[]
  headings: SiteSettings['creativeSections']
  matureLabel: string
  kindLabels: SiteSettings['kindLabels']
  labels: ReturnType<typeof galleryLabels>
  /** A row before the kinds, e.g. the UX page's case studies. */
  lead?: { key: string; heading: string; content: React.ReactNode }
}) {
  const groups = PORTFOLIO_KINDS.map((kind) => ({
    kind: kind.value,
    heading: headings[kind.value],
    items: works.filter((w) => w.kind === kind.value),
  })).filter((g) => g.items.length > 0)

  const showHeadings = groups.length + (lead ? 1 : 0) > 1

  // One lightbox for the page: cards that don't link anywhere step through it together.
  return (
    <Lightbox items={lightboxItems(groups.flatMap((g) => g.items))} labels={labels}>
      <div className="space-y-16">
        {lead && (
          <section aria-labelledby={showHeadings ? `group-${lead.key}` : undefined}>
            {showHeadings && (
              <h2 id={`group-${lead.key}`} className="font-display mb-8 text-3xl font-semibold">
                {lead.heading}
              </h2>
            )}
            {lead.content}
          </section>
        )}
        {groups.map((group) => {
          const [lead, ...rest] = group.items
          const headingLevel = showHeadings ? 'h3' : 'h2'
          // Projects (brand systems) sit side by side as equals, featured or not.
          if (PROJECT_KINDS.includes(group.kind)) {
            return (
              <section key={group.kind} aria-labelledby={showHeadings ? `group-${group.kind}` : undefined}>
                {showHeadings && (
                  <h2 id={`group-${group.kind}`} className="font-display mb-8 text-3xl font-semibold">
                    {group.heading}
                  </h2>
                )}
                <div className="grid gap-x-6 gap-y-10 md:grid-cols-2">
                  {group.items.map((work) => (
                    <CreativeTile key={work._id} work={work} matureLabel={matureLabel} enlargeLabel={labels.enlarge} kindLabels={kindLabels} large headingLevel={headingLevel} />
                  ))}
                </div>
              </section>
            )
          }
          const hasLead = lead.featured && !lead.mature
          return (
            <section key={group.kind} aria-labelledby={showHeadings ? `group-${group.kind}` : undefined}>
              {showHeadings && (
                <h2 id={`group-${group.kind}`} className="font-display mb-8 text-3xl font-semibold">
                  {group.heading}
                </h2>
              )}
              {hasLead && (
                <div className="mb-10">
                  <CreativeTile work={lead} matureLabel={matureLabel} enlargeLabel={labels.enlarge} kindLabels={kindLabels} large headingLevel={headingLevel} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
                {(hasLead ? rest : group.items).map((work) => (
                  <CreativeTile key={work._id} work={work} matureLabel={matureLabel} enlargeLabel={labels.enlarge} kindLabels={kindLabels} headingLevel={headingLevel} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </Lightbox>
  )
}
