import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

/** Leaves draft mode by URL (the "Exit preview" button uses a server action instead). */
export async function GET(request: NextRequest) {
  ;(await draftMode()).disable()
  return NextResponse.redirect(new URL('/', request.url))
}
