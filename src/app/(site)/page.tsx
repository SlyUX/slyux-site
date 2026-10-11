import { BookOpen, Handshake } from 'lucide-react'

import { Hero } from '@/components/hero'
import { ButtonLink, Section, SectionHeading } from '@/components/ui'
import { CaseStudyTile, MetricStrip } from '@/components/content'
import { RoleLine } from '@/components/role-line'
import { getResume } from '@/lib/resume'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const { s, current } = await getResume()
  const featured = s.featuredCaseStudies ?? []
  // Closing teasers, with decorative icons in the hero's fox orange: an open
  // book for the portfolio, a handshake for client work. The client teaser can
  // be hidden (while job-seeking) without losing its copy.
  const teasers = [
    { teaser: s.creativeTeaser, Icon: BookOpen },
    { teaser: s.clientTeaser?.hidden ? null : s.clientTeaser, Icon: Handshake },
  ].flatMap(({ teaser, Icon }) => (teaser?.heading ? [{ ...teaser, heading: teaser.heading, Icon }] : []))

  return (
    <>
      <Hero
        name={s.ownerName}
        role={current && <RoleLine role={current} />}
        headline={s.headline}
        intro={s.intro}
        videoUrl={s.heroVideoUrl}
        videoType={s.heroVideoType}
        poster={s.heroPoster}
        actions={s.quickActions}
      />

      {!!s.proofStats?.length && (
        <Section tone="brand" className="py-12 md:py-14" aria-label="Highlights">
          <MetricStrip metrics={s.proofStats} tone="brand" align="center" />
        </Section>
      )}

      {featured.length > 0 && (
        <Section aria-labelledby="featured-heading">
          {s.featuredHeading && <SectionHeading id="featured-heading">{s.featuredHeading}</SectionHeading>}
          {/* Three to a row: thumbnail, title, and client. The Case Studies page carries the summaries. */}
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
            {featured.map((study) => (
              <CaseStudyTile key={study._id} study={study} meta="client" />
            ))}
          </div>
        </Section>
      )}

      {teasers.length > 0 && (
        <Section tone="surface">
          <div className={cn('grid gap-12', teasers.length > 1 && 'md:grid-cols-2')}>
            {teasers.map(({ heading, body, cta, Icon }) => (
              <div key={heading}>
                <h2 className="font-display flex items-center gap-3 text-3xl font-semibold">
                  <Icon aria-hidden className="text-fox size-[1em] shrink-0" strokeWidth={1.5} />
                  {heading}
                </h2>
                {body && <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">{body}</p>}
                <ButtonLink link={cta} variant="secondary" className="mt-5" />
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
