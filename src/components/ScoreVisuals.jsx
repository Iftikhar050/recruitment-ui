import React from 'react'

/* ── Colour by score ─────────────────────────────────────────── */
export function scoreColor(n) {
  if (n >= 75) return '#22c55e'
  if (n >= 50) return '#f0a500'
  return '#ef4444'
}

/* ── Circular score badge ────────────────────────────────────── */
export function ScoreRing({ value, size = 52 }) {
  const r   = (size - 6) / 2
  const c   = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const col = scoreColor(pct)

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="#272c38" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={col} strokeWidth={5}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={size/2} y={size/2}
        textAnchor="middle" dominantBaseline="central"
        fill={col}
        fontSize={size * 0.26}
        fontFamily="'DM Mono', monospace"
        fontWeight="500"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}>
        {pct}
      </text>
    </svg>
  )
}

/* ── Horizontal bar ──────────────────────────────────────────── */
export function ScoreBar({ value, label }) {
  const col = scoreColor(value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: '#6b7385' }}>{label}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", color: col }}>{value}</span>
      </div>
      <div style={{ height: 4, background: '#1b1f27', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${value}%`,
          background: col, borderRadius: 4,
          transition: 'width 0.7s ease',
        }} />
      </div>
    </div>
  )
}