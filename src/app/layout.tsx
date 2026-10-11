import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'
import { Analytics } from '@vercel/analytics/next'
import { Geist, Libre_Bodoni } from 'next/font/google'

import './globals.css'
import { cn } from '@/lib/utils'
import { getSiteSettings } from '@/lib/site-settings'
import { SITE_URL } from '@/lib/site-url'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
// Display serif for headings: a Bodoni drawn for text sizes, so its hairlines
// hold up on dark backgrounds and smaller headings.
const bodoni = Libre_Bodoni({ subsets: ['latin'], variable: '--font-bodoni' })

/**
 * Root layout stays minimal so the Studio at /studio is full-screen. Site
 * chrome lives in `(site)/layout.tsx`. Metadata comes from Sanity.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  // Draft-mode edit markers don't belong in <title> or meta tags.
  return stegaClean({
    metadataBase: new URL(SITE_URL),
    // His name in every tab and search result, so "Stephen Fox" and the site are one entity.
    title: { default: `${settings.ownerName} · ${settings.siteTitle}`, template: `%s · ${settings.ownerName}` },
    description: settings.siteDescription,
    openGraph: {
      title: `${settings.ownerName} · ${settings.siteTitle}`,
      description: settings.siteDescription,
      siteName: settings.siteTitle,
      url: SITE_URL,
      type: 'website',
    },
  })
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(geist.variable, bodoni.variable)}>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
