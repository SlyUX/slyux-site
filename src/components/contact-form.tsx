'use client'

import { useActionState, useEffect, useRef } from 'react'

import { submitContact, type ContactState } from '@/app/actions/contact'
import { buttonVariants } from '@/components/ui'
import { cn } from '@/lib/utils'

type Copy = {
  topicLegend: string
  nameLabel: string
  emailLabel: string
  messageLabel: string
  sendLabel: string
  sendingLabel: string
  successHeading: string
  successText: string
}

const field = 'bg-paper border-border aria-[invalid=true]:border-error rounded-ui block w-full border px-4 py-3'

/**
 * The contact form: a topic (Site settings → Contact → inquiry options), name,
 * email, and message, sent by submitContact. Works without JavaScript; with
 * it, errors show inline and success replaces the form. The address it sends
 * to never reaches the browser.
 */
export function ContactForm({ topics, copy }: { topics: { key: string; label: string; description?: string | null }[]; copy: Copy }) {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(submitContact, { status: 'idle' })
  const startedRef = useRef<HTMLInputElement>(null)
  const doneRef = useRef<HTMLHeadingElement>(null)
  const errors = state.fieldErrors ?? {}
  const values = state.values

  // Stamps when the form appeared, for the timing gate (a page served from
  // cache can't carry the time itself). A DOM write, not state.
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now())
  }, [])

  // On success the form is replaced: focus the confirmation so it's announced.
  // On errors: focus the first field that needs fixing.
  useEffect(() => {
    if (state.status === 'success') doneRef.current?.focus()
    else if (state.fieldErrors) document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus()
  }, [state])

  if (state.status === 'success') {
    return (
      <div role="status" className="bg-surface rounded-ui mt-12 max-w-2xl p-8">
        <h2 ref={doneRef} tabIndex={-1} className="font-display text-2xl font-semibold">
          {copy.successHeading}
        </h2>
        <p className="text-muted-foreground mt-2">{copy.successText}</p>
      </div>
    )
  }

  const describedBy = (name: 'name' | 'email' | 'message') => (errors[name] ? `contact-${name}-error` : undefined)
  const error = (name: 'name' | 'email' | 'message') =>
    errors[name] && (
      <p id={`contact-${name}-error`} className="text-error mt-2 text-sm font-medium">
        {errors[name]}
      </p>
    )

  return (
    <form action={formAction} noValidate className="mt-12 grid max-w-3xl gap-8">
      <fieldset>
        <legend className="mb-3 font-semibold">{copy.topicLegend}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {topics.map((topic, i) => (
            <label
              key={topic.key}
              className="bg-paper border-border has-[:checked]:border-primary rounded-ui flex cursor-pointer gap-3 border p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-[var(--primary)]"
            >
              <input
                type="radio"
                name="topic"
                value={topic.key}
                defaultChecked={values ? values.topic === topic.key : i === 0}
                className="accent-primary mt-1 size-4 shrink-0 focus-visible:outline-none"
              />
              <span>
                <span className="font-display block text-lg font-semibold">{topic.label}</span>
                {topic.description && <span className="text-muted-foreground mt-1 block text-sm">{topic.description}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-2 block font-semibold">
            {copy.nameLabel}
          </label>
          <input id="contact-name" name="name" autoComplete="name" defaultValue={values?.name} aria-invalid={!!errors.name} aria-describedby={describedBy('name')} className={field} />
          {error('name')}
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-2 block font-semibold">
            {copy.emailLabel}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={values?.email}
            aria-invalid={!!errors.email}
            aria-describedby={describedBy('email')}
            className={field}
          />
          {error('email')}
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block font-semibold">
          {copy.messageLabel}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={7}
          defaultValue={values?.message}
          aria-invalid={!!errors.message}
          aria-describedby={describedBy('message')}
          className={cn(field, 'leading-relaxed')}
        />
        {error('message')}
      </div>

      {/* Honeypot and timing stamp, for bots only: hidden from people and from assistive technology. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <input name="company" tabIndex={-1} autoComplete="off" />
        <input ref={startedRef} type="hidden" name="t" defaultValue="0" />
      </div>

      {state.message && (
        <p role="alert" className="text-error font-medium">
          {state.message}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className={cn(buttonVariants(), 'disabled:opacity-70')}>
          {pending ? copy.sendingLabel : copy.sendLabel}
        </button>
      </div>
    </form>
  )
}
