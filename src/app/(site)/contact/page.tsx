import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'

import { ContactForm } from '@/components/contact-form'
import { PageHeader, Section } from '@/components/ui'
import { contactFormReady } from '@/lib/contact'
import { getSiteSettings } from '@/lib/site-settings'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return stegaClean({ title: s.contactTitle, description: s.contactIntro ?? undefined })
}

/**
 * Contact through a form (ContactForm): pick a topic, write, send. The topics
 * are the inquiry options in Site settings, and each message arrives with its
 * topic's subject line, so hiring and project messages come in pre-sorted.
 * The address never appears on the page.
 *
 * Until the form can send (Resend's keys in Vercel), each option opens an
 * email instead, so contact never breaks.
 */
export default async function ContactPage() {
  const s = await getSiteSettings()
  if (contactFormReady() && s.inquiryTypes?.length) {
    return (
      <Section opener>
        <PageHeader title={s.contactTitle} intro={s.contactForm.intro} />
        <ContactForm
          topics={s.inquiryTypes.map((t) => ({ key: t._key, label: t.label ?? '', description: t.description }))}
          copy={s.contactForm}
        />
      </Section>
    )
  }
  const mailto = (subject?: string) =>
    `mailto:${s.contactEmail}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`

  return (
    <Section opener>
      <PageHeader title={s.contactTitle} intro={s.contactIntro} />
      {s.inquiryTypes?.length ? (
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {s.inquiryTypes.map((type) => (
            <li key={type._key}>
              <a
                href={mailto(type.subject)}
                className="border-border hover:border-primary group block h-full rounded-ui border p-6 transition-colors"
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
