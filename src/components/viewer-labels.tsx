'use client'

import { createContext, useContext } from 'react'

import type { GalleryLabels } from '@/components/viewer'

/**
 * The viewer's labels (from Site settings) for images that open larger from
 * anywhere in shared content, such as story images, without threading them
 * through every page. Provided once by the site layout.
 */
const ViewerLabelsContext = createContext<(Pick<GalleryLabels, 'close' | 'previous' | 'next'> & { enlarge: string }) | null>(null)

export function ViewerLabelsProvider({
  labels,
  children,
}: {
  labels: Pick<GalleryLabels, 'close' | 'previous' | 'next'> & { enlarge: string }
  children: React.ReactNode
}) {
  return <ViewerLabelsContext value={labels}>{children}</ViewerLabelsContext>
}

export const useViewerLabels = () => useContext(ViewerLabelsContext)
