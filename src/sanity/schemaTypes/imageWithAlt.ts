import { defineType, defineField } from 'sanity'

/**
 * Every image on the site uses this instead of the bare `image` type, so alt
 * text is always available to the front end (AGENTS.md §2).
 *
 * `alt` is intentionally NOT required: making it so would block editors from
 * saving a draft, and a hard validation error is a worse outcome than a
 * decorative image. The warning nudges without blocking, and components fall
 * back to `alt=""` (correct for cover art whose title sits right beside it).
 */
export default defineType({
  name: 'imageWithAlt',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description:
        'Describe what the image SHOWS, not what the thing IS — this is read aloud, it is not SEO copy. Good: "Three phone screens showing the new order flow, step by step." Not: "VitalChek case study." Leave BLANK for logos and covers that sit right beside their own title — otherwise a screen reader announces the same thing twice.',
      validation: (rule) =>
        rule
          .max(160)
          .warning('Long alt text is hard to listen to. Aim for one sentence.'),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional visible caption. Shown under images in a case study or page body.',
    }),
  ],
})
