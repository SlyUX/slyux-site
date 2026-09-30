'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useIsPresentationTool } from 'next-sanity/hooks'
import { VisualEditing } from 'next-sanity/visual-editing/client-component'
import { perspectiveChangeAction } from 'next-sanity/visual-editing/server-actions'

/**
 * Draft mode only. Click-to-edit overlays for the Studio's Presentation tool,
 * and a way out of draft mode when the preview is opened on its own.
 */
export function PreviewTools() {
  const router = useRouter()
  const inPresentation = useIsPresentationTool()

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
      {inPresentation === false && (
        // No prefetch: prefetching this route would switch draft mode off.
        <Link
          href="/api/draft-mode/disable"
          prefetch={false}
          className="bg-primary text-primary-foreground fixed right-4 bottom-4 z-50 rounded-full px-4 py-2 text-sm font-semibold shadow-lg"
        >
          {/* Editor-only control, never shown to visitors; not CMS copy. */}
          Exit preview
        </Link>
      )}
    </>
  )
}
