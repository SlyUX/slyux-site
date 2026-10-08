import Image from 'next/image'
import { PortableText, toPlainText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock, TypedObject } from '@portabletext/types'
import { ExternalLink, FolderOpen, Maximize2 } from 'lucide-react'

import { TransitionLink } from '@/components/grid-nav'
import { LightboxButton, type LightboxItem } from '@/components/lightbox'
import { Rail } from '@/components/rail'
import { cn, externalHref } from '@/lib/utils'
import { urlFor } from '@/sanity/image'
import { sectionOfKind } from '@/sanity/portfolio'
import type { CaseStudyCard as CaseStudyCardData, CmsMetric, CreativeWorkCard, SanityImage } from '@/lib/types'

/** A row of headline numbers. Used by the home proof strip and case studies. */
export function MetricStrip({
  metrics,
  tone = 'default',
}: {
  metrics: CmsMetric[] | null | undefined
  tone?: 'default' | 'ink' | 'brand'
}) {
  if (!metrics?.length) return null
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
      {metrics.map((m) => (
        // The number reads first (order-first on <dd>); <dt> stays first in the DOM so
        // assistive tech still announces label → value.
        <div key={`${m.value}-${m.label}`} className="flex flex-col gap-1">
          <dt
            className={cn(
              'text-sm leading-snug',
              { default: 'text-muted-foreground', ink: 'text-ink-muted', brand: 'text-brand-muted' }[tone],
            )}
          >
            {m.label}
          </dt>
          <dd
            className={cn(
              'font-display order-first text-4xl font-semibold',
              { default: 'text-primary', ink: 'text-fox', brand: 'text-highlight' }[tone],
            )}
          >
            {m.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Card linking to a case study. Same shape on the home page and /work. */
export function CaseStudyCard({ study, headingLevel = 'h3' }: { study: CaseStudyCardData; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel
  const lead = study.metrics?.[0]
  return (
    <article className="group relative flex flex-col">
      <div className="bg-paper relative aspect-[4/3] overflow-hidden rounded-2xl">
        {study.heroImage?.asset ? (
          <Image
            // Uncropped at the source; the frame crops from the top-left, where
            // screenshots (most card images) start reading.
            src={urlFor(study.heroImage).width(1100).url()}
            alt={study.heroImage.alt ?? ''}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          // No image yet: a faint blueprint grid with the title's initial in navy.
          <div
            aria-hidden
            className="bg-surface text-heading/20 font-display flex h-full items-center justify-center blueprint-grid text-7xl"
          >
            {study.title.charAt(0)}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-1">
        {(study.organization || study.years) && (
          <p className="text-muted-foreground text-sm">{[study.organization, study.years].filter(Boolean).join(' · ')}</p>
        )}
        <Heading className="font-display text-2xl font-semibold">
          <TransitionLink href={`/case-studies/${study.slug}`} className="after:absolute after:inset-0 group-hover:text-primary">
            {study.title}
          </TransitionLink>
        </Heading>
        <p className="text-muted-foreground leading-relaxed">{study.summary}</p>
        {lead && (
          <p className="mt-1 text-sm font-semibold">
            <span className="text-primary">{lead.value}</span> {lead.label}
          </p>
        )}
      </div>
    </article>
  )
}

type CardImage = NonNullable<CreativeWorkCard['image']>

/** An image's size after its Studio crop, from the asset ID ("image-<hash>-1600x900-jpg"). */
export function imageSize(image: Pick<CardImage, 'asset' | 'crop'>) {
  const [w, h] = (image.asset?._ref?.match(/-(\d+)x(\d+)-/)?.slice(1) ?? []).map(Number)
  if (!w || !h) return undefined
  const c = image.crop
  return {
    width: Math.round(w * (1 - (c?.left ?? 0) - (c?.right ?? 0))),
    height: Math.round(h * (1 - (c?.top ?? 0) - (c?.bottom ?? 0))),
  }
}

/**
 * Where a piece's card goes: its own page (a story or PDFs), else its case
 * study, else off-site. Mature pieces only ever link out. `undefined` means
 * the card opens its artwork in the lightbox instead.
 */
export function cardHref(work: CreativeWorkCard): string | undefined {
  const outbound = externalHref(work.externalUrl)
  const section = sectionOfKind(work.kind)
  if (work.mature) return outbound
  if (work.hasPage && section) return `/portfolio/${section}/${work.slug}`
  if (work.caseStudySlug) return `/case-studies/${work.caseStudySlug}`
  return outbound
}

/**
 * The lightbox's images for a group of cards: every card that doesn't link
 * anywhere, its main image then its "More images", in card order.
 */
export function lightboxItems(works: CreativeWorkCard[]): LightboxItem[] {
  return works.flatMap((work) => {
    if (work.mature || cardHref(work)) return []
    return [work.image, ...(work.gallery ?? [])].flatMap((image, i) => {
      const size = image?.asset ? imageSize(image) : undefined
      if (!image || !size) return []
      // Big enough to judge the work on a large screen; never more than the source.
      const width = Math.min(2400, size.width)
      return [{
        key: `${work._id}-${i}`,
        pieceKey: work._id,
        title: work.title,
        alt: image.alt || work.title,
        src: urlFor(image).width(width).format('webp').quality(85).url(),
        width,
        height: Math.round((width * size.height) / size.width),
      }]
    })
  })
}

/**
 * A case study as a compact card among portfolio pieces (the UX page's top
 * row): wide image under the navy edge, title, and organization, with an
 * optional "Case study" chip. The full card, with summary and metric, is
 * CaseStudyCard.
 */
export function CaseStudyTile({
  study,
  label,
  details = false,
  headingLevel: Heading = 'h3',
}: {
  study: CaseStudyCardData
  /** The chip text; omit where a heading already says "Case studies". */
  label?: string
  /** Two to a row on the Case Studies page: a larger title, the summary (three lines at most), and the lead metric. */
  details?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  const meta = [study.organization, study.years].filter(Boolean).join(' · ')
  const lead = details ? study.metrics?.[0] : undefined
  return (
    <article className="group relative flex flex-col">
      <div className="border-border bg-paper group-hover:border-primary relative aspect-[3/2] overflow-hidden rounded-2xl border transition-colors">
        {study.heroImage?.asset && (
          <Image
            // Uncropped at the source; the frame crops from the top-left, where screenshots start reading.
            src={urlFor(study.heroImage).width(1100).url()}
            alt={study.heroImage.alt ?? ''}
            fill
            sizes={details ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
            className="object-cover object-left-top"
          />
        )}
        <span aria-hidden className="bg-footer absolute inset-x-0 top-0 h-[5px]" />
        {label && <KindChip label={label} deep className="absolute top-3 left-3 shadow-sm" />}
        <CardAction action="page" />
      </div>
      <Heading className={cn('font-semibold', details ? 'mt-4 text-xl' : 'mt-3')}>
        <TransitionLink href={`/case-studies/${study.slug}`} className="after:absolute after:inset-0 group-hover:text-primary">
          {study.title}
        </TransitionLink>
      </Heading>
      {meta && <p className="text-muted-foreground text-sm">{meta}</p>}
      {details && study.summary && <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">{study.summary}</p>}
      {lead && (
        <p className="mt-2 text-sm font-semibold">
          <span className="text-primary">{lead.value}</span> {lead.label}
        </p>
      )}
    </article>
  )
}

/**
 * One case study as a row in the Case Studies page's featured band: the
 * thumbnail beside its summary, so the text reads as a dek. Its title sits a
 * step below the band heading.
 * `flip` puts the thumbnail on the right; the page alternates it down the rows.
 * Phones stack the thumbnail above the text.
 */
export function CaseStudyRow({
  study,
  flip = false,
  priority = false,
  headingLevel: Heading = 'h3',
}: {
  study: CaseStudyCardData
  flip?: boolean
  priority?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  const meta = [study.organization, study.years].filter(Boolean).join(' · ')
  const lead = study.metrics?.[0]
  return (
    <article className="group relative grid items-center gap-6 md:grid-cols-2 md:gap-12">
      <div
        className={cn(
          'border-border bg-paper group-hover:border-primary relative aspect-[3/2] overflow-hidden rounded-2xl border transition-colors',
          flip && 'md:order-last',
        )}
      >
        {study.heroImage?.asset ? (
          <Image
            // Uncropped at the source; the frame crops from the top-left, where screenshots start reading.
            src={urlFor(study.heroImage).width(1200).url()}
            alt={study.heroImage.alt ?? ''}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-left-top"
          />
        ) : (
          // No image yet: the same blueprint placeholder as the home page cards.
          <div aria-hidden className="bg-surface text-heading/20 font-display blueprint-grid flex h-full items-center justify-center text-7xl">
            {study.title.charAt(0)}
          </div>
        )}
        <span aria-hidden className="bg-footer absolute inset-x-0 top-0 h-[5px]" />
        <CardAction action="page" />
      </div>
      <div className="flex flex-col gap-2">
        {meta && <p className="text-muted-foreground text-sm">{meta}</p>}
        <Heading className="font-display text-2xl font-semibold">
          <TransitionLink href={`/case-studies/${study.slug}`} className="after:absolute after:inset-0 group-hover:text-primary">
            {study.title}
          </TransitionLink>
        </Heading>
        {study.summary && <p className="text-muted-foreground leading-relaxed">{study.summary}</p>}
        {lead && (
          <p className="mt-1 text-sm font-semibold">
            <span className="text-primary">{lead.value}</span> {lead.label}
          </p>
        )}
      </div>
    </article>
  )
}

/** Cards with a full page behind them: a project page or a case study. */
export const isDeepCard = (work: CreativeWorkCard) => !!cardHref(work)?.startsWith('/')

/**
 * What clicking a card does, in its thumbnail's top-right corner (across from
 * the chip): a folder opens a project page or case study, diverging arrows
 * open the artwork larger, an outward arrow opens another site. Decorative —
 * the card's link or button already says where it goes.
 */
function CardAction({ action }: { action: 'page' | 'enlarge' | 'external' }) {
  const Icon = { page: FolderOpen, enlarge: Maximize2, external: ExternalLink }[action]
  return (
    <span
      aria-hidden
      className="bg-background/90 text-foreground absolute top-3 right-3 flex size-8 items-center justify-center rounded-full shadow-md"
    >
      <Icon className="size-4" />
    </span>
  )
}

/** The label naming what a piece is; in color on cards with a full page behind them. */
function KindChip({ label, deep, className }: { label: string; deep: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        deep ? 'bg-project text-project-foreground' : 'bg-surface text-muted-foreground',
        className,
      )}
    >
      {label}
    </span>
  )
}

/**
 * A portfolio card. The artwork fills the card, cropped around the image's
 * focal point. It shows whole, on white, for brand and logo work (logos are
 * never cropped), transparent images, and pieces set to "Show the whole
 * image". A chip names the kind of piece; cards with a full page behind them
 * get it in burnt orange under a navy top edge. Mature pieces show no artwork:
 * just the title and an outbound link, so the visitor chooses to go further.
 * Cards that don't link anywhere open their artwork larger (see Lightbox).
 */
export function CreativeTile({
  work,
  matureLabel,
  enlargeLabel,
  kindLabels,
  large = false,
  headingLevel: Heading = 'h3',
}: {
  work: CreativeWorkCard
  matureLabel: string
  /** Names the lightbox button, e.g. "View larger". */
  enlargeLabel: string
  /** Chip text per kind, from Site settings. Omit where a heading already names the kind. */
  kindLabels?: Record<string, string>
  large?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  const outbound = externalHref(work.externalUrl)
  const href = cardHref(work)
  const deep = !!href?.startsWith('/')
  const kindLabel = work.kind ? kindLabels?.[work.kind] : undefined
  const meta = [work.client, work.year].filter(Boolean).join(' · ')

  if (work.mature) {
    return (
      <article className="border-border flex flex-col justify-between rounded-2xl border p-6">
        {kindLabel && <KindChip label={kindLabel} deep={false} className="mb-3 self-start" />}
        <Heading className="font-display text-xl font-semibold">{work.title}</Heading>
        {work.summary && <p className="text-muted-foreground mt-2 text-sm">{work.summary}</p>}
        {outbound && (
          <a href={outbound} target="_blank" rel="noopener noreferrer" className="text-primary mt-4 text-sm font-semibold underline underline-offset-4">
            {matureLabel}
          </a>
        )}
      </article>
    )
  }

  // UX pieces are documents and slides, so their cards are wide (3:2) everywhere;
  // other cards are 4:3 when large and square in grids.
  const shape = sectionOfKind(work.kind) === 'ux' ? 'wide' : large ? 'large' : 'square'
  const card = { wide: { width: 1500, height: 1000 }, large: { width: 1400, height: 1050 }, square: { width: 800, height: 800 } }[shape]
  const sizes = shape === 'square' ? '(max-width: 768px) 50vw, 25vw' : large ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, 33vw'
  const size = work.image?.asset ? imageSize(work.image) : undefined
  const whole = sectionOfKind(work.kind) === 'brand' || work.cardFit === 'whole' || work.opaque === false
  let image: React.ReactNode = null
  if (work.image && size) {
    if (whole) {
      const width = Math.min(card.width, size.width)
      image = (
        <Image
          src={urlFor(work.image).width(width).url()}
          alt={work.image.alt ?? ''}
          width={width}
          height={Math.round((width * size.height) / size.width)}
          sizes={sizes}
          className="h-full w-full object-contain p-4"
        />
      )
    } else {
      // Cropped to the card's shape by Sanity, around the focal point; never upscaled.
      const scale = Math.min(1, size.width / card.width, size.height / card.height)
      const width = Math.round(card.width * scale)
      const height = Math.round(card.height * scale)
      image = (
        <Image
          src={urlFor(work.image).width(width).height(height).url()}
          alt={work.image.alt ?? ''}
          width={width}
          height={height}
          sizes={sizes}
          className="h-full w-full object-cover"
        />
      )
    }
  }

  const stretch = 'after:absolute after:inset-0 group-hover:text-primary'
  return (
    <article className="group relative flex flex-col">
      <div
        className={cn(
          'border-border bg-paper group-hover:border-primary relative overflow-hidden rounded-2xl border transition-colors',
          { wide: 'aspect-[3/2]', large: 'aspect-[4/3]', square: 'aspect-square' }[shape],
        )}
      >
        {image}
        {deep && <span aria-hidden className="bg-footer absolute inset-x-0 top-0 h-[5px]" />}
        {kindLabel && <KindChip label={kindLabel} deep={deep} className="absolute top-3 left-3 shadow-sm" />}
        {href ? <CardAction action={deep ? 'page' : 'external'} /> : image && <CardAction action="enlarge" />}
      </div>
      <Heading className="mt-3 font-semibold">
        {href ? (
          href.startsWith('/') ? (
            <TransitionLink href={href} className={stretch}>{work.title}</TransitionLink>
          ) : (
            <a href={href} target="_blank" rel="noopener noreferrer" className={stretch}>{work.title}</a>
          )
        ) : image ? (
          <LightboxButton pieceKey={work._id} label={`${enlargeLabel}: ${work.title}`} className={cn(stretch, 'text-left')}>
            {work.title}
          </LightboxButton>
        ) : (
          work.title
        )}
      </Heading>
      {meta && <p className="text-muted-foreground text-sm">{meta}</p>}
      {work.credit && <p className="text-muted-foreground mt-1 text-xs">{work.credit}</p>}
    </article>
  )
}

const richTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h2: ({ children }) => <h2 className="font-display pt-6 text-3xl font-semibold">{children}</h2>,
    h3: ({ children }) => <h3 className="pt-3 text-xl font-semibold">{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote className="border-fox font-display border-l-4 pl-5 text-2xl leading-snug">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-2 pl-5">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal space-y-2 pl-5">{children}</ol>,
  },
  marks: {
    link: ({ value, children }: { value?: { href?: string }; children: React.ReactNode }) => {
      const href = externalHref(value?.href)
      if (!href) return <>{children}</>
      return (
        <a href={href} className="text-primary underline underline-offset-4 hover:no-underline" {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {children}
        </a>
      )
    },
  },
  types: {
    imageWithAlt: ({ value }: { value: SanityImage }) => {
      if (!value?.asset) return null
      // Asset IDs carry the source size ("image-<hash>-431x81-jpg"). Never
      // request or display more pixels than that, so small images (an old
      // logo) stay crisp instead of being stretched to the column width.
      const [w, h] = (value.asset._ref?.match(/-(\d+)x(\d+)-/)?.slice(1) ?? ['1600', '1000']).map(Number)
      const width = Math.min(1600, w)
      return (
        // The figure is only as wide as the image, so the caption centers on the image, not the column.
        <figure className="my-4" style={{ maxWidth: w }}>
          <Image
            src={urlFor(value).width(width).url()}
            alt={value.alt ?? ''}
            width={width}
            height={Math.round((width * h) / w)}
            sizes={`(max-width: 768px) 100vw, ${Math.min(768, w)}px`}
            className="bg-paper h-auto w-full rounded-xl"
          />
          {value.caption && <figcaption className="text-caption mt-2 text-center text-sm">{value.caption}</figcaption>}
        </figure>
      )
    },
  },
}

/** A section a page adds after the written story, e.g. its documents. */
export interface ExtraSection {
  key: string
  heading: string
  content: React.ReactNode
}

type StorySection = { key: string; heading?: string; content: React.ReactNode }

/**
 * A story split at its H2s, then any `extra` sections. Text before the first
 * heading leads as a section without one.
 */
function splitStory(value: TypedObject[] | null | undefined, extra: ExtraSection[] = []): StorySection[] {
  const written: { key: string; heading?: string; blocks: TypedObject[] }[] = []
  for (const [i, block] of (value ?? []).entries()) {
    if (block._type === 'block' && (block as { style?: string }).style === 'h2') {
      written.push({ key: block._key ?? `s${i}`, heading: toPlainText([block as PortableTextBlock]), blocks: [] })
    } else {
      if (!written.length) written.push({ key: 'intro', blocks: [] })
      written[written.length - 1].blocks.push(block)
    }
  }
  return [...written.map(({ key, heading, blocks }) => ({ key, heading, content: <RichText value={blocks} /> })), ...extra]
}

/**
 * Story sections as heading | copy (heading on the left, pinned while its
 * section scrolls), with a hairline between them. Beside a rail there's less
 * room, so the split waits for wider screens.
 */
function StorySections({ sections, beside = false }: { sections: StorySection[]; beside?: boolean }) {
  if (!sections.length) return null
  return (
    <div className="divide-border divide-y">
      {sections.map((section) => (
        <section
          key={section.key}
          aria-labelledby={section.heading ? `story-${section.key}` : undefined}
          className={cn(
            'grid gap-x-10 gap-y-4 py-10 first:pt-0 last:pb-0',
            beside ? 'xl:grid-cols-[13rem_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]',
          )}
        >
          {section.heading && (
            <h2
              id={`story-${section.key}`}
              className={cn(
                'font-display text-3xl font-semibold text-balance',
                beside ? 'xl:sticky xl:top-6 xl:self-start xl:text-2xl' : 'lg:sticky lg:top-6 lg:self-start',
              )}
            >
              {section.heading}
            </h2>
          )}
          <div className={beside ? 'xl:col-start-2' : 'lg:col-start-2'}>{section.content}</div>
        </section>
      ))}
    </div>
  )
}

/**
 * The story of a piece of work, shared by case studies and portfolio pages:
 * heading | copy sections, and — when there is one — the "How it started…"
 * rail (see Rail), on its own card so it reads as reference. It follows the
 * first section (At a glance) in reading order: folded there on phones,
 * moved to the right-hand column from lg. Not pinned: a rail of screenshots
 * can be taller than the screen.
 */
export function WorkStory({
  body,
  extra,
  rail,
  railHeading,
  children,
}: {
  body: TypedObject[] | null | undefined
  /** Sections after the written story, e.g. documents. */
  extra?: ExtraSection[]
  /** Rail content; omit for no rail. */
  rail?: React.ReactNode
  railHeading: string
  /** After the story in the same column, e.g. links. */
  children?: React.ReactNode
}) {
  const sections = splitStory(body, extra)
  if (!rail) {
    return (
      <div>
        <StorySections sections={sections} />
        {children}
      </div>
    )
  }

  const [first, ...rest] = sections
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-x-12 xl:gap-x-16">
      {first && (
        <div className="lg:col-start-1 lg:row-start-1">
          <StorySections sections={[first]} beside />
        </div>
      )}
      <Rail heading={railHeading} className="mt-10 lg:col-start-2 lg:row-[1/span_2] lg:mt-0">
        {rail}
      </Rail>
      <div className={cn('lg:col-start-1 lg:row-start-2', rest.length > 0 && 'border-border mt-10 border-t pt-10')}>
        <StorySections sections={rest} beside />
        {children}
      </div>
    </div>
  )
}

/** Body copy for case studies, creative stories, and pages. */
export function RichText({ value, compact = false }: { value: TypedObject[] | null | undefined; compact?: boolean }) {
  if (!value?.length) return null
  return (
    <div className={compact ? 'space-y-3 text-sm leading-relaxed' : 'space-y-5 text-lg leading-relaxed'}>
      <PortableText value={value} components={richTextComponents} />
    </div>
  )
}
