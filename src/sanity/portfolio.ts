/**
 * Portfolio taxonomy, shared by the Studio schema and the site.
 *
 * A piece has one `kind`; each kind belongs to exactly one portfolio section,
 * and each section is a subpage at /portfolio/[section]. Section headings and
 * intros are CMS copy (Site settings → Portfolio); these values are the
 * structure only.
 */
export const PORTFOLIO_SECTIONS = ['ux', 'brand', 'design', 'illustration'] as const
export type PortfolioSection = (typeof PORTFOLIO_SECTIONS)[number]

export const PORTFOLIO_KINDS = [
  { title: 'UX — screens & prototypes', value: 'ux', section: 'ux' },
  { title: 'Brand — brand system', value: 'brand', section: 'brand' },
  { title: 'Brand — logo', value: 'logo', section: 'brand' },
  { title: 'Design — campaign', value: 'campaign', section: 'design' },
  { title: 'Design — graphic / print / web', value: 'graphic', section: 'design' },
  { title: 'Illustration', value: 'illustration', section: 'illustration' },
  { title: 'Illustration — book / comic', value: 'book', section: 'illustration' },
] as const satisfies readonly { title: string; value: string; section: PortfolioSection }[]

export type PortfolioKind = (typeof PORTFOLIO_KINDS)[number]['value']

export const kindsInSection = (section: PortfolioSection): PortfolioKind[] =>
  PORTFOLIO_KINDS.filter((k) => k.section === section).map((k) => k.value)

export const sectionOfKind = (kind: string | null | undefined): PortfolioSection | undefined =>
  PORTFOLIO_KINDS.find((k) => k.value === kind)?.section

export const isPortfolioSection = (value: string): value is PortfolioSection =>
  (PORTFOLIO_SECTIONS as readonly string[]).includes(value)
