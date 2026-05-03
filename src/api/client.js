const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

// ── Safely extract a readable message from any error response ──
function parseError(err, fallback) {
  if (!err) return fallback
  // FastAPI validation errors return detail as an array of objects
  if (Array.isArray(err.detail)) {
    return err.detail.map(e => e.msg || JSON.stringify(e)).join(', ')
  }
  // Normal string detail
  if (typeof err.detail === 'string') return err.detail
  // Fallback to stringifying whatever we got
  if (typeof err === 'string') return err
  return fallback
}

export async function uploadResumes(files) {
  const form = new FormData()
  files.forEach(f => form.append('files', f))

  const res = await fetch(`${BASE}/upload/batch`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(parseError(err, `Upload failed (${res.status})`))
  }
  return res.json()
}

export async function scoreResumes(resumes, jobDescription) {
  const body = {
    job_description: jobDescription,
    resumes: resumes.map(r => ({
      candidate_name: r.filename.replace(/\.(pdf|docx)$/i, ''),
      resume_text: r.extracted_text,
    })),
  }

  const res = await fetch(`${BASE}/score/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(parseError(err, `Scoring failed (${res.status})`))
  }
  return res.json()
}

export function exportToCSV(candidates) {
  const headers = [
    'Rank', 'Candidate', 'Overall Score', 'Skills Match',
    'Experience (yrs)', 'Education Fit', 'Red Flags', 'Strengths', 'Summary'
  ]
  const rows = candidates.map((c, i) => [
    i + 1,
    c.candidate_name || 'Unknown',
    c.overall_score,
    c.skills_match,
    c.experience_years,
    c.education_fit,
    (c.red_flags || []).join(' | '),
    (c.strengths || []).join(' | '),
    c.summary || '',
  ])
  const escape = val => `"${String(val).replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `candidates_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}