import { defineType, defineField, defineArrayMember } from 'sanity'

import { slugField } from './slugField'
import { PORTFOLIO_KINDS, sectionOfKind } from '../portfolio'


/**
 * A portfolio piece: UX screens, a logo, a campaign, an illustration, a book.
 * Its `kind` decides which portfolio section (/portfolio/ux, /design,
 * /illustration) it appears in — see `src/sanity/portfolio.ts`. Pieces with a
 * Story or PDFs get their own page at /portfolio/[section]/[slug]; the rest
 * are cards that link to a case study or out, or open their image larger.
 *
 * Internal type name stays `creativeWork` so existing documents need no
 * migration; editors only ever see "Portfolio piece".
 */
export default defineType({
  name: 'creativeWork',
  title: 'Portfolio piece',
  type: 'document',
  // What the card shows, what the piece's own page holds, and where a card links.
  groups: [
    { name: 'card', title: 'Card', default: true },
    { name: 'page', title: 'Project page' },
    { name: 'links', title: 'Links' },
  ],
  fields: [
    defineField({
      name: 'title',
      group: 'card',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    { ...slugField('title', '/portfolio/illustration/epic-starfish'), group: 'card' },
    defineField({
      name: 'kind',
      group: 'card',
      title: 'Kind',
      type: 'string',
      description: 'Decides which portfolio page the piece appears on.',
      options: { list: PORTFOLIO_KINDS.map(({ title, value }) => ({ title, value })), layout: 'radio' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      group: 'card',
      title: 'Main image',
      type: 'imageWithAlt',
      description: 'Required unless the piece is marked mature (mature pieces show no artwork).',
      validation: (rule) =>
        rule.custom((value, context) =>
          (value as { asset?: unknown } | undefined)?.asset || (context.document as { mature?: boolean } | undefined)?.mature
            ? true
            : 'Add an image, or mark the piece as mature.',
        ),
    }),
    defineField({
      name: 'cardFit',
      group: 'card',
      title: 'In cards',
      type: 'string',
      options: {
        list: [
          { title: 'Fill the card', value: 'fill' },
          { title: 'Show the whole image', value: 'whole' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'fill',
      // Brand and logo pieces always show whole, on white, so the choice only appears for other kinds.
      hidden: ({ document }) => sectionOfKind(document?.kind as string | undefined) === 'brand',
      description:
        "Fill crops the image to the card's shape around its focal point (set it with the crop tool on the image). Use Show the whole image for banners or covers that mustn't be cut. Transparent images always show whole, on white.",
    }),
    defineField({
      name: 'client',
      group: 'card',
      title: 'Client or publisher',
      type: 'string',
      description: 'e.g. "HarperCollins Christian Publishing". Leave empty for personal work.',
    }),
    defineField({
      name: 'year',
      group: 'card',
      title: 'Year',
      type: 'string',
    }),
    defineField({
      name: 'credit',
      group: 'card',
      title: 'Credit note',
      type: 'string',
      description:
        'Clarifies your role when others contributed, e.g. "Campaign design. Cover illustration by Ela Smietanka."',
    }),
    defineField({
      name: 'summary',
      group: 'card',
      title: 'Summary',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(240),
    }),
    defineField({
      name: 'gallery',
      group: 'card',
      title: 'More images',
      type: 'array',
      description: "Shown on the piece's page, or after the main image when its card opens it larger.",
      of: [{ type: 'imageWithAlt' }],
      options: { layout: 'grid' },
    }),
    defineField({
      name: 'documents',
      group: 'page',
      title: 'PDF documents',
      type: 'array',
      of: [defineArrayMember({ type: 'pdfDocument' })],
      description:
        'Thumbnails with a PDF badge that open a page-by-page reader, shown on the piece\'s page instead of the images above. Adding one gives the piece its own page.',
    }),
    defineField({
      name: 'documentsHeading',
      group: 'page',
      title: 'Documents heading',
      type: 'string',
      description: 'Optional. Heads the section of PDF documents on this page, e.g. "The comic". Empty uses the one in Site settings.',
    }),
    defineField({
      name: 'howItStarted',
      group: 'page',
      title: 'How it started',
      type: 'richText',
      description:
        'Optional context before the work — the old logo, the problem — shown in a rail beside the story (after it on phones), so the page leads with the work itself.',
    }),
    defineField({
      name: 'body',
      group: 'page',
      title: 'Story',
      type: 'richText',
      description: 'Optional. Filling this in, or adding PDF documents, gives the piece its own page.',
    }),
    defineField({
      name: 'caseStudy',
      group: 'links',
      title: 'Related case study',
      type: 'reference',
      to: [{ type: 'caseStudy' }],
      description: 'For UX pieces especially: the tile links to the full story.',
    }),
    defineField({
      name: 'externalUrl',
      group: 'links',
      title: 'External link',
      type: 'url',
      description: 'e.g. the book on ndriot.com or foxstorytelling.com.',
    }),
    defineField({
      name: 'mature',
      group: 'card',
      title: 'Mature content',
      type: 'boolean',
      initialValue: false,
      description:
        'Mature pieces show as a title and outbound link only — no artwork on this site. Visitors choose whether to go further.',
    }),
    defineField({
      name: 'featured',
      group: 'card',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Featured pieces get a large tile at the top of their section, and appear on the Portfolio landing page.',
    }),
    defineField({
      name: 'order',
      group: 'card',
      title: 'Order',
      type: 'number',
      initialValue: 100,
      description: 'Lower numbers come first within each kind.',
    }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  // The subtitle says what the card does, so a single logo and a full project read differently in lists.
  preview: {
    select: {
      title: 'title',
      kind: 'kind',
      media: 'image',
      story: 'body.0._key',
      pdf: 'documents.0._key',
      caseStudy: 'caseStudy._ref',
      externalUrl: 'externalUrl',
      mature: 'mature',
      featured: 'featured',
    },
    prepare: ({ title, kind, media, story, pdf, caseStudy, externalUrl, mature, featured }) => {
      const kindTitle = PORTFOLIO_KINDS.find((k) => k.value === kind)?.title ?? 'No kind yet'
      const card = mature
        ? 'Mature: title and link only'
        : story || pdf
          ? 'Project page'
          : caseStudy
            ? 'Links to a case study'
            : externalUrl
              ? 'Links out'
              : 'Single image, opens larger'
      return { title, media, subtitle: [kindTitle, card, featured && 'Featured'].filter(Boolean).join(' · ') }
    },
  },
})
