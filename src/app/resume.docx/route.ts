import { fileHeaders, getResumeDocument } from '@/lib/resume'
import { resumeDocx } from '@/lib/resume-docx'

/** Built from the same content as /resume, and refreshed on the same schedule, so the file matches the page. */
export const dynamic = 'force-static'
export const revalidate = 60

export async function GET() {
  const doc = await getResumeDocument()
  const file = await resumeDocx(doc)
  return new Response(new Uint8Array(file), {
    headers: fileHeaders(doc, 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
  })
}
