import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

type ConfigMap = Record<string, string>

export function useAppConfig() {
  return useQuery({
    queryKey: ['app-config'],
    queryFn: async (): Promise<ConfigMap> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pg = supabase as any
      const { data } = await pg.from('app_config').select('key, value')
      return Object.fromEntries(
        (data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]),
      )
    },
    staleTime: Infinity,
  })
}
