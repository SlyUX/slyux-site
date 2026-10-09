import Image from 'next/image'
import { draftMode } from 'next/headers'
import { stegaClean } from 'next-sanity'

import { AiStatementProvider } from '@/components/ai-statement'
import { HeaderHeight } from '@/components/header-height'
import { RichText } from '@/components/content'
import { JsonLd, personId } from '@/components/json-ld'
import { SiteNav } from '@/components/site-nav'
import { TransitionLink } from '@/components/transition-link'
import { PreviewTools } from '@/components/preview-tools'
import { EXPERIENCE_QUERY, safeFetch } from '@/lib/queries'
import { galleryLabels, getSiteSettings } from '@/lib/site-settings'
import { SITE_URL } from '@/lib/site-url'
import { externalHref } from '@/lib/utils'
import type { ExperienceEntry } from '@/lib/types'
import { ViewerLabelsProvider } from '@/components/viewer-labels'
import { urlFor } from '@/sanity/image'

/**
 * Pages are static but refresh from Sanity at most once a minute, so edits in
 * the Studio go live without a redeploy. New slugs render on first request.
 */
export const revalidate = 60

/** Site chrome: the header, and the providers every page shares. Kept off the full-screen Studio. Main and the footer are in the page template, so they move with each page (see template.tsx). */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, experience] = await Promise.all([getSiteSettings(), safeFetch<ExperienceEntry[]>(EXPERIENCE_QUERY, {}, [])])
  const { isEnabled: preview } = await draftMode()

  // Who Stephen is, for search engines and AI tools (schema.org). The current
  // role is the résumé's open-ended entry; skills are the résumé's skills.
  const current = experience.find((e) => !e.end) ?? experience[0]
  const linkedin = externalHref(settings.linkedinUrl)
  const structured = stegaClean([
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': personId(SITE_URL),
      name: settings.ownerName,
      url: SITE_URL,
      description: settings.siteDescription,
      jobTitle: current?.role ?? undefined,
      worksFor: current?.organization ? { '@type': 'Organization', name: current.organization } : undefined,
      sameAs: linkedin ? [linkedin] : undefined,
      knowsAbout: settings.skillGroups?.flatMap((group) => group.skills ?? []),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: settings.siteTitle,
      description: settings.siteDescription,
      author: { '@id': personId(SITE_URL) },
    },
  ])

  // The wrapper is at least one (small) viewport tall; each page's panel
  // (template.tsx) fills what the header leaves, so short pages put the footer
  // on the bottom edge and tall ones put it below the content.
  return (
    <>
    <div className="flex min-h-svh flex-col">
      <JsonLd data={structured} />
      <a href="#main" className="bg-primary text-primary-foreground sr-only z-50 px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        {/* a11y-only text; not CMS-managed. */}
        Skip to content
      </a>
      {/* Sticky: pinned to the top once the page scrolls; on phones it steps aside while scrolling down (see HeaderHeight). */}
      <header data-site-header className="border-border bg-background sticky top-0 z-40 border-b px-4 sm:px-6" style={{ viewTransitionName: 'site-header' }}>
        <HeaderHeight />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-x-8 py-3">
          <TransitionLink href="/" className="font-display shrink-0 text-xl font-semibold">
            {settings.headerLogo?.asset && settings.headerLogoSize ? (
              <Image
                src={urlFor(settings.headerLogo).height(96).url()}
                alt={settings.headerLogo.alt || settings.siteTitle}
                width={Math.round((96 * settings.headerLogoSize.width) / settings.headerLogoSize.height)}
                height={96}
                priority
                className="h-11 w-auto"
              />
            ) : (
              <>
                {settings.siteTitle}
                <span className="text-fox">.</span>
              </>
            )}
          </TransitionLink>
          {/* aria-label is a11y-only text, not CMS copy. */}
          <SiteNav entries={settings.gridNav} label="Main" portfolio={{ label: settings.creativeTitle, href: '/portfolio' }} />
        </div>
      </header>
      <ViewerLabelsProvider labels={galleryLabels(settings)}>
        <AiStatementProvider
          label={settings.aiNoteLabel}
          heading={settings.aiStatementHeading}
          closeLabel={settings.closeLabel}
          statement={settings.aiStatement?.length ? <RichText value={settings.aiStatement} /> : undefined}
        >
          {children}
        </AiStatementProvider>
      </ViewerLabelsProvider>
    </div>
    {preview && <PreviewTools />}
    </>
  )
}
