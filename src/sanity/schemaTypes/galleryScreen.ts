import { defineType, defineField } from 'sanity'

/**
 * A gallery image that can carry a full-length capture of the same page.
 *
 * The gallery shows this image (usually the first screen, "fold"); when a
 * full-page version is attached, a "View full page" button opens it in an
 * overlay. Upload the full capture as-is — however tall — the site requests
 * it in slices, because Sanity's image service caps output at 8192px.
 *
 * Plain `imageWithAlt` items in galleries keep working; this is an
 * alternative member type, so existing content needs no migration.
 */
export default defineType({
  name: 'galleryScreen',
  title: 'Screen (with full page)',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe what the screen SHOWS. One sentence.',
      validation: (rule) => rule.max(160).warning('Long alt text is hard to listen to. Aim for one sentence.'),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional visible caption under the image.',
    }),
    defineField({
      name: 'fullPage',
      title: 'Full-page version',
      type: 'image',
      description: 'Optional: the entire scrolling page. Adds a "View full page" button. Any height works.',
    }),
  ],
})
