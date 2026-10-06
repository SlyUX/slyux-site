import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'
import { notFound } from 'next/navigation'

import { PageHeader, Section } from '@/components/ui'
import { CaseStudyTile } from '@/components/content'
import { PortfolioGrid } from '@/components/portfolio-grid'
import { CASE_STUDIES_QUERY, PORTFOLIO_SECTION_QUERY, safeFetch } from '@/lib/queries'
import { galleryLabels, getSiteSettings } from '@/lib/site-settings'
import { PORTFOLIO_SECTIONS, isPortfolioSection, kindsInSection } from '@/sanity/portfolio'
import type { CaseStudyCard as CaseStudyCardData, CreativeWorkCard } from '@/lib/types'

export const dynamicParams = false

export function generateStaticParams() {
  return PORTFOLIO_SECTIONS.map((section) => ({ section }))
}

export async function generateMetadata({ params }: PageProps<'/portfolio/[section]'>): Promise<Metadata> {
  const { section } = await params
  if (!isPortfolioSection(section)) return {}
  const s = await getSiteSettings()
  const copy = s.portfolioSections[section]
  return stegaClean({ title: copy.title, description: copy.intro })
}

export default async function PortfolioSectionPage({ params }: PageProps<'/portfolio/[section]'>) {
  const { section } = await params
  if (!isPortfolioSection(section)) notFound()

  const [s, works] = await Promise.all([
    getSiteSettings(),
    safeFetch<CreativeWorkCard[]>(PORTFOLIO_SECTION_QUERY, { kinds: kindsInSection(section) }, []),
  ])
  const copy = s.portfolioSections[section]

  // The UX page leads with the case studies, then the evidence behind them by discipline.
  const studies = section === 'ux' ? await safeFetch<CaseStudyCardData[]>(CASE_STUDIES_QUERY, {}, []) : []
  const lead = studies.length
    ? {
        key: 'case-studies',
        heading: s.caseStudiesRowHeading,
        content: (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {studies.map((study) => (
              // Under the row heading when artifact rows follow; the row heading hides when it's alone.
              <CaseStudyTile key={study._id} study={study} label={s.caseStudyLabel} headingLevel={works.length > 0 ? 'h3' : 'h2'} />
            ))}
          </div>
        ),
      }
    : undefined

  return (
    <Section>
      <PageHeader title={copy.title} intro={copy.intro} back={{ label: s.creativeTitle, href: '/portfolio' }} />
      <div className="mt-14">
        {works.length > 0 || lead ? (
          <PortfolioGrid
            works={works}
            headings={s.creativeSections}
            matureLabel={s.matureLabel}
            kindLabels={s.kindLabels}
            labels={galleryLabels(s)}
            lead={lead}
          />
        ) : (
          <p className="text-muted-foreground">{s.workEmpty}</p>
        )}
      </div>
    </Section>
  )
}
