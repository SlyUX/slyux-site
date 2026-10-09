import { defineQuery } from 'next-sanity'

import { requestClient } from '@/sanity/preview'

/**
 * Every fetch goes through here with an explicit fallback. GROQ returns `null`
 * — not `[]` — when nothing matches, and a missing project/network error
 * should render an empty state rather than a 500. In draft mode it reads drafts
 * for the Studio's Presentation tool (see `@/sanity/preview`).
 */
export async function safeFetch<T>(
  query: string,
  params: Record<string, unknown>,
  fallback: T,
): Promise<T> {
  try {
    const { client, options } = await requestClient()
    const result = await client.fetch<T>(query, params, options)
    return result ?? fallback
  } catch {
    return fallback
  }
}

const PORTFOLIO_CARD = `_id,title,"slug":slug.current,kind,image,cardFit,artworkBackground,"opaque": image.asset->metadata.isOpaque,gallery,client,year,credit,summary,externalUrl,featured,
  "hasPage": count(body) > 0 || count(documents) > 0,
  "caseStudySlug": caseStudy->slug.current`

const CASE_STUDY_CARD = `_id,title,"slug":slug.current,summary,organization,role,years,skills,heroImage,metrics`

/** Related work: this page's picks, then pieces that picked it (see RelatedWork). */
const RELATED_CARD = `_type,_type=="caseStudy"=>{${CASE_STUDY_CARD}},_type=="creativeWork"=>{${PORTFOLIO_CARD}}`
const RELATED = `"relatedPicks": related[]->{${RELATED_CARD}},
  "relatedBack": *[_type in ["caseStudy","creativeWork"] && ^._id in related[]._ref]|order(_type asc, order asc){${RELATED_CARD}}`

export const SITE_SETTINGS_QUERY = defineQuery(`*[_type=="siteSettings" && _id=="siteSettings"][0]{
  ...,
  "resumePdfUrl": resumePdf.asset->url,
  "heroVideoUrl": heroVideo.asset->url,
  "headerLogoSize": headerLogo.asset->metadata.dimensions{width,height},
  "heroVideoType": heroVideo.asset->mimeType,
  "featuredCaseStudies": featuredCaseStudies[defined(@->slug.current)]->{${CASE_STUDY_CARD}},
  "uxCaseStudies": uxCaseStudies[defined(@->slug.current)]->{${CASE_STUDY_CARD}},
  "caseStudyGroups": caseStudyGroups[]{_key,heading,"studies": studies[defined(@->slug.current)]->{${CASE_STUDY_CARD}}},
  "portfolioUxCaseStudy": portfolioUxCaseStudy->{${CASE_STUDY_CARD}},
  "portfolioUxPieces": portfolioUxPieces[defined(@->slug.current)]->{${PORTFOLIO_CARD}}
}`)

export const CASE_STUDIES_QUERY = defineQuery(
  `*[_type=="caseStudy" && defined(slug.current)]|order(order asc, title asc){${CASE_STUDY_CARD}}`,
)

export const CASE_STUDY_QUERY = defineQuery(`*[_type=="caseStudy" && slug.current==$slug][0]{
  ${CASE_STUDY_CARD},body,links,seoDescription,heroBackground,personasIntro,aiNote,${RELATED},
  personas[]{_key,name,photo,traits,opportunitiesLead,opportunities,barriers,"photoSize": photo.asset->metadata.dimensions{width,height}},
  galleries[]{_key,heading,intro,layout,placement,images[]{...,"size": asset->metadata.dimensions{width,height},"fullPageSize": fullPage.asset->metadata.dimensions{width,height}}}
}`)

export const CASE_STUDY_SLUGS_QUERY = defineQuery(
  `*[_type=="caseStudy" && defined(slug.current)].slug.current`,
)

/** A PDF shown as page images (see schemaTypes/pdfDocument.ts). */
const PDF_DOCUMENT = `_key,title,"file": file.asset->{url,originalFilename},
  pages[]{_key,asset,"size": asset->metadata.dimensions{width,height}}`


/** All pieces in one portfolio section. `$kinds` comes from `kindsInSection()`. */
export const PORTFOLIO_SECTION_QUERY = defineQuery(
  `*[_type=="creativeWork" && defined(slug.current) && kind in $kinds]|order(featured desc, order asc, title asc){${PORTFOLIO_CARD}}`,
)

/** Featured pieces for the /portfolio landing page. */
export const PORTFOLIO_FEATURED_QUERY = defineQuery(
  `*[_type=="creativeWork" && defined(slug.current) && featured == true]|order(order asc, title asc){${PORTFOLIO_CARD}}`,
)

export const CREATIVE_WORK_QUERY = defineQuery(`*[_type=="creativeWork" && slug.current==$slug && kind in $kinds][0]{
  _id,title,"slug":slug.current,kind,image,client,year,credit,aiNote,summary,gallery,howItStarted,body,documentsHeading,externalUrl,
  documents[]{${PDF_DOCUMENT}},${RELATED},
  "caseStudy": caseStudy->{title,"slug":slug.current}
}`)

export const CREATIVE_WORK_PATHS_QUERY = defineQuery(
  `*[_type=="creativeWork" && defined(slug.current) && (count(body) > 0 || count(documents) > 0)]{kind,"slug":slug.current}`,
)

export const PAGE_QUERY = defineQuery(`*[_type=="page" && slug.current==$slug][0]{
  _id,title,intro,image,body,rail,cta,seoDescription
}`)

export const PAGE_SLUGS_QUERY = defineQuery(`*[_type=="page" && defined(slug.current)].slug.current`)

export const EXPERIENCE_QUERY = defineQuery(`*[_type=="experience"]|order(start desc){
  _id,role,organization,start,end,location,highlights,
  "caseStudies": caseStudies[defined(@->slug.current)]->{title,"slug":slug.current}
}`)

/** Every public URL and when it last changed, for sitemap.xml. */
export const SITEMAP_QUERY = defineQuery(`{
  "pages": *[_type=="page" && defined(slug.current)]{"slug": slug.current, _updatedAt},
  "caseStudies": *[_type=="caseStudy" && defined(slug.current)]{"slug": slug.current, _updatedAt},
  "pieces": *[_type=="creativeWork" && defined(slug.current) && (count(body) > 0 || count(documents) > 0)]{"slug": slug.current, kind, _updatedAt},
  "settingsUpdated": *[_id=="siteSettings"][0]._updatedAt
}`)

/** The site as text for AI tools (/llms.txt and /llms-full.txt): summaries, and the full stories. */
export const LLMS_QUERY = defineQuery(`{
  "caseStudies": *[_type=="caseStudy" && defined(slug.current)]|order(order asc, title asc){
    title, "slug": slug.current, summary, organization, role, years, skills, "text": pt::text(body)
  },
  "pieces": *[_type=="creativeWork" && defined(slug.current) && (count(body) > 0 || count(documents) > 0)]|order(order asc, title asc){
    title, "slug": slug.current, kind, summary, client, year, credit, "text": pt::text(body)
  },
  "pages": *[_type=="page" && defined(slug.current)]|order(title asc){title, "slug": slug.current, intro, "text": pt::text(body), "rail": rail{heading, "text": pt::text(body)}}
}`)
