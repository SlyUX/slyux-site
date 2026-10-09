import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { AiNote } from '@/components/ai-statement'
import { Breadcrumb } from '@/components/breadcrumb'
import { breadcrumbLd, JsonLd, personId } from '@/components/json-ld'
import { ButtonLink, PageHeader, Section } from '@/components/ui'
import { MetricStrip, WorkStory } from '@/components/content'
import { Gallery, GalleryStack } from '@/components/gallery'
import { Personas } from '@/components/personas'
import { RelatedWork } from '@/components/related-work'
import { CASE_STUDY_QUERY, CASE_STUDY_SLUGS_QUERY, safeFetch } from '@/lib/queries'
import { galleryLabels, getSiteSettings } from '@/lib/site-settings'
import { absoluteUrl, SITE_URL } from '@/lib/site-url'
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
  return stegaClean({ title: study.title, description: study.seoDescription ?? study.summary })
}

export default async function CaseStudyPage({ params }: PageProps<'/case-studies/[slug]'>) {
  const [study, s] = await Promise.all([getStudy((await params).slug), getSiteSettings()])
  if (!study) notFound()

  const facts = [study.organization, study.role, study.years].filter(Boolean)
  const heroBg = study.heroBackground?.asset ? urlFor(study.heroBackground).width(2400).quality(70).url() : undefined

  // Page order: introduction → story (current state in a rail beside it) → personas → new design.
  const galleries = study.galleries ?? []
  const before = galleries.filter((g) => g.placement === 'before')
  const after = galleries.filter((g) => g.placement !== 'before')
  const labels = galleryLabels(s)

  const path = `/case-studies/${study.slug}`
  const structured = stegaClean([
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': `${absoluteUrl(path)}#work`,
      url: absoluteUrl(path),
      name: study.title,
      description: study.summary,
      image: study.heroImage?.asset ? urlFor(study.heroImage).width(1200).url() : undefined,
      author: { '@id': personId(SITE_URL) },
      sourceOrganization: study.organization ? { '@type': 'Organization', name: study.organization } : undefined,
      temporalCoverage: study.years ?? undefined,
      keywords: study.skills?.join(', '),
    },
    breadcrumbLd(SITE_URL, [{ label: s.workTitle, href: '/case-studies' }], { label: study.title ?? '', href: path }),
  ])

  return (
    <article>
      <JsonLd data={structured} />
      <Section opener className="relative isolate overflow-hidden pb-8 md:pb-10">
        {heroBg && (
          <>
            {/* Decorative: a faded collage of the project behind the title. */}
            <Image src={heroBg} alt="" fill priority sizes="100vw" className="-z-20 object-cover object-top" />
            <div aria-hidden className="from-background/40 via-background/75 to-background absolute inset-0 -z-10 bg-gradient-to-b" />
          </>
        )}
        <PageHeader
          title={study.title}
          intro={study.summary}
          eyebrow={study.organization}
          breadcrumb={<Breadcrumb trail={[{ label: s.workTitle, href: '/case-studies' }]} page={study.title} />}
        />
        {(facts.length > 1 || study.aiNote) && (
          <p className="text-muted-foreground mt-6 text-sm">
            {facts.slice(1).join(' · ')}
            {study.aiNote && <AiNote />}
          </p>
        )}
        {!!study.skills?.length && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {study.skills.map((skill) => (
              <li key={skill} className="bg-surface rounded-ui px-3 py-1 text-sm">
                {skill}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/*
        The improved state up front: the card image as a preview right after the
        introduction, so the outcome lands before the story explains it. Framed
        16:9 from the top-left, where screenshots start reading; the full screens
        are in the galleries below.
      */}
      {study.heroImage?.asset && (
        // Gutter outside, width inside — the same frame as Section, so the preview lines up with the text.
        <div className="px-4 sm:px-6">
          <div className="bg-paper border-border relative mx-auto aspect-[16/9] max-w-6xl overflow-hidden rounded-ui border">
            <Image
              src={urlFor(study.heroImage).width(2304).url()}
              alt={study.heroImage.alt ?? ''}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1152px"
              className="object-cover object-left-top"
            />
          </div>
        </div>
      )}

      {!!study.metrics?.length && (
        <Section className="py-10 md:py-12">
          <MetricStrip metrics={study.metrics} />
        </Section>
      )}

      {/* The story, with the current state in the "How it started…" rail (see WorkStory). */}
      <Section>
        <WorkStory
          body={study.body}
          railHeading={s.howItStartedHeading}
          rail={
            before.length > 0 ? (
              <GalleryStack rail>
                {before.map((gallery) => (
                  <Gallery
                    key={gallery._key}
                    gallery={gallery}
                    id={`gallery-${gallery._key}`}
                    labels={labels}
                    rail
                    headingAs={before.length > 1 ? 'h3' : 'none'}
                  />
                ))}
              </GalleryStack>
            ) : undefined
          }
        >
          {!!study.links?.length && (
            <div className="mt-10 flex flex-wrap gap-3">
              {study.links.map((link) => (
                <ButtonLink key={link._key} link={link} variant="secondary" />
              ))}
            </div>
          )}
        </WorkStory>
      </Section>

      {!!study.personas?.length && (
        <Section className="pt-0 md:pt-0">
          <Personas
            personas={study.personas}
            heading={s.personasHeading}
            intro={study.personasIntro}
            labels={{ opportunities: s.opportunitiesLabel, barriers: s.barriersLabel }}
          />
        </Section>
      )}

      {after.length > 0 && (
        <Section className="pt-0 md:pt-0">
          <GalleryStack>
            {after.map((gallery) => (
              <Gallery key={gallery._key} gallery={gallery} id={`gallery-${gallery._key}`} labels={labels} />
            ))}
          </GalleryStack>
        </Section>
      )}

      <RelatedWork
        picks={study.relatedPicks}
        back={study.relatedBack}
        heading={s.relatedHeading}
        caseStudyLabel={s.caseStudyLabel}
        kindLabels={s.kindLabels}
        labels={labels}
      />
    </article>
  )
}
