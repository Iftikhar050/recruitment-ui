import React from 'react'
import { ScoreBar, ScoreRing, scoreColor } from './ScoreVisuals.jsx'

export default function CandidateDrawer({ candidate, onClose }) {
  if (!candidate) return null
  const c = candidate

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)', zIndex: 40,
        animation: 'fadeUp 0.2s ease',
      }} />

      {/* Drawer panel */}
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: '#13161b',
        borderLeft: '1px solid #272c38',
        zIndex: 50, overflowY: 'auto',
        animation: 'slideIn 0.25s ease',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid #272c38',
          position: 'sticky', top: 0,
          background: '#13161b', zIndex: 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: "'DM Mono'", color: '#6b7385', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Candidate Report</div>
              <h2 style={{ fontFamily: "'Syne'", fontSize: 20, fontWeight: 700, color: '#e8eaf0' }}>
                {c.candidate_name || 'Unknown Candidate'}
              </h2>
            </div>
            <button onClick={onClose} style={{
              background: '#1b1f27', border: '1px solid #272c38',
              color: '#6b7385', borderRadius: 6, width: 32, height: 32,
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Overall score hero */}
          <div style={{
            background: '#1b1f27', borderRadius: 12,
            border: '1px solid #272c38',
            padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <ScoreRing value={c.overall_score} size={72} />
            <div>
              <div style={{ fontSize: 11, color: '#6b7385', fontFamily: "'DM Mono'", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Overall Score</div>
              <div style={{
                fontSize: 32, fontFamily: "'Syne'", fontWeight: 800,
                color: scoreColor(c.overall_score), lineHeight: 1.1,
              }}>{c.overall_score}<span style={{ fontSize: 16, fontWeight: 500, color: '#6b7385' }}>/100</span></div>
              <div style={{ fontSize: 12, color: '#6b7385', marginTop: 4 }}>
                {c.overall_score >= 75 ? '✦ Strong fit' : c.overall_score >= 50 ? '◈ Moderate fit' : '◇ Weak fit'}
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono'", color: '#6b7385', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score Breakdown</div>
            <ScoreBar value={c.skills_match}    label="Skills Match" />
            <ScoreBar value={c.education_fit}   label="Education Fit" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#6b7385' }}>Experience</span>
                <span style={{ fontFamily: "'DM Mono'", color: '#e8eaf0' }}>{c.experience_years} yr{c.experience_years !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ height: 4, background: '#1b1f27', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (c.experience_years / 15) * 100)}%`,
                  background: '#f0a500', borderRadius: 4,
                  transition: 'width 0.7s ease',
                }} />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ background: '#1b1f27', borderRadius: 10, padding: '16px 18px', border: '1px solid #272c38' }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono'", color: '#6b7385', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>AI Summary</div>
            <p style={{ fontSize: 13, color: '#b0b7c9', lineHeight: 1.7 }}>{c.summary}</p>
          </div>

          {/* Strengths */}
          {c.strengths?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontFamily: "'DM Mono'", color: '#6b7385', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Strengths</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {c.strengths.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    background: '#0f1a13', border: '1px solid #1a3322',
                    borderRadius: 8, padding: '10px 12px',
                  }}>
                    <span style={{ color: '#22c55e', fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: '#b0b7c9', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red flags */}
          {c.red_flags?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontFamily: "'DM Mono'", color: '#6b7385', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Red Flags</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {c.red_flags.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    background: '#1a0f0f', border: '1px solid #3a1a1a',
                    borderRadius: 8, padding: '10px 12px',
                  }}>
                    <span style={{ color: '#ef4444', fontSize: 14, flexShrink: 0, marginTop: 1 }}>!</span>
                    <span style={{ fontSize: 13, color: '#b0b7c9', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No issues badge */}
          {(!c.red_flags || c.red_flags.length === 0) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#0f1a13', border: '1px solid #1a3322',
              borderRadius: 8, padding: '10px 14px',
            }}>
              <span style={{ color: '#22c55e' }}>✓</span>
              <span style={{ fontSize: 13, color: '#22c55e' }}>No red flags identified</span>
            </div>
          )}

        </div>
      </aside>
    </>
  )
}