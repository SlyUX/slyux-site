/**
 * Whether the contact form can send (Resend's key, the from-address, and the
 * inbox are set in Vercel). Read while the page renders, on the server; kept
 * out of the 'use server' actions file so it isn't callable from the browser.
 */
export const contactFormReady = () => !!(process.env.RESEND_API_KEY && process.env.CONTACT_FROM && process.env.CONTACT_INBOX)
