import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'

import { PanLink } from '@/components/grid-nav'
import { PageHeader, Section } from '@/components/ui'
import { CreativeTile } from '@/components/content'
import { PORTFOLIO_SECTION_QUERY, safeFetch } from '@/lib/queries'
import { getSiteSettings } from '@/lib/site-settings'
import { PORTFOLIO_KINDS, PORTFOLIO_SECTIONS, sectionOfKind } from '@/sanity/portfolio'
import type { CreativeWorkCard } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return stegaClean({ title: s.creativeTitle, description: s.creativeIntro ?? undefined })
}

/** How many pieces each section previews on the landing page. */
const PREVIEW_COUNT = 4

export default async function PortfolioPage() {
  const [s, works] = await Promise.all([
    getSiteSettings(),
    safeFetch<CreativeWorkCard[]>(
      PORTFOLIO_SECTION_QUERY,
      { kinds: PORTFOLIO_KINDS.map((k) => k.value) },
      [],
    ),
  ])

  // Featured pieces first (the query orders them so), mature pieces never
  // previewed here — they live on their section page as links only.
  const sections = PORTFOLIO_SECTIONS.map((section) => ({
    section,
    copy: s.portfolioSections[section],
    items: works.filter((w) => sectionOfKind(w.kind) === section && !w.mature).slice(0, PREVIEW_COUNT),
  })).filter((entry) => entry.items.length > 0)

  return (
    <>
      <Section className="pb-4 md:pb-6">
        <PageHeader title={s.creativeTitle} intro={s.creativeIntro} />
      </Section>
      {sections.map(({ section, copy, items }) => (
        <Section key={section} aria-labelledby={`portfolio-${section}`} className="py-10 md:py-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id={`portfolio-${section}`} className="font-display text-3xl font-semibold">
                <PanLink href={`/portfolio/${section}`} className="hover:text-primary">
                  {copy.title}
                </PanLink>
              </h2>
              {copy.intro && <p className="text-muted-foreground mt-2">{copy.intro}</p>}
            </div>
            <PanLink href={`/portfolio/${section}`} className="text-primary text-sm font-semibold underline underline-offset-4">
              {s.portfolioViewAll}
              <span className="sr-only"> {copy.title}</span>
            </PanLink>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {items.map((work) => (
              <CreativeTile key={work._id} work={work} matureLabel={s.matureLabel} headingLevel="h3" />
            ))}
          </div>
        </Section>
      ))}
    </>
  )
}
