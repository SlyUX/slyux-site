import { stegaClean } from 'next-sanity'

import { EXPERIENCE_QUERY, safeFetch } from '@/lib/queries'
import { getSiteSettings } from '@/lib/site-settings'
import { absoluteUrl, SITE_URL } from '@/lib/site-url'
import { externalHref } from '@/lib/utils'
import type { ExperienceEntry } from '@/lib/types'

/**
 * The résumé, shared by the page (/resume) and the files built from it
 * (/resume.pdf, /resume.docx), so the three never disagree. Everything comes
 * from Sanity: the roles, and the résumé fields in Site settings.
 */

const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const formatDate = (date: string) => monthYear.format(new Date(`${date}T00:00:00Z`))

/** "Nov 2023 – Present". */
export const dateRange = (role: Pick<ExperienceEntry, 'start' | 'end'>) => `${formatDate(role.start)} – ${role.end ? formatDate(role.end) : 'Present'}`

/**
 * Consecutive roles at the same organization render as one group. Names are
 * compared without draft-mode edit markers, which differ field to field.
 */
export function groupByOrganization(entries: ExperienceEntry[]) {
  const groups: { organization: string; roles: ExperienceEntry[] }[] = []
  for (const entry of entries) {
    const last = groups.at(-1)
    if (last && stegaClean(last.organization) === stegaClean(entry.organization)) last.roles.push(entry)
    else groups.push({ organization: entry.organization, roles: [entry] })
  }
  return groups
}

/** The current job: the open-ended employment entry. A venture (ND Riot) never counts. */
export function currentRole(entries: ExperienceEntry[]) {
  const jobs = entries.filter((e) => !e.venture)
  return jobs.find((e) => !e.end) ?? jobs[0]
}

/** Settings, employment, and ventures (listed after employment, under their own heading). */
export async function getResume() {
  const [s, experience] = await Promise.all([getSiteSettings(), safeFetch<ExperienceEntry[]>(EXPERIENCE_QUERY, {}, [])])
  return {
    s,
    current: currentRole(experience),
    employment: experience.filter((e) => !e.venture),
    ventures: experience.filter((e) => e.venture),
  }
}

/** A URL as people type it: no scheme, no "www.", no trailing slash. */
const bareUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

/** The site's own address with the brand's capitals ("SlyUX.com") when it spells the site title. */
function siteAddress(siteTitle: string) {
  const host = bareUrl(SITE_URL)
  const branded = `${siteTitle.replace(/\s+/g, '')}${host.slice(host.indexOf('.'))}`
  return branded.toLowerCase() === host.toLowerCase() ? branded : host
}

export interface ResumeLink {
  text: string
  href?: string
}

export interface ResumeRole {
  role: string
  /** Dates, then location: "Nov 2023 – Present · Nashville, TN · Remote". */
  meta: string
  highlights: string[]
  caseStudies: ResumeLink[]
}

export interface ResumeSection {
  heading: string
  groups: { organization: string; roles: ResumeRole[] }[]
}

/** The résumé as plain data for the PDF and Word files: one column, standard headings, contact details in the body. */
export interface ResumeDocument {
  name: string
  title?: string
  contact: ResumeLink[]
  summary?: string
  sections: ResumeSection[]
  skillsHeading: string
  skills: { heading: string; skills: string }[]
  educationHeading: string
  education: string[]
  /** "Stephen Fox Résumé", for the file name and the document title. */
  fileTitle: string
}

export async function getResumeDocument(): Promise<ResumeDocument> {
  const { s, current, employment, ventures } = stegaClean(await getResume())
  const linkedin = externalHref(s.linkedinUrl)
  const toSection = (heading: string, entries: ExperienceEntry[]): ResumeSection => ({
    heading,
    groups: groupByOrganization(entries).map((group) => ({
      organization: group.organization,
      roles: group.roles.map((role) => ({
        role: role.role,
        meta: [dateRange(role), role.location].filter(Boolean).join(' · '),
        highlights: role.highlights ?? [],
        caseStudies: (role.caseStudies ?? []).flatMap((cs) =>
          cs.slug ? [{ text: `${s.caseStudyLabel}: ${cs.title ?? cs.slug}`, href: absoluteUrl(`/case-studies/${cs.slug}`) }] : [],
        ),
      })),
    })),
  })

  return {
    name: s.ownerName,
    title: current?.role,
    contact: [
      current?.location ? { text: current.location } : undefined,
      s.contactEmail ? { text: s.contactEmail, href: `mailto:${s.contactEmail}` } : undefined,
      s.resumePhone ? { text: s.resumePhone, href: `tel:${s.resumePhone.replace(/[^\d+]/g, '')}` } : undefined,
      linkedin ? { text: bareUrl(linkedin), href: linkedin } : undefined,
      { text: siteAddress(s.siteTitle), href: SITE_URL },
    ].filter((item): item is ResumeLink => !!item),
    summary: s.resumeIntro ?? undefined,
    sections: [toSection(s.experienceHeading, employment), ...(ventures.length ? [toSection(s.venturesHeading, ventures)] : [])],
    skillsHeading: s.skillsHeading,
    skills: (s.skillGroups ?? []).flatMap((group) => (group.skills?.length ? [{ heading: group.heading, skills: group.skills.join(', ') }] : [])),
    educationHeading: s.educationHeading,
    education: s.education ?? [],
    fileTitle: `${s.ownerName} ${s.resumeTitle}`,
  }
}

/** Headers for a downloaded résumé file: saved under the owner's name, kept out of search results (it carries contact details). */
export function fileHeaders(doc: ResumeDocument, extension: 'pdf' | 'docx', contentType: string) {
  const name = `${doc.fileTitle}.${extension}`
  const ascii = name.normalize('NFD').replace(/[^\x20-\x7e]/g, '').replace(/"/g, '')
  return {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    'X-Robots-Tag': 'noindex',
  }
}
