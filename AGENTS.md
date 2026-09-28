<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: slyUX.com

Stephen Fox's portfolio. Primary audience: hiring managers for director/lead UX/CX roles. Secondary: potential clients, via a quieter "Work with me" path. Planning notes live OUTSIDE the repo in `~/Documents/1-SlyUX/Site-Plan.md` (private).

## Stack
- Next.js 16.2.10 (App Router, Turbopack, `src/`, alias `@/*`), React 19.2, TypeScript, Tailwind v4 (CSS-first tokens in `src/app/globals.css`)
- Sanity v6, embedded Studio at `/studio`. Same setup as the sibling `../NDRiot` repo — check it before inventing a pattern.
- Vercel deploy, DNS on Cloudflare. **Pushing `main` deploys to slyux.com** — commit freely, push deliberately.

## Content model (`src/sanity/schemaTypes`)
- `siteSettings` (singleton): all chrome copy, home page, section headings, résumé skills, contact inquiry options
- `caseStudy` → `/work/[slug]` · `creativeWork` → `/creative` (+ `/creative/[slug]` when it has a Story; mature pieces are link-only) · `page` → `/[slug]` (about, work-with-me) · `experience` → `/resume`

## Rules (adapted from ND Riot's AGENTS.md)
1. **Verify APIs** in `node_modules/next/dist/docs/` or Context7 before use — never from memory.
2. **Content is Sanity's.** No display copy hardcoded in components; defaults live only in `src/lib/site-settings.ts` and each needs a matching schema field. Exceptions (a11y text) get a comment.
3. **Generated types only.** `npm run typegen` (runs on prebuild). Wrap queries in `defineQuery()`; alias results in `src/lib/types.ts`. GROQ returns `null` for absent fields.
4. **All fetches via `safeFetch()`** with a fallback. Every list needs an empty state.
5. **Tokens only** — no raw hex or palette classes in components. New color pairs must clear WCAG AA; record the ratio in `globals.css`. Palette is PROVISIONAL pending art direction.
6. **Accessibility:** one `<h1>` per page, no skipped heading levels, real alt text from Sanity, visible focus, reduced motion respected.
7. **Before done:** `npm run lint` clean, `npm run build` passes, smoke-test every route (`next start` + curl) in a separate step from any push.
8. **American English** in copy and Studio labels.
