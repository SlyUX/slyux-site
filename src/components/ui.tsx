import { cva, type VariantProps } from 'class-variance-authority'

import { TransitionLink } from '@/components/transition-link'
import { TrackedText } from '@/components/tracked-text'
import { cn } from '@/lib/utils'
import type { CmsLink } from '@/lib/types'

/**
 * Layout and link primitives shared by every page. Presentational only —
 * content arrives as props.
 */

/**
 * Full-bleed band with a centered, width-limited inner column. Bands are 48px
 * top and bottom on phones, 64px on wider screens. A page's opening band (its
 * header, just below the navigation) starts closer: 32px, then 40px.
 */
const sectionVariants = cva('px-4 py-12 sm:px-6 md:py-16', {
  variants: {
    opener: { true: 'pt-8 md:pt-10' },
    tone: {
      default: '',
      surface: 'bg-surface',
      ink: 'bg-ink text-ink-foreground',
      brand: 'bg-brand text-primary-foreground',
    },
  },
  defaultVariants: { tone: 'default' },
})

export function Section({
  tone,
  opener,
  className,
  children,
  ...props
}: React.ComponentProps<'section'> & VariantProps<typeof sectionVariants>) {
  return (
    <section className={cn(sectionVariants({ tone, opener }), className)} {...props}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  )
}

/**
 * Buttons. Primary is the orange action; secondary is 75% white with a navy
 * border and text, so it reads on any band. Both carry a 1px border so they
 * match in height side by side.
 */
export const buttonVariants = cva(
  'rounded-ui inline-flex items-center justify-center gap-2 border px-5 py-2.5 text-sm font-semibold transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-heading border-transparent',
        secondary: 'bg-paper/75 border-heading text-heading hover:bg-paper hover:border-primary hover:text-primary',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
)

const isExternal = (href: string) => /^(https?:|mailto:)/.test(href)

/** A CMS link rendered as a button. Renders nothing when the link is unset. */
export function ButtonLink({
  link,
  variant,
  className,
}: { link: CmsLink | null | undefined; className?: string } & VariantProps<typeof buttonVariants>) {
  if (!link?.href || !link.label) return null
  const cls = cn(buttonVariants({ variant }), className)
  return isExternal(link.href) ? (
    <a href={link.href} className={cls} {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {link.label}
    </a>
  ) : (
    <TransitionLink href={link.href} className={cls}>
      {link.label}
    </TransitionLink>
  )
}

/**
 * A section's heading, the same on every band and page: one size and color,
 * and one gap (40px) to the content. An intro can sit below it and an action
 * (a "See all" button) beside it.
 */
export function SectionHeading({
  id,
  intro,
  action,
  as: Heading = 'h2',
  children,
}: {
  id?: string
  intro?: React.ReactNode
  action?: React.ReactNode
  /** The level, for a heading nested inside another section (the styleguide's examples). */
  as?: 'h2' | 'h3' | 'h4'
  children: React.ReactNode
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div>
        <Heading id={id} className="font-display text-3xl font-semibold">
          {children}
        </Heading>
        {intro && <p className="text-muted-foreground mt-2">{intro}</p>}
      </div>
      {action}
    </div>
  )
}

/** Title + optional intro at the top of a page. The page's only <h1>. */
export function PageHeader({
  title,
  intro,
  eyebrow,
  breadcrumb,
}: {
  title: string
  intro?: string | null
  eyebrow?: string | null
  /** Where the page sits (a Breadcrumb), above the title. */
  breadcrumb?: React.ReactNode
}) {
  return (
    <header>
      {breadcrumb}
      {eyebrow && <p className="text-primary mb-3 text-sm font-semibold tracking-wide uppercase"><TrackedText>{eyebrow}</TrackedText></p>}
      <h1 className="font-display text-heading text-4xl leading-tight font-semibold tracking-tight md:text-5xl">{title}</h1>
      {intro && <p className="text-muted-foreground mt-5 text-lg leading-relaxed">{intro}</p>}
    </header>
  )
}
