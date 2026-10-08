import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { TransitionLink } from '@/components/transition-link'
import { buttonVariants, PageHeader, Section } from '@/components/ui'
import { imageSize, RichText, WorkStory } from '@/components/content'
import { Breadcrumb } from '@/components/breadcrumb'
import { DocumentGrid, readableDocuments } from '@/components/documents'
import { Lightbox, LightboxButton, type LightboxItem } from '@/components/lightbox'
import { CREATIVE_WORK_PATHS_QUERY, CREATIVE_WORK_QUERY, safeFetch } from '@/lib/queries'
import { documentSettings, galleryLabels, getSiteSettings } from '@/lib/site-settings'
import { externalHref } from '@/lib/utils'
import { urlFor } from '@/sanity/image'
import { isPortfolioSection, kindsInSection, PORTFOLIO_SECTIONS, sectionOfKind } from '@/sanity/portfolio'
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
  // The main image leads the page as its preview (or, for a UX piece, is only
  // the cover on its card), so the grid below the story shows "More images" only.
  const images = (work.gallery ?? []).flatMap((img) =>
    img?.asset ? [{ ...img, ref: img.asset._ref, size: imageSize(img) }] : [],
  )
  const labels = galleryLabels(s)
  const morePiece = `${work._id}-more`
  const moreItems: LightboxItem[] = images.flatMap((img, i) => {
    if (!img.size) return []
    const full = Math.min(2400, img.size.width)
    return [{
      key: `${morePiece}-${i}`,
      pieceKey: morePiece,
      title: work.title,
      alt: img.alt || work.title,
      src: urlFor(img).width(full).format('webp').quality(85).url(),
      width: full,
      height: Math.round((full * img.size.height) / img.size.width),
    }]
  })
  const hasLinks = !!(work.caseStudy?.slug || outbound)
  const heroSize = work.image?.asset ? imageSize(work.image) : undefined

  return (
    <article>
      <Section opener className="pb-6 md:pb-8">
        <PageHeader
          title={work.title}
          intro={work.summary}
          eyebrow={[work.client, work.year].filter(Boolean).join(' · ') || null}
          breadcrumb={
            <Breadcrumb
              parent={{ label: s.creativeTitle, href: '/portfolio' }}
              items={PORTFOLIO_SECTIONS.map((sec) => ({ label: s.portfolioSections[sec].title, href: `/portfolio/${sec}` }))}
              current={`/portfolio/${section}`}
              page={work.title}
            />
          }
        />
        {work.credit && <p className="text-muted-foreground mt-4 text-sm">{work.credit}</p>}
      </Section>
      {/*
        The improved state up front: the piece's main image, whole on white and
        capped in height so a logo never fills the screen. UX pieces skip it;
        their main image is a document cover, not the result.
      */}
      {section !== 'ux' && work.image?.asset && heroSize && (
        // Gutter outside, width inside — the same frame as Section, so the preview lines up with the text.
        <div className="px-4 pb-12 sm:px-6 md:pb-16">
          {work.kind === 'brand' ? (
            // A brand mark sits in generous white space on its card image. From md up,
            // zoom in ~30%, clipping only that margin; narrower screens show it whole,
            // since a wide wordmark would clip.
            <div className="bg-paper border-border relative mx-auto h-72 max-w-6xl overflow-hidden rounded-ui border sm:h-[28rem]">
              <Image
                src={urlFor(work.image).width(Math.min(2000, heroSize.width)).url()}
                alt={work.image.alt ?? ''}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1152px"
                className="object-contain md:scale-[1.3]"
              />
            </div>
          ) : (
            <div className="bg-paper border-border mx-auto flex max-w-6xl justify-center overflow-hidden rounded-ui border p-6 sm:p-10">
              <Image
                src={urlFor(work.image).width(Math.min(1800, heroSize.width)).url()}
                alt={work.image.alt ?? ''}
                width={heroSize.width}
                height={heroSize.height}
                priority
                sizes="(max-width: 1200px) 100vw, 1152px"
                className="h-auto max-h-[28rem] w-auto max-w-full object-contain"
              />
            </div>
          )}
        </div>
      )}
      <Section className="pt-0 md:pt-0">
        <WorkStory
          body={work.body}
          extra={
            docs.length
              ? [{ key: 'documents', heading: work.documentsHeading || s.documentsHeading, content: <DocumentGrid docs={docs} labels={docSettings.labels} /> }]
              : undefined
          }
          railHeading={s.howItStartedHeading}
          rail={work.howItStarted?.length ? <RichText value={work.howItStarted} compact /> : undefined}
        >
          {/* Links out, as secondary buttons, the same as on case studies. */}
          {hasLinks && (
            <div className="mt-10 flex flex-wrap gap-3">
              {work.caseStudy?.slug && (
                <TransitionLink href={`/case-studies/${work.caseStudy.slug}`} className={buttonVariants({ variant: 'secondary' })}>
                  {work.caseStudy.title}
                </TransitionLink>
              )}
              {outbound && (
                <a href={outbound} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'secondary' })}>
                  {outbound.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              )}
            </div>
          )}
        </WorkStory>
        {/* PDFs, when there are any, stand in for the images. The images are one gallery: each opens the viewer at itself. */}
        {!docs.length && images.length > 0 && (
          <Lightbox items={moreItems} labels={labels}>
            <div className="mt-16 grid gap-6 md:grid-cols-2">
              {images.map((img, i) => (
                <LightboxButton
                  key={img.ref}
                  pieceKey={morePiece}
                  at={i}
                  label={`${labels.enlarge}: ${img.alt || work.title}`}
                  className="block w-full cursor-zoom-in"
                >
                  <Image
                    src={urlFor(img).width(1400).url()}
                    alt={img.alt ?? ''}
                    width={1400}
                    height={img.size ? Math.round((1400 * img.size.height) / img.size.width) : 1050}
                    priority={i === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="bg-paper rounded-ui h-auto w-full"
                  />
                </LightboxButton>
              ))}
            </div>
          </Lightbox>
        )}
      </Section>
    </article>
  )
}
