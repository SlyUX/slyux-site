import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'

import { TransitionLink } from '@/components/grid-nav'
import { PageHeader, Section } from '@/components/ui'
import { CreativeTile, isDeepCard, lightboxItems } from '@/components/content'
import { Lightbox } from '@/components/lightbox'
import { PORTFOLIO_SECTION_QUERY, safeFetch } from '@/lib/queries'
import { galleryLabels, getSiteSettings } from '@/lib/site-settings'
import { cn } from '@/lib/utils'
import { PORTFOLIO_KINDS, PORTFOLIO_SECTIONS, sectionOfKind } from '@/sanity/portfolio'
import type { CreativeWorkCard } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return stegaClean({ title: s.creativeTitle, description: s.creativeIntro ?? undefined })
}

/** How many pieces each section previews on the landing page: one row. UX cards are wide, three to a row. */
const previewCount = (section: string) => (section === 'ux' ? 3 : 4)

export default async function PortfolioPage() {
  const [s, works] = await Promise.all([
    getSiteSettings(),
    safeFetch<CreativeWorkCard[]>(
      PORTFOLIO_SECTION_QUERY,
      { kinds: PORTFOLIO_KINDS.map((k) => k.value) },
      [],
    ),
  ])

  // Pieces with a full page behind them lead each row, then featured pieces
  // (the query orders them so). Mature pieces are never previewed here —
  // they live on their section page as links only.
  const sections = PORTFOLIO_SECTIONS.map((section) => {
    const pieces = works.filter((w) => sectionOfKind(w.kind) === section && !w.mature)
    return {
      section,
      copy: s.portfolioSections[section],
      items: [...pieces.filter(isDeepCard), ...pieces.filter((w) => !isDeepCard(w))].slice(0, previewCount(section)),
    }
  }).filter((entry) => entry.items.length > 0)

  const labels = galleryLabels(s)

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
                <TransitionLink href={`/portfolio/${section}`} className="hover:text-primary">
                  {copy.title}
                </TransitionLink>
              </h2>
              {copy.intro && <p className="text-muted-foreground mt-2">{copy.intro}</p>}
            </div>
            <TransitionLink href={`/portfolio/${section}`} className="text-primary text-sm font-semibold underline underline-offset-4">
              {s.portfolioViewAll}
              <span className="sr-only"> {copy.title}</span>
            </TransitionLink>
          </div>
          <Lightbox items={lightboxItems(items)} labels={labels}>
            <div className={cn('grid gap-x-6 gap-y-10', section === 'ux' ? 'sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4')}>
              {items.map((work) => (
                <CreativeTile key={work._id} work={work} matureLabel={s.matureLabel} enlargeLabel={labels.enlarge} kindLabels={s.kindLabels} headingLevel="h3" />
              ))}
            </div>
          </Lightbox>
        </Section>
      ))}
    </>
  )
}
