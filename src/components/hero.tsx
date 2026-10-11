import Image from 'next/image'
import { TransitionLink } from '@/components/transition-link'
import { TrackedText } from '@/components/tracked-text'
import { Briefcase, FileText, LayoutGrid, MessageCircle, Palette, User, type LucideIcon } from 'lucide-react'

import { urlFor } from '@/sanity/image'

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
  /** Who this is: the page's one heading. */
  name: string
  /** Title and location, from the current résumé role (see RoleLine). */
  role?: React.ReactNode
  /** The positioning line. */
  headline?: string | null
  intro?: string | null
  videoUrl?: string | null
  videoType?: string | null
  poster?: { asset?: { _ref: string } } | null
  actions?: QuickAction[] | null
}

/**
 * The home page's first screen: who Stephen is (name, title, and location),
 * what he does, and one-click shortcuts, over a muted, looping blueprint
 * video. Kept short so the proof strip and selected work start on the first
 * screen; the header already carries the logo.
 *
 * The video is decorative (aria-hidden). Under `prefers-reduced-motion` it is
 * hidden by CSS and the poster still shows instead — no client JS needed.
 * A dark scrim keeps white text above AA contrast whatever frame is showing.
 */
export function Hero({ name, role, headline, intro, videoUrl, videoType, poster, actions }: HeroProps) {
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

      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-14 text-center sm:px-6 md:py-20">
        <h1 className="font-display text-5xl leading-none font-semibold tracking-tight md:text-7xl">{name}</h1>
        {role && <p className="text-fox mt-4 text-lg font-semibold text-balance md:text-xl">{role}</p>}
        {headline && (
          <p className="font-display mt-8 max-w-3xl text-2xl leading-snug font-semibold text-balance md:text-3xl">{headline}</p>
        )}
        {intro && <p className="text-ink-muted mt-4 max-w-2xl leading-relaxed text-balance md:text-lg">{intro}</p>}

        {!!actions?.length && (
          <nav aria-label={`${name} quick links`} className="mt-10 w-full max-w-4xl">
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
