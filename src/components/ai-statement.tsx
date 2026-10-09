'use client'

import { createContext, useCallback, useContext, useId, useRef } from 'react'
import { Sparkles, X } from 'lucide-react'

import { returnFocus } from '@/components/return-focus'
import { cn } from '@/lib/utils'

/**
 * "How I work with AI": one statement (Site settings), opened from the AI note
 * on any piece or case study where AI played a part (its "AI note" toggle),
 * at the end of the credit line, or the role line on case studies. The layout
 * renders the dialog once; each note's button opens it.
 * Without a statement in Site settings, notes render nothing.
 */
const AiStatementContext = createContext<{ label: string; open: (from: HTMLButtonElement) => void } | null>(null)

export function AiStatementProvider({
  label,
  heading,
  closeLabel,
  statement,
  children,
}: {
  /** The note's button text, e.g. "How I work with AI". */
  label: string
  heading: string
  closeLabel: string
  /** The statement, rendered by the layout; omit when Site settings has none. */
  statement?: React.ReactNode
  children: React.ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const headingId = useId()
  const open = useCallback((from: HTMLButtonElement) => {
    triggerRef.current = from
    dialogRef.current?.showModal()
  }, [])

  return (
    <AiStatementContext value={statement ? { label, open } : null}>
      {children}
      {statement && (
        <dialog
          ref={dialogRef}
          aria-labelledby={headingId}
          onClose={() => returnFocus(triggerRef.current)}
          // A click on the backdrop (the dialog itself, outside its panel) closes it.
          onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
          className="bg-paper text-foreground rounded-ui backdrop:bg-ink/70 m-auto max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] max-w-2xl p-0 shadow-2xl"
        >
          <div className="p-6 sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <h2 id={headingId} className="font-display flex items-center gap-3 text-3xl font-semibold">
                <Sparkles aria-hidden className="text-fox size-[0.9em] shrink-0" strokeWidth={1.5} />
                {heading}
              </h2>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label={closeLabel}
                className="hover:text-primary hover:bg-surface rounded-ui -mt-1 -mr-2 flex size-10 shrink-0 items-center justify-center transition-colors"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <div className="mt-6">{statement}</div>
          </div>
        </dialog>
      )}
    </AiStatementContext>
  )
}

/** The note itself: Sparkles and the label, after a credit line or on its own. */
export function AiNote({ className }: { className?: string }) {
  const context = useContext(AiStatementContext)
  if (!context) return null
  return (
    <button
      type="button"
      onClick={(e) => context.open(e.currentTarget)}
      className={cn('text-primary ml-1 inline-flex items-baseline gap-1 font-semibold underline underline-offset-4 hover:no-underline', className)}
    >
      <Sparkles aria-hidden className="size-[0.95em] shrink-0 self-center" strokeWidth={2} />
      {context.label}
    </button>
  )
}
