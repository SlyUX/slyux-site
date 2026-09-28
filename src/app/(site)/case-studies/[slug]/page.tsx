import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { ButtonLink, PageHeader, Section } from '@/components/ui'
import { MetricStrip, RichText } from '@/components/content'
import { Gallery } from '@/components/gallery'
import { CASE_STUDY_QUERY, CASE_STUDY_SLUGS_QUERY, safeFetch } from '@/lib/queries'
import { getSiteSettings } from '@/lib/site-settings'
import { urlFor } from '@/sanity/image'
import type { CaseStudyDetail } from '@/lib/types'

export async function generateStaticParams() {
  const slugs = await safeFetch<string[]>(CASE_STUDY_SLUGS_QUERY, {}, [])
  return slugs.map((slug) => ({ slug }))
}

const getStudy = (slug: string) => safeFetch<CaseStudyDetail | null>(CASE_STUDY_QUERY, { slug }, null)

export async function generateMetadata({ params }: PageProps<'/case-studies/[slug]'>): Promise<Metadata> {
  const study = await getStudy((await params).slug)
  if (!study) return {}
  return { title: study.title, description: study.seoDescription ?? study.summary }
}

export default async function CaseStudyPage({ params }: PageProps<'/case-studies/[slug]'>) {
  const [study, s] = await Promise.all([getStudy((await params).slug), getSiteSettings()])
  if (!study) notFound()

  const facts = [study.organization, study.role, study.years].filter(Boolean)
  const heroBg = study.heroBackground?.asset ? urlFor(study.heroBackground).width(2400).quality(70).url() : undefined

  return (
    <article>
      <Section className="relative isolate overflow-hidden pb-8 md:pb-10">
        {heroBg && (
          <>
            {/* Decorative: a faded collage of the project behind the title. */}
            <Image src={heroBg} alt="" fill priority sizes="100vw" className="-z-20 object-cover object-top" />
            <div aria-hidden className="from-background/40 via-background/75 to-background absolute inset-0 -z-10 bg-gradient-to-b" />
          </>
        )}
        <PageHeader title={study.title} intro={study.summary} eyebrow={study.organization} back={{ label: s.workTitle, href: '/case-studies' }} />
        {facts.length > 1 && (
          <p className="text-muted-foreground mt-6 text-sm">{facts.slice(1).join(' · ')}</p>
        )}
        {!!study.skills?.length && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {study.skills.map((skill) => (
              <li key={skill} className="bg-surface rounded-full px-3 py-1 text-sm">
                {skill}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* The card image repeats on the page only when there's no hero background. */}
      {study.heroImage?.asset && !heroBg && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Image
            src={urlFor(study.heroImage).width(2000).url()}
            alt={study.heroImage.alt ?? ''}
            width={2000}
            height={1250}
            priority
            sizes="(max-width: 1200px) 100vw, 1152px"
            className="h-auto w-full rounded-2xl"
          />
        </div>
      )}

      {!!study.metrics?.length && (
        <Section className="py-10 md:py-12">
          <MetricStrip metrics={study.metrics} />
        </Section>
      )}

      <Section className="pt-4 md:pt-6">
        <div className="mx-auto max-w-3xl">
          <RichText value={study.body} />
          {!!study.links?.length && (
            <div className="mt-10 flex flex-wrap gap-3">
              {study.links.map((link) => (
                <ButtonLink key={link._key} link={link} variant="secondary" />
              ))}
            </div>
          )}
        </div>
        {study.galleries?.map((gallery) => (
          <Gallery key={gallery._key} gallery={gallery} id={`gallery-${gallery._key}`} />
        ))}
      </Section>
    </article>
  )
}
