import { defineType, defineField, defineArrayMember } from 'sanity'

/**
 * Every reader-facing string that isn't part of a case study, creative piece
 * or page. A singleton pinned to the ID `siteSettings` by
 * `src/sanity/structure.ts`.
 */
export default defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'home', title: 'Home page' },
    { name: 'nav', title: 'Navigation map' },
    { name: 'work', title: 'Case Studies page' },
    { name: 'creative', title: 'Portfolio pages' },
    { name: 'resume', title: 'Résumé page' },
    { name: 'contact', title: 'Contact page' },
  ],
  fields: [
    // General
    defineField({
      name: 'siteTitle',
      title: 'Site title',
      type: 'string',
      group: 'general',
      description: 'Browser tab title and the default for link previews.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'siteDescription',
      title: 'Site description',
      type: 'text',
      rows: 2,
      group: 'general',
      description: 'For search engines and link previews.',
      validation: (rule) => rule.max(160).warning('Search engines cut off around 160 characters.'),
    }),
    defineField({ name: 'ownerName', title: 'Your name', type: 'string', group: 'general' }),
    defineField({
      name: 'headerLogo',
      title: 'Header logo',
      type: 'imageWithAlt',
      group: 'general',
      description: 'The full-color logo for the light header. SVG or a large transparent PNG. Alt text: "Sly UX". Falls back to the site title as text.',
    }),
    defineField({
      name: 'gridNav',
      title: 'Navigation map (3 × 3)',
      type: 'array',
      group: 'nav',
      description:
        'The site is laid out as a 3 × 3 map. Each section sits in one cell; navigating pans the view toward it. Put Home in the center. Pages not on the map still work — they just fade in instead of panning.',
      validation: (rule) =>
        rule.max(9).custom((cells: { cell?: number }[] | undefined) => {
          const used = (cells ?? []).map((c) => c.cell)
          return new Set(used).size === used.length ? true : 'Two sections share a cell.'
        }),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'gridCell',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'href',
              title: 'Address',
              type: 'string',
              description: 'A site path, e.g. "/portfolio/illustration".',
              validation: (rule) =>
                rule.required().custom((v) => (typeof v === 'string' && v.startsWith('/') ? true : 'Must start with "/".')),
            }),
            defineField({
              name: 'cell',
              title: 'Cell',
              type: 'number',
              options: {
                list: [
                  { title: 'Top left', value: 1 },
                  { title: 'Top center', value: 2 },
                  { title: 'Top right', value: 3 },
                  { title: 'Middle left', value: 4 },
                  { title: 'Center', value: 5 },
                  { title: 'Middle right', value: 6 },
                  { title: 'Bottom left', value: 7 },
                  { title: 'Bottom center', value: 8 },
                  { title: 'Bottom right', value: 9 },
                ],
              },
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: 'label', cell: 'cell', href: 'href' },
            prepare: ({ title, cell, href }) => ({ title, subtitle: `Cell ${cell} · ${href}` }),
          },
        }),
      ],
    }),
    defineField({ name: 'contactEmail', title: 'Contact email', type: 'string', group: 'general' }),
    defineField({ name: 'linkedinUrl', title: 'LinkedIn URL', type: 'url', group: 'general' }),
    defineField({ name: 'footerLine', title: 'Footer line', type: 'string', group: 'general' }),

    // Home
    defineField({
      name: 'heroBrandmark',
      title: 'Hero brandmark',
      type: 'imageWithAlt',
      group: 'home',
      description: 'The reversed (light-on-dark) Sly UX logo. SVG or a large transparent PNG. Alt text: "Sly UX".',
    }),
    defineField({
      name: 'heroVideo',
      title: 'Hero background video',
      type: 'file',
      group: 'home',
      options: { accept: 'video/mp4,video/webm' },
      description: 'Muted, looping, and decorative. Keep it under ~2 MB. Visitors who prefer reduced motion see the still image instead.',
    }),
    defineField({
      name: 'heroPoster',
      title: 'Hero still image',
      type: 'image',
      group: 'home',
      description: 'Shown while the video loads, and in place of it for reduced motion. Usually a frame from the video.',
    }),
    defineField({
      name: 'quickActions',
      title: 'Quick actions',
      type: 'array',
      group: 'home',
      description: 'The row of shortcuts under the hero — the most-used ways in. Three or four works best.',
      validation: (rule) => rule.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'quickAction',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'href',
              title: 'Address',
              type: 'string',
              description: 'A site path like "/resume", or a full URL.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  { title: 'Résumé (document)', value: 'resume' },
                  { title: 'Case studies (grid)', value: 'work' },
                  { title: 'About (person)', value: 'about' },
                  { title: "Let's talk (message)", value: 'contact' },
                  { title: 'Creative (palette)', value: 'creative' },
                  { title: 'Work with me (briefcase)', value: 'hire' },
                ],
              },
              initialValue: 'work',
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'href' } },
        }),
      ],
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      group: 'home',
      description: 'The positioning line — the first thing anyone reads.',
    }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3, group: 'home' }),
    defineField({ name: 'primaryCta', title: 'Primary button', type: 'link', group: 'home' }),
    defineField({ name: 'secondaryCta', title: 'Secondary button', type: 'link', group: 'home' }),
    defineField({
      name: 'proofStats',
      title: 'Proof strip',
      type: 'array',
      of: [{ type: 'metric' }],
      group: 'home',
      validation: (rule) => rule.max(5),
    }),
    defineField({ name: 'featuredHeading', title: 'Featured work heading', type: 'string', group: 'home' }),
    defineField({
      name: 'featuredCaseStudies',
      title: 'Featured case studies',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'caseStudy' }] })],
      group: 'home',
      validation: (rule) => rule.max(4).unique(),
    }),
    defineField({
      name: 'creativeTeaser',
      title: 'Portfolio teaser',
      type: 'object',
      group: 'home',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
        defineField({ name: 'cta', title: 'Link', type: 'link' }),
      ],
    }),
    defineField({
      name: 'clientTeaser',
      title: 'Work-with-me teaser',
      type: 'object',
      group: 'home',
      description: 'The quieter path for potential clients.',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
        defineField({ name: 'cta', title: 'Link', type: 'link' }),
      ],
    }),

    // Work
    defineField({ name: 'workTitle', title: 'Title', type: 'string', group: 'work' }),
    defineField({ name: 'workIntro', title: 'Intro', type: 'text', rows: 2, group: 'work' }),
    defineField({ name: 'workEmpty', title: 'Empty state', type: 'string', group: 'work', description: 'Shown if no case studies are published.' }),
    defineField({ name: 'fullPageLabel', title: '"View full page" button', type: 'string', group: 'work', description: 'On gallery screens that have a full-page version.' }),
    defineField({ name: 'enlargeLabel', title: '"View larger" (screen reader)', type: 'string', group: 'work', description: 'Names gallery thumbnails that open a larger image, e.g. "View larger".' }),
    defineField({ name: 'closeLabel', title: '"Close" button', type: 'string', group: 'work', description: 'Closes the gallery viewer.' }),
    defineField({ name: 'previousLabel', title: '"Previous" button (screen reader)', type: 'string', group: 'work' }),
    defineField({ name: 'nextLabel', title: '"Next" button (screen reader)', type: 'string', group: 'work' }),

    // Creative
    defineField({ name: 'creativeTitle', title: 'Title', type: 'string', group: 'creative' }),
    defineField({ name: 'creativeIntro', title: 'Intro', type: 'text', rows: 2, group: 'creative' }),
    defineField({
      name: 'portfolioSections',
      title: 'Portfolio subpages',
      type: 'object',
      group: 'creative',
      description: 'Title and intro for each portfolio subpage: /portfolio/ux, /brand, /design, /illustration.',
      fields: (['ux', 'brand', 'design', 'illustration'] as const).map((section) =>
        defineField({
          name: section,
          title: { ux: 'UX', brand: 'Brand Development', design: 'Design', illustration: 'Illustration' }[section],
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
          ],
        }),
      ),
    }),
    defineField({ name: 'portfolioViewAll', title: '"View all" link label', type: 'string', group: 'creative', description: 'On the Portfolio landing page, e.g. "See all illustration".' }),
    defineField({
      name: 'creativeSections',
      title: 'Group headings within subpages',
      type: 'object',
      group: 'creative',
      description: 'Headings for each kind of piece within a subpage (e.g. Logos within Design). A group only appears when it has pieces.',
      fields: [
        defineField({ name: 'ux', title: 'UX screens & prototypes', type: 'string' }),
        defineField({ name: 'brand', title: 'Brand systems', type: 'string' }),
        defineField({ name: 'illustration', title: 'Illustration', type: 'string' }),
        defineField({ name: 'book', title: 'Books & comics', type: 'string' }),
        defineField({ name: 'campaign', title: 'Campaigns', type: 'string' }),
        defineField({ name: 'graphic', title: 'Graphic design', type: 'string' }),
        defineField({ name: 'logo', title: 'Logos', type: 'string' }),
      ],
    }),
    defineField({
      name: 'matureLabel',
      title: 'Mature content label',
      type: 'string',
      group: 'creative',
      description: 'Shown on mature pieces in place of artwork, e.g. "Mature horror — view on ND Riot".',
    }),

    // Résumé
    defineField({ name: 'resumeTitle', title: 'Title', type: 'string', group: 'resume' }),
    defineField({ name: 'resumeIntro', title: 'Intro', type: 'text', rows: 3, group: 'resume' }),
    defineField({ name: 'resumePdf', title: 'Résumé PDF', type: 'file', group: 'resume', options: { accept: 'application/pdf' } }),
    defineField({ name: 'resumeDownloadLabel', title: 'Download button label', type: 'string', group: 'resume' }),
    defineField({ name: 'experienceHeading', title: 'Experience heading', type: 'string', group: 'resume' }),
    defineField({ name: 'skillsHeading', title: 'Skills heading', type: 'string', group: 'resume' }),
    defineField({
      name: 'skillGroups',
      title: 'Skill groups',
      type: 'array',
      group: 'resume',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'skillGroup',
          fields: [
            defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'skills', title: 'Skills', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
          ],
          preview: { select: { title: 'heading' } },
        }),
      ],
    }),
    defineField({ name: 'educationHeading', title: 'Education heading', type: 'string', group: 'resume' }),
    defineField({ name: 'education', title: 'Education & training', type: 'array', of: [{ type: 'string' }], group: 'resume' }),

    // Contact
    defineField({ name: 'contactTitle', title: 'Title', type: 'string', group: 'contact' }),
    defineField({ name: 'contactIntro', title: 'Intro', type: 'text', rows: 3, group: 'contact' }),
    defineField({
      name: 'inquiryTypes',
      title: 'Inquiry options',
      type: 'array',
      group: 'contact',
      description:
        'Each becomes a button that opens an email with its subject line filled in — so hiring and project messages arrive already sorted.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'inquiryType',
          fields: [
            defineField({ name: 'label', title: 'Button label', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'description', title: 'Description', type: 'string' }),
            defineField({ name: 'subject', title: 'Email subject', type: 'string', validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: 'label', subtitle: 'subject' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
