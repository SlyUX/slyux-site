import Image from 'next/image'
import { TransitionLink } from '@/components/transition-link'
import { TrackedText } from '@/components/tracked-text'
import { Briefcase, FileText, LayoutGrid, MessageCircle, Palette, User, type LucideIcon } from 'lucide-react'

import { urlFor } from '@/sanity/image'
import type { SanityImage } from '@/lib/types'

const ICONS: Record<string, LucideIcon> = {
  resume: FileText,
  work: LayoutGrid,
  about: User,
  contact: MessageCircle,
  creative: Palette,
  hire: Briefcase,
}

export interface QuickAction {
  _key: string
  label: string
  href: string
  icon?: string | null
}

interface HeroProps {
  eyebrow?: string | null
  headline: string
  intro?: string | null
  brandmark?: SanityImage | null
  videoUrl?: string | null
  videoType?: string | null
  poster?: { asset?: { _ref: string } } | null
  actions?: QuickAction[] | null
  /** The site map, so quick actions pan like the main navigation. */
}

/**
 * The home page's first viewport: the site's funnel. Brandmark, positioning,
 * and one-click shortcuts over a muted, looping blueprint video.
 *
 * The video is decorative (aria-hidden). Under `prefers-reduced-motion` it is
 * hidden by CSS and the poster still shows instead — no client JS needed.
 * A dark scrim keeps white text above AA contrast whatever frame is showing.
 */
export function Hero({ eyebrow, headline, intro, brandmark, videoUrl, videoType, poster, actions }: HeroProps) {
  const posterUrl = poster?.asset ? urlFor(poster).width(1920).quality(70).url() : undefined

  return (
    <section className="bg-ink text-ink-foreground relative isolate overflow-hidden">
      {posterUrl && (
        <Image src={posterUrl} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
      )}
      {videoUrl && (
        <video
          aria-hidden
          autoPlay
          muted
          loop
          playsInline
          poster={posterUrl}
          className="-z-10 absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
        >
          <source src={videoUrl} type={videoType ?? 'video/mp4'} />
        </video>
      )}
      {/* Scrim: keeps text legible over any video frame. */}
      <div aria-hidden className="bg-ink/80 absolute inset-0 -z-10" />

      <div className="mx-auto flex min-h-[80svh] max-w-6xl flex-col items-center justify-center px-4 py-14 md:py-16 text-center sm:px-6">
        {brandmark?.asset ? (
          <h1>
            <Image
              src={urlFor(brandmark).width(1000).url()}
              alt={brandmark.alt || eyebrow || ''}
              width={1000}
              height={375}
              priority
              className="mx-auto h-auto w-full max-w-xs md:max-w-sm"
            />
            <span className="font-display mx-auto mt-6 block max-w-4xl text-2xl leading-snug font-semibold text-balance md:text-3xl">
              {headline}
            </span>
          </h1>
        ) : (
          <>
            {eyebrow && <p className="text-fox mb-4 text-sm font-semibold tracking-wide uppercase"><TrackedText>{eyebrow}</TrackedText></p>}
            <h1 className="font-display max-w-4xl text-4xl leading-[1.1] font-semibold tracking-tight md:text-5xl">
              {headline}
            </h1>
          </>
        )}
        {intro && <p className="text-ink-muted mt-4 max-w-2xl leading-relaxed text-balance md:text-lg">{intro}</p>}

        {!!actions?.length && (
          <nav aria-label={eyebrow ? `${eyebrow} quick links` : 'Quick links'} className="mt-10 w-full max-w-4xl">
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {actions.map((action) => {
                const Icon = ICONS[action.icon ?? ''] ?? LayoutGrid
                const external = /^(https?:|mailto:)/.test(action.href)
                const inner = (
                  <>
                    <Icon aria-hidden className="text-fox size-7 transition-transform group-hover:-translate-y-0.5" strokeWidth={1.5} />
                    <span className="text-sm font-semibold tracking-wide uppercase"><TrackedText>{action.label}</TrackedText></span>
                  </>
                )
                const cls =
                  'group flex h-full flex-col items-center gap-3 rounded-ui border border-ink-foreground/15 bg-ink/40 px-4 py-6 backdrop-blur-sm transition-colors hover:border-fox hover:bg-ink/70'
                return (
                  <li key={action._key}>
                    {external ? (
                      <a href={action.href} className={cls}>{inner}</a>
                    ) : (
                      <TransitionLink href={action.href} className={cls}>{inner}</TransitionLink>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </div>
    </section>
  )
}
