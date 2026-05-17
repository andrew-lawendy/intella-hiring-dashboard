import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { TabNav } from './TabNav'
import { AlertBanners } from './AlertBanners'
import { AddCandidateDrawer } from '@/components/candidates/AddCandidateDrawer'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { exportToExcel, exportDecisionReport } from '@/lib/exports'

export function Layout() {
  const { data } = useCandidates()
  const { stateMap } = useCandidateState()
  const [addOpen, setAddOpen] = useState(false)

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
        onExportReport={() => exportDecisionReport(data, stateMap)}
        onExportExcel={() => exportToExcel(data, stateMap)}
        onPrint={() => window.print()}
      />
      <AddCandidateDrawer open={addOpen} onClose={() => setAddOpen(false)} />
      <TabNav />
      <AlertBanners />
      <main className="max-w-[1480px] mx-auto px-6 py-7">
        <Outlet />
      </main>
    </div>
  )
}
