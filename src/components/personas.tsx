import Image from 'next/image'

import { urlFor } from '@/sanity/image'
import type { CaseStudyDetail } from '@/lib/types'

type Persona = NonNullable<CaseStudyDetail['personas']>[number]

/**
 * Research personas as cards: circular headshot (already cut to a circle, so
 * no CSS rounding), name, traits, then what brings them in and what holds
 * them back. Two across on wide screens.
 */
export function Personas({
  personas,
  heading,
  intro,
  labels,
}: {
  personas: Persona[]
  heading: string
  intro?: string | null
  labels: { opportunities: string; barriers: string }
}) {
  if (!personas.length) return null

  return (
    <section aria-labelledby="personas-heading">
      <h2 id="personas-heading" className="font-display text-heading text-3xl font-semibold">
        {heading}
      </h2>
      {intro && <p className="text-muted-foreground mt-2">{intro}</p>}
      <ul className="mt-8 grid gap-6 lg:grid-cols-2">
        {personas.map((p) => (
          <li key={p._key} className="bg-surface flex min-w-0 flex-col gap-6 rounded-2xl p-6 sm:flex-row sm:p-8">
            <div className="flex items-center gap-4 sm:w-40 sm:shrink-0 sm:flex-col sm:items-start">
              {p.photo?.asset && (
                <Image
                  // Decorative: the name beside it identifies the persona.
                  src={urlFor(p.photo).width(576).url()}
                  alt=""
                  width={288}
                  height={288}
                  sizes="(min-width: 640px) 144px, 96px"
                  className="size-24 shrink-0 sm:size-36"
                />
              )}
              <div className="min-w-0">
                <h3 className="font-display text-heading text-2xl font-semibold">{p.name}</h3>
                {!!p.traits?.length && (
                  <ul className="mt-2 flex flex-wrap gap-1.5 sm:flex-col sm:items-start">
                    {p.traits.map((t) => (
                      <li key={t} className="bg-background rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-5 text-sm leading-relaxed">
              {!!p.opportunities?.length && (
                <div>
                  <h4 className="text-foreground font-semibold">{labels.opportunities}</h4>
                  {p.opportunitiesLead && <p className="text-muted-foreground mt-1">{p.opportunitiesLead}</p>}
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {p.opportunities.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
              {!!p.barriers?.length && (
                <div>
                  <h4 className="text-foreground font-semibold">{labels.barriers}</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {p.barriers.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
