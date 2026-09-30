import { defineDocuments, defineLocations, type PresentationPluginOptions } from 'sanity/presentation'

import { sectionOfKind } from './portfolio'

/**
 * Tells the Studio's Presentation tool which page shows which document (the
 * "Used on" list in the editor), and which document a page is mainly about
 * (so opening a URL in the preview selects it). Keep in step with src/app/(site).
 */
export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    { route: '/case-studies/:slug', filter: `_type == "caseStudy" && slug.current == $slug` },
    { route: '/portfolio/:section/:slug', filter: `_type == "creativeWork" && slug.current == $slug` },
    { route: '/resume', filter: `_type == "siteSettings" && _id == "siteSettings"` },
    { route: '/:slug', filter: `_type == "page" && slug.current == $slug` },
    { route: '/', filter: `_type == "siteSettings" && _id == "siteSettings"` },
  ]),
  locations: {
    caseStudy: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [
          ...(doc?.slug ? [{ title: doc.title || 'Untitled', href: `/case-studies/${doc.slug}` }] : []),
          { title: 'Case studies', href: '/case-studies' },
        ],
      }),
    }),
    creativeWork: defineLocations({
      select: { title: 'title', slug: 'slug.current', kind: 'kind', body: 'body' },
      resolve: (doc) => {
        const section = sectionOfKind(doc?.kind)
        if (!section) return { locations: [{ title: 'Portfolio', href: '/portfolio' }] }
        return {
          locations: [
            ...(doc?.slug && doc?.body?.length ? [{ title: doc.title || 'Untitled', href: `/portfolio/${section}/${doc.slug}` }] : []),
            { title: 'Portfolio section', href: `/portfolio/${section}` },
            { title: 'Portfolio', href: '/portfolio' },
          ],
        }
      },
    }),
    page: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({ locations: doc?.slug ? [{ title: doc.title || 'Untitled', href: `/${doc.slug}` }] : [] }),
    }),
    experience: defineLocations({
      locations: [{ title: 'Résumé', href: '/resume' }],
    }),
    siteSettings: defineLocations({
      message: 'Site settings appear on every page.',
      tone: 'positive',
      locations: [
        { title: 'Home', href: '/' },
        { title: 'Résumé', href: '/resume' },
        { title: 'Contact', href: '/contact' },
      ],
    }),
  },
}
