import { cookies, draftMode } from 'next/headers'
import { resolvePerspectiveFromCookies } from 'next-sanity/live'

import { client, readToken } from './client'

/**
 * Content fields the site compares rather than displays. In draft mode,
 * Visual Editing hides invisible edit markers ("stega") in text values, which
 * would break those comparisons, so these stay clean. Sanity's default filter
 * already skips links, slugs, layout, dates, IDs, and the like.
 */
const LOGIC_FIELDS = new Set(['placement', 'kind', 'mimeType'])

const previewClient = readToken
  ? client.withConfig({
      token: readToken,
      useCdn: false,
      stega: {
        enabled: true,
        studioUrl: '/studio',
        filter: (props) => (LOGIC_FIELDS.has(String(props.sourcePath.at(-1))) ? false : props.filterDefault(props)),
      },
    })
  : undefined

/**
 * The client for this request. Visitors get the published CDN, exactly as
 * before. In draft mode (turned on by the Studio's Presentation tool) it reads
 * drafts, or whatever perspective the Studio picked, with click-to-edit markers.
 * Safe outside a request (e.g. generateStaticParams), where draft mode can't be on.
 */
export async function requestClient() {
  let enabled = false
  try {
    enabled = (await draftMode()).isEnabled
  } catch {
    // No request scope (build-time params): published content.
  }
  if (!enabled || !previewClient) return { client, options: {} }

  const perspective = (await resolvePerspectiveFromCookies({ cookies: await cookies() })) ?? 'drafts'
  return { client: previewClient, options: { perspective, cache: 'no-store' as const } }
}
