'use server'

import { draftMode } from 'next/headers'

/** Leaves draft mode; the caller refreshes so every layout re-renders without it. */
export async function disableDraftMode() {
  ;(await draftMode()).disable()
}
