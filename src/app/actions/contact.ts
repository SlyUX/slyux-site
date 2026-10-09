'use server'

import { headers } from 'next/headers'
import { stegaClean } from 'next-sanity'

import { getSiteSettings } from '@/lib/site-settings'

/**
 * The contact form's handler, adapted from ND Riot's (../NDRiot/src/app/actions/contact.ts).
 *
 * Email only: a stranger's message and address must never be stored in the
 * public dataset. Delivery is Resend's REST API, one POST, no SDK. Nothing
 * sends until RESEND_API_KEY, CONTACT_FROM, and CONTACT_INBOX exist; until
 * then the contact page doesn't show the form at all (see src/lib/contact.ts).
 */

export type ContactState = {
  status: 'idle' | 'success' | 'error'
  /** A general problem, e.g. sending failed; field problems are in fieldErrors. */
  message?: string
  fieldErrors?: Partial<Record<'name' | 'email' | 'message', string>>
  /** Echoed back so the form repopulates on error, with or without JavaScript. */
  values?: { topic: string; name: string; email: string; message: string }
}

const LIMITS = { name: 100, message: 5000 }
const MIN_MESSAGE = 10

/** Deliberately loose: an over-strict pattern rejects real addresses. A bounce is the real test. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Best-effort rate limit, per serverless instance: it only catches a bot
 * hammering one warm instance. The honeypot and timing gate do most of the
 * work; a shared store (e.g. Upstash) is the follow-up if abuse appears.
 */
const hits = new Map<string, number[]>()
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 5

function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > MAX_PER_WINDOW
}

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = {
    topic: String(formData.get('topic') ?? ''),
    name: String(formData.get('name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    message: String(formData.get('message') ?? '').trim(),
  }

  // Honeypot: a field people never see. Filled means a bot; it's told it
  // succeeded, so it learns nothing, and the message is dropped.
  if (String(formData.get('company') ?? '')) return { status: 'success' }

  // Timing gate: the form stamps when it appeared. Faster than a person could
  // type means a script. Same silent drop.
  const started = Number(formData.get('t'))
  if (Number.isFinite(started) && started > 0 && Date.now() - started < 2_000) return { status: 'success' }

  const s = await getSiteSettings()
  const copy = stegaClean(s.contactForm)

  const fieldErrors: NonNullable<ContactState['fieldErrors']> = {}
  if (!values.name) fieldErrors.name = copy.nameRequired
  else if (values.name.length > LIMITS.name) fieldErrors.name = copy.nameRequired
  if (!values.email) fieldErrors.email = copy.emailRequired
  else if (!EMAIL.test(values.email)) fieldErrors.email = copy.emailInvalid
  if (!values.message) fieldErrors.message = copy.messageRequired
  else if (values.message.length < MIN_MESSAGE) fieldErrors.message = copy.messageShort
  else if (values.message.length > LIMITS.message) fieldErrors.message = copy.messageLong
  if (Object.keys(fieldErrors).length > 0) return { status: 'error', fieldErrors, values }

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip)) return { status: 'error', message: copy.rateLimited, values }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM
  const to = process.env.CONTACT_INBOX
  if (!apiKey || !from || !to) {
    // Our problem, not the sender's: don't imply their message was malformed.
    console.error('[contact] RESEND_API_KEY / CONTACT_FROM / CONTACT_INBOX not set')
    return { status: 'error', message: copy.errorText, values }
  }

  // The topic's subject line, so messages arrive sorted (Site settings → Contact).
  const topic = stegaClean(s.inquiryTypes?.find((t) => t._key === values.topic))
  const subject = topic?.subject ?? 'Message from slyux.com'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        // A plain Reply goes to the sender, not the no-reply from-address.
        reply_to: values.email,
        subject: `${subject}: ${values.name}`,
        text: `From: ${values.name} <${values.email}>\nTopic: ${topic?.label ?? '(none)'}\n\n${values.message}`,
      }),
    })
    if (!res.ok) {
      console.error('[contact] Resend responded', res.status, await res.text())
      return { status: 'error', message: copy.errorText, values }
    }
  } catch (cause) {
    console.error('[contact] send failed', cause)
    return { status: 'error', message: copy.errorText, values }
  }
  return { status: 'success' }
}
