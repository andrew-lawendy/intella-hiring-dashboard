import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../src/lib/database.types'
import { candidatesData, initialConfirmed } from './data/candidates'
import { profilesData } from './data/profiles'
import { analysisData } from './data/analysis'
import { questionsData } from './data/questions'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('Seeding candidates...')
  const { error: candidateError } = await supabase
    .from('candidates')
    .upsert(candidatesData, { onConflict: 'id' })
  if (candidateError) throw candidateError

  console.log('Seeding candidate profiles...')
  const { error: profileError } = await supabase
    .from('candidate_profiles')
    .upsert(profilesData, { onConflict: 'candidate_id' })
  if (profileError) throw profileError

  console.log('Seeding candidate analysis...')
  const analysisRows = analysisData.map(({ id, ...rest }) => ({
    candidate_id: id,
    ...rest,
  }))
  const { error: analysisError } = await supabase
    .from('candidate_analysis')
    .upsert(analysisRows, { onConflict: 'candidate_id' })
  if (analysisError) throw analysisError

  console.log('Seeding interview state...')
  const stateRows = candidatesData.map((c) => ({
    candidate_id: c.id,
    confirmed: initialConfirmed[c.id] ?? false,
    shortlisted: null,
    interview_status: 'pending' as const,
    verdict: null,
    checklist: {
      'CV reviewed': false,
      'LinkedIn checked': false,
      'Questions prepared': false,
      'Salary discussed': false,
      'Notice period confirmed': false,
    },
    photo_url: null,
  }))
  const { error: stateError } = await supabase
    .from('interview_state')
    .upsert(stateRows, { onConflict: 'candidate_id' })
  if (stateError) throw stateError

  console.log('Seeding interview questions...')
  const { error: questionsError } = await supabase.from('interview_questions').upsert(
    questionsData.map((q, i) => ({ ...q, id: i + 1 })),
    { onConflict: 'id' },
  )
  if (questionsError) throw questionsError

  console.log('Seed complete.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
