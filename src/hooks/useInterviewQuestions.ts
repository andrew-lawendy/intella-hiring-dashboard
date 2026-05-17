import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Question = Database['public']['Tables']['interview_questions']['Row']

export function useInterviewQuestions() {
  const { data: questions = [], isLoading: loading } = useQuery({
    queryKey: ['interview-questions'],
    queryFn: async () => {
      const { data } = await supabase.from('interview_questions').select('*').order('position')
      return (data ?? []) as Question[]
    },
  })

  return { questions, loading }
}
