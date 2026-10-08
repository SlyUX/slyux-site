'use client'

import { Lightbox, LightboxButton, type LightboxItem } from '@/components/lightbox'
import { useViewerLabels } from '@/components/viewer-labels'

/**
 * An image in shared content (a story, a page) that opens larger on its own,
 * in the same viewer as portfolio cards. Without the site's labels (outside
 * the site layout) it stays a plain image.
 */
export function ZoomableImage({ item, children }: { item: LightboxItem; children: React.ReactNode }) {
  const labels = useViewerLabels()
  if (!labels) return <>{children}</>
  return (
    <Lightbox items={[item]} labels={labels}>
      <LightboxButton pieceKey={item.pieceKey} label={`${labels.enlarge}: ${item.alt}`} className="block w-full cursor-zoom-in">
        {children}
      </LightboxButton>
    </Lightbox>
  )
}
