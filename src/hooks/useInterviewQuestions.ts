import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Question = Database['public']['Tables']['interview_questions']['Row']

export function useInterviewQuestions(jobId?: number) {
  const { data: questions = [], isLoading: loading } = useQuery({
    queryKey: ['interview-questions', jobId],
    queryFn: async () => {
      if (jobId !== undefined) {
        const { data } = await supabase
          .from('interview_questions')
          .select('*')
          .or(`job_id.eq.${jobId},is_general.eq.true`)
          .order('position')
        return (data ?? []) as Question[]
      }
      const { data } = await supabase.from('interview_questions').select('*').order('position')
      return (data ?? []) as Question[]
    },
  })

  return { questions, loading }
}
