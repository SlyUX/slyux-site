import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'

import { TransitionLink } from '@/components/transition-link'
import { buttonVariants, PageHeader, Section, SectionHeading } from '@/components/ui'
import { CaseStudyTile, CreativeTile, isDeepCard, lightboxItems } from '@/components/content'
import { Lightbox } from '@/components/lightbox'
import { CASE_STUDIES_QUERY, PORTFOLIO_SECTION_QUERY, safeFetch } from '@/lib/queries'
import { galleryLabels, getSiteSettings } from '@/lib/site-settings'
import { cn } from '@/lib/utils'
import { PORTFOLIO_KINDS, PORTFOLIO_SECTIONS, kindsInSection, sectionOfKind } from '@/sanity/portfolio'
import type { CaseStudyCard as CaseStudyCardData, CreativeWorkCard } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return stegaClean({ title: s.creativeTitle, description: s.creativeIntro ?? undefined })
}

/** How many pieces each section previews on the landing page: one row. UX cards are wide, three to a row. */
const previewCount = (section: string) => (section === 'ux' ? 3 : 4)

/**
 * The UX row: a case study, then two pieces. Each is picked in Site settings;
 * otherwise the case study is the UX page's first, and the pieces are the
 * first of each row on the UX page, in its order (Design systems first).
 */
async function uxPreview(s: Awaited<ReturnType<typeof getSiteSettings>>, works: CreativeWorkCard[]) {
  const study: CaseStudyCardData | undefined = s.portfolioUxCaseStudy?.slug
    ? s.portfolioUxCaseStudy
    : (s.uxCaseStudies?.[0] ?? (await safeFetch<CaseStudyCardData[]>(CASE_STUDIES_QUERY, {}, []))[0])
  const usable = (w: CreativeWorkCard) => sectionOfKind(w.kind) === 'ux' && !w.mature
  const picked = (s.portfolioUxPieces ?? []).filter(usable)
  const rowFirsts = kindsInSection('ux').flatMap((kind) => works.find((w) => w.kind === kind && !w.mature) ?? [])
  const pieces = [...picked, ...rowFirsts.filter((w) => !picked.some((p) => p._id === w._id))].slice(0, previewCount('ux') - (study ? 1 : 0))
  return { study, pieces }
}

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
  const ux = await uxPreview(s, works)
  const sections = PORTFOLIO_SECTIONS.map((section) => {
    const pieces = works.filter((w) => sectionOfKind(w.kind) === section && !w.mature)
    return {
      section,
      copy: s.portfolioSections[section],
      study: section === 'ux' ? ux.study : undefined,
      items:
        section === 'ux'
          ? ux.pieces
          : [...pieces.filter(isDeepCard), ...pieces.filter((w) => !isDeepCard(w))].slice(0, previewCount(section)),
    }
  }).filter((entry) => entry.study || entry.items.length > 0)

  const labels = galleryLabels(s)

  return (
    <>
      <Section opener className="pb-10 md:pb-12">
        <PageHeader title={s.creativeTitle} intro={s.creativeIntro} />
      </Section>
      {/* Each section a full-width band, alternating from the surface tone, like the subpages. */}
      {sections.map(({ section, copy, study, items }, i) => (
        <Section key={section} aria-labelledby={`portfolio-${section}`} tone={i % 2 === 0 ? 'surface' : 'default'}>
          <SectionHeading
            id={`portfolio-${section}`}
            intro={copy.intro}
            action={
              <TransitionLink href={`/portfolio/${section}`} className={buttonVariants({ variant: 'secondary' })}>
                {s.portfolioViewAll}
                <span className="sr-only"> {copy.title}</span>
              </TransitionLink>
            }
          >
            <TransitionLink href={`/portfolio/${section}`} className="hover:text-primary">
              {copy.title}
            </TransitionLink>
          </SectionHeading>
          <Lightbox items={lightboxItems(items)} labels={labels}>
            <div className={cn('grid gap-x-6 gap-y-10', section === 'ux' ? 'sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4')}>
              {study && <CaseStudyTile study={study} label={s.caseStudyLabel} />}
              {items.map((work) => (
                <CreativeTile
                  key={work._id}
                  work={work}
                  matureLabel={s.matureLabel}
                  enlargeLabel={labels.enlarge}
                  imageCountLabel={labels.imageCount}
                  kindLabels={s.kindLabels}
                  headingLevel="h3"
                />
              ))}
            </div>
          </Lightbox>
        </Section>
      ))}
    </>
  )
}
