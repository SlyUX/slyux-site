import { stegaClean } from 'next-sanity'

/**
 * CMS text set with letter-spacing (`tracking-*`). In draft mode (Visual
 * Editing) content strings end in a long run of invisible edit markers, and
 * letter-spacing applies to each one, pushing centered text off center. This
 * keeps the markers, so the text stays click-to-edit, but sets them without
 * spacing. Outside draft mode there are no markers and it's just the text.
 */
export function TrackedText({ children }: { children: string }) {
  const visible = stegaClean(children)
  const markers = children.startsWith(visible) ? children.slice(visible.length) : ''
  return (
    <>
      {visible}
      {markers && <span className="tracking-normal">{markers}</span>}
    </>
  )
}
