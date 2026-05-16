import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { TabNav } from './TabNav'
import { AlertBanners } from './AlertBanners'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { exportToExcel, exportDecisionReport } from '@/lib/exports'

export function Layout() {
  const { data } = useCandidates()
  const { stateMap } = useCandidateState()

  return (
    <div className="min-h-screen bg-bg">
      <Header
        onExportReport={() => exportDecisionReport(data, stateMap)}
        onExportExcel={() => exportToExcel(data, stateMap)}
        onPrint={() => window.print()}
      />
      <TabNav />
      <AlertBanners />
      <main className="max-w-[1480px] mx-auto px-6 py-7">
        <Outlet />
      </main>
    </div>
  )
}
