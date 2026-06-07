// controls.tsx
// Form-control helpers for the Tweaks panel: layout helpers (TweakSection,
// TweakRow) and the individual controls (slider, toggle, segmented radio with
// drag + dropdown fallback, select, text, number with label-scrub, color with
// chips + native fallback, button). Shared styling lives in ./styles.

import { useState, useRef } from 'react'
import type { ReactNode } from 'react'

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }: { label: ReactNode; children?: ReactNode }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  )
}

function TweakRow(
  { label, value, children, inline = false }:
  { label: ReactNode; value?: ReactNode; children?: ReactNode; inline?: boolean },
) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  )
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider(
  { label, value, min = 0, max = 100, step = 1, unit = '', onChange }:
  {
    label: ReactNode; value: number; min?: number; max?: number; step?: number;
    unit?: string; onChange: (v: number) => void
  },
) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input type="range" className="twk-slider" min={min} max={max} step={step}
             value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </TweakRow>
  )
}

function TweakToggle(
  { label, value, onChange }:
  { label: ReactNode; value: boolean; onChange: (v: boolean) => void },
) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  )
}

type TweakOption = unknown | { value: unknown; label: unknown }

function TweakRadio(
  { label, value, options, onChange }:
  { label: ReactNode; value: unknown; options: TweakOption[]; onChange: (v: unknown) => void },
) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = useRef(value)
  valueRef.current = value

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = (o: TweakOption) => String(typeof o === 'object' && o !== null ? (o as { label: unknown }).label : o).length
  const maxLen = options.reduce((m: number, o) => Math.max(m, labelLen(o)), 0)
  const fitsAsSegments = maxLen <= (({ 2: 16, 3: 10 } as Record<number, number>)[options.length] ?? 0)
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = (s: string): unknown => {
      const m = options.find((o) => String(typeof o === 'object' && o !== null ? (o as { value: unknown }).value : o) === s)
      return m === undefined ? s : typeof m === 'object' && m !== null ? (m as { value: unknown }).value : m
    }
    return <TweakSelect label={label} value={value} options={options}
                        onChange={(s) => onChange(resolve(s as string))} />
  }
  const opts = options.map((o) => (typeof o === 'object' && o !== null ? o as { value: unknown; label: unknown } : { value: o, label: o }))
  const idx = Math.max(0, opts.findIndex((o) => o.value === value))
  const n = opts.length

  const segAt = (clientX: number): unknown => {
    const r = trackRef.current!.getBoundingClientRect()
    const inner = r.width - 4
    const i = Math.floor(((clientX - r.left - 2) / inner) * n)
    return opts[Math.max(0, Math.min(n - 1, i))].value
  }

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true)
    const v0 = segAt(e.clientX)
    if (v0 !== valueRef.current) onChange(v0)
    const move = (ev: PointerEvent) => {
      if (!trackRef.current) return
      const v = segAt(ev.clientX)
      if (v !== valueRef.current) onChange(v)
    }
    const up = () => {
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value}>
            {o.label as ReactNode}
          </button>
        ))}
      </div>
    </TweakRow>
  )
}

function TweakSelect(
  { label, value, options, onChange }:
  { label: ReactNode; value: unknown; options: TweakOption[]; onChange: (v: string) => void },
) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value as string | number} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' && o !== null ? (o as { value: unknown }).value : o
          const l = typeof o === 'object' && o !== null ? (o as { label: unknown }).label : o
          return <option key={String(v)} value={v as string | number}>{l as ReactNode}</option>
        })}
      </select>
    </TweakRow>
  )
}

function TweakText(
  { label, value, placeholder, onChange }:
  { label: ReactNode; value: string; placeholder?: string; onChange: (v: string) => void },
) {
  return (
    <TweakRow label={label}>
      <input className="twk-field" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  )
}

function TweakNumber(
  { label, value, min, max, step = 1, unit = '', onChange }:
  {
    label: ReactNode; value: number; min?: number; max?: number; step?: number;
    unit?: string; onChange: (v: number) => void
  },
) {
  const clamp = (n: number) => {
    if (min != null && n < min) return min
    if (max != null && n > max) return max
    return n
  }
  const startRef = useRef<{ x: number; val: number }>({ x: 0, val: 0 })
  const onScrubStart = (e: React.PointerEvent) => {
    e.preventDefault()
    startRef.current = { x: e.clientX, val: value }
    const decimals = (String(step).split('.')[1] || '').length
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startRef.current.x
      const raw = startRef.current.val + dx * step
      const snapped = Math.round(raw / step) * step
      onChange(clamp(Number(snapped.toFixed(decimals))))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  )
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex: string): boolean {
  const h = String(hex).replace('#', '')
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0')
  const n = parseInt(x.slice(0, 6), 16)
  if (Number.isNaN(n)) return true
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return r * 299 + g * 587 + b * 114 > 148000
}

const __TwkCheck = ({ light }: { light: boolean }) => (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          stroke={light ? 'rgba(0,0,0,.78)' : '#fff'} />
  </svg>
)

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor(
  { label, value, options, onChange }:
  {
    label: ReactNode; value: string | string[]; options?: (string | string[])[];
    onChange: (v: string | string[]) => void
  },
) {
  if (!options || !options.length) {
    return (
      <div className="twk-row twk-row-h">
        <div className="twk-lbl"><span>{label}</span></div>
        <input type="color" className="twk-swatch" value={value as string}
               onChange={(e) => onChange(e.target.value)} />
      </div>
    )
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = (o: unknown) => String(JSON.stringify(o)).toLowerCase()
  const cur = key(value)
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((o, i) => {
          const colors = Array.isArray(o) ? o : [o]
          const [hero, ...rest] = colors
          const sup = rest.slice(0, 4)
          const on = key(o) === cur
          return (
            <button key={i} type="button" className="twk-chip" role="radio"
                    aria-checked={on} data-on={on ? '1' : '0'}
                    aria-label={colors.join(', ')} title={colors.join(' · ')}
                    style={{ background: hero }}
                    onClick={() => onChange(o)}>
              {sup.length > 0 && (
                <span>
                  {sup.map((c, j) => <i key={j} style={{ background: c }} />)}
                </span>
              )}
              {on && <__TwkCheck light={__twkIsLight(hero)} />}
            </button>
          )
        })}
      </div>
    </TweakRow>
  )
}

function TweakButton(
  { label, onClick, secondary = false }:
  { label: ReactNode; onClick?: () => void; secondary?: boolean },
) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick}>{label}</button>
  )
}

export {
  TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
}
