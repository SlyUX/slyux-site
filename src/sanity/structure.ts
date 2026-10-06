import type { StructureBuilder, StructureResolver } from 'sanity/structure'

import { PORTFOLIO_KINDS, PORTFOLIO_SECTIONS, PORTFOLIO_SECTION_TITLES } from './portfolio'

/**
 * Studio sidebar, laid out like the site: settings, pages, case studies, the
 * portfolio by section and kind (Brand Development → Brand systems, Logos),
 * then the résumé.
 *
 * `siteSettings` is pinned to a single document. Without that, the type
 * behaves like any other and editors can create a second one — at which point
 * the site reads whichever the query happens to return first. Paired with
 * `newDocumentOptions` in sanity.config.ts, which hides it from the global
 * create menu.
 */
const SINGLETONS = ['siteSettings']

/** Types placed by hand below; anything added later still appears at the end. */
const PLACED = ['siteSettings', 'page', 'caseStudy', 'creativeWork', 'experience']

const byOrder = [{ field: 'order', direction: 'asc' as const }]

/** One kind's pieces. "+" here starts a piece of that kind (template in sanity.config.ts). */
const kindList = (S: StructureBuilder, kind: (typeof PORTFOLIO_KINDS)[number]) =>
  S.listItem()
    .id(`kind-${kind.value}`)
    .title(kind.list)
    .schemaType('creativeWork')
    .child(
      S.documentTypeList('creativeWork')
        .title(kind.list)
        .filter('_type == "creativeWork" && kind == $kind')
        .params({ kind: kind.value })
        .defaultOrdering(byOrder)
        .initialValueTemplates([S.initialValueTemplateItem('creativeWork-kind', { kind: kind.value })]),
    )

/** A portfolio section: its kinds as lists, or the one kind's pieces directly. */
const sectionItem = (S: StructureBuilder, section: (typeof PORTFOLIO_SECTIONS)[number]) => {
  const kinds = PORTFOLIO_KINDS.filter((k) => k.section === section)
  const title = PORTFOLIO_SECTION_TITLES[section]
  if (kinds.length === 1) return kindList(S, kinds[0]).id(`section-${section}`).title(title)
  return S.listItem()
    .id(`section-${section}`)
    .title(title)
    .child(S.list().title(title).items(kinds.map((kind) => kindList(S, kind))))
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .id('siteSettings')
        .schemaType('siteSettings')
        .title('Site settings')
        .child(
          S.editor().id('siteSettings').schemaType('siteSettings').documentId('siteSettings'),
        ),
      S.divider(),
      S.documentTypeListItem('page').title('Pages'),
      S.listItem()
        .id('caseStudy')
        .title('Case studies')
        .schemaType('caseStudy')
        .child(S.documentTypeList('caseStudy').title('Case studies').defaultOrdering(byOrder)),
      S.listItem()
        .id('portfolio')
        .title('Portfolio')
        .child(
          S.list()
            .title('Portfolio')
            .items([
              ...PORTFOLIO_SECTIONS.map((section) => sectionItem(S, section)),
              S.divider(),
              S.listItem()
                .id('allPortfolio')
                .title('All portfolio pieces')
                .schemaType('creativeWork')
                .child(S.documentTypeList('creativeWork').title('All portfolio pieces').defaultOrdering(byOrder)),
            ]),
        ),
      S.documentTypeListItem('experience').title('Résumé'),
      ...S.documentTypeListItems().filter((item) => {
        const id = item.getId()
        return id ? !PLACED.includes(id) && !SINGLETONS.includes(id) : true
      }),
    ])
