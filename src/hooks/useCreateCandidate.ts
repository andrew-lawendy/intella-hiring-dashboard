import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fitLabelFromScore } from '@/lib/scoring'

export interface CreateCandidateInput {
  name: string
  email: string
  interviewType: 'Remote' | 'In-person'
  salaryAmount: string
  salaryCurrency: 'EGP' | 'USD'
  salaryPeriod: 'month' | 'year'
  notice: string
  interviewAt: Date | null
  seniority: string
  jobId: number | null
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

export function useCreateCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCandidateInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pg = supabase as any
      const { data: inserted, error: e1 } = await pg
        .from('candidates')
        .insert({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          type: data.interviewType,
          salary_amount: data.salaryAmount
            ? parseInt(data.salaryAmount.replace(/\D/g, '')) || null
            : null,
          salary_currency:
            data.salaryAmount && data.salaryAmount.replace(/\D/g, '') ? data.salaryCurrency : null,
          salary_period:
            data.salaryAmount && data.salaryAmount.replace(/\D/g, '') ? data.salaryPeriod : null,
          notice: data.notice.trim() || null,
          seniority: data.seniority || null,
          interview_at: data.interviewAt?.toISOString() ?? null,
          job_id: data.jobId ?? null,
        })
        .select('id')
      if (e1 || !inserted?.[0]?.id) throw new Error(e1?.message ?? 'Failed to create candidate')
      const id: string = inserted[0].id

      const { error: e2 } = await pg.from('candidate_profiles').insert({
        candidate_id: id,
        title: data.title.trim() || null,
        company: data.company.trim() || null,
        summary: data.summary.trim() || null,
        strengths: data.strengths.length ? data.strengths : null,
        weaknesses: null,
        fit_score: data.fitScore,
        fit_label: fitLabelFromScore(data.fitScore),
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
        total_exp: data.totalExp ? Math.round(parseFloat(data.totalExp)) : null,
        pm_exp: data.pmExp ? Math.round(parseFloat(data.pmExp)) : null,
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
        checklist: {
          'CV reviewed': false,
          'LinkedIn checked': false,
          'Questions prepared': false,
          'Salary discussed': false,
          'Notice period confirmed': false,
        },
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
