import { defineType, defineField, defineArrayMember } from 'sanity'

import { kindsInSection } from '../portfolio'

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
    { name: 'nav', title: 'Navigation' },
    { name: 'work', title: 'Case Studies page' },
    { name: 'creative', title: 'Portfolio pages' },
    { name: 'resume', title: 'Résumé page' },
    { name: 'contact', title: 'Contact page' },
  ],
  fields: [
    // General
    defineField({
      name: 'aiStatement',
      title: 'How I work with AI',
      type: 'richText',
      group: 'general',
      description:
        'Opens from the AI note on any piece or case study where it\'s turned on (the "AI note" toggle). Leave empty and the notes don\'t show.',
    }),
    defineField({ name: 'aiStatementHeading', title: 'AI statement heading', type: 'string', group: 'general' }),
    defineField({ name: 'aiNoteLabel', title: 'AI note button text', type: 'string', group: 'general' }),
    defineField({
      name: 'relatedHeading',
      title: 'Related work heading',
      type: 'string',
      group: 'general',
      description: 'Above the cards at the bottom of case studies and portfolio pages.',
    }),
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
      title: 'Navigation',
      type: 'array',
      group: 'nav',
      description:
        'The pages in the header (and the phone menu), in order. Portfolio sections are grouped behind "Portfolio" and always follow the Portfolio page\'s order. Home is skipped in the header, since the logo links home.',
      validation: (rule) =>
        rule.max(9).custom((cells: { cell?: number }[] | undefined) => {
          const used = (cells ?? []).map((c) => c.cell)
          return new Set(used).size === used.length ? true : 'Two pages share a position.'
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
              title: 'Order',
              type: 'number',
              description: 'Lower numbers come first.',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: 'label', cell: 'cell', href: 'href' },
            prepare: ({ title, cell, href }) => ({ title, subtitle: `${cell} · ${href}` }),
          },
        }),
      ],
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact email',
      type: 'string',
      group: 'general',
      description: 'Only used if the contact form isn\'t set up (no Resend keys in Vercel). The form sends to the inbox set there, and the address never shows on the site.',
    }),
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
    defineField({
      name: 'caseStudyGroups',
      title: 'Groups',
      type: 'array',
      group: 'work',
      description:
        'The Case Studies page, in order, each group a band under its heading. The first group is featured: one large row per case study. Later groups show two case studies to a row, so pairs fill them best. Case studies left out of every group appear last, under the heading below.',
      of: [
        defineArrayMember({
          name: 'caseStudyGroup',
          title: 'Group',
          type: 'object',
          fields: [
            defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'studies',
              title: 'Case studies',
              type: 'array',
              of: [defineArrayMember({ type: 'reference', to: [{ type: 'caseStudy' }], options: { disableNew: true } })],
              validation: (rule) => rule.required().min(1).unique(),
            }),
          ],
          preview: {
            select: { title: 'heading', s0: 'studies.0.title', s1: 'studies.1.title', s2: 'studies.2.title' },
            prepare: ({ title, s0, s1, s2 }) => ({ title, subtitle: [s0, s1, s2].filter(Boolean).join(' · ') }),
          },
        }),
      ],
    }),
    defineField({
      name: 'caseStudiesMoreHeading',
      title: '"More case studies" heading',
      type: 'string',
      group: 'work',
      description: 'Heads any case studies not in a group. Not shown when every case study is in one, or when there are no groups.',
    }),
    defineField({ name: 'fullPageLabel', title: '"View full page" button', type: 'string', group: 'work', description: 'On gallery screens that have a full-page version.' }),
    defineField({ name: 'howItStartedHeading', title: '"How it started" rail title', type: 'string', group: 'work', description: 'Titles the right-hand rail of before-the-work context on case studies and portfolio pages.' }),
    defineField({ name: 'documentsHeading', title: 'Documents heading', type: 'string', group: 'work', description: 'Heads the PDF documents, the last section of the story on portfolio pages.' }),
    defineField({ name: 'personasHeading', title: 'Personas heading', type: 'string', group: 'work', description: 'Section heading on case studies that have personas.' }),
    defineField({ name: 'opportunitiesLabel', title: '"Opportunities to engage" label', type: 'string', group: 'work' }),
    defineField({ name: 'barriersLabel', title: '"Barriers to adoption" label', type: 'string', group: 'work' }),
    defineField({ name: 'enlargeLabel', title: '"View larger" (screen reader)', type: 'string', group: 'work', description: 'Names gallery thumbnails that open a larger image, e.g. "View larger".' }),
    defineField({ name: 'imageCountLabel', title: '"{count} images" (screen reader)', type: 'string', group: 'work', description: 'Added to a portfolio card\'s name when it opens several images, matching the count on the card. {count} is filled in, e.g. "{count} images".' }),
    defineField({ name: 'closeLabel', title: '"Close" button', type: 'string', group: 'work', description: 'Closes the gallery viewer.' }),
    defineField({ name: 'previousLabel', title: '"Previous" button (screen reader)', type: 'string', group: 'work' }),
    defineField({ name: 'nextLabel', title: '"Next" button (screen reader)', type: 'string', group: 'work' }),
    defineField({ name: 'pdfBadge', title: 'Document badge', type: 'string', group: 'work', description: 'On document thumbnails, e.g. "Look inside". {pages} becomes the page count if you include it, e.g. "Look inside · {pages} pages".' }),
    defineField({ name: 'pdfPageCounter', title: 'PDF reader page counter', type: 'string', group: 'work', description: '{page} and {pages} are filled in, e.g. "Page {page} of {pages}".' }),
    defineField({ name: 'pdfDownloadLabel', title: '"Download PDF" button', type: 'string', group: 'work' }),
    defineField({ name: 'fullscreenLabel', title: '"Fullscreen" button', type: 'string', group: 'work', description: 'In the PDF reader, where the browser supports it.' }),
    defineField({ name: 'exitFullscreenLabel', title: '"Exit fullscreen" button', type: 'string', group: 'work' }),

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
        defineField({ name: 'data', title: 'Data analysis', type: 'string' }),
        defineField({ name: 'audit', title: 'Site audits', type: 'string' }),
        defineField({ name: 'strategy', title: 'Research and strategy', type: 'string' }),
        defineField({ name: 'designSystem', title: 'Design systems', type: 'string' }),
        defineField({ name: 'ux', title: 'UX screens and prototypes', type: 'string' }),
        defineField({ name: 'uiAssets', title: 'UI assets', type: 'string' }),
        defineField({ name: 'brand', title: 'Brand systems', type: 'string' }),
        defineField({ name: 'illustration', title: 'Illustration', type: 'string' }),
        defineField({ name: 'cover', title: 'Book covers', type: 'string' }),
        defineField({ name: 'book', title: 'Books and comics', type: 'string' }),
        defineField({ name: 'campaign', title: 'Campaigns', type: 'string' }),
        defineField({ name: 'printAd', title: 'Print ads', type: 'string' }),
        defineField({ name: 'graphic', title: 'Graphic design', type: 'string' }),
        defineField({ name: 'logo', title: 'Logos', type: 'string' }),
      ],
    }),
    defineField({
      name: 'kindLabels',
      title: 'Card labels',
      type: 'object',
      group: 'creative',
      description:
        'The small label on each portfolio card saying what the piece is. Cards with a full page behind them (a project or case study) show it in burnt orange, under a navy top edge.',
      fields: [
        defineField({ name: 'data', title: 'Data analysis', type: 'string' }),
        defineField({ name: 'audit', title: 'Site audits', type: 'string' }),
        defineField({ name: 'strategy', title: 'Research and strategy', type: 'string' }),
        defineField({ name: 'designSystem', title: 'Design systems', type: 'string' }),
        defineField({ name: 'ux', title: 'UX screens and prototypes', type: 'string' }),
        defineField({ name: 'uiAssets', title: 'UI assets', type: 'string' }),
        defineField({ name: 'brand', title: 'Brand systems', type: 'string' }),
        defineField({ name: 'logo', title: 'Logos', type: 'string' }),
        defineField({ name: 'campaign', title: 'Campaigns', type: 'string' }),
        defineField({ name: 'printAd', title: 'Print ads', type: 'string' }),
        defineField({ name: 'graphic', title: 'Graphic design', type: 'string' }),
        defineField({ name: 'illustration', title: 'Illustration', type: 'string' }),
        defineField({ name: 'cover', title: 'Book covers', type: 'string' }),
        defineField({ name: 'book', title: 'Books and comics', type: 'string' }),
      ],
    }),
    defineField({
      name: 'uxCaseStudies',
      title: 'UX page: case studies',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'caseStudy' }] })],
      group: 'creative',
      description: 'The three case studies in the top row of the UX portfolio page, beside a link to all of them. Empty shows the first three in Case Studies order.',
      validation: (rule) => rule.max(3).unique(),
    }),
    defineField({
      name: 'portfolioFeaturedHeading',
      title: 'Featured band heading',
      type: 'string',
      group: 'creative',
      description: 'Heads the band at the top of a portfolio page that holds its featured pieces (any piece marked Featured, except brand systems and UX projects).',
    }),
    defineField({
      name: 'portfolioUxCaseStudy',
      title: 'Portfolio page, UX row: case study',
      type: 'reference',
      to: [{ type: 'caseStudy' }],
      options: { disableNew: true },
      group: 'creative',
      description: 'The first card in the UX row on the Portfolio page. Empty uses the first case study on the UX page.',
    }),
    defineField({
      name: 'portfolioUxPieces',
      title: 'Portfolio page, UX row: two more cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'creativeWork' }],
          // Only pieces from the UX section can be picked.
          options: { filter: 'kind in $kinds', filterParams: { kinds: kindsInSection('ux') }, disableNew: true },
        }),
      ],
      group: 'creative',
      description:
        'The second and third cards. Empty, or only one picked, fills in from the first piece in each row of the UX page, in that order (Design systems first).',
      validation: (rule) => rule.max(2).unique(),
    }),
    defineField({
      name: 'caseStudiesRowHeading',
      title: 'Case studies row heading',
      type: 'string',
      group: 'creative',
      description: 'Heads the row of case studies at the top of the UX portfolio page.',
    }),
    defineField({
      name: 'caseStudyLabel',
      title: '"Case study" card label',
      type: 'string',
      group: 'creative',
      description: 'The chip on the case study card in the UX row of the Portfolio page.',
    }),
    // Retired 2026-10-09 with creativeWork's `mature`: hidden, not deleted, so the
    // stored value doesn't surface as an unknown field. Nothing reads it.
    defineField({
      name: 'matureLabel',
      title: 'Mature content label (retired)',
      type: 'string',
      group: 'creative',
      hidden: true,
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
    defineField({ name: 'education', title: 'Education and training', type: 'array', of: [{ type: 'string' }], group: 'resume' }),

    // Contact
    defineField({ name: 'contactTitle', title: 'Title', type: 'string', group: 'contact' }),
    defineField({ name: 'contactIntro', title: 'Intro', type: 'text', rows: 3, group: 'contact' }),
    defineField({
      name: 'inquiryTypes',
      title: 'Inquiry options',
      type: 'array',
      group: 'contact',
      description:
        'The topics on the contact form (and, until the form is live, buttons that open an email). Each message arrives with its subject line, so hiring and project messages come in already sorted.',
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
    defineField({
      name: 'contactForm',
      title: 'Contact form',
      type: 'object',
      group: 'contact',
      description: 'Wording on the contact form. Messages go to the inbox set in Vercel (CONTACT_INBOX); no address shows on the site.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'intro', title: 'Intro, with the form', type: 'text', rows: 2, description: 'Replaces the intro above once the form is live.' }),
        defineField({ name: 'topicLegend', title: 'Topic question', type: 'string' }),
        defineField({ name: 'nameLabel', title: 'Name label', type: 'string' }),
        defineField({ name: 'emailLabel', title: 'Email label', type: 'string' }),
        defineField({ name: 'messageLabel', title: 'Message label', type: 'string' }),
        defineField({ name: 'sendLabel', title: 'Send button', type: 'string' }),
        defineField({ name: 'sendingLabel', title: 'Send button while sending', type: 'string' }),
        defineField({ name: 'successHeading', title: 'Sent: heading', type: 'string' }),
        defineField({ name: 'successText', title: 'Sent: text', type: 'text', rows: 2 }),
        defineField({ name: 'errorText', title: 'Not sent: text', type: 'text', rows: 2, description: 'Shown when sending fails on our side.' }),
        defineField({ name: 'nameRequired', title: 'Error: no name', type: 'string' }),
        defineField({ name: 'emailRequired', title: 'Error: no email', type: 'string' }),
        defineField({ name: 'emailInvalid', title: 'Error: email looks wrong', type: 'string' }),
        defineField({ name: 'messageRequired', title: 'Error: no message', type: 'string' }),
        defineField({ name: 'messageShort', title: 'Error: message too short', type: 'string' }),
        defineField({ name: 'messageLong', title: 'Error: message too long', type: 'string' }),
        defineField({ name: 'rateLimited', title: 'Error: too many messages', type: 'string' }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
