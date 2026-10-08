import { cn } from '@/lib/utils'

/**
 * One component on the styleguide: its name and where it lives, a live
 * example, then how to use it. The name is an h3 under the section's h2, so
 * examples render their own headings at h4.
 */
export function Specimen({
  name,
  file,
  children,
  notes,
  stage = 'paper',
}: {
  name: string
  /** Path from the repo root, e.g. src/components/ui.tsx. */
  file: string
  children: React.ReactNode
  /** When to use it and its options, as a short list. */
  notes?: React.ReactNode[]
  /** The example's background: white, the page, or the gray band. */
  stage?: 'paper' | 'background' | 'surface'
}) {
  return (
    <figure className="border-border bg-paper rounded-ui overflow-hidden border">
      <figcaption className="border-border flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-5 py-4">
        <h3 className="font-semibold">{name}</h3>
        <code className="text-muted-foreground font-mono text-xs">{file}</code>
      </figcaption>
      <div
        className={cn(
          'p-5 sm:p-8',
          {
            paper: 'bg-paper',
            background: 'bg-background',
            surface: 'bg-surface',
          }[stage],
        )}
      >
        {children}
      </div>
      {notes && notes.length > 0 && (
        <ul className="border-border text-muted-foreground list-disc space-y-1 border-t py-4 pr-5 pl-10 text-sm leading-relaxed">
          {notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      )}
    </figure>
  )
}
