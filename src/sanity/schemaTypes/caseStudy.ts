import { defineType, defineField, defineArrayMember } from 'sanity'

import { slugField } from './slugField'

/**
 * Drafting notes ("TODO:" and "TODO (review):", as the ux-case-study skill
 * writes them) are fine in a draft but public the moment it's published.
 * Warn rather than block, so a partly finished page can still go live on
 * purpose.
 */
const todoCheck = (value: unknown) =>
  JSON.stringify(value ?? '').includes('TODO') ? 'Still has TODO notes. They will be public when you publish.' : true

/**
 * A UX / product case study — the core of the portfolio. Which ones appear on
 * the home page is chosen in Site settings, not here, so featuring is one
 * decision in one place.
 */
export default defineType({
  name: 'caseStudy',
  title: 'Case study',
  type: 'document',
  groups: [
    { name: 'overview', title: 'Overview', default: true },
    { name: 'story', title: 'Story' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'overview',
      validation: (rule) => rule.required(),
    }),
    slugField('title', '/case-studies/church-marketing-plan-tool'),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      group: 'overview',
      description: 'One or two sentences for cards and the top of the page: the problem and what changed.',
      validation: (rule) => [rule.required().max(280), rule.custom(todoCheck).warning()],
    }),
    defineField({
      name: 'organization',
      title: 'Organization',
      type: 'string',
      group: 'overview',
      description: 'Who the work was for, e.g. "United Methodist Communications".',
      validation: (rule) => rule.custom(todoCheck).warning(),
    }),
    defineField({
      name: 'role',
      title: 'My role',
      type: 'string',
      group: 'overview',
      description: 'e.g. "UX/CX Director — strategy, IA, coded prototypes".',
      validation: (rule) => rule.custom(todoCheck).warning(),
    }),
    defineField({
      name: 'years',
      title: 'Years',
      type: 'string',
      group: 'overview',
      description: 'As it should read, e.g. "2018" or "2024–2026".',
      validation: (rule) => rule.custom(todoCheck).warning(),
    }),
    defineField({
      name: 'skills',
      title: 'Skills shown',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'overview',
      description: 'Short tags, e.g. "Research", "Information architecture", "Next.js".',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'imageWithAlt',
      group: 'overview',
    }),
    defineField({
      name: 'heroBackground',
      title: 'Hero background',
      type: 'image',
      group: 'overview',
      options: { hotspot: true },
      description:
        'Decorative wide image behind the title on the case study page (e.g. a faded collage, ~3000 × 750). The hero image above is used on cards.',
    }),
    defineField({
      name: 'metrics',
      title: 'Results',
      type: 'array',
      of: [{ type: 'metric' }],
      group: 'overview',
      description: 'Up to four headline numbers. Leave empty rather than inventing one.',
      validation: (rule) => [rule.max(4), rule.custom(todoCheck).warning()],
    }),
    defineField({
      name: 'body',
      title: 'Story',
      type: 'richText',
      group: 'story',
      description: 'Suggested headings: The problem · My role · Process · What changed.',
      validation: (rule) => rule.custom(todoCheck).warning(),
    }),
    defineField({
      name: 'personasIntro',
      title: 'Personas intro',
      type: 'text',
      rows: 2,
      group: 'story',
      description: 'Optional line under the Personas heading.',
      validation: (rule) => rule.custom(todoCheck).warning(),
    }),
    defineField({
      name: 'personas',
      title: 'Personas',
      type: 'array',
      group: 'story',
      description: 'Shown after the story, before the new-design galleries.',
      validation: (rule) => rule.custom(todoCheck).warning(),
      of: [defineArrayMember({ type: 'persona' })],
    }),
    defineField({
      name: 'galleries',
      title: 'Galleries',
      type: 'array',
      group: 'story',
      description: 'Titled image groups — e.g. "The sites today" before the story, "The app" after it. Order within each placement follows this list.',
      validation: (rule) => rule.custom(todoCheck).warning(),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'gallery',
          fields: [
            defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
            defineField({
              name: 'placement',
              title: 'Placement',
              type: 'string',
              initialValue: 'after',
              description: 'Where the gallery sits relative to the story.',
              options: {
                list: [
                  { title: 'Before the story — the current state', value: 'before' },
                  { title: 'After the story — the new design', value: 'after' },
                ],
                layout: 'radio',
              },
            }),
            defineField({
              name: 'layout',
              title: 'Layout',
              type: 'string',
              initialValue: 'wide',
              options: {
                list: [
                  { title: 'Phone screens (grid)', value: 'phone' },
                  { title: 'Wide / mixed (two columns)', value: 'wide' },
                ],
                layout: 'radio',
              },
            }),
            defineField({
              name: 'images',
              title: 'Images',
              type: 'array',
              description:
                'Give each image a short caption, e.g. "UMC.org · Home". Tall page captures show their first screen, and the whole page opens in the viewer; use "Screen (with full page)" to pair a separate first-screen image with a full-length capture.',
              of: [{ type: 'imageWithAlt' }, { type: 'galleryScreen' }],
              options: { layout: 'grid' },
              validation: (rule) => rule.min(1),
            }),
          ],
          preview: {
            select: { title: 'heading', images: 'images', media: 'images.0' },
            prepare: ({ title, images, media }) => ({ title, subtitle: `${images?.length ?? 0} images`, media }),
          },
        }),
      ],
    }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [{ type: 'link' }],
      group: 'story',
      description: 'Live site, prototype, press, etc.',
    }),
    defineField({
      name: 'order',
      title: 'Order on the Work page',
      type: 'number',
      group: 'overview',
      description: 'Lower numbers come first.',
      initialValue: 100,
    }),
    defineField({
      name: 'seoDescription',
      title: 'Search description',
      type: 'text',
      rows: 2,
      group: 'seo',
      description: 'Falls back to the summary when empty.',
      validation: (rule) => [rule.max(160).warning('Search engines cut off around 160 characters.'), rule.custom(todoCheck).warning()],
    }),
  ],
  orderings: [{ title: 'Work page order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'organization', media: 'heroImage' } },
})
