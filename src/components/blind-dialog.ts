/**
 * Opens and closes a modal <dialog> as a blind: the whole overlay, backdrop
 * and content together, slides down from above the window and back up on
 * close (`globals.css`, `dialog[data-blind]`). Driven from script rather than
 * CSS exit transitions so the closing slide plays in every browser, not only
 * Chromium. Escape is routed through the same close (`cancelAsBlind`), and
 * reduced motion skips the slide.
 */

/** Added to the slide's own duration: a backstop in case `animationend` never fires. */
const BACKSTOP_SLACK_MS = 250

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Runs `done` once, when the dialog's own animation ends (the backdrop's ends with it). */
function afterSlide(dialog: HTMLDialogElement, done: () => void) {
  let finished = false
  const onEnd = (e: AnimationEvent) => e.target === dialog && finish()
  const finish = () => {
    if (finished) return
    finished = true
    dialog.removeEventListener('animationend', onEnd)
    done()
  }
  dialog.addEventListener('animationend', onEnd)
  // The slide's length as CSS sets it (--overlay-duration), so a slower slide is never cut short.
  const seconds = parseFloat(getComputedStyle(dialog).animationDuration) || 0
  setTimeout(finish, seconds * 1000 + BACKSTOP_SLACK_MS)
}

export function openBlind(dialog: HTMLDialogElement | null) {
  if (!dialog || dialog.open) return
  dialog.showModal()
  if (reducedMotion()) return
  dialog.dataset.blind = 'in'
  afterSlide(dialog, () => {
    if (dialog.dataset.blind === 'in') delete dialog.dataset.blind
  })
}

export function closeBlind(dialog: HTMLDialogElement | null) {
  if (!dialog?.open || dialog.dataset.blind === 'out') return
  if (reducedMotion()) return dialog.close()
  dialog.dataset.blind = 'out'
  afterSlide(dialog, () => {
    delete dialog.dataset.blind
    dialog.close()
  })
}

/** A dialog's onCancel: Escape slides it closed instead of snapping it shut. */
export function cancelAsBlind(e: React.SyntheticEvent<HTMLDialogElement>) {
  e.preventDefault()
  closeBlind(e.currentTarget)
}

/** Starts loading an image before its viewer opens, so it's ready when the slide ends. */
const preloaded = new Set<string>()
export function preloadImage(src: string | undefined) {
  if (!src || preloaded.has(src)) return
  preloaded.add(src)
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}
