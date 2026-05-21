import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useQueryState, parseAsString } from 'nuqs'
import { Header } from './Header'
import { TabNav } from './TabNav'
import { AddCandidateDrawer } from '@/components/candidates/AddCandidateDrawer'
import { ProfileDrawer } from '@/components/profile/ProfileDrawer'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { useJobs } from '@/hooks/useJobs'
import { exportToExcel, exportDecisionReport } from '@/lib/exports'

export function Layout() {
  const [jobSlug] = useQueryState('job', parseAsString)
  const { data } = useCandidates()
  const { stateMap } = useCandidateState()
  const { data: jobs = [] } = useJobs()
  const round = jobs.find((j) => j.slug === jobSlug) ?? null
  const [addOpen, setAddOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="layout-bg relative min-h-screen bg-bg">
      <Header
        onAddCandidate={() => setAddOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onExportReport={() => exportDecisionReport(data, stateMap, round ?? null)}
        onExportExcel={() => exportToExcel(data, stateMap, round ?? null)}
        onPrint={() => window.print()}
      />
      <AddCandidateDrawer open={addOpen} onClose={() => setAddOpen(false)} />
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
      <TabNav />
      <main className="max-w-[1480px] mx-auto px-6 py-7">
        <Outlet />
      </main>
    </div>
  )
}
