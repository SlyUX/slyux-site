import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'

import { PageHeader, Section } from '@/components/ui'
import { getSiteSettings } from '@/lib/site-settings'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return stegaClean({ title: s.contactTitle, description: s.contactIntro ?? undefined })
}

/**
 * Contact without a form (for now): each inquiry option opens an email with
 * its subject prefilled, so hiring and project messages arrive pre-sorted.
 */
export default async function ContactPage() {
  const s = await getSiteSettings()
  const mailto = (subject?: string) =>
    `mailto:${s.contactEmail}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`

  return (
    <Section>
      <PageHeader title={s.contactTitle} intro={s.contactIntro} />
      {s.inquiryTypes?.length ? (
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {s.inquiryTypes.map((type) => (
            <li key={type._key}>
              <a
                href={mailto(type.subject)}
                className="border-border hover:border-primary group block h-full rounded-2xl border p-6 transition-colors"
              >
                <span className="font-display group-hover:text-primary text-2xl font-semibold">{type.label}</span>
                {type.description && <span className="text-muted-foreground mt-2 block">{type.description}</span>}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-lg">
          <a href={mailto()} className="text-primary font-semibold underline underline-offset-4">
            {s.contactEmail}
          </a>
        </p>
      )}
    </Section>
  )
}
