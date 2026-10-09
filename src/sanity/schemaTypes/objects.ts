import { defineType, defineField, defineArrayMember } from 'sanity'

/**
 * Small reusable object types. Registered in `index.ts` so any document can
 * use them by name.
 */

/** A headline number with its label, e.g. "38×" / "more engagement". */
export const metric = defineType({
  name: 'metric',
  title: 'Metric',
  type: 'object',
  fields: [
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      description: 'The number as it should read, e.g. "38×", "17 yrs", "75+".',
      validation: (rule) => rule.required().max(12),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'What the number means, in a few words.',
      validation: (rule) => rule.required().max(80),
    }),
  ],
  preview: { select: { title: 'value', subtitle: 'label' } },
})

/** A labeled link. Internal paths ("/case-studies") or full URLs both work. */
export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Address',
      type: 'string',
      description: 'A site path like "/case-studies", or a full URL like "https://ndriot.com".',
      validation: (rule) =>
        rule.required().custom((value) =>
          typeof value === 'string' && /^(\/|https?:|mailto:)/.test(value)
            ? true
            : 'Start with "/", "https://", or "mailto:".',
        ),
    }),
  ],
  preview: { select: { title: 'label', subtitle: 'href' } },
})

/**
 * Long-form body copy for case studies and pages: headings, lists, links,
 * inline images and pull quotes. Deliberately small — every block style here
 * needs a matching renderer in `src/components/rich-text.tsx`.
 */
export const richText = defineType({
  name: 'richText',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Subheading', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        annotations: [
          defineArrayMember({
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [defineField({ name: 'href', type: 'url', title: 'URL', validation: (rule) => rule.uri({ scheme: ['http', 'https', 'mailto'] }) })],
          }),
        ],
      },
    }),
    defineArrayMember({ type: 'imageWithAlt' }),
  ],
})
