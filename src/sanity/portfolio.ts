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

/** Studio labels for each section, matching the site's default page titles. */
export const PORTFOLIO_SECTION_TITLES: Record<PortfolioSection, string> = {
  ux: 'UX',
  brand: 'Brand Development',
  design: 'Design',
  illustration: 'Illustration',
}

/** `title` labels the Kind field; `list` names the kind's list in the Studio sidebar. */
export const PORTFOLIO_KINDS = [
  { title: 'UX — audit / evaluation', list: 'Audits & evaluations', value: 'audit', section: 'ux' },
  { title: 'UX — data & analytics', list: 'Data & analytics', value: 'data', section: 'ux' },
  { title: 'UX — strategy & roadmap', list: 'Strategy & roadmaps', value: 'strategy', section: 'ux' },
  { title: 'UX — research & insights', list: 'Research & insights', value: 'research', section: 'ux' },
  { title: 'UX — design system', list: 'Design systems', value: 'designSystem', section: 'ux' },
  { title: 'UX — screens & prototypes', list: 'Screens & prototypes', value: 'ux', section: 'ux' },
  { title: 'Brand — brand system', list: 'Brand systems', value: 'brand', section: 'brand' },
  { title: 'Brand — logo', list: 'Logos', value: 'logo', section: 'brand' },
  { title: 'Design — campaign', list: 'Campaigns', value: 'campaign', section: 'design' },
  { title: 'Design — graphic / print / web', list: 'Graphic design', value: 'graphic', section: 'design' },
  { title: 'Illustration', list: 'Illustration', value: 'illustration', section: 'illustration' },
  { title: 'Illustration — book / comic', list: 'Books & comics', value: 'book', section: 'illustration' },
] as const satisfies readonly { title: string; list: string; value: string; section: PortfolioSection }[]

export type PortfolioKind = (typeof PORTFOLIO_KINDS)[number]['value']

/**
 * Kinds shown as projects: every piece a half-width tile linking to its own
 * page, rather than a full-width featured lead above a grid of small tiles.
 * The UX disciplines are the evidence behind the case studies — documents
 * and analyses with pages of their own.
 */
export const PROJECT_KINDS: readonly PortfolioKind[] = ['brand', 'audit', 'data', 'strategy', 'research', 'designSystem']

export const kindsInSection = (section: PortfolioSection): PortfolioKind[] =>
  PORTFOLIO_KINDS.filter((k) => k.section === section).map((k) => k.value)

export const sectionOfKind = (kind: string | null | undefined): PortfolioSection | undefined =>
  PORTFOLIO_KINDS.find((k) => k.value === kind)?.section

export const isPortfolioSection = (value: string): value is PortfolioSection =>
  (PORTFOLIO_SECTIONS as readonly string[]).includes(value)
