import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Question = Database['public']['Tables']['interview_questions']['Row']

export function useInterviewQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('interview_questions')
      .select('*')
      .order('position')
      .then(({ data }) => {
        setQuestions(data ?? [])
        setLoading(false)
      })
  }, [])

  return { questions, loading }
}
