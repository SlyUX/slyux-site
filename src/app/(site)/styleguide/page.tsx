import type { Metadata } from 'next'
import { ChevronRight, ExternalLink, FolderOpen, Images, Maximize2, Menu, type LucideIcon } from 'lucide-react'

import { Breadcrumb } from '@/components/breadcrumb'
import { CaseStudyRow, CaseStudyTile, CreativeTile, lightboxItems, MetricStrip } from '@/components/content'
import { Lightbox } from '@/components/lightbox'
import { Rail } from '@/components/rail'
import { ColorTokens, ContrastTable, type ContrastPair, type TokenGroup } from '@/components/styleguide/color-tokens'
import { Specimen } from '@/components/styleguide/specimen'
import { ButtonLink, PageHeader, Section, SectionHeading } from '@/components/ui'
import { CASE_STUDIES_QUERY, PORTFOLIO_SECTION_QUERY, safeFetch } from '@/lib/queries'
import { galleryLabels, getSiteSettings } from '@/lib/site-settings'
import { PORTFOLIO_KINDS } from '@/sanity/portfolio'
import type { CaseStudyCard as CaseStudyCardData, CreativeWorkCard } from '@/lib/types'

/*
 * The styleguide documents the code itself, so its text lives here, beside
 * what it describes, rather than in Sanity: a deliberate exception to "display
 * copy lives in Sanity" (see AGENTS.md). Its examples render the real
 * components with real content, and its contrast ratios are measured live
 * from the tokens, so it stays true to the site as it changes.
 */

export const metadata: Metadata = {
  title: 'Styleguide',
  description: 'The design system behind slyux.com: foundations, components, and the rules that keep them consistent.',
}

const TOKENS: TokenGroup[] = [
  {
    name: 'Neutrals',
    tokens: [
      { token: 'background', use: 'The page.' },
      {
        token: 'surface',
        use: 'Alternating bands, the "How it started" rail, tags.',
      },
      {
        token: 'paper',
        use: 'White ground for artwork: cards, images, galleries, documents.',
      },
      {
        token: 'foreground',
        use: 'Body text, and every heading below the page title.',
      },
      {
        token: 'muted-foreground',
        use: 'Secondary text: intros, meta lines, labels.',
      },
      { token: 'caption', use: 'Image captions.' },
      { token: 'border', use: 'Card outlines and dividers.' },
    ],
  },
  {
    name: 'Accents',
    tokens: [
      {
        token: 'heading',
        use: 'Page titles; the secondary button’s border and text.',
      },
      {
        token: 'primary',
        use: 'Primary buttons, links, the current page in the navigation. The logo’s orange, as dark as readable text needs.',
      },
      {
        token: 'fox',
        use: 'The logo’s exact orange: the dark hero, icons, the pull-quote rule, link underlines in the footer. Never text on a light ground.',
      },
      {
        token: 'project',
        use: 'Burnt orange: the chip on cards with a full page behind them.',
      },
      { token: 'brand', use: 'The blue Highlights band on the home page.' },
      { token: 'brand-muted', use: 'Labels on the blue band.' },
    ],
  },
  {
    name: 'Dark grounds',
    tokens: [
      { token: 'ink', use: 'The home hero and the viewer’s backdrop.' },
      { token: 'ink-muted', use: 'Secondary text on ink.' },
      {
        token: 'footer',
        use: 'The footer, and the navy top edge on cards with a full page.',
      },
      { token: 'footer-muted', use: 'The footer’s copyright line.' },
      {
        token: 'pdf',
        use: 'The document badge: the one red on the site, after Acrobat.',
      },
    ],
  },
]

