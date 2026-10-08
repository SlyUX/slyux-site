import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'

import { PageHeader, Section, SectionHeading } from '@/components/ui'
import { CaseStudyRow, CaseStudyTile } from '@/components/content'
import { CASE_STUDIES_QUERY, safeFetch } from '@/lib/queries'
import { getSiteSettings } from '@/lib/site-settings'
import type { CaseStudyCard as CaseStudyCardData } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return stegaClean({ title: s.workTitle, description: s.workIntro ?? undefined })
}

type Group = { key: string; heading: string | null; studies: CaseStudyCardData[] }

export default async function WorkPage() {
  const [s, studies] = await Promise.all([
    getSiteSettings(),
    safeFetch<CaseStudyCardData[]>(CASE_STUDIES_QUERY, {}, []),
  ])

  // Groups come from Site settings, in order. A case study shows once, in its
  // first group; any left out follow under "More case studies". With no groups,
  // every case study is one unheaded band, in Case Studies order.
  const placed = new Set<string>()
  const groups: Group[] = []
  for (const g of s.caseStudyGroups ?? []) {
    const own = (g.studies ?? []).filter((study) => !placed.has(study._id))
    own.forEach((study) => placed.add(study._id))
    if (g.heading && own.length) groups.push({ key: g._key, heading: g.heading, studies: own })
  }
  const rest = studies.filter((study) => !placed.has(study._id))
  if (rest.length) groups.push({ key: 'more', heading: groups.length ? s.caseStudiesMoreHeading : null, studies: rest })

  // The first group is featured: one large row per case study, thumbnails
  // alternating sides. Every later group shows two case studies to a row.
  const featuredKey = groups[0]?.key !== 'more' ? groups[0]?.key : undefined

  return (
    <>
      <Section opener className="pb-10 md:pb-12">
        <PageHeader title={s.workTitle} intro={s.workIntro} />
      </Section>
      {groups.length ? (
        // Each group a full-width band, alternating from the surface tone, like the Portfolio pages.
        groups.map((group, i) => (
          <Section
            key={group.key}
            tone={i % 2 === 0 ? 'surface' : 'default'}
            aria-labelledby={group.heading ? `group-${group.key}` : undefined}
          >
            {group.heading && <SectionHeading id={`group-${group.key}`}>{group.heading}</SectionHeading>}
            {group.key === featuredKey ? (
              <div className="flex flex-col gap-16">
                {group.studies.map((study, index) => (
                  <CaseStudyRow key={study._id} study={study} flip={index % 2 === 1} priority={index === 0} headingLevel="h3" />
                ))}
              </div>
            ) : (
              <div className="grid gap-x-8 gap-y-14 md:grid-cols-2">
                {group.studies.map((study) => (
                  <CaseStudyTile key={study._id} study={study} details headingLevel={group.heading ? 'h3' : 'h2'} />
                ))}
              </div>
            )}
          </Section>
        ))
      ) : (
        <Section className="pt-0 md:pt-0">
          <p className="text-muted-foreground">{s.workEmpty}</p>
        </Section>
      )}
    </>
  )
}
