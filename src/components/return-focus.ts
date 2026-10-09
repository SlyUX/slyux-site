/**
 * Returns focus to whatever opened a dialog or menu (the viewer, the document
 * reader, the navigation menu), as accessibility requires, and decides whether
 * the focus ring shows there.
 *
 * Someone navigating by keyboard keeps the ring, so they can see where they
 * are. Anyone who clicked doesn't: browsers would otherwise draw it around the
 * title they clicked, which reads as a stray box. "Keyboard" means Tab was
 * pressed since the last click, because mouse users press Escape and the arrow
 * keys too (Chrome shows the ring after Escape; Safari after a click as well).
 */
let tabbing = false

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => e.key === 'Tab' && (tabbing = true), true)
  window.addEventListener('pointerdown', () => (tabbing = false), true)
}

export function returnFocus(el: HTMLElement | null | undefined) {
  if (!el) return
  if (!tabbing) {
    // Hides the ring (globals.css) until focus moves on.
    el.dataset.quietFocus = ''
    el.addEventListener('blur', () => delete el.dataset.quietFocus, { once: true })
  }
  el.focus()
}
