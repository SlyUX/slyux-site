'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { FolderIcon } from '@sanity/icons/Folder'
import { Badge } from '@sanity/ui'
import { useCurrentUser, useDocumentStore, useWorkspace, validateDocument, type CurrentUser, type DocumentStore, type SanityDocument, type Workspace } from 'sanity'

/**
 * Sidebar icons that say what needs attention below them, all the way up the
 * tree: Portfolio › Design › Campaigns each count the pieces inside. A count of
 * documents with validation errors (red) when there are any, otherwise of
 * unpublished drafts (amber); hovering gives both. With nothing to report,
 * the Studio's usual folder.
 *
 * Validation isn't stored anywhere; the Studio computes it in the browser for
 * the open document. So this validates every document of the type in the
 * background, once per revision. Fine at this site's size (dozens of
 * documents); revisit if a type grows into the thousands. Updates are
 * throttled to every 3 seconds, so typing in a long case study doesn't refetch
 * every document of its type on each keystroke.
 */

/** Every document of a type, drafts included, shared by all the sidebar items showing that type. */
interface Feed {
  docs?: SanityDocument[]
  listeners: Set<() => void>
  stop?: () => void
}
const feeds = new Map<string, Feed>()

function subscribeFeed(store: DocumentStore, type: string, listener: () => void) {
  const feed = feeds.get(type) ?? { listeners: new Set() }
  feeds.set(type, feed)
  feed.listeners.add(listener)
  if (!feed.stop) {
    const subscription = store
      .listenQuery('*[_type == $type]', { type }, { perspective: 'raw', throttleTime: 3000, tag: 'sidebar-status' })
      .subscribe((docs: SanityDocument[]) => {
        feed.docs = docs
        feed.listeners.forEach((notify) => notify())
      })
    feed.stop = () => subscription.unsubscribe()
  }
  return () => {
    feed.listeners.delete(listener)
    if (feed.listeners.size === 0) {
      feed.stop?.()
      feed.stop = undefined
    }
  }
}

/** Whether a document has errors, validated once per revision and shared. */
const verdicts = new Map<string, { rev: string; hasErrors: Promise<boolean> }>()

function hasErrors(doc: SanityDocument, workspace: Workspace, currentUser: CurrentUser | null) {
  const cached = verdicts.get(doc._id)
  if (cached?.rev === doc._rev) return cached.hasErrors
  const hasErrors = validateDocument({ document: doc, workspace, environment: 'studio', currentUser })
    .then((markers) => markers.some((marker) => marker.level === 'error'))
    .catch(() => false)
  verdicts.set(doc._id, { rev: doc._rev, hasErrors })
  return hasErrors
}

function useStatus(type: string, kinds?: readonly string[]) {
  const store = useDocumentStore()
  const workspace = useWorkspace()
  const currentUser = useCurrentUser()
  const subscribe = useCallback((listener: () => void) => subscribeFeed(store, type, listener), [store, type])
  const docs = useSyncExternalStore(subscribe, () => feeds.get(type)?.docs, () => undefined)

  // One entry per document, as the editor sees it: the draft when there is one.
  const current = useMemo(() => {
    if (!docs) return undefined
    const byId = new Map<string, { doc: SanityDocument; draft: boolean }>()
    for (const doc of docs) {
      if (doc._id.startsWith('versions.')) continue
      const draft = doc._id.startsWith('drafts.')
      const id = draft ? doc._id.slice('drafts.'.length) : doc._id
      if (draft || !byId.has(id)) byId.set(id, { doc, draft })
    }
    return [...byId.values()].filter(({ doc }) => !kinds || kinds.includes(doc.kind as string))
  }, [docs, kinds])

  const [errors, setErrors] = useState(0)
  useEffect(() => {
    if (!current) return
    let live = true
    Promise.all(current.map(({ doc }) => hasErrors(doc, workspace, currentUser))).then((results) => {
      if (live) setErrors(results.filter(Boolean).length)
    })
    return () => {
      live = false
    }
  }, [current, workspace, currentUser])

  return { errors, drafts: current?.filter((entry) => entry.draft).length ?? 0 }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** The icon for a sidebar item showing documents of `type` (and, for portfolio sections, these kinds). */
export function statusIcon(type: string, kinds?: readonly string[]) {
  return function StatusIcon() {
    const { errors, drafts } = useStatus(type, kinds)
    if (!errors && !drafts) return <FolderIcon />
    const label = [errors && plural(errors, 'document with errors', 'documents with errors'), drafts && plural(drafts, 'unpublished draft', 'unpublished drafts')]
      .filter(Boolean)
      .join(', ')
    return (
      <Badge tone={errors ? 'critical' : 'caution'} fontSize={1} title={label} aria-label={label} role="img">
        {errors || drafts}
      </Badge>
    )
  }
}