const PAIRS: ContrastPair[] = [
  {
    fg: 'foreground',
    bg: 'background',
    use: 'Body text on the page',
    need: 'text',
  },
  {
    fg: 'foreground',
    bg: 'paper',
    use: 'Text on cards and documents',
    need: 'text',
  },
  {
    fg: 'muted-foreground',
    bg: 'background',
    use: 'Intros, meta lines',
    need: 'text',
  },
  {
    fg: 'muted-foreground',
    bg: 'surface',
    use: 'Meta lines on gray bands',
    need: 'text',
  },
  { fg: 'caption', bg: 'background', use: 'Image captions', need: 'text' },
  { fg: 'caption', bg: 'surface', use: 'Captions in the rail', need: 'text' },
  { fg: 'heading', bg: 'background', use: 'Page titles', need: 'text' },
  {
    fg: 'primary',
    bg: 'background',
    use: 'Links, active navigation',
    need: 'text',
  },
  {
    fg: 'primary',
    bg: 'surface',
    use: 'Big stat numbers on gray bands',
    need: 'large',
  },
  { fg: 'white', bg: 'primary', use: 'Primary buttons', need: 'text' },
  { fg: 'white', bg: 'heading', use: 'Primary button, hovered', need: 'text' },
  {
    fg: 'heading',
    bg: 'paper',
    bgAlpha: 0.75,
    under: 'surface',
    use: 'Secondary buttons (worst case: on a gray band)',
    need: 'text',
  },
  {
    fg: 'primary',
    bg: 'paper',
    bgAlpha: 0.75,
    under: 'surface',
    use: 'Secondary button, hovered',
    need: 'text',
  },
  {
    fg: 'white',
    bg: 'project',
    use: 'Chips on cards with a full page',
    need: 'text',
  },
  {
    fg: 'fox',
    bg: 'ink',
    use: 'Icons and text on the dark hero',
    need: 'text',
  },
  {
    fg: 'fox',
    bg: 'background',
    use: 'Icons only: never text on the page',
    need: 'decorative',
  },
  { fg: 'ink-foreground', bg: 'ink', use: 'Text on ink', need: 'text' },
  { fg: 'ink-muted', bg: 'ink', use: 'Secondary text on ink', need: 'text' },
  { fg: 'white', bg: 'brand', use: 'Numbers on the blue band', need: 'text' },
  {
    fg: 'brand-muted',
    bg: 'brand',
    use: 'Labels on the blue band',
    need: 'text',
  },
  {
    fg: 'fox',
    bg: 'brand',
    use: 'Never: no orange on the blue band',
    need: 'text',
  },
  { fg: 'footer-foreground', bg: 'footer', use: 'Footer links', need: 'text' },
  {
    fg: 'footer-muted',
    bg: 'footer',
    use: 'The footer’s copyright line',
    need: 'text',
  },
  {
    fg: 'fox',
    bg: 'footer',
    use: 'The footer’s hover underline, never text',
    need: 'decorative',
  },
  { fg: 'white', bg: 'pdf', use: 'The document badge', need: 'text' },
]

const TYPE = [
  {
    role: 'Page title',
    className: 'font-display text-heading text-4xl leading-tight font-semibold tracking-tight md:text-5xl',
    sample: 'Case Studies',
    spec: 'Libre Bodoni, semibold, navy: fluid from 30px on phones to 60px on wide screens. One per page.',
  },
  {
    role: 'Section heading',
    className: 'font-display text-3xl font-semibold',
    sample: 'Research-led redesigns',
    spec: 'Libre Bodoni, semibold, fluid 24–36px. Every band and section.',
  },
  {
    role: 'Featured title',
    className: 'font-display text-2xl font-semibold',
    sample: 'Clear Mind, Peaceful Heart',
    spec: 'Libre Bodoni, 24px: a step below the section heading.',
  },
  {
    role: 'Card title',
    className: 'text-xl font-semibold',
    sample: 'WellTrack wellness app',
    spec: 'Geist, semibold: 16px on small cards, 20px on Case Studies cards.',
  },
  {
    role: 'Eyebrow',
    className: 'text-primary text-sm font-semibold tracking-wide uppercase',
    sample: 'HarperCollins Christian Publishing',
    spec: 'Geist, 14px tracked capitals in orange: the organization above a case study’s title.',
  },
  {
    role: 'Body',
    className: 'leading-relaxed',
    sample: 'Short declarative sentences, concrete nouns, and numbers with their context.',
    spec: 'Geist, 16px, relaxed leading. Page intros run 18px in the muted gray.',
  },
  {
    role: 'Caption',
    className: 'text-caption text-sm',
    sample: 'The podcast in Apple Podcasts in 2026, with the cover I designed.',
    spec: 'Geist, 14px, dark gray, centered under its image.',
  },
]

const ICONS: { icon: LucideIcon; name: string; use: string }[] = [
  {
    icon: FolderOpen,
    name: 'Folder',
    use: 'The card opens a page: a case study or a project.',
  },
  {
    icon: Maximize2,
    name: 'Expand',
    use: 'The card opens its image larger, in the viewer.',
  },
  {
    icon: Images,
    name: 'Gallery',
    use: 'Paired with a count and the expand arrows when a card opens several images.',
  },
  { icon: ExternalLink, name: 'External', use: 'The card opens another site.' },
  {
    icon: ChevronRight,
    name: 'Chevron',
    use: 'Between steps of the breadcrumb trail.',
  },
  {
    icon: Menu,
    name: 'Menu',
    use: 'Opens the navigation on narrower screens.',
  },
]

