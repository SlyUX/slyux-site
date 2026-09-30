import { CreativeTile } from '@/components/content'
import { PORTFOLIO_KINDS } from '@/sanity/portfolio'
import type { CreativeWorkCard } from '@/lib/types'
import type { DocumentSettings, SiteSettings } from '@/lib/site-settings'

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
  docs,
}: {
  works: CreativeWorkCard[]
  headings: SiteSettings['creativeSections']
  matureLabel: string
  docs: DocumentSettings
}) {
  const groups = PORTFOLIO_KINDS.map((kind) => ({
    kind: kind.value,
    heading: headings[kind.value],
    items: works.filter((w) => w.kind === kind.value),
  })).filter((g) => g.items.length > 0)

  const showHeadings = groups.length > 1

  return (
    <div className="space-y-16">
      {groups.map((group) => {
        const [lead, ...rest] = group.items
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
                <CreativeTile work={lead} matureLabel={matureLabel} docs={docs} large headingLevel={showHeadings ? 'h3' : 'h2'} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {(hasLead ? rest : group.items).map((work) => (
                <CreativeTile key={work._id} work={work} matureLabel={matureLabel} docs={docs} headingLevel={showHeadings ? 'h3' : 'h2'} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
