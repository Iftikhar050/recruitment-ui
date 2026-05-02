import React, { useState, useRef, useCallback } from 'react'
import { uploadResumes, scoreResumes, exportToCSV } from './api/client.js'
import { ScoreRing, scoreColor } from './components/ScoreVisuals.jsx'
import CandidateDrawer from './components/CandidateDrawer.jsx'

/* ── Status badge ───────────────────────────────────────────── */
function StatusBadge({ score }) {
  const col  = scoreColor(score)
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Moderate' : 'Weak'
  return (
    <span style={{
      fontSize: 10, fontFamily: "'DM Mono'", fontWeight: 500,
      padding: '2px 8px', borderRadius: 20,
      background: col + '18', color: col,
      border: `1px solid ${col}44`,
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>{label}</span>
  )
}

/* ── Drop zone ──────────────────────────────────────────────── */
function DropZone({ files, onFiles }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handle = useCallback(newFiles => {
    const valid = Array.from(newFiles).filter(f =>
      f.type === 'application/pdf' ||
      f.name.endsWith('.docx') ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    onFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !names.has(f.name))]
    })
  }, [onFiles])

  const onDrop = e => {
    e.preventDefault(); setDragging(false)
    handle(e.dataTransfer.files)
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? '#f0a500' : '#272c38'}`,
          borderRadius: 12, padding: '32px 24px',
          textAlign: 'center', cursor: 'pointer',
          background: dragging ? '#f0a50009' : '#1b1f27',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
        <div style={{ fontFamily: "'Syne'", fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>
          Drop resumes here
        </div>
        <div style={{ fontSize: 12, color: '#6b7385' }}>
          PDF or DOCX · up to 50 files · 10 MB each
        </div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.docx"
          style={{ display: 'none' }}
          onChange={e => handle(e.target.files)} />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map((f, i) => (
            <div key={f.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#1b1f27', border: '1px solid #272c38',
              borderRadius: 8, padding: '8px 14px',
              animation: 'fadeUp 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>{f.name.endsWith('.pdf') ? '📄' : '📝'}</span>
                <span style={{ fontSize: 12, color: '#b0b7c9', fontFamily: "'DM Mono'" }}>
                  {f.name.length > 38 ? f.name.slice(0, 35) + '...' : f.name}
                </span>
              </div>
              <button onClick={e => { e.stopPropagation(); onFiles(prev => prev.filter((_, j) => j !== i)) }}
                style={{ background: 'none', border: 'none', color: '#6b7385', fontSize: 16, lineHeight: 1 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Skeleton loader row ────────────────────────────────────── */
function SkeletonRow() {
  const sh = {
    background: 'linear-gradient(90deg, #1b1f27 25%, #22273300 50%, #1b1f27 75%)',
    backgroundSize: '800px 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: 4,
    height: 12,
  }
  return (
    <tr style={{ borderBottom: '1px solid #1b1f27' }}>
      <td style={{ padding: '16px 20px' }}><div style={{ ...sh, width: 20 }} /></td>
      <td style={{ padding: '16px 20px' }}><div style={{ ...sh, width: 140 }} /></td>
      <td style={{ padding: '16px 20px' }}><div style={{ ...sh, width: 60 }} /></td>
      <td style={{ padding: '16px 20px' }}><div style={{ ...sh, width: 50 }} /></td>
      <td style={{ padding: '16px 20px' }}><div style={{ ...sh, width: 40 }} /></td>
      <td style={{ padding: '16px 20px' }}><div style={{ ...sh, width: 50 }} /></td>
      <td style={{ padding: '16px 20px' }}><div style={{ ...sh, width: 60 }} /></td>
    </tr>
  )
}

/* ── Main app ───────────────────────────────────────────────── */
export default function App() {
  const [jd, setJd]               = useState('')
  const [files, setFiles]         = useState([])
  const [status, setStatus]       = useState('idle')   // idle | uploading | scoring | done | error
  const [statusMsg, setStatusMsg] = useState('')
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected]   = useState(null)
  const [error, setError]         = useState('')

  const canRun = jd.trim().length > 30 && files.length > 0 && status !== 'uploading' && status !== 'scoring'

  async function handleAnalyze() {
    if (!canRun) return
    setError(''); setCandidates([]); setSelected(null)

    try {
      setStatus('uploading')
      setStatusMsg(`Extracting text from ${files.length} resume${files.length > 1 ? 's' : ''}…`)
      const uploadResult = await uploadResumes(files)

      const successful = uploadResult.resumes.filter(r => r.extraction_success)
      if (successful.length === 0) {
        setError('No text could be extracted from any resume. Make sure you uploaded text-based PDFs (not scanned images).')
        setStatus('error'); return
      }

      setStatus('scoring')
      setStatusMsg(`Scoring ${successful.length} candidate${successful.length > 1 ? 's' : ''} with AI…`)
      const scoreResult = await scoreResumes(successful, jd)

      setCandidates(scoreResult.results)
      setStatus('done')
      setStatusMsg('')
    } catch (e) {
      setError(e.message || 'Something went wrong. Is your FastAPI server running on port 8000?')
      setStatus('error')
    }
  }

  const colHeader = label => (
    <th style={{
      padding: '10px 20px', textAlign: 'left',
      fontFamily: "'DM Mono'", fontSize: 10,
      color: '#6b7385', fontWeight: 500,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      borderBottom: '1px solid #272c38', whiteSpace: 'nowrap',
    }}>{label}</th>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f12' }}>

      {/* Top nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 56,
        borderBottom: '1px solid #272c38',
        background: '#0d0f12', position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #f0a500, #e07800)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>⚡</div>
          <span style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
            HireIQ
          </span>
        </div>
        {candidates.length > 0 && (
          <button onClick={() => exportToCSV(candidates)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#1b1f27', border: '1px solid #272c38',
            color: '#b0b7c9', borderRadius: 8,
            padding: '7px 14px', fontSize: 12, fontFamily: "'DM Mono'",
            transition: 'all 0.15s',
          }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#f0a500'; e.currentTarget.style.color = '#f0a500' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#272c38'; e.currentTarget.style.color = '#b0b7c9' }}
          >
            ↓ Export CSV
          </button>
        )}
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 32, animation: 'fadeUp 0.4s ease' }}>
          <h1 style={{
            fontFamily: "'Syne'", fontWeight: 800, fontSize: 28,
            letterSpacing: '-0.03em', color: '#e8eaf0', marginBottom: 6,
          }}>
            Resume Screening
          </h1>
          <p style={{ color: '#6b7385', fontSize: 13 }}>
            Upload resumes + paste a job description → get an AI-ranked shortlist in seconds.
          </p>
        </div>

        {/* Input panel */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
          marginBottom: 28, animation: 'fadeUp 0.45s ease',
        }}>

          {/* Job description */}
          <div style={{
            background: '#13161b', border: '1px solid #272c38',
            borderRadius: 12, padding: '20px 22px',
          }}>
            <label style={{
              display: 'block', fontFamily: "'DM Mono'", fontSize: 10,
              color: '#6b7385', textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 10,
            }}>Job Description</label>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the full job description here…&#10;&#10;e.g. We're looking for a Senior Backend Engineer with 5+ years Python, FastAPI, PostgreSQL, AWS experience…"
              rows={10}
              style={{
                width: '100%', background: '#1b1f27',
                border: '1px solid #272c38', borderRadius: 8,
                color: '#e8eaf0', padding: '12px 14px', fontSize: 13,
                resize: 'vertical', outline: 'none',
                transition: 'border-color 0.2s',
                lineHeight: 1.6,
              }}
              onFocus={e => e.target.style.borderColor = '#f0a500'}
              onBlur={e => e.target.style.borderColor = '#272c38'}
            />
            <div style={{ marginTop: 6, fontSize: 11, color: jd.length < 30 && jd.length > 0 ? '#ef4444' : '#6b7385', fontFamily: "'DM Mono'" }}>
              {jd.length} chars {jd.length < 30 && jd.length > 0 ? '· minimum 30 characters' : ''}
            </div>
          </div>

          {/* File uploader */}
          <div style={{
            background: '#13161b', border: '1px solid #272c38',
            borderRadius: 12, padding: '20px 22px',
            display: 'flex', flexDirection: 'column',
          }}>
            <label style={{
              display: 'block', fontFamily: "'DM Mono'", fontSize: 10,
              color: '#6b7385', textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 10,
            }}>Resumes ({files.length} loaded)</label>
            <DropZone files={files} onFiles={setFiles} />
          </div>
        </div>

        {/* Analyze button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36, animation: 'fadeUp 0.5s ease' }}>
          <button
            onClick={handleAnalyze}
            disabled={!canRun}
            style={{
              padding: '13px 32px',
              background: canRun ? 'linear-gradient(135deg, #f0a500, #e07800)' : '#1b1f27',
              border: 'none', borderRadius: 10,
              color: canRun ? '#0d0f12' : '#3a4055',
              fontFamily: "'Syne'", fontWeight: 700, fontSize: 14,
              transition: 'all 0.2s',
              cursor: canRun ? 'pointer' : 'not-allowed',
              transform: canRun ? 'none' : 'none',
            }}
            onMouseOver={e => canRun && (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseOut={e => (e.currentTarget.style.transform = 'none')}
          >
            {status === 'uploading' || status === 'scoring' ? '⏳ Analyzing…' : '⚡ Analyze Candidates'}
          </button>

          {(status === 'uploading' || status === 'scoring') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 14, height: 14, border: '2px solid #272c38',
                borderTopColor: '#f0a500', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: 12, color: '#6b7385', fontFamily: "'DM Mono'" }}>{statusMsg}</span>
            </div>
          )}

          {status === 'done' && (
            <span style={{ fontSize: 12, color: '#22c55e', fontFamily: "'DM Mono'" }}>
              ✓ {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} ranked
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#1a0f0f', border: '1px solid #3a1a1a',
            borderRadius: 10, padding: '14px 18px',
            color: '#ef4444', fontSize: 13, marginBottom: 28,
            animation: 'fadeUp 0.3s ease',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Leaderboard */}
        {(candidates.length > 0 || status === 'uploading' || status === 'scoring') && (
          <div style={{
            background: '#13161b', border: '1px solid #272c38',
            borderRadius: 14, overflow: 'hidden',
            animation: 'fadeUp 0.5s ease',
          }}>
            {/* Table header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid #272c38',
            }}>
              <span style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 15 }}>
                Candidate Leaderboard
              </span>
              {candidates.length > 0 && (
                <span style={{ fontSize: 11, fontFamily: "'DM Mono'", color: '#6b7385' }}>
                  {candidates.length} candidates · sorted by score
                </span>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f1115' }}>
                    {colHeader('#')}
                    {colHeader('Candidate')}
                    {colHeader('Overall')}
                    {colHeader('Skills')}
                    {colHeader('Exp')}
                    {colHeader('Education')}
                    {colHeader('Fit')}
                  </tr>
                </thead>
                <tbody>
                  {(status === 'uploading' || status === 'scoring') && candidates.length === 0
                    ? Array(files.length || 3).fill(0).map((_, i) => <SkeletonRow key={i} />)
                    : candidates.map((c, i) => (
                      <tr key={c.candidate_name + i}
                        onClick={() => setSelected(c)}
                        style={{
                          borderBottom: '1px solid #1b1f27',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#1b1f27'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Rank */}
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontFamily: "'DM Mono'", fontSize: 12,
                            color: i === 0 ? '#f0a500' : i === 1 ? '#b0b7c9' : i === 2 ? '#c47c2e' : '#3a4055',
                            fontWeight: 600,
                          }}>{i < 3 ? ['①','②','③'][i] : `${i + 1}`}</span>
                        </td>

                        {/* Name */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 500, color: '#e8eaf0', fontSize: 13 }}>
                            {c.candidate_name || 'Unknown'}
                          </div>
                          {c.red_flags?.length > 0 && (
                            <div style={{ fontSize: 10, color: '#ef444499', fontFamily: "'DM Mono'", marginTop: 2 }}>
                              {c.red_flags.length} flag{c.red_flags.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </td>

                        {/* Overall score */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ScoreRing value={c.overall_score} size={40} />
                          </div>
                        </td>

                        {/* Skills */}
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontFamily: "'DM Mono'", fontSize: 13,
                            color: scoreColor(c.skills_match),
                          }}>{c.skills_match}%</span>
                        </td>

                        {/* Experience */}
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontFamily: "'DM Mono'", fontSize: 13, color: '#b0b7c9' }}>
                            {c.experience_years}y
                          </span>
                        </td>

                        {/* Education */}
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontFamily: "'DM Mono'", fontSize: 13,
                            color: scoreColor(c.education_fit),
                          }}>{c.education_fit}%</span>
                        </td>

                        {/* Fit badge + arrow */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <StatusBadge score={c.overall_score} />
                            <span style={{ color: '#3a4055', fontSize: 14 }}>›</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {status === 'idle' && candidates.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '64px 24px',
            animation: 'fadeUp 0.5s ease',
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>⚡</div>
            <div style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#e8eaf0' }}>
              Ready to screen candidates
            </div>
            <div style={{ color: '#6b7385', fontSize: 13, maxWidth: 380, margin: '0 auto', lineHeight: 1.7 }}>
              Paste a job description, upload your resume files, and hit Analyze. You'll get a ranked leaderboard in seconds.
            </div>
          </div>
        )}

      </main>

      {/* Candidate detail drawer */}
      <CandidateDrawer candidate={selected} onClose={() => setSelected(null)} />
    </div>
  )
}