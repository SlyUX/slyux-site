import { Hero } from '@/components/hero'
import { ButtonLink, Section } from '@/components/ui'
import { CaseStudyTile, MetricStrip } from '@/components/content'
import { getSiteSettings } from '@/lib/site-settings'

export default async function HomePage() {
  const s = await getSiteSettings()
  const featured = s.featuredCaseStudies ?? []

  return (
    <>
      <Hero
        eyebrow={s.ownerName}
        headline={s.headline}
        intro={s.intro}
        brandmark={s.heroBrandmark}
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
          {s.featuredHeading && (
            <h2 id="featured-heading" className="font-display mb-10 text-3xl font-semibold">
              {s.featuredHeading}
            </h2>
          )}
          {/* Three to a row: thumbnail, title, and client. The Case Studies page carries the summaries. */}
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
            {featured.map((study) => (
              <CaseStudyTile key={study._id} study={study} meta="client" />
            ))}
          </div>
        </Section>
      )}

      {(s.creativeTeaser?.heading || s.clientTeaser?.heading) && (
        <Section tone="surface">
          <div className="grid gap-12 md:grid-cols-2">
            {[s.creativeTeaser, s.clientTeaser].map(
              (teaser, i) =>
                teaser?.heading && (
                  <div key={i}>
                    <h2 className="font-display text-3xl font-semibold">{teaser.heading}</h2>
                    {teaser.body && <p className="text-muted-foreground mt-3 leading-relaxed">{teaser.body}</p>}
                    <ButtonLink link={teaser.cta} variant="secondary" className="mt-5" />
                  </div>
                ),
            )}
          </div>
        </Section>
      )}
    </>
  )
}
