import type { Metadata } from 'next'
import { stegaClean } from 'next-sanity'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { ButtonLink, PageHeader, Section } from '@/components/ui'
import { RichText } from '@/components/content'
import { Rail } from '@/components/rail'
import { PAGE_QUERY, PAGE_SLUGS_QUERY, safeFetch } from '@/lib/queries'
import { urlFor } from '@/sanity/image'
import type { PageDetail } from '@/lib/types'

/** Free-form pages from Sanity: /about, /work-with-me, and any added later. */
export async function generateStaticParams() {
  const slugs = await safeFetch<string[]>(PAGE_SLUGS_QUERY, {}, [])
  return slugs.map((slug) => ({ slug }))
}

const getPage = (slug: string) => safeFetch<PageDetail | null>(PAGE_QUERY, { slug }, null)

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const page = await getPage((await params).slug)
  if (!page) return {}
  return stegaClean({ title: page.title, description: page.seoDescription ?? page.intro ?? undefined })
}

export default async function CmsPage({ params }: PageProps<'/[slug]'>) {
  const page = await getPage((await params).slug)
  if (!page) notFound()

  return (
    <Section opener>
      <div className="grid gap-12 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div>
          <PageHeader title={page.title} intro={page.intro} />
          <div className="mt-10">
            <RichText value={page.body} />
          </div>
          <ButtonLink link={page.cta} className="mt-10" />
        </div>
        {(page.image?.asset || page.rail?.heading) && (
          // Beside the page from lg; after it on phones, where the rail folds under its heading.
          <div className="flex flex-col gap-8">
            {page.image?.asset && (
              <Image
                src={urlFor(page.image).width(800).url()}
                alt={page.image.alt ?? ''}
                width={800}
                height={1000}
                priority
                sizes="(max-width: 1024px) 100vw, 320px"
                className="h-auto w-full rounded-ui"
              />
            )}
            {page.rail?.heading && (
              <Rail heading={page.rail.heading} className="self-stretch">
                <RichText value={page.rail.body} compact />
              </Rail>
            )}
          </div>
        )}
      </div>
    </Section>
  )
}
