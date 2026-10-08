import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'
import { Analytics } from '@vercel/analytics/next'
import { Bodoni_Moda, Geist } from 'next/font/google'

import './globals.css'
import { cn } from '@/lib/utils'
import { getSiteSettings } from '@/lib/site-settings'
import { SITE_URL } from '@/lib/site-url'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
// Display serif for headings: a Didone. The optical-size axis thickens its
// hairlines automatically at smaller sizes, so headings stay legible.
const bodoni = Bodoni_Moda({ subsets: ['latin'], axes: ['opsz'], variable: '--font-bodoni' })

/**
 * Root layout stays minimal so the Studio at /studio is full-screen. Site
 * chrome lives in `(site)/layout.tsx`. Metadata comes from Sanity.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  // Draft-mode edit markers don't belong in <title> or meta tags.
  return stegaClean({
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
