import { llmsFullTxt, textResponse } from '@/lib/llms'

/** Static, rebuilt at most hourly (see src/lib/llms.ts). */
export const dynamic = 'force-static'
export const revalidate = 3600

export async function GET() {
  return textResponse(await llmsFullTxt())
}
