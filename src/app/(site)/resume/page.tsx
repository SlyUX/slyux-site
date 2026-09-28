import type { Metadata } from 'next'

import { PanLink } from '@/components/grid-nav'
import { PageHeader, Section } from '@/components/ui'
import { EXPERIENCE_QUERY, safeFetch } from '@/lib/queries'
import { getSiteSettings } from '@/lib/site-settings'
import type { ExperienceEntry } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return { title: s.resumeTitle, description: s.resumeIntro ?? undefined }
}

const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const formatDate = (date: string) => monthYear.format(new Date(`${date}T00:00:00Z`))

/** Consecutive roles at the same organization render as one group. */
function groupByOrganization(entries: ExperienceEntry[]) {
  const groups: { organization: string; roles: ExperienceEntry[] }[] = []
  for (const entry of entries) {
    const last = groups.at(-1)
    if (last?.organization === entry.organization) last.roles.push(entry)
    else groups.push({ organization: entry.organization, roles: [entry] })
  }
  return groups
}

export default async function ResumePage() {
  const [s, experience] = await Promise.all([
    getSiteSettings(),
    safeFetch<ExperienceEntry[]>(EXPERIENCE_QUERY, {}, []),
  ])
  const groups = groupByOrganization(experience)

  return (
    <Section>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <PageHeader title={s.resumeTitle} intro={s.resumeIntro} />
        {s.resumePdfUrl && (
          <a
            href={`${s.resumePdfUrl}?dl=`}
            className="bg-primary text-primary-foreground hover:bg-foreground inline-flex shrink-0 items-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            {s.resumeDownloadLabel}
          </a>
        )}
      </div>

      <div className="mt-14 grid gap-14 lg:grid-cols-[2fr_1fr]">
        {groups.length > 0 && (
          <section aria-labelledby="experience-heading">
            <h2 id="experience-heading" className="font-display mb-8 text-3xl font-semibold">
              {s.experienceHeading}
            </h2>
            <ol className="space-y-10">
              {groups.map((group) => (
                <li key={`${group.organization}-${group.roles[0]._id}`}>
                  <h3 className="text-xl font-semibold">{group.organization}</h3>
                  <ol className="border-border mt-3 space-y-6 border-l-2 pl-5">
                    {group.roles.map((role) => (
                      <li key={role._id}>
                        <p className="font-semibold">{role.role}</p>
                        <p className="text-muted-foreground text-sm">
                          {formatDate(role.start)} – {role.end ? formatDate(role.end) : 'Present'}
                          {role.location && ` · ${role.location}`}
                        </p>
                        {!!role.highlights?.length && (
                          <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
                            {role.highlights.map((h) => (
                              <li key={h}>{h}</li>
                            ))}
                          </ul>
                        )}
                        {!!role.caseStudies?.length && (
                          <p className="mt-3 flex flex-wrap gap-x-4 text-sm">
                            {role.caseStudies.map(
                              (cs) =>
                                cs.slug && (
                                  <PanLink key={cs.slug} href={`/case-studies/${cs.slug}`} className="text-primary underline underline-offset-4">
                                    {cs.title}
                                  </PanLink>
                                ),
                            )}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </section>
        )}

        <aside className="space-y-12">
          {!!s.skillGroups?.length && (
            <section aria-labelledby="skills-heading">
              <h2 id="skills-heading" className="font-display mb-6 text-3xl font-semibold">
                {s.skillsHeading}
              </h2>
              <div className="space-y-6">
                {s.skillGroups.map((group) => (
                  <div key={group._key}>
                    <h3 className="font-semibold">{group.heading}</h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {group.skills?.map((skill) => (
                        <li key={skill} className="bg-surface rounded-full px-3 py-1 text-sm">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
          {!!s.education?.length && (
            <section aria-labelledby="education-heading">
              <h2 id="education-heading" className="font-display mb-4 text-3xl font-semibold">
                {s.educationHeading}
              </h2>
              <ul className="space-y-2">
                {s.education.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </Section>
  )
}
