'use client'

import { useMemo, useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'

/**
 * The color tokens and their contrast, read live from `globals.css`: each
 * swatch shows the token's current value, and each ratio is measured from the
 * tokens in the browser, so this page can't drift from the code.
 */

export interface TokenGroup {
  name: string
  tokens: { token: string; use: string }[]
}

export interface ContrastPair {
  fg: string
  bg: string
  /** Paints the foreground over the background at this opacity (secondary buttons). */
  bgAlpha?: number
  /** A second background under a translucent one, e.g. the gray band under 75% white. */
  under?: string
  use: string
  /** What the pair must pass: body text (4.5), large text (3), or nothing (decorative). */
  need: 'text' | 'large' | 'decorative'
}

/** Hex to RGB. The minifier shortens values in the built CSS (#ffffff → #fff), so both lengths come back. */
const hex = (v: string) => {
  const s = v.trim()
  if (s === 'white') return [255, 255, 255]
  const m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return undefined
  const digits = m[1].length === 3 ? [...m[1]].map((d) => d + d).join('') : m[1]
  return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16))
}
/** As written in globals.css: six lowercase digits. */
const fullHex = (v: string) =>
  hex(v)
    ?.map((c) => c.toString(16).padStart(2, '0'))
    .join('')
const luminance = ([r, g, b]: number[]) => {
  const c = [r, g, b].map((x) => {
    const v = x / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a: number[], b: number[]) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const mix = (top: number[], bottom: number[], alpha: number) => top.map((t, i) => Math.round(alpha * t + (1 - alpha) * bottom[i]))

const noSubscribe = () => () => {}

/**
 * Reads every `--token` from the root element in the browser (empty on the
 * server). The values never change after load, so there's nothing to subscribe
 * to; the snapshot is one string so React can compare it between renders.
 */
function useTokens(names: string[]) {
  const key = names.join(',')
  const snapshot = useSyncExternalStore(
    noSubscribe,
    () => {
      const css = getComputedStyle(document.documentElement)
      return key
        .split(',')
        .map((n) => css.getPropertyValue(`--${n}`).trim())
        .join(',')
    },
    () => '',
  )
  return useMemo(() => {
    const values = snapshot.split(',')
    return Object.fromEntries(key.split(',').map((n, i) => [n, values[i] ?? '']))
  }, [key, snapshot]) as Record<string, string>
}

export function ColorTokens({ groups }: { groups: TokenGroup[] }) {
  const values = useTokens(groups.flatMap((g) => g.tokens.map((t) => t.token)))
  return (
    <div className="grid gap-10">
      {groups.map((group) => (
        <div key={group.name}>
          <h3 className="mb-4 font-semibold">{group.name}</h3>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.tokens.map(({ token, use }) => (
              <li key={token} className="bg-paper border-border rounded-ui flex gap-4 border p-3">
                <span aria-hidden className="border-border rounded-ui-inner size-14 shrink-0 border" style={{ background: `var(--${token})` }} />
                <span className="min-w-0">
                  <code className="block text-sm font-semibold">--{token}</code>
                  <span className="text-muted-foreground block font-mono text-xs">{fullHex(values[token] ?? '') ? `#${fullHex(values[token])}` : ' '}</span>
                  <span className="text-muted-foreground mt-1 block text-sm leading-snug">{use}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

const VERDICT = {
  aaa: { label: 'AAA', className: 'bg-footer text-footer-foreground' },
  aa: { label: 'AA', className: 'bg-footer text-footer-foreground' },
  large: { label: 'Large text only', className: 'bg-surface text-foreground' },
  decorative: {
    label: 'Decorative only',
    className: 'bg-surface text-foreground',
  },
  fails: { label: 'Fails', className: 'bg-pdf text-pdf-foreground' },
}

const label = (t: string) => (t === 'white' ? 'white' : `--${t}`)
const describe = (p: ContrastPair) => `${label(p.fg)} on ${label(p.bg)}${p.bgAlpha ? ` at ${p.bgAlpha * 100}%` : ''}${p.under ? ` over ${label(p.under)}` : ''}`

/**
 * Every pair, measured. A table from `md` up; on phones the same rows stack,
 * so the ratio and verdict stay on screen instead of scrolling off to the side.
 */
export function ContrastTable({ pairs }: { pairs: ContrastPair[] }) {
  const tokens = [...new Set(pairs.flatMap((p) => [p.fg, p.bg, p.under ?? '']).filter((t) => t && t !== 'white'))]
  const values = useTokens(tokens)
  const color = (t: string) => hex(t === 'white' ? 'white' : (values[t] ?? ''))

  const rows = pairs.map((p) => {
    const fg = color(p.fg)
    const base = color(p.bg)
    const under = p.under ? color(p.under) : undefined
    const bg = base && p.bgAlpha && under ? mix(base, under, p.bgAlpha) : base
    const r = fg && bg ? ratio(fg, bg) : undefined
    const verdict = r === undefined ? undefined : r >= 7 ? 'aaa' : r >= 4.5 ? 'aa' : p.need === 'decorative' ? 'decorative' : r >= 3 && p.need === 'large' ? 'large' : 'fails'
    return {
      key: `${p.fg}-${p.bg}-${p.bgAlpha ?? 1}`,
      pair: p,
      sample: (
        <span
          className="rounded-ui-inner inline-flex px-2.5 py-1 font-semibold"
          style={{
            color: p.fg === 'white' ? '#fff' : `var(--${p.fg})`,
            background: bg ? `rgb(${bg.join(',')})` : undefined,
          }}
        >
          Aa
        </span>
      ),
      ratio: r ? r.toFixed(2) : '…',
      verdict: verdict && (
        <span className={cn('rounded-ui-inner inline-flex px-2 py-0.5 text-xs font-semibold whitespace-nowrap', VERDICT[verdict].className)}>{VERDICT[verdict].label}</span>
      ),
    }
  })

  return (
    <div className="bg-paper border-border rounded-ui border">
      <ul className="divide-border divide-y text-sm md:hidden">
        {rows.map((row) => (
          <li key={row.key} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 p-4">
            {row.sample}
            <span className="min-w-0">
              <code className="block font-mono text-xs break-words">{describe(row.pair)}</code>
              <span className="text-muted-foreground mt-1 block">{row.pair.use}</span>
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className="font-semibold tabular-nums">{row.ratio}</span>
              {row.verdict}
            </span>
          </li>
        ))}
      </ul>
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="text-muted-foreground border-border border-b">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Sample
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Pair
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Where
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Ratio
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-border border-b last:border-0">
              <td className="px-4 py-3">{row.sample}</td>
              <td className="px-4 py-3 font-mono text-xs">{describe(row.pair)}</td>
              <td className="text-muted-foreground px-4 py-3">{row.pair.use}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">{row.ratio}</td>
              <td className="px-4 py-3">{row.verdict}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
