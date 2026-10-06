import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'
import { notFound } from 'next/navigation'

import { PageHeader, Section } from '@/components/ui'
import { CaseStudyCard } from '@/components/content'
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

  // Until UX screens are added as pieces, the UX page shows the case studies
  // themselves rather than an empty page.
  const studies =
    section === 'ux' && works.length === 0
      ? await safeFetch<CaseStudyCardData[]>(CASE_STUDIES_QUERY, {}, [])
      : []

  return (
    <Section>
      <PageHeader title={copy.title} intro={copy.intro} back={{ label: s.creativeTitle, href: '/portfolio' }} />
      <div className="mt-14">
        {works.length > 0 ? (
          <PortfolioGrid works={works} headings={s.creativeSections} matureLabel={s.matureLabel} labels={galleryLabels(s)} />
        ) : studies.length > 0 ? (
          <div className="grid gap-x-8 gap-y-14 md:grid-cols-2">
            {studies.map((study) => (
              <CaseStudyCard key={study._id} study={study} headingLevel="h2" />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{s.workEmpty}</p>
        )}
      </div>
    </Section>
  )
}
