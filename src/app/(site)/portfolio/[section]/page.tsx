import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'
import { notFound } from 'next/navigation'

import { Breadcrumb } from '@/components/breadcrumb'
import { ButtonLink, PageHeader, Section } from '@/components/ui'
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

  // The UX page leads with one row of case studies (picked in Site settings, else
  // the first three in order) beside a link to all of them, then the evidence
  // behind them by discipline.
  const studies =
    section === 'ux'
      ? s.uxCaseStudies?.length
        ? s.uxCaseStudies
        : (await safeFetch<CaseStudyCardData[]>(CASE_STUDIES_QUERY, {}, [])).slice(0, 3)
      : []
  const lead = studies.length
    ? {
        key: 'case-studies',
        heading: s.caseStudiesRowHeading,
        action: <ButtonLink link={{ _type: 'link', label: s.portfolioViewAll, href: '/case-studies' }} variant="secondary" />,
        content: (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {studies.map((study) => (
              <CaseStudyTile key={study._id} study={study} />
            ))}
          </div>
        ),
      }
    : undefined

  return (
    <>
      <Section opener className="pb-10 md:pb-12">
        <PageHeader
          title={copy.title}
          intro={copy.intro}
          breadcrumb={
            <Breadcrumb
              parent={{ label: s.creativeTitle, href: '/portfolio' }}
              items={PORTFOLIO_SECTIONS.map((sec) => ({ label: s.portfolioSections[sec].title, href: `/portfolio/${sec}` }))}
              current={`/portfolio/${section}`}
            />
          }
        />
      </Section>
      {works.length > 0 || lead ? (
        <PortfolioGrid
          works={works}
          headings={s.creativeSections}
          matureLabel={s.matureLabel}
          labels={galleryLabels(s)}
          lead={lead}
          pageTitle={copy.title}
          featuredHeading={s.portfolioFeaturedHeading}
        />
      ) : (
        <Section className="pt-0 md:pt-0">
          <p className="text-muted-foreground">{s.workEmpty}</p>
        </Section>
      )}
    </>
  )
}
