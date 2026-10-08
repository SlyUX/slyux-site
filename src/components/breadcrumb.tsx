import { ChevronRight } from 'lucide-react'

import { TransitionLink } from '@/components/transition-link'

export interface Crumb {
  label: string
  href: string
}

/**
 * Where a child page sits: a plain trail, Parent › Child › Page, small and
 * muted so the title leads, with 32px of air before it. Switching sections
 * stays in the header.
 */
export function Breadcrumb({ trail, page }: { trail: Crumb[]; page: string }) {
  return (
    // aria-label is a11y-only text, not CMS copy.
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
        {trail.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <TransitionLink href={crumb.href} className="hover:text-primary font-medium">
              {crumb.label}
            </TransitionLink>
            <ChevronRight aria-hidden className="size-3.5" />
          </li>
        ))}
        <li aria-current="page" className="text-foreground font-medium">
          {page}
        </li>
      </ol>
    </nav>
  )
}
