import { defineArrayMember, defineField, defineType } from 'sanity'
import { MobileDeviceIcon } from '@sanity/icons/MobileDevice'

/** Screen names in this prototype, for checking where a tap area leads. */
const screenNames = (document: unknown) => ((document as { screens?: { name?: string }[] } | undefined)?.screens ?? []).flatMap((s) => (s.name ? [s.name] : []))

/**
 * A clickable phone prototype: screens, and tap areas that link them. It
 * plays in a current iPhone (Dynamic Island, status bar, home indicator) in
 * place of the gallery's plain viewer: any case study gallery image that uses
 * the same image as a screen opens the prototype at that screen.
 *
 * Positions and sizes are in design points, measured from the top-left of the
 * screen as designed (its status bar included), so they match the design file.
 */
export default defineType({
  name: 'prototype',
  title: 'Prototype',
  type: 'document',
  icon: MobileDeviceIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Names the prototype for screen readers, e.g. "WellTrack app prototype".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'designWidth',
      title: 'Design width',
      type: 'number',
      initialValue: 375,
      description: 'The width the screens were designed at, in points (375 for most iPhone designs). Tap areas use the same units.',
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: 'statusBarHeight',
      title: 'Designed status bar height',
      type: 'number',
      initialValue: 43,
      description: "The status bar drawn into the designs, in points. The prototype crops it and draws a current iPhone's instead. 0 if the designs have none.",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'screens',
      title: 'Screens',
      type: 'array',
      description: 'In the order the viewer steps through them. The first is where "Try the prototype" starts.',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'prototypeScreen',
          title: 'Screen',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              description: 'Shown as the viewer steps through, e.g. "Dashboard · New user". Tap areas lead to screens by this name.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'image',
              title: 'Screen',
              type: 'image',
              description: 'The first screen as designed, at 2× or 3×. A gallery image using this same image opens the prototype here.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              description: 'Describe what the screen SHOWS. One sentence.',
              validation: (rule) => rule.required().max(160).warning('Long alt text is hard to listen to. Aim for one sentence.'),
            }),
            defineField({
              name: 'fullPage',
              title: 'Full-length screen',
              type: 'image',
              description: 'Optional: the whole screen, for one taller than the phone. It scrolls inside the phone.',
            }),
            defineField({
              name: 'pinnedTop',
              title: 'Pinned at the top',
              type: 'number',
              description: 'With a full-length screen: how much of the top stays put while it scrolls (status bar and header), in points.',
              hidden: ({ parent }) => !parent?.fullPage,
            }),
            defineField({
              name: 'pinnedBottom',
              title: 'Pinned at the bottom',
              type: 'number',
              description: 'With a full-length screen: how much of the bottom stays put (a tab bar), in points.',
              hidden: ({ parent }) => !parent?.fullPage,
            }),
            defineField({
              name: 'topColor',
              title: 'Color behind the Dynamic Island',
              type: 'string',
              description: 'Usually the color right under the designed status bar, e.g. "#fafafa". The status bar text turns light or dark to match.',
              validation: (rule) => rule.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex color' }),
            }),
            defineField({
              name: 'hotspots',
              title: 'Tap areas',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'hotspot',
                  title: 'Tap area',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                      description: 'What it does, for screen readers and keyboard users, e.g. "Sign in" or "Inbox tab".',
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: 'target',
                      title: 'Opens',
                      type: 'string',
                      description: 'The name of the screen it opens, exactly as written above.',
                      validation: (rule) =>
                        rule.required().custom((value, context) => (!value || screenNames(context.document).includes(value) ? true : `No screen is named "${value}".`)),
                    }),
                    defineField({ name: 'x', title: 'Left', type: 'number', validation: (rule) => rule.required().min(0) }),
                    defineField({ name: 'y', title: 'Top', type: 'number', validation: (rule) => rule.required().min(0) }),
                    defineField({ name: 'width', title: 'Width', type: 'number', validation: (rule) => rule.required().positive() }),
                    defineField({ name: 'height', title: 'Height', type: 'number', validation: (rule) => rule.required().positive() }),
                    defineField({
                      name: 'fixed',
                      title: 'Stays put while scrolling',
                      type: 'boolean',
                      description: 'For tab bars and back buttons on a full-length screen.',
                    }),
                  ],
                  preview: {
                    select: { title: 'label', target: 'target' },
                    prepare: ({ title, target }) => ({ title, subtitle: target ? `→ ${target}` : undefined }),
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: { title: 'name', media: 'image', hotspots: 'hotspots' },
            prepare: ({ title, media, hotspots }) => ({ title, media, subtitle: `${hotspots?.length ?? 0} tap areas` }),
          },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'title', media: 'screens.0.image' } },
})
