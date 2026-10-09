import type { SiteSettings } from '@/lib/site-settings'
import { externalHref } from '@/lib/utils'

/**
 * The footer. Rendered by the page template, not the layout, so it moves
 * with the page during a blind: everything below the fixed header travels as
 * one panel, and a short page never slides in short (see RouteTransition).
 */
export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const linkedin = externalHref(settings.linkedinUrl)
  return (
    <footer className="bg-footer text-footer-foreground px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
        <p className="text-footer-muted">{settings.footerLine ?? `© ${new Date().getFullYear()} ${settings.ownerName}`}</p>
        <ul className="flex gap-5">
          <li>
            <a href={`mailto:${settings.contactEmail}`} className="decoration-fox underline-offset-4 hover:underline hover:decoration-2">
              {settings.contactEmail}
            </a>
          </li>
          {linkedin && (
            <li>
              <a href={linkedin} target="_blank" rel="noopener noreferrer" className="decoration-fox underline-offset-4 hover:underline hover:decoration-2">
                LinkedIn
              </a>
            </li>
          )}
        </ul>
      </div>
    </footer>
  )
}
