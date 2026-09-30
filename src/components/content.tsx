import Image from 'next/image'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { TypedObject } from '@portabletext/types'

import { TransitionLink } from '@/components/grid-nav'
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
      <div className="bg-surface relative aspect-[4/3] overflow-hidden rounded-2xl">
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
            className="text-heading/20 font-display flex h-full items-center justify-center blueprint-grid text-7xl"
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

/**
 * A piece on the Brand & Illustration page. Mature pieces show no artwork —
 * just the title and an outbound link — so the visitor chooses to go further.
 */
export function CreativeTile({
  work,
  matureLabel,
  large = false,
  headingLevel: Heading = 'h3',
}: {
  work: CreativeWorkCard
  matureLabel: string
  large?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  const outbound = externalHref(work.externalUrl)
  // Where the tile goes: its own story page, else its case study, else off-site.
  const section = sectionOfKind(work.kind)
  const href = work.mature
    ? outbound
    : work.hasStory && section
      ? `/portfolio/${section}/${work.slug}`
      : work.caseStudySlug
        ? `/case-studies/${work.caseStudySlug}`
        : outbound
  const meta = [work.client, work.year].filter(Boolean).join(' · ')

  if (work.mature) {
    return (
      <article className="border-border flex flex-col justify-between rounded-2xl border p-6">
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

  const image = work.image?.asset ? (
    <Image
      src={urlFor(work.image).width(large ? 1400 : 700).url()}
      alt={work.image.alt ?? ''}
      width={large ? 1400 : 700}
      height={large ? 1050 : 525}
      sizes={large ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 50vw, 33vw'}
      className="h-full w-full object-contain p-4"
    />
  ) : null

  return (
    <article className="group relative flex flex-col">
      <div className={cn('bg-surface flex items-center justify-center overflow-hidden rounded-2xl', large ? 'aspect-[4/3]' : 'aspect-square')}>
        {image}
      </div>
      <Heading className="mt-3 font-semibold">
        {href ? (
          href.startsWith('/') ? (
            <TransitionLink href={href} className="after:absolute after:inset-0 group-hover:text-primary">{work.title}</TransitionLink>
          ) : (
            <a href={href} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0 group-hover:text-primary">{work.title}</a>
          )
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
      return (
        <figure className="my-4">
          <Image
            src={urlFor(value).width(1600).url()}
            alt={value.alt ?? ''}
            width={1600}
            height={1000}
            sizes="(max-width: 768px) 100vw, 768px"
            className="h-auto w-full rounded-xl"
          />
          {value.caption && <figcaption className="text-muted-foreground mt-2 text-sm">{value.caption}</figcaption>}
        </figure>
      )
    },
  },
}

/** Body copy for case studies, creative stories, and pages. */
export function RichText({ value }: { value: TypedObject[] | null | undefined }) {
  if (!value?.length) return null
  return (
    <div className="space-y-5 text-lg leading-relaxed">
      <PortableText value={value} components={richTextComponents} />
    </div>
  )
}
