import { defineType, defineField } from 'sanity'

import { slugField } from './slugField'

/**
 * A free-form page: About, Work with me, and anything added later. Served at
 * /[slug]. Slugs that collide with a built-in route (work, creative, resume,
 * studio) are rejected, since the built-in route would always win.
 */
const RESERVED = ['work', 'creative', 'resume', 'studio', 'contact']

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    {
      ...slugField('title', '/about'),
      validation: (rule) =>
        rule.required().custom((value: { current?: string } | undefined) =>
          value?.current && RESERVED.includes(value.current)
            ? `"${value.current}" is already a built-in page. Choose another slug.`
            : true,
        ),
    },
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'text',
      rows: 3,
      description: 'A short lead paragraph under the title.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'imageWithAlt',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'richText',
    }),
    defineField({
      name: 'rail',
      title: 'Rail',
      type: 'object',
      description:
        'An optional card beside the page on wide screens, like "How it started" on case studies; on phones it folds under its heading at the end. About uses it for "Working with AI."',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required() }),
        defineField({ name: 'body', title: 'Text', type: 'richText' }),
      ],
    }),
    defineField({
      name: 'cta',
      title: 'Call to action',
      type: 'link',
      description: 'Optional button at the end of the page.',
    }),
    defineField({
      name: 'seoDescription',
      title: 'Search description',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(160).warning('Search engines cut off around 160 characters.'),
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
