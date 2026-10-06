import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { TransitionLink } from '@/components/grid-nav'
import { PageHeader, Section } from '@/components/ui'
import { RichText, WorkStory } from '@/components/content'
import { DocumentGrid, readableDocuments } from '@/components/documents'
import { CREATIVE_WORK_PATHS_QUERY, CREATIVE_WORK_QUERY, safeFetch } from '@/lib/queries'
import { documentSettings, getSiteSettings } from '@/lib/site-settings'
import { externalHref } from '@/lib/utils'
import { urlFor } from '@/sanity/image'
import { isPortfolioSection, kindsInSection, sectionOfKind } from '@/sanity/portfolio'
import type { CreativeWorkDetail } from '@/lib/types'

export async function generateStaticParams() {
  const paths = await safeFetch<{ kind: string | null; slug: string | null }[]>(CREATIVE_WORK_PATHS_QUERY, {}, [])
  return paths.flatMap(({ kind, slug }) => {
    const section = sectionOfKind(kind)
    return section && slug ? [{ section, slug }] : []
  })
}

async function getWork(section: string, slug: string) {
  if (!isPortfolioSection(section)) return null
  return safeFetch<CreativeWorkDetail | null>(CREATIVE_WORK_QUERY, { slug, kinds: kindsInSection(section) }, null)
}

export async function generateMetadata({ params }: PageProps<'/portfolio/[section]/[slug]'>): Promise<Metadata> {
  const { section, slug } = await params
  const work = await getWork(section, slug)
  if (!work) return {}
  return stegaClean({ title: work.title, description: work.summary ?? undefined })
}

export default async function PortfolioPiecePage({ params }: PageProps<'/portfolio/[section]/[slug]'>) {
  const { section, slug } = await params
  const [work, s] = await Promise.all([getWork(section, slug), getSiteSettings()])
  if (!work || !isPortfolioSection(section)) notFound()

  const outbound = externalHref(work.externalUrl)
  const docSettings = documentSettings(s)
  const docs = readableDocuments(work.documents, docSettings.badge)
  // A UX piece's main image is the cover on its card (a document cover or a
  // typographic card); its page carries its own figures, so only "More images" show.
  const cover = section === 'ux' ? [] : [work.image]
  const images = [...cover, ...(work.gallery ?? [])].flatMap((img) =>
    img?.asset ? [{ ...img, ref: img.asset._ref }] : [],
  )
  const hasLinks = !!(work.caseStudy?.slug || outbound)

  return (
    <article>
      <Section className="pb-6 md:pb-8">
        <PageHeader
          title={work.title}
          intro={work.summary}
          eyebrow={[work.client, work.year].filter(Boolean).join(' · ') || null}
          back={{ label: s.portfolioSections[section].title, href: `/portfolio/${section}` }}
        />
        {work.credit && <p className="text-muted-foreground mt-4 text-sm">{work.credit}</p>}
      </Section>
      <Section className="pt-0 md:pt-0">
        <WorkStory
          body={work.body}
          extra={
            docs.length
              ? [{ key: 'documents', heading: s.documentsHeading, content: <DocumentGrid docs={docs} labels={docSettings.labels} /> }]
              : undefined
          }
          railHeading={s.howItStartedHeading}
          rail={work.howItStarted?.length ? <RichText value={work.howItStarted} compact /> : undefined}
        >
          {hasLinks && (
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
              {work.caseStudy?.slug && (
                <TransitionLink href={`/case-studies/${work.caseStudy.slug}`} className="text-primary font-semibold underline underline-offset-4">
                  {work.caseStudy.title}
                </TransitionLink>
              )}
              {outbound && (
                <a href={outbound} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline underline-offset-4">
                  {outbound.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              )}
            </div>
          )}
        </WorkStory>
        {/* PDFs, when there are any, stand in for the images. */}
        {!docs.length && images.length > 0 && (
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {images.map((img, i) => (
              <Image
                key={img.ref}
                src={urlFor(img).width(1400).url()}
                alt={img.alt ?? ''}
                width={1400}
                height={1050}
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="bg-surface h-auto w-full rounded-2xl"
              />
            ))}
          </div>
        )}
      </Section>
    </article>
  )
}