const RULES = [
  [
    'Tokens only.',
    'Colors come from the tokens above, through Tailwind; no raw hex values or palette classes in components. A new color pair must pass WCAG AA, and its ratio goes in globals.css.',
  ],
  ['One page title.', 'Each page has one h1, and headings never skip a level.'],
  [
    'Corners are 7px.',
    'Every outermost element uses rounded-ui. An element nested a small inset inside another takes the parent’s radius minus the inset (rounded-ui-inner, 4px, inside a 3px track), so the corners stay concentric. Phone screenshots keep a device-like corner.',
  ],
  ['Artwork sits on white.', 'Logos and brand marks show whole, never cropped. Other cards fill with the artwork, cropped around its focal point.'],
  ['No red for good news.', 'Red reads as urgent. Positive emphasis is burnt orange or navy; the one red is the document badge.'],
  ['Every image opens larger.', 'Cards, galleries, and story images all open the viewer. Each card is its own gallery: the viewer steps through that card’s images and stops.'],
  ['Featured pieces lead.', 'A piece marked Featured leads its page in a Featured band, image beside summary. Brand systems and UX projects sit side by side as equals instead.'],
  ['Phones see phones first.', 'Case studies show their mobile galleries before desktop ones on narrow screens, and desktop captures swipe in one row.'],
  ['Navigation recedes.', 'The breadcrumb is a plain trail; switching sections happens in the header. Choose the lighter option before adding boxes around navigation.'],
  [
    'Content lives in Sanity.',
    'Display copy is edited in the Studio, with defaults in src/lib/site-settings.ts. Exceptions are text only assistive technology hears, and this page.',
  ],
]

const VOICE: [string, React.ReactNode][] = [
  [
    'Diplomatic, even when disagreeing.',
    'Describe the work and the conditions behind it, not people’s judgment. Credit what worked before naming what didn’t. When someone decided differently, say so plainly and leave it there.',
  ],
  ['Let results carry the praise.', 'No self-assessment or adjectives doing a number’s job. Numbers keep their baseline and source.'],
  ['First person for my calls, we for the team’s.', 'Be clear which is which.'],
  ['Short and concrete.', 'Short declarative sentences, concrete nouns, no hype words (leveraged, seamless, robust, holistic).'],
  ['Sentence case for headings.', '“Research-led redesigns,” not “Research-Led Redesigns.” Page names follow the navigation.'],
  ['Lowercase after a label.', '“Scope: research and design,” not “Scope: Research and design.” Proper nouns, job titles, and “I” keep their capitals.'],
  [
    'Titles in italics, or quotation marks: never both.',
    <>
      Italics in body text (<em>Jesus Calling</em>); quotation marks where italics can’t go, like summaries and alt text.
    </>,
  ],
  ['American English.', 'Including Studio labels.'],
  ['Alt text says what the image shows and why it matters,', 'in one sentence.'],
]

const pick = <T extends { slug?: string | null }>(list: T[], slug: string) => list.find((x) => x.slug === slug)

