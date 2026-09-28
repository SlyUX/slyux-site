import Image from 'next/image'

import { GridNav, PanLink, SiteMapProvider } from '@/components/grid-nav'
import { getSiteSettings } from '@/lib/site-settings'
import { externalHref } from '@/lib/utils'
import { urlFor } from '@/sanity/image'

/**
 * Pages are static but refresh from Sanity at most once a minute, so edits in
 * the Studio go live without a redeploy. New slugs render on first request.
 */
export const revalidate = 60

/** Site chrome: header, main, footer. Kept off the full-screen Studio. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const linkedin = externalHref(settings.linkedinUrl)

  // Footer sits on the bottom edge of short pages, and below the content on
  // tall ones: the wrapper is at least one (small) viewport tall and main grows.
  return (
    <SiteMapProvider cells={settings.gridNav}>
    <div className="flex min-h-svh flex-col">
      <a href="#main" className="bg-primary text-primary-foreground sr-only z-50 px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        {/* a11y-only text; not CMS-managed. */}
        Skip to content
      </a>
      <header className="border-border bg-background relative z-40 border-b px-4 sm:px-6" style={{ viewTransitionName: 'site-header' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-x-8 py-3">
          <PanLink href="/" cells={settings.gridNav} className="font-display shrink-0 text-xl font-semibold">
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
          </PanLink>
          {/* aria-label is a11y-only text, not CMS copy. */}
          <GridNav cells={settings.gridNav} label="Site map" portfolio={{ label: settings.creativeTitle, href: '/portfolio' }} />
        </div>
      </header>
      <main id="main" className="flex-1">{children}</main>
      <footer className="bg-ink text-ink-foreground px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-ink-muted">{settings.footerLine ?? `© ${new Date().getFullYear()} ${settings.ownerName}`}</p>
          <ul className="flex gap-5">
            <li>
              <a href={`mailto:${settings.contactEmail}`} className="hover:text-fox">
                {settings.contactEmail}
              </a>
            </li>
            {linkedin && (
              <li>
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-fox">
                  LinkedIn
                </a>
              </li>
            )}
          </ul>
        </div>
      </footer>
    </div>
    </SiteMapProvider>
  )
}
