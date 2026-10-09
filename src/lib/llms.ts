import { toPlainText } from '@portabletext/react'

import { LLMS_QUERY, safeFetch } from '@/lib/queries'
import { getSiteSettings } from '@/lib/site-settings'
import { absoluteUrl } from '@/lib/site-url'
import { sectionOfKind } from '@/sanity/portfolio'
import type { LlmsData } from '@/lib/types'

/**
 * The site as plain text for AI tools, following the llms.txt proposal
 * (llmstxt.org): /llms.txt is a short guide, a summary and every case study
 * and project with one line each; /llms-full.txt adds the full stories. All
 * of it comes from Sanity, so it never drifts from the pages. No email
 * address: contact goes through the form.
 */

const EMPTY: LlmsData = { caseStudies: [], pieces: [], pages: [] }

const line = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ')
const link = (title: string | null, path: string, note?: string | null) => `- [${title ?? path}](${absoluteUrl(path)})${note ? `: ${note}` : ''}`

async function load() {
  const [s, data] = await Promise.all([getSiteSettings(), safeFetch<LlmsData>(LLMS_QUERY, {}, EMPTY)])
  const pieces = data.pieces.flatMap((p) => {
    const section = sectionOfKind(p.kind)
    return section ? [{ ...p, path: `/portfolio/${section}/${p.slug}`, kindLabel: p.kind ? s.kindLabels[p.kind as keyof typeof s.kindLabels] : undefined }] : []
  })
  return { s, data, pieces }
}

export async function llmsTxt() {
  const { s, data, pieces } = await load()
  return [
    `# ${s.ownerName} — ${s.siteTitle}`,
    `> ${s.siteDescription}`,
    s.resumeIntro,
    `## ${s.workTitle}`,
    ...data.caseStudies.map((c) => link(c.title, `/case-studies/${c.slug}`, line(c.organization, c.years) + (c.summary ? `. ${c.summary}` : ''))),
    `## ${s.creativeTitle}`,
    ...pieces.map((p) => link(p.title, p.path, line(p.kindLabel, p.client, p.year) + (p.summary ? `. ${p.summary}` : ''))),
    `## ${s.ownerName}`,
    ...data.pages.map((p) => link(p.title, `/${p.slug}`, p.intro)),
    link(s.resumeTitle, '/resume'),
    link(s.contactTitle, '/contact'),
    '## Optional',
    link('Full text of every case study and project', '/llms-full.txt'),
  ]
    .filter(Boolean)
    .join('\n\n')
}

export async function llmsFullTxt() {
  const { s, data, pieces } = await load()
  const section = (title: string | null, path: string, meta: string, summary: string | null | undefined, text: string | null | undefined) =>
    [`## ${title}`, absoluteUrl(path), meta, summary, text].filter(Boolean).join('\n\n')
  return [
    `# ${s.ownerName} — ${s.siteTitle}`,
    `> ${s.siteDescription}`,
    s.resumeIntro,
    `## ${s.aiStatementHeading}`,
    s.aiStatement?.length ? toPlainText(s.aiStatement) : undefined,
    ...data.pages.map((p) => section(p.title, `/${p.slug}`, '', p.intro, [p.text, p.rail?.heading && `${p.rail.heading}\n\n${p.rail.text ?? ''}`].filter(Boolean).join('\n\n'))),
    ...data.caseStudies.map((c) => section(c.title, `/case-studies/${c.slug}`, line(c.organization, c.role, c.years, c.skills?.join(', ')), c.summary, c.text)),
    ...pieces.map((p) => section(p.title, p.path, line(p.kindLabel, p.client, p.year, p.credit), p.summary, p.text)),
  ]
    .filter(Boolean)
    .join('\n\n')
}

export const textResponse = (body: string) => new Response(`${body}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
