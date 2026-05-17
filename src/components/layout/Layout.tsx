import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { TabNav } from './TabNav'
import { AlertBanners } from './AlertBanners'
import { AddCandidateDrawer } from '@/components/candidates/AddCandidateDrawer'
import { ProfileDrawer } from '@/components/profile/ProfileDrawer'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { useHiringRound } from '@/hooks/useHiringRound'
import { exportToExcel, exportDecisionReport } from '@/lib/exports'

export function Layout() {
  const { data } = useCandidates()
  const { stateMap } = useCandidateState()
  const { data: round } = useHiringRound()
  const [addOpen, setAddOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div
      className="relative min-h-screen bg-bg"
      style={{
        backgroundImage: 'url("/assets/images/illustrations/background-image.svg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
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
      <AlertBanners />
      <main className="max-w-[1480px] mx-auto px-6 py-7">
        <Outlet />
      </main>
    </div>
  )
}
