import { defineType, defineField } from 'sanity'

/**
 * One role on the résumé. Several roles at the same organization are separate
 * entries — the page groups them by organization.
 */
export default defineType({
  name: 'experience',
  title: 'Résumé role',
  type: 'document',
  fields: [
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'organization',
      title: 'Organization',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'start',
      title: 'Start',
      type: 'date',
      options: { dateFormat: 'MMM YYYY' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'end',
      title: 'End',
      type: 'date',
      options: { dateFormat: 'MMM YYYY' },
      description: 'Leave empty for your current role.',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. "Nashville, TN · Hybrid".',
    }),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Lead with outcomes. One line each.',
    }),
    defineField({
      name: 'caseStudies',
      title: 'Related case studies',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'caseStudy' }] }],
    }),
  ],
  orderings: [{ title: 'Most recent first', name: 'startDesc', by: [{ field: 'start', direction: 'desc' }] }],
  preview: { select: { title: 'role', subtitle: 'organization' } },
})
