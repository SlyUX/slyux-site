import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Fraunces, Geist } from 'next/font/google'

import './globals.css'
import { cn } from '@/lib/utils'
import { getSiteSettings } from '@/lib/site-settings'
import { SITE_URL } from '@/lib/site-url'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
// Display serif for headings — provisional, pending art direction.
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' })

/**
 * Root layout stays minimal so the Studio at /studio is full-screen. Site
 * chrome lives in `(site)/layout.tsx`. Metadata comes from Sanity.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: settings.siteTitle, template: `%s · ${settings.siteTitle}` },
    description: settings.siteDescription,
    openGraph: {
      title: settings.siteTitle,
      description: settings.siteDescription,
      siteName: settings.siteTitle,
      url: SITE_URL,
      type: 'website',
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(geist.variable, fraunces.variable)}>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
