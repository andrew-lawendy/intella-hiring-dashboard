import * as XLSX from 'xlsx'
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { StateMap } from '@/hooks/useCandidateState'
import type { HiringRound } from '@/hooks/useHiringRound'
import { VERDICT_MAP } from './verdicts'
import { formatRoundDateRange, formatRoundYear } from '@/hooks/useHiringRound'
import { totalScore, maxScore } from './scoring'
import type { Scores } from './scoring'

function roundLabel(round: HiringRound | null): string {
  if (!round) return 'Hiring Round'
  return `${round.role_short} · ${formatRoundDateRange(round.start_date, round.end_date)}, ${formatRoundYear(round.start_date)}`
}

function roundFilename(round: HiringRound | null): string {
  if (!round) return 'intella-hiring.xlsx'
  const year = formatRoundYear(round.start_date)
  const month = new Date(round.start_date)
    .toLocaleDateString('en-US', { month: 'long' })
    .toLowerCase()
  return `intella-hiring-${month}-${year}.xlsx`
}

export function exportToExcel(
  candidates: CandidateWithDetails[],
  stateMap: StateMap,
  round: HiringRound | null = null,
  scorerNames: { a: string; b: string } = { a: 'Scorer A', b: 'Scorer B' },
): void {
  const max = maxScore()
  const rows = candidates.map(({ candidate, profile, analysis }) => {
    const state = stateMap[candidate.id]
    const score = state
      ? totalScore(state.peter_scores as Scores, state.ossama_scores as Scores)
      : 0
    return {
      Name: candidate.name,
      Email: candidate.email,
      Slot: candidate.slot,
      Type: candidate.type,
      Salary: candidate.salary,
      Notice: candidate.notice,
      'Current Role': analysis?.current_role ?? '',
      'Current Company': analysis?.current_company ?? '',
      'Total Exp (yrs)': analysis?.total_exp ?? '',
      'PM Exp (yrs)': analysis?.pm_exp ?? '',
      'AI Experience': analysis?.ai_exp ? 'Yes' : 'No',
      'Fit Score': profile?.fit_score ?? '',
      'Fit Label': profile?.fit_label ?? '',
      'Combined Score': `${score}/${max}`,
      [`${scorerNames.a} Score`]: state
        ? Object.values(state.peter_scores as Scores).reduce((a, b) => a + b, 0)
        : '',
      [`${scorerNames.b} Score`]: state
        ? Object.values(state.ossama_scores as Scores).reduce((a, b) => a + b, 0)
        : '',
      Verdict: state?.verdict ?? '',
      Status: state?.interview_status ?? '',
      Confirmed: state?.confirmed ? 'Yes' : 'No',
      Shortlisted: state?.shortlisted === true ? 'Yes' : state?.shortlisted === false ? 'No' : '',
      [`${scorerNames.a} Notes`]: state?.peter_comment ?? '',
      [`${scorerNames.b} Notes`]: state?.ossama_comment ?? '',
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Candidates')
  XLSX.writeFile(wb, roundFilename(round))
}

export function exportDecisionReport(
  candidates: CandidateWithDetails[],
  stateMap: StateMap,
  round: HiringRound | null = null,
  scorerNames: { a: string; b: string } = { a: 'Scorer A', b: 'Scorer B' },
): void {
  const max = maxScore()
  const sorted = [...candidates].sort((a, b) => {
    const sa = stateMap[a.candidate.id]
    const sb = stateMap[b.candidate.id]
    const ta = sa ? totalScore(sa.peter_scores as Scores, sa.ossama_scores as Scores) : 0
    const tb = sb ? totalScore(sb.peter_scores as Scores, sb.ossama_scores as Scores) : 0
    return tb - ta
  })

  const verdictLabels = Object.fromEntries(
    Object.entries(VERDICT_MAP).map(([k, v]) => [k, v.short]),
  )

  const rows = sorted
    .map((d, i) => {
      const { candidate, profile, analysis } = d
      const state = stateMap[candidate.id]
      const score = state
        ? totalScore(state.peter_scores as Scores, state.ossama_scores as Scores)
        : 0
      return `<tr>
        <td>${i + 1}</td>
        <td><strong>${candidate.name}</strong><br/><small>${analysis?.current_role ?? ''} @ ${analysis?.current_company ?? ''}</small></td>
        <td>${candidate.salary ?? '—'}</td>
        <td>${candidate.notice ?? '—'}</td>
        <td>${profile?.fit_score ?? '—'}%</td>
        <td><strong>${score}/${max}</strong></td>
        <td style="color:${state?.verdict === 'strong-yes' ? 'green' : state?.verdict === 'no' ? 'red' : 'inherit'}">${verdictLabels[state?.verdict ?? ''] ?? '—'}</td>
        <td><small>${state?.peter_comment ? scorerNames.a + ': ' + state.peter_comment.slice(0, 60) : ''}${state?.ossama_comment ? '<br/>' + scorerNames.b + ': ' + state.ossama_comment.slice(0, 60) : ''}</small></td>
      </tr>`
    })
    .join('')

  const html = `<!DOCTYPE html><html><head><title>Intella Decision Report</title>
  <style>
    body{font-family:system-ui,sans-serif;font-size:12px;color:#111;margin:30px}
    h1{font-size:20px;margin:0 0 4px}p{color:#666;margin:0 0 16px}
    table{width:100%;border-collapse:collapse}
    th{background:#1a1816;color:#fff;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
    td{padding:8px 10px;border-bottom:1px solid #eee;vertical-align:top}
    tr:hover td{background:#f9f9f9}
    @media print{body{margin:10px}}
  </style></head><body>
  <h1>Intella Hiring Round — Decision Report</h1>
  <p>${roundLabel(round)} · Generated ${new Date().toLocaleDateString()}</p>
  <table><thead><tr><th>#</th><th>Candidate</th><th>Salary</th><th>Notice</th><th>Fit</th><th>Score</th><th>Verdict</th><th>Notes</th></tr></thead>
  <tbody>${rows}</tbody></table></body></html>`

  const w = window.open('', '_blank')
  if (w) {
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }
}

export function printBriefCard(data: CandidateWithDetails, state: StateMap[string]): void {
  const { candidate, profile, analysis } = data
  const strengths = (profile?.strengths ?? [])
    .slice(0, 3)
    .map((s) => `<div style="color:#166534;font-size:12px;margin-bottom:4px">✓ ${s}</div>`)
    .join('')
  const questions = (profile?.custom_questions ?? [])
    .map(
      (q, i) =>
        `<div style="background:#f0f4ff;border-left:3px solid #1e3a8a;padding:8px 10px;margin-bottom:6px;border-radius:0 4px 4px 0;font-size:12px;line-height:1.5"><strong>Q${i + 1}.</strong> ${q}</div>`,
    )
    .join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Brief: ${candidate.name}</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:700px;margin:30px auto;color:#111;font-size:13px}
    h2{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#666;margin:14px 0 5px;border-bottom:1px solid #eee;padding-bottom:3px}
    .meta{display:flex;gap:16px;flex-wrap:wrap;color:#555;font-size:12px;margin-bottom:14px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px}
    .box{background:#f8f8f8;border-radius:5px;padding:8px 10px}
    .lbl{font-size:9px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:2px}
    .val{font-size:12px;font-weight:500}
    @media print{body{margin:15px}}
  </style></head><body>
  <h1 style="font-size:18px;margin:0 0 4px">${candidate.name}</h1>
  <div class="meta">
    <span>📅 ${candidate.slot ?? 'TBD'}</span>
    <span>💰 ${candidate.salary ?? '—'}</span>
    <span>⏱ Notice: ${candidate.notice ?? '—'}</span>
    ${analysis ? `<span>🏢 ${analysis.current_role} @ ${analysis.current_company}</span>` : ''}
  </div>
  <div class="grid">
    <div class="box"><div class="lbl">University</div><div class="val">${analysis?.university ?? '—'}</div></div>
    <div class="box"><div class="lbl">Experience</div><div class="val">${analysis ? `${analysis.total_exp}y total, ${analysis.pm_exp}y PM` : '—'}</div></div>
    <div class="box"><div class="lbl">AI Exp</div><div class="val">${analysis?.ai_exp ? 'Yes' : 'No'}</div></div>
    <div class="box"><div class="lbl">Fit Score</div><div class="val">${profile ? `${profile.fit_label} (${profile.fit_score}%)` : '—'}</div></div>
  </div>
  ${strengths ? `<h2>Top Strengths</h2>${strengths}` : ''}
  ${profile?.watch_for ? `<h2>Watch For</h2><div style="font-size:12px;color:#92400e;background:#fffbeb;padding:8px 10px;border-radius:4px">${profile.watch_for}</div>` : ''}
  ${questions ? `<h2>Interview Questions</h2>${questions}` : ''}
  ${state ? `<h2>Current Status</h2><div style="font-size:12px">Status: ${state.interview_status ?? '—'} | Verdict: ${state.verdict ?? 'none'}</div>` : ''}
  </body></html>`

  const w = window.open('', '_blank')
  if (w) {
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }
}
