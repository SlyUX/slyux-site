import { cache } from 'react'

import { safeFetch, SITE_SETTINGS_QUERY } from '@/lib/queries'
import { PORTFOLIO_SECTIONS, type PortfolioSection } from '@/sanity/portfolio'
import type { SITE_SETTINGS_QUERY_RESULT } from '../../sanity.types'

type Settings = NonNullable<SITE_SETTINGS_QUERY_RESULT>

/**
 * Site-wide copy from the `siteSettings` singleton, merged over defaults.
 *
 * The defaults exist so the site renders before the singleton is filled in,
 * and survives a cleared field. They are DEFAULTS, not content: every one has
 * a matching field in `schemaTypes/siteSettings.ts`, and Sanity overrides it.
 * Do not add a string here without that field.
 */
const DEFAULTS = {
  siteTitle: 'Sly UX',
  siteDescription: 'Stephen Fox — UX & CX leadership, design, code, and illustration.',
  ownerName: 'Stephen Fox',
  gridNav: [
    { _key: 'ux', _type: 'gridCell', label: 'UX', href: '/portfolio/ux', cell: 1 },
    { _key: 'brand', _type: 'gridCell', label: 'Brand Development', href: '/portfolio/brand', cell: 2 },
    { _key: 'design', _type: 'gridCell', label: 'Design', href: '/portfolio/design', cell: 3 },
    { _key: 'illustration', _type: 'gridCell', label: 'Illustration', href: '/portfolio/illustration', cell: 4 },
    { _key: 'home', _type: 'gridCell', label: 'Home', href: '/', cell: 5 },
    { _key: 'case-studies', _type: 'gridCell', label: 'Case Studies', href: '/case-studies', cell: 6 },
    { _key: 'about', _type: 'gridCell', label: 'About', href: '/about', cell: 7 },
    { _key: 'resume', _type: 'gridCell', label: 'Résumé', href: '/resume', cell: 8 },
    { _key: 'contact', _type: 'gridCell', label: 'Contact', href: '/contact', cell: 9 },
  ],
  contactEmail: 'fox@slyux.com',
  headline: 'Sly UX',
  workTitle: 'Case Studies',
  workEmpty: 'Case studies are on their way.',
  caseStudiesMoreHeading: 'More case studies',
  fullPageLabel: 'View full page',
  closeLabel: 'Close',
  howItStartedHeading: 'How it started…',
  documentsHeading: 'Documents',
  personasHeading: 'Personas',
  opportunitiesLabel: 'Opportunities to engage',
  barriersLabel: 'Barriers to adoption',
  enlargeLabel: 'View larger',
  imageCountLabel: '{count} images',
  previousLabel: 'Previous image',
  nextLabel: 'Next image',
  pdfBadge: 'Look inside',
  pdfPageCounter: 'Page {page} of {pages}',
  pdfDownloadLabel: 'Download PDF',
  fullscreenLabel: 'Fullscreen',
  exitFullscreenLabel: 'Exit fullscreen',
  creativeTitle: 'Portfolio',
  portfolioViewAll: 'See all',
  portfolioSections: {
    ux: { title: 'UX' },
    design: { title: 'Design' },
    brand: { title: 'Brand Development' },
    illustration: { title: 'Illustration' },
  },
  creativeSections: {
    data: 'Data analysis',
    audit: 'Site audits',
    strategy: 'Research & strategy',
    designSystem: 'Design systems',
    ux: 'Screens & prototypes',
    uiAssets: 'UI assets',
    brand: 'Brand systems',
    illustration: 'Illustration',
    cover: 'Book covers',
    book: 'Books & comics',
    campaign: 'Campaigns',
    printAd: 'Print ads',
    graphic: 'Graphic design',
    logo: 'Logos',
  },
  kindLabels: {
    data: 'Data analysis',
    audit: 'Site audit',
    strategy: 'Strategy',
    designSystem: 'Design system',
    ux: 'Prototype',
    uiAssets: 'UI assets',
    brand: 'Brand strategy',
    logo: 'Logo',
    campaign: 'Campaign',
    printAd: 'Print ad',
    graphic: 'Graphic design',
    illustration: 'Illustration',
    cover: 'Book cover',
    book: 'Book',
  },
  caseStudiesRowHeading: 'Case studies',
  portfolioFeaturedHeading: 'Featured',
  caseStudyLabel: 'Case study',
  resumeTitle: 'Résumé',
  resumeDownloadLabel: 'Download PDF',
  experienceHeading: 'Experience',
  skillsHeading: 'Skills',
  educationHeading: 'Education & training',
  contactTitle: 'Contact',
} satisfies Partial<Settings>

type SectionCopy = { title: string; intro?: string }

export type SiteSettings = Omit<Settings, keyof typeof DEFAULTS> & typeof DEFAULTS & {
  creativeSections: Required<NonNullable<Settings['creativeSections']>>
  kindLabels: Required<NonNullable<Settings['kindLabels']>>
  portfolioSections: Record<PortfolioSection, SectionCopy>
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const fetched = await safeFetch<SITE_SETTINGS_QUERY_RESULT>(SITE_SETTINGS_QUERY, {}, null)
  const merged: Record<string, unknown> = { ...DEFAULTS }
  // Only non-empty values override a default — a cleared field falls back.
  for (const [key, value] of Object.entries(fetched ?? {})) {
    const empty = value === null || value === '' || (Array.isArray(value) && value.length === 0)
    if (!empty) merged[key] = value
  }
  merged.creativeSections = { ...DEFAULTS.creativeSections, ...(fetched?.creativeSections ?? {}) }
  // Per-kind card labels: a cleared label falls back to its default.
  merged.kindLabels = Object.fromEntries(
    Object.entries(DEFAULTS.kindLabels).map(([kind, label]) => [
      kind,
      fetched?.kindLabels?.[kind as keyof typeof DEFAULTS.kindLabels] || label,
    ]),
  )
  // Per-section copy: a cleared title falls back to the default; intro is optional.
  merged.portfolioSections = Object.fromEntries(
    PORTFOLIO_SECTIONS.map((key) => {
      const copy = fetched?.portfolioSections?.[key]
      return [key, { title: copy?.title || DEFAULTS.portfolioSections[key].title, intro: copy?.intro }]
    }),
  )
  return merged as SiteSettings
})

/** Gallery and lightbox labels, from Site settings. */
export const galleryLabels = (s: SiteSettings) => ({
  fullPage: s.fullPageLabel,
  enlarge: s.enlargeLabel,
  imageCount: s.imageCountLabel,
  close: s.closeLabel,
  previous: s.previousLabel,
  next: s.nextLabel,
})

/** The PDF badge template and reader labels, from Site settings. */
export const documentSettings = (s: SiteSettings) => ({
  badge: s.pdfBadge,
  labels: {
    counter: s.pdfPageCounter,
    download: s.pdfDownloadLabel,
    fullscreen: s.fullscreenLabel,
    exitFullscreen: s.exitFullscreenLabel,
    close: s.closeLabel,
    previous: s.previousLabel,
    next: s.nextLabel,
  },
})
export type DocumentSettings = ReturnType<typeof documentSettings>
