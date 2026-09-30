import { defineEnableDraftMode } from 'next-sanity/draft-mode'

import { client, readToken } from '@/sanity/client'

/**
 * Called by the Studio's Presentation tool: validates its one-time secret,
 * then turns on draft mode for this browser so the preview shows drafts.
 */
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: readToken }),
})