export default async function StyleguidePage() {
  const [s, studies, works] = await Promise.all([
    getSiteSettings(),
    safeFetch<CaseStudyCardData[]>(CASE_STUDIES_QUERY, {}, []),
    safeFetch<CreativeWorkCard[]>(PORTFOLIO_SECTION_QUERY, { kinds: PORTFOLIO_KINDS.map((k) => k.value) }, []),
  ])
  const labels = galleryLabels(s)
  const study = pick(studies, 'welltrack') ?? studies[0]
  const featuredStudy = pick(studies, 'jesus-calling') ?? studies[1]
  const cards = ['acculevel', 'clear-mind-peaceful-heart', 'wheelhouse-marketing', 'the-gardener'].flatMap((slug) => pick(works, slug) ?? [])
  const feature = pick(works, 'clear-mind-peaceful-heart')
  const tile = (work: CreativeWorkCard, extra: { feature?: boolean } = {}) => (
    <CreativeTile
      key={work._id}
      work={work}
      enlargeLabel={labels.enlarge}
      imageCountLabel={labels.imageCount}
      kindLabels={s.kindLabels}
      headingLevel="h4"
      {...extra}
    />
  )

  const toc = [
    ['color', 'Color'],
    ['type', 'Type'],
    ['corners-and-spacing', 'Corners and spacing'],
    ['icons', 'Icons'],
    ['actions', 'Actions and wayfinding'],
    ['cards', 'Cards'],
    ['data-and-story', 'Stats and stories'],
    ['rules', 'Rules'],
    ['voice', 'Voice'],
  ]

  return (
    <>
      <Section opener className="pb-10 md:pb-12">
        <PageHeader
          title="Styleguide"
          intro="The design system behind this site: its foundations, its components, and the rules that keep them consistent. Before building anything new, check here for something to reuse or extend."
        />
        <nav aria-label="On this page" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {toc.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="bg-surface hover:text-primary rounded-ui inline-flex px-3 py-1.5 text-sm font-medium">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      <Section id="color" tone="surface" aria-labelledby="color-heading" className="scroll-mt-4">
        <SectionHeading
          id="color-heading"
          intro="Paper, blueprint blues, and one fox orange. Components use these tokens through Tailwind (bg-surface, text-primary), never raw hex values. Each value below is read from globals.css as the page loads."
        >
          Color
        </SectionHeading>
        <ColorTokens groups={TOKENS} />
        <h3 className="mt-14 mb-2 font-semibold">Contrast</h3>
        <p className="text-muted-foreground mb-6 max-w-3xl">
          Every pair the site uses, measured live against WCAG 2.x: 4.5 for text, 3 for large text. A few fail on purpose; they’re listed so no one uses them for text.
        </p>
        <ContrastTable pairs={PAIRS} />
      </Section>

      <Section id="type" aria-labelledby="type-heading" className="scroll-mt-4">
        <SectionHeading id="type-heading" intro="Two families: Libre Bodoni for display, a Bodoni drawn for text sizes so its thin strokes hold up, and Geist for everything else.">
          Type
        </SectionHeading>
        <div className="border-border bg-paper rounded-ui divide-border divide-y border">
          {TYPE.map((t) => (
            <div key={t.role} className="grid gap-3 p-5 md:grid-cols-[12rem_1fr] md:gap-8">
              <div>
                <p className="font-semibold">{t.role}</p>
                <p className="text-muted-foreground mt-1 text-sm">{t.spec}</p>
              </div>
              <p className={t.className}>{t.sample}</p>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-6 max-w-3xl text-sm">
          Display sizes are fluid, scaling between phone and desktop widths. In stats, the symbols ×, +, and ~ are set in Geist: Bodoni draws them as hairlines that fade at stat
          sizes.
        </p>
      </Section>

      <Section id="corners-and-spacing" tone="surface" aria-labelledby="corners-heading" className="scroll-mt-4">
        <SectionHeading id="corners-heading" intro="Corners are 7px on every outermost element. Spacing follows an 8px rhythm.">
          Corners and spacing
        </SectionHeading>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-paper border-border rounded-ui grid place-items-center gap-3 border p-8 text-center">
            <span className="bg-surface border-border rounded-ui size-20 border" />
            <p className="text-sm">
              <code className="font-semibold">rounded-ui</code> · 7px
              <br />
              <span className="text-muted-foreground">Cards, buttons, chips, menus, images.</span>
            </p>
          </div>
          <div className="bg-paper border-border rounded-ui grid place-items-center gap-3 border p-8 text-center">
            <span className="bg-surface rounded-ui inline-flex gap-[3px] p-[3px]">
              <span className="bg-paper rounded-ui-inner px-3 py-1.5 text-sm font-medium shadow-sm">Selected</span>
              <span className="text-muted-foreground px-3 py-1.5 text-sm font-medium">Other</span>
            </span>
            <p className="text-sm">
              <code className="font-semibold">rounded-ui-inner</code> · 4px
              <br />
              <span className="text-muted-foreground">Inside a 3px inset: 7 − 3, so the corners nest.</span>
            </p>
          </div>
          <div className="bg-paper border-border rounded-ui grid place-items-center gap-3 border p-8 text-center">
            <span className="border-border h-24 w-12 rounded-[1.25rem] border-2" />
            <p className="text-sm">
              <span className="font-semibold">The exception</span>
              <br />
              <span className="text-muted-foreground">Phone screenshots keep a device-like corner.</span>
            </p>
          </div>
        </div>
        <dl className="bg-paper border-border rounded-ui divide-border mt-6 divide-y border text-sm">
          {[
            ['Bands', '48px top and bottom on phones, 64px on wider screens.'],
            ['A page’s first band', 'Starts closer to the navigation: 32px, then 40px.'],
            ['Breadcrumb to title', '32px.'],
            ['Section heading to content', '40px.'],
            ['Galleries', '64px apart below a story, 32px apart in the rail.'],
          ].map(([term, value]) => (
            <div key={term} className="grid gap-1 p-4 sm:grid-cols-[14rem_1fr]">
              <dt className="font-semibold">{term}</dt>
              <dd className="text-muted-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="icons" aria-labelledby="icons-heading" className="scroll-mt-4">
        <SectionHeading
          id="icons-heading"
          intro="Lucide line icons, with a lighter 1.5 stroke where they’re large. In the hero and the home page’s closing headings they’re fox orange; on cards they sit in a white pill in the image’s top-right corner."
        >
          Icons
        </SectionHeading>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ICONS.map(({ icon: Icon, name, use }) => (
            <li key={name} className="bg-paper border-border rounded-ui flex items-start gap-4 border p-4">
              <span className="bg-surface rounded-ui-inner flex size-10 shrink-0 items-center justify-center">
                <Icon aria-hidden className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{name}</span>
                <span className="text-muted-foreground block text-sm">{use}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="actions" tone="surface" aria-labelledby="actions-heading" className="scroll-mt-4">
        <SectionHeading id="actions-heading" intro="How people act and find their way.">
          Actions and wayfinding
        </SectionHeading>
        <div className="grid gap-8">
          <Specimen
            name="Buttons"
            file="src/components/ui.tsx"
            notes={[
              'Primary: orange with white text, navy when hovered. The one main action in a view.',
              'Secondary: 75% white with a navy border and text, so it reads on any band. For “See all” and links out of a story.',
              'ButtonLink renders a CMS link; buttonVariants() styles anything else as a button.',
            ]}
          >
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                link={{
                  _type: 'link',
                  label: 'Primary action',
                  href: '/contact',
                }}
              />
              <ButtonLink
                link={{
                  _type: 'link',
                  label: 'Secondary action',
                  href: '/portfolio',
                }}
                variant="secondary"
              />
            </div>
          </Specimen>
          <Specimen
            name="Section heading"
            file="src/components/ui.tsx"
            stage="background"
            notes={['Heads every band and section: one size, one color, 40px to the content.', 'Takes an optional intro below and an action beside it, such as “See all.”']}
          >
            {/* Without its 40px gap to the content, which this frame doesn’t have. */}
            <div className="*:mb-0">
              <SectionHeading
                as="h4"
                intro="An optional intro, in the muted gray."
                action={
                  <ButtonLink
                    link={{
                      _type: 'link',
                      label: s.portfolioViewAll,
                      href: '/portfolio',
                    }}
                    variant="secondary"
                  />
                }
              >
                Section heading
              </SectionHeading>
            </div>
          </Specimen>
          <Specimen
            name="Breadcrumb"
            file="src/components/breadcrumb.tsx"
            stage="background"
            notes={['On child pages only: portfolio sections, portfolio pieces, and case studies.', 'A plain trail, small and muted, so the title leads.']}
          >
            <div className="*:mb-0">
              <Breadcrumb
                trail={[
                  { label: s.creativeTitle, href: '/portfolio' },
                  {
                    label: s.portfolioSections.brand.title,
                    href: '/portfolio/brand',
                  },
                ]}
                page="Acculevel brand system"
              />
            </div>
          </Specimen>
          <Specimen
            name="Navigation"
            file="src/components/site-nav.tsx"
            stage="background"
            notes={[
              'The header above is the live example. Wide screens list the pages, with the portfolio sections behind the chevron beside “Portfolio.”',
              'Narrower screens show a menu button that opens the same pages, sections indented under Portfolio.',
              'Pages and their order come from Site settings → Navigation; sections follow the Portfolio page’s order.',
            ]}
          >
            <p className="text-muted-foreground text-sm">See the header at the top of this page.</p>
          </Specimen>
        </div>
      </Section>

      <Section id="cards" aria-labelledby="cards-heading" className="scroll-mt-4">
        <SectionHeading id="cards-heading" intro="Every card is one click target, and its top-right indicator says what the click does.">
          Cards
        </SectionHeading>
        <Lightbox items={lightboxItems([...cards, ...(feature ? [feature] : [])])} labels={labels}>
          <div className="grid gap-8">
            {study && (
              <Specimen
                name="Case study tile"
                file="src/components/content.tsx · CaseStudyTile"
                notes={[
                  'Compact (home page, the UX row): thumbnail, title, and client or organization and years.',
                  'With details (Case Studies page, two to a row): a larger title, a summary of three lines at most, and the lead metric.',
                ]}
              >
                <div className="grid gap-8 md:grid-cols-2">
                  <CaseStudyTile study={study} label={s.caseStudyLabel} headingLevel="h4" />
                  <CaseStudyTile study={study} details headingLevel="h4" />
                </div>
              </Specimen>
            )}
            {featuredStudy && (
              <Specimen
                name="Case study row"
                file="src/components/content.tsx · CaseStudyRow"
                notes={['The featured band on the Case Studies page: thumbnail beside the summary, alternating sides down the page.']}
              >
                <CaseStudyRow study={featuredStudy} headingLevel="h4" />
              </Specimen>
            )}
            {cards.length > 0 && (
              <Specimen
                name="Portfolio card"
                file="src/components/content.tsx · CreativeTile"
                notes={[
                  'Indicator: a folder opens a page; arrows open the image larger; a gallery adds its icon and image count.',
                  'A chip names the kind where no heading does. Cards with a page get a burnt-orange chip and a navy top edge. On cards too narrow for both, the chip drops to the bottom-left so it never runs under the indicator.',
                  'Brand pieces and logos show whole on white; other artwork fills the card, cropped around its focal point.',
                ]}
              >
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">{cards.map((work) => tile(work))}</div>
              </Specimen>
            )}
            {feature && (
              <Specimen
                name="Featured row"
                file="src/components/content.tsx · CreativeTile feature"
                notes={['A featured piece leads its portfolio page: image beside client, title, and summary. Its click does what its card would.']}
              >
                {tile(feature, { feature: true })}
              </Specimen>
            )}
          </div>
        </Lightbox>
      </Section>

      <Section id="data-and-story" tone="surface" aria-labelledby="data-heading" className="scroll-mt-4">
        <SectionHeading id="data-heading" intro="Numbers that carry a story, and the context beside it.">
          Stats and stories
        </SectionHeading>
        <div className="grid gap-8">
          {!!study?.metrics?.length && (
            <Specimen
              name="Stat strip"
              file="src/components/content.tsx · MetricStrip"
              notes={[
                'Left-aligned on case studies, where text follows; centered on the home page’s blue band.',
                'Numbers in Libre Bodoni; ×, +, and ~ in Geist.',
                'Up to four, each with its baseline in the label. Only real numbers.',
              ]}
            >
              <MetricStrip metrics={study.metrics} />
              <div className="bg-brand text-primary-foreground rounded-ui mt-8 p-6">
                <MetricStrip metrics={study.metrics} tone="brand" align="center" />
              </div>
            </Specimen>
          )}
          <Specimen
            name="“How it started” rail"
            file="src/components/rail.tsx"
            stage="background"
            notes={['Before-the-work context beside a story: the old logo, the original site. Folds closed on phones, after At a glance.']}
          >
            <div className="max-w-sm">
              <Rail heading={s.howItStartedHeading} headingLevel="h4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  The original mark, a page that predated the redesign, or the brief: whatever shows where the work began.
                </p>
              </Rail>
            </div>
          </Specimen>
          <Specimen
            name="Viewer"
            file="src/components/viewer.tsx · lightbox.tsx · gallery-viewer.tsx · document-viewer.tsx"
            notes={[
              'One viewer behind every image: cards, case study galleries, story images, and the document reader. Try the cards above.',
              'Each card is its own gallery. A thumbnail in a gallery opens at itself.',
              'Images fit the screen, never wider than their real resolution. Tall page captures stream in slices so they stay sharp.',
            ]}
          >
            <p className="text-muted-foreground text-sm">Open any card in the Cards section above.</p>
          </Specimen>
        </div>
      </Section>

      <Section id="rules" aria-labelledby="rules-heading" className="scroll-mt-4">
        <SectionHeading id="rules-heading" intro="The decisions behind the components, so the next one fits.">
          Rules
        </SectionHeading>
        <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {RULES.map(([lead, rest]) => (
            <li key={lead} className="leading-relaxed">
              <span className="font-semibold">{lead}</span> <span className="text-muted-foreground">{rest}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="voice" tone="surface" aria-labelledby="voice-heading" className="scroll-mt-4">
        <SectionHeading id="voice-heading" intro="How the case studies and portfolio pages are written.">
          Voice
        </SectionHeading>
        <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {VOICE.map(([lead, rest]) => (
            <li key={lead} className="leading-relaxed">
              <span className="font-semibold">{lead}</span> <span className="text-muted-foreground">{rest}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
