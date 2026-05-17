import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface TeamProfile {
  id: string
  first_name: string | null
  last_name: string | null
  title: string | null
  avatar_url: string | null
}

export function displayName(profile: TeamProfile | undefined, fallback: string): string {
  if (!profile) return fallback
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  return name || fallback
}

export function useTeamProfiles(): Record<string, TeamProfile> {
  const { data = [] } = useQuery({
    queryKey: ['team-profiles'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('profiles')
        .select('id, first_name, last_name, title, avatar_url')
      return (data ?? []) as TeamProfile[]
    },
    staleTime: 5 * 60 * 1000,
  })

  return Object.fromEntries(data.map((p) => [p.id, p]))
}
