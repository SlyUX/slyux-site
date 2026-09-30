import { defineType, defineField, defineArrayMember } from 'sanity'

import { slugField } from './slugField'
import { PORTFOLIO_KINDS } from '../portfolio'


/**
 * A portfolio piece: UX screens, a logo, a campaign, an illustration, a book.
 * Its `kind` decides which portfolio section (/portfolio/ux, /design,
 * /illustration) it appears in — see `src/sanity/portfolio.ts`. Pieces with a
 * Story get their own page at /portfolio/[section]/[slug]; the rest are tiles.
 *
 * Internal type name stays `creativeWork` so existing documents need no
 * migration; editors only ever see "Portfolio piece".
 */
export default defineType({
  name: 'creativeWork',
  title: 'Portfolio piece',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    slugField('title', '/portfolio/illustration/epic-starfish'),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      description: 'Decides which portfolio page the piece appears on.',
      options: { list: PORTFOLIO_KINDS.map(({ title, value }) => ({ title, value })), layout: 'radio' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
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
      name: 'client',
      title: 'Client or publisher',
      type: 'string',
      description: 'e.g. "HarperCollins Christian Publishing". Leave empty for personal work.',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
    }),
    defineField({
      name: 'credit',
      title: 'Credit note',
      type: 'string',
      description:
        'Clarifies your role when others contributed, e.g. "Campaign design. Cover illustration by Ela Smietanka."',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(240),
    }),
    defineField({
      name: 'gallery',
      title: 'More images',
      type: 'array',
      of: [{ type: 'imageWithAlt' }],
      options: { layout: 'grid' },
    }),
    defineField({
      name: 'documents',
      title: 'PDF documents',
      type: 'array',
      of: [defineArrayMember({ type: 'pdfDocument' })],
      description:
        'Thumbnails with a PDF badge that open a page-by-page reader, shown on the piece\'s page instead of the images above. Adding one gives the piece its own page.',
    }),
    defineField({
      name: 'body',
      title: 'Story',
      type: 'richText',
      description: 'Optional. Filling this in, or adding PDF documents, gives the piece its own page.',
    }),
    defineField({
      name: 'caseStudy',
      title: 'Related case study',
      type: 'reference',
      to: [{ type: 'caseStudy' }],
      description: 'For UX pieces especially: the tile links to the full story.',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External link',
      type: 'url',
      description: 'e.g. the book on ndriot.com or foxstorytelling.com.',
    }),
    defineField({
      name: 'mature',
      title: 'Mature content',
      type: 'boolean',
      initialValue: false,
      description:
        'Mature pieces show as a title and outbound link only — no artwork on this site. Visitors choose whether to go further.',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Featured pieces get a large tile at the top of their section, and appear on the Portfolio landing page.',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      initialValue: 100,
      description: 'Lower numbers come first within each kind.',
    }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'kind', media: 'image' } },
})
