import type { Metadata } from 'next'

import { PageHeader, Section } from '@/components/ui'
import { CaseStudyCard } from '@/components/content'
import { CASE_STUDIES_QUERY, safeFetch } from '@/lib/queries'
import { getSiteSettings } from '@/lib/site-settings'
import type { CaseStudyCard as CaseStudyCardData } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return { title: s.workTitle, description: s.workIntro ?? undefined }
}

export default async function WorkPage() {
  const [s, studies] = await Promise.all([
    getSiteSettings(),
    safeFetch<CaseStudyCardData[]>(CASE_STUDIES_QUERY, {}, []),
  ])

  return (
    <Section>
      <PageHeader title={s.workTitle} intro={s.workIntro} />
      {studies.length ? (
        <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2">
          {studies.map((study) => (
            <CaseStudyCard key={study._id} study={study} headingLevel="h2" />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-10">{s.workEmpty}</p>
      )}
    </Section>
  )
}
