import { cva, type VariantProps } from 'class-variance-authority'

import { PanLink } from '@/components/grid-nav'
import { cn } from '@/lib/utils'
import type { CmsLink } from '@/lib/types'

/**
 * Layout and link primitives shared by every page. Presentational only —
 * content arrives as props.
 */

/** Full-bleed band with a centered, width-limited inner column. */
const sectionVariants = cva('px-4 py-14 sm:px-6 md:py-20', {
  variants: {
    tone: {
      default: '',
      surface: 'bg-surface',
      ink: 'bg-ink text-ink-foreground',
    },
  },
  defaultVariants: { tone: 'default' },
})

export function Section({
  tone,
  className,
  children,
  ...props
}: React.ComponentProps<'section'> & VariantProps<typeof sectionVariants>) {
  return (
    <section className={cn(sectionVariants({ tone }), className)} {...props}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  )
}

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-foreground',
        secondary: 'border border-foreground/20 hover:border-primary hover:text-primary',
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
    <PanLink href={link.href} className={cls}>
      {link.label}
    </PanLink>
  )
}

/** Title + optional intro at the top of a page. The page's only <h1>. */
export function PageHeader({
  title,
  intro,
  eyebrow,
  back,
}: {
  title: string
  intro?: string | null
  eyebrow?: string | null
  /** The parent page. Following it rolls the blind back up. */
  back?: { label: string; href: string }
}) {
  return (
    <header className="max-w-3xl">
      {back && (
        <PanLink href={back.href} className="text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-1.5 text-sm font-medium">
          <span aria-hidden>←</span>
          {back.label}
        </PanLink>
      )}
      {eyebrow && <p className="text-primary mb-3 text-sm font-semibold tracking-wide uppercase">{eyebrow}</p>}
      <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight md:text-5xl">{title}</h1>
      {intro && <p className="text-muted-foreground mt-5 text-lg leading-relaxed">{intro}</p>}
    </header>
  )
}
