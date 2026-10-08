'use client'

import { useRouter } from 'next/navigation'
import { useSyncExternalStore, useTransition } from 'react'
import { VisualEditing } from 'next-sanity/visual-editing/client-component'
import { perspectiveChangeAction } from 'next-sanity/visual-editing/server-actions'

import { disableDraftMode } from '@/sanity/draft-mode-actions'

const noSubscribe = () => () => {}

/**
 * Only when the site is its own browser tab — never inside the Studio's
 * Presentation frame (or its pop-out window), where leaving draft mode would
 * break the preview. Decided from the window itself, so it's right at once
 * rather than waiting on the Studio's connection handshake.
 */
const isStandalone = () => window.self === window.top && !window.opener

/**
 * Draft mode only. Click-to-edit overlays for the Studio's Presentation tool,
 * and a way out of draft mode when the preview is opened on its own.
 */
export function PreviewTools() {
  const router = useRouter()
  const standalone = useSyncExternalStore(noSubscribe, isStandalone, () => false)
  const [leaving, startLeaving] = useTransition()

  return (
    <>
      <VisualEditing
        onPerspectiveChange={perspectiveChangeAction}
        // Drafts render on the server, so re-render after each edit.
        refresh={() => {
          router.refresh()
          return new Promise((resolve) => setTimeout(resolve, 1000))
        }}
      />
      {standalone && (
        <button
          type="button"
          disabled={leaving}
          // Layouts persist across client navigation, so turn draft mode off
          // on the server, then refresh so every layout re-renders without it.
          onClick={() =>
            startLeaving(async () => {
              await disableDraftMode()
              router.refresh()
            })
          }
          className="bg-primary text-primary-foreground fixed right-4 bottom-4 z-50 rounded-ui px-4 py-2 text-sm font-semibold shadow-lg disabled:opacity-70"
        >
          {/* Editor-only control, never shown to visitors; not CMS copy. */}
          Exit preview
        </button>
      )}
    </>
  )
}
