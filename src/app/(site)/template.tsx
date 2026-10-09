import { RouteTransition } from '@/components/route-transition'
import { SiteFooter } from '@/components/site-footer'
import { getSiteSettings } from '@/lib/site-settings'

/**
 * Every page animates in and out via RouteTransition (see its notes). Main and
 * the footer live here rather than in the layout so they travel together as
 * one panel below the fixed header: a short page slides in at full height
 * instead of as a short band, with nothing popping in when the blind ends.
 */
export default async function SiteTemplate({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  return (
    <RouteTransition>
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </RouteTransition>
  )
}
