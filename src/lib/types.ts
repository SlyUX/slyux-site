import type {
  CASE_STUDIES_QUERY_RESULT,
  CASE_STUDY_QUERY_RESULT,
  PORTFOLIO_SECTION_QUERY_RESULT,
  CREATIVE_WORK_QUERY_RESULT,
  EXPERIENCE_QUERY_RESULT,
  ImageWithAlt,
  Link,
  Metric,
  PAGE_QUERY_RESULT,
  RichText as GeneratedRichText,
} from '../../sanity.types'

/**
 * Readable names for generated Sanity types. Never hand-write field lists
 * here — run `npm run typegen` and alias the result.
 */
export type SanityImage = ImageWithAlt
export type RichText = GeneratedRichText
export type CmsLink = Link
export type CmsMetric = Metric
export type CaseStudyCard = CASE_STUDIES_QUERY_RESULT[number]
export type CaseStudyDetail = NonNullable<CASE_STUDY_QUERY_RESULT>
export type CreativeWorkCard = PORTFOLIO_SECTION_QUERY_RESULT[number]
export type CreativeWorkDetail = NonNullable<CREATIVE_WORK_QUERY_RESULT>
export type PageDetail = NonNullable<PAGE_QUERY_RESULT>
export type ExperienceEntry = EXPERIENCE_QUERY_RESULT[number]
