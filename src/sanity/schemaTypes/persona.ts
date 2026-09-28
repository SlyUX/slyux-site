import { defineType, defineField, defineArrayMember } from 'sanity'

/**
 * A research persona, shown as a card on a case study. Reusable across case
 * studies: add them to any case study's Personas list.
 *
 * The photo should already be a circle (a transparent PNG cut to the circle),
 * so it displays as-is with no CSS rounding.
 */
export default defineType({
  name: 'persona',
  title: 'Persona',
  type: 'object',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      description: 'A circular headshot on a transparent background (PNG). Decorative: the name is announced instead.',
    }),
    defineField({
      name: 'traits',
      title: 'Traits',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
      description: 'Two to four short traits, e.g. "Highly introverted", "Planner".',
    }),
    defineField({
      name: 'opportunitiesLead',
      title: 'Opportunities lead-in',
      type: 'string',
      description: 'Optional sentence above the list, e.g. "Kevin is most likely to engage when:".',
    }),
    defineField({
      name: 'opportunities',
      title: 'Opportunities to engage',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'barriers',
      title: 'Barriers to adoption',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
  ],
  preview: {
    select: { title: 'name', traits: 'traits', media: 'photo' },
    prepare: ({ title, traits, media }) => ({ title, subtitle: (traits ?? []).join(' · '), media }),
  },
})
