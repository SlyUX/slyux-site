/**
 * Structured data (schema.org JSON-LD) for search engines and AI tools: who
 * Stephen is, and what each case study and piece is. Rendered as a script tag
 * in the page, as the Next.js JSON-LD guide recommends, with `<` escaped so
 * content can never close the tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

/** One id for Stephen, so every page's creative work points at the same person. */
export const personId = (siteUrl: string) => `${siteUrl}/#person`

/** A BreadcrumbList from a page's trail, ending with the page itself. */
export function breadcrumbLd(siteUrl: string, trail: { label: string; href: string }[], page: { label: string; href: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [...trail, page].map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: `${siteUrl}${crumb.href}`,
    })),
  }
}
