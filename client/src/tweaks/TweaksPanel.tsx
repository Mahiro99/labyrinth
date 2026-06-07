// TweaksPanel.tsx
// Reusable Tweaks shell. Adapted for a top-level Vite app: the Claude host
// protocol (postMessage edit-mode, iframe FAB fallback, host detection,
// 'tweakchange' CustomEvent) has been dropped. The FAB is always shown (this
// app is always top-level); 'T' toggles the panel; closing just hides it.

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { TWEAKS_STYLE } from './styles'

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. The FAB is always shown (this app is always top-level).
// Closing just hides the panel; reopen via the FAB or the 'T' key.
function TweaksPanel({ title = 'Tweaks', children }: { title?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const dragRef = useRef<HTMLDivElement | null>(null)
  const offsetRef = useRef<{ x: number; y: number }>({ x: 16, y: 16 })
  const PAD = 16

  const clampToViewport = useCallback(() => {
    const panel = dragRef.current
    if (!panel) return
    const w = panel.offsetWidth, h = panel.offsetHeight
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD)
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD)
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    }
    panel.style.right = offsetRef.current.x + 'px'
    panel.style.bottom = offsetRef.current.y + 'px'
  }, [])

  useEffect(() => {
    if (!open) return
    clampToViewport()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport)
      return () => window.removeEventListener('resize', clampToViewport)
    }
    const ro = new ResizeObserver(clampToViewport)
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [open, clampToViewport])

  useEffect(() => {
    // 'T' toggles the panel (ignored while typing in inputs).
    const onKey = (ev: KeyboardEvent) => {
      if (ev.defaultPrevented) return
      const tag = (ev.target && (ev.target as HTMLElement).tagName) || ''
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || ev.metaKey || ev.ctrlKey || ev.altKey) return
      if (ev.key !== 't' && ev.key !== 'T') return
      ev.preventDefault(); setOpen((o) => !o)
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey) }
  }, [])

  const dismiss = () => {
    setOpen(false)
  }

  const onDragStart = (e: React.MouseEvent) => {
    const panel = dragRef.current
    if (!panel) return
    const r = panel.getBoundingClientRect()
    const sx = e.clientX, sy = e.clientY
    const startRight = window.innerWidth - r.right
    const startBottom = window.innerHeight - r.bottom
    const move = (ev: MouseEvent) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      }
      clampToViewport()
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  // Show a floating button to open the panel.
  if (!open) {
    return (
      <>
        <style>{TWEAKS_STYLE}</style>
        <button className="twk-fab" data-omelette-chrome="" title="Tweaks (press T)"
                onClick={() => setOpen(true)}>✦ Tweaks</button>
      </>
    )
  }
  return (
    <>
      <style>{TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" data-omelette-chrome=""
           style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">
          {children}
        </div>
      </div>
    </>
  )
}

export { TweaksPanel }
