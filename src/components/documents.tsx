import Image from 'next/image'
import { BookOpenText } from 'lucide-react'

import { DocumentViewer, type DocumentLabels, type DocumentPage } from '@/components/document-viewer'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/image'
import type { CreativeWorkDetail } from '@/lib/types'

export type PdfDocumentData = NonNullable<CreativeWorkDetail['documents']>[number]
export type { DocumentLabels }

/** Everything the site needs from a PDF document: page images, badge text, download link. */
export function toDocument(doc: PdfDocumentData, badgeTemplate: string) {
  const pages: DocumentPage[] = (doc.pages ?? []).flatMap((p) =>
    p.asset && p.size?.width && p.size.height
      ? [{
          key: p._key,
          // Pages fit the screen, so ~2000px covers a retina laptop without waste.
          src: urlFor(p).width(Math.min(2000, p.size.width)).format('webp').quality(80).url(),
          width: Math.min(2000, p.size.width),
          height: Math.round((Math.min(2000, p.size.width) * p.size.height) / p.size.width),
        }]
      : [],
  )
  const cover = doc.pages?.[0]
  const badge = badgeTemplate.replace('{pages}', String(pages.length))
  const downloadHref = doc.file?.url
    ? `${doc.file.url}?dl=${encodeURIComponent(doc.file.originalFilename ?? `${doc.title ?? 'document'}.pdf`)}`
    : undefined
  return { title: doc.title ?? '', pages, cover, badge, downloadHref }
}

/** The red "Look inside" chip over a document thumbnail. */
export function PdfBadge({ text }: { text: string }) {
  return (
    <span className="bg-pdf text-pdf-foreground absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-md">
      <BookOpenText aria-hidden className="size-3.5" strokeWidth={2} />
      {text}
    </span>
  )
}

/** The documents that have pages to show, ready for DocumentGrid. */
export const readableDocuments = (documents: PdfDocumentData[] | null | undefined, badgeTemplate: string) =>
  (documents ?? []).map((d) => toDocument(d, badgeTemplate)).filter((d) => d.pages.length && d.cover?.asset)

/**
 * PDFs as badged thumbnails; each opens the page-at-a-time reader. One
 * document fills its column, like the story's images; more sit two across.
 */
export function DocumentGrid({ docs, labels }: { docs: ReturnType<typeof readableDocuments>; labels: DocumentLabels }) {
  if (!docs.length) return null
  const single = docs.length === 1

  return (
    <ul className={cn('grid gap-x-6 gap-y-8', !single && 'sm:grid-cols-2')}>
      {docs.map((doc) => (
        <li key={doc.cover!._key}>
          <DocumentViewer
            title={doc.title}
            pages={doc.pages}
            downloadHref={doc.downloadHref}
            labels={labels}
            triggerLabel={`${doc.title}: ${doc.badge}`}
            className="group block w-full text-left"
          >
            <span className="border-border group-hover:border-primary relative block overflow-hidden rounded-xl border bg-paper transition-colors">
              <Image
                src={urlFor(doc.cover!).width(1100).url()}
                alt=""
                width={1100}
                height={Math.round((1100 * (doc.cover!.size?.height ?? 850)) / (doc.cover!.size?.width ?? 1100))}
                sizes={single ? '(max-width: 1024px) 100vw, 768px' : '(max-width: 640px) 100vw, 400px'}
                className="h-auto w-full"
              />
              <PdfBadge text={doc.badge} />
            </span>
            <span className="group-hover:text-primary mt-2 block font-semibold">{doc.title}</span>
          </DocumentViewer>
        </li>
      ))}
    </ul>
  )
}
