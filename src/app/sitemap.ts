import type { MetadataRoute } from 'next'

import { SITEMAP_QUERY, safeFetch } from '@/lib/queries'
import { absoluteUrl } from '@/lib/site-url'
import { PORTFOLIO_SECTIONS, sectionOfKind } from '@/sanity/portfolio'
import type { SitemapData } from '@/lib/types'

/** Rebuilt at most hourly, so new pieces appear without a deploy. */
export const revalidate = 3600

/** Every public page, with when its content last changed in Sanity. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await safeFetch<SitemapData>(SITEMAP_QUERY, {}, { pages: [], caseStudies: [], pieces: [], settingsUpdated: null })
  const site = data.settingsUpdated ? new Date(data.settingsUpdated) : undefined
  const at = (path: string, updated?: string | null) => ({ url: absoluteUrl(path), lastModified: updated ? new Date(updated) : site })

  return [
    at('/'),
    at('/case-studies'),
    ...data.caseStudies.map((c) => at(`/case-studies/${c.slug}`, c._updatedAt)),
    at('/portfolio'),
    ...PORTFOLIO_SECTIONS.map((section) => at(`/portfolio/${section}`)),
    ...data.pieces.flatMap((p) => {
      const section = sectionOfKind(p.kind)
      return section ? [at(`/portfolio/${section}/${p.slug}`, p._updatedAt)] : []
    }),
    ...data.pages.map((p) => at(`/${p.slug}`, p._updatedAt)),
    at('/resume'),
    at('/contact'),
    at('/styleguide'),
  ]
}
