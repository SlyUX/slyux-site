import { defineType, defineField, defineArrayMember } from 'sanity'

/**
 * A PDF shown as a thumbnail (its first page, with a PDF badge) that opens a
 * page-at-a-time reader. Browsers render embedded PDFs poorly on phones, and
 * large files load slowly, so the reader shows page images and offers the PDF
 * itself as a download. The page images are rendered from the PDF by a script
 * (seed/pdf/add_documents.mjs in the site's private working folder).
 */
export default defineType({
  name: 'pdfDocument',
  title: 'PDF document',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Shown under the thumbnail and in the reader, e.g. "Brand manual".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'file',
      title: 'PDF',
      type: 'file',
      options: { accept: 'application/pdf' },
      description: 'The original, offered as a download from the reader.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pages',
      title: 'Page images',
      type: 'array',
      of: [defineArrayMember({ type: 'image' })],
      options: { layout: 'grid' },
      description: 'One image per page, in order. The first is the thumbnail.',
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: 'title', pages: 'pages', media: 'pages.0' },
    prepare: ({ title, pages, media }) => ({ title, subtitle: `PDF · ${pages?.length ?? 0} pages`, media }),
  },
})
