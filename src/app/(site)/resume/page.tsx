import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'

import { AiNote } from '@/components/ai-statement'
import { TransitionLink } from '@/components/transition-link'
import { buttonVariants, PageHeader, Section, SectionHeading } from '@/components/ui'
import { RoleLine } from '@/components/role-line'
import { dateRange, getResume, groupByOrganization } from '@/lib/resume'
import { getSiteSettings } from '@/lib/site-settings'
import type { ExperienceEntry } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return stegaClean({ title: s.resumeTitle, description: s.resumeIntro ?? undefined })
}

/** One band of roles (Experience, or Ventures), grouped by organization. */
function RoleList({ id, heading, entries }: { id: string; heading: string; entries: ExperienceEntry[] }) {
  return (
    <section aria-labelledby={id}>
      <SectionHeading id={id}>{heading}</SectionHeading>
      <ol className="space-y-10">
        {groupByOrganization(entries).map((group) => (
          <li key={`${group.organization}-${group.roles[0]._id}`}>
            <h3 className="text-xl font-semibold">{group.organization}</h3>
            <ol className="border-border mt-3 space-y-6 border-l-2 pl-5">
              {group.roles.map((role) => (
                <li key={role._id}>
                  <p className="font-semibold">{role.role}</p>
                  <p className="text-muted-foreground text-sm">
                    {dateRange(role)}
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
                            <TransitionLink key={cs.slug} href={`/case-studies/${cs.slug}`} className="text-primary underline underline-offset-4">
                              {cs.title}
                            </TransitionLink>
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
  )
}

export default async function ResumePage() {
  const { s, current, employment, ventures } = await getResume()

  return (
    <Section opener>
      {/* His name is the heading, so the page says whose résumé it is; the PDF and Word files are built from this same content. */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <PageHeader eyebrow={s.resumeTitle} title={s.ownerName} subtitle={current && <RoleLine role={current} />} intro={s.resumeIntro} />
        <div className="flex shrink-0 flex-wrap gap-3">
          <a href="/resume.pdf" download className={buttonVariants()}>
            {s.resumeDownloadLabel}
          </a>
          <a href="/resume.docx" download className={buttonVariants({ variant: 'secondary' })}>
            {s.resumeDocxLabel}
          </a>
        </div>
      </div>

      <div className="mt-14 grid gap-14 lg:grid-cols-[2fr_1fr]">
        {employment.length + ventures.length > 0 && (
          <div className="space-y-14">
            {employment.length > 0 && <RoleList id="experience-heading" heading={s.experienceHeading} entries={employment} />}
            {ventures.length > 0 && <RoleList id="ventures-heading" heading={s.venturesHeading} entries={ventures} />}
          </div>
        )}

        <aside className="space-y-12">
          {!!s.skillGroups?.length && (
            <section aria-labelledby="skills-heading">
              <SectionHeading id="skills-heading" intro={<AiNote className="ml-0" />}>
                {s.skillsHeading}
              </SectionHeading>
              <div className="space-y-6">
                {s.skillGroups.map((group) => (
                  <div key={group._key}>
                    <h3 className="font-semibold">{group.heading}</h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {group.skills?.map((skill) => (
                        <li key={skill} className="bg-surface rounded-ui px-3 py-1 text-sm">
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
              <SectionHeading id="education-heading">{s.educationHeading}</SectionHeading>
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
