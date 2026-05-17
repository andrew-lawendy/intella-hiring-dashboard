import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CreateCandidateInput {
  name: string
  email: string
  interviewType: 'Remote' | 'In-person'
  salary: string
  notice: string
  slotDate: string
  slotTime: string
  title: string
  company: string
  summary: string
  strengths: string[]
  watchFor: string
  fitScore: number
  aiScore: number
  fintechScore: number
  b2bScore: number
  seniorityScore: number
  university: string
  degree: string
  gradYear: string
  masters: boolean
  totalExp: string
  pmExp: string
  domains: string[]
  hasAI: boolean
  hasB2B: boolean
  hasB2C: boolean
  hasFintech: boolean
  notable: string
}

function fitLabel(score: number): string {
  if (score >= 80) return 'Strong Yes'
  if (score >= 65) return 'Yes'
  if (score >= 50) return 'Maybe'
  return 'No'
}

function fitColor(score: number): string {
  if (score >= 80) return 'var(--green)'
  if (score >= 65) return 'var(--color-green-500)'
  if (score >= 50) return 'var(--amber)'
  return 'var(--red)'
}

function getDayName(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date(dateStr).getDay()] ?? ''
}

export function useCreateCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCandidateInput) => {
      const id = crypto.randomUUID()
      const slot = data.slotDate && data.slotTime ? `${data.slotDate}T${data.slotTime}` : null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pg = supabase as any
      const { error: e1 } = await pg.from('candidates').insert({
        id,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        type: data.interviewType,
        salary: data.salary.trim() || null,
        notice: data.notice.trim() || null,
        slot,
        day: data.slotDate ? getDayName(data.slotDate) : null,
        time: data.slotTime || null,
      })
      if (e1) throw new Error(e1.message)

      const { error: e2 } = await pg.from('candidate_profiles').insert({
        candidate_id: id,
        title: data.title.trim() || null,
        company: data.company.trim() || null,
        summary: data.summary.trim() || null,
        strengths: data.strengths.length ? data.strengths : null,
        weaknesses: null,
        fit_score: data.fitScore,
        fit_label: fitLabel(data.fitScore),
        fit_color: fitColor(data.fitScore),
        ai_score: data.aiScore,
        fintech_score: data.fintechScore,
        b2b_score: data.b2bScore,
        seniority_score: data.seniorityScore,
        watch_for: data.watchFor.trim() || null,
        custom_questions: null,
        career: [],
      })
      if (e2) throw new Error(e2.message)

      const { error: e3 } = await pg.from('candidate_analysis').insert({
        candidate_id: id,
        university: data.university.trim() || null,
        degree: data.degree.trim() || null,
        grad_year: data.gradYear ? parseInt(data.gradYear) : null,
        masters: data.masters ? 'true' : null,
        total_exp: data.totalExp ? parseFloat(data.totalExp) : null,
        pm_exp: data.pmExp ? parseFloat(data.pmExp) : null,
        current_role: data.title.trim() || null,
        current_company: data.company.trim() || null,
        domains: data.domains.length ? data.domains : null,
        ai_exp: data.hasAI,
        b2b: data.hasB2B,
        b2c: data.hasB2C,
        fintech: data.hasFintech,
        notable: data.notable.trim() || null,
      })
      if (e3) throw new Error(e3.message)

      const { error: e4 } = await pg.from('interview_state').insert({
        candidate_id: id,
        confirmed: false,
        shortlisted: null,
        interview_status: 'pending',
        verdict: null,
        peter_scores: {
          Communication: 0,
          Technical: 0,
          'Culture Fit': 0,
          Leadership: 0,
          Overall: 0,
        },
        ossama_scores: {
          Communication: 0,
          Technical: 0,
          'Culture Fit': 0,
          Leadership: 0,
          Overall: 0,
        },
        peter_comment: '',
        ossama_comment: '',
        checklist: {
          'CV reviewed': false,
          'LinkedIn checked': false,
          'Questions prepared': false,
          'Salary discussed': false,
          'Notice period confirmed': false,
        },
        photo_url: null,
      })
      if (e4) throw new Error(e4.message)

      return { id, name: data.name.trim() }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate-meta'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-stats'] })
    },
  })
}
