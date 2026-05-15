import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { TabNav } from './TabNav'
import { AlertBanners } from './AlertBanners'

export function Layout() {
  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <TabNav />
      <AlertBanners />
      <main className="max-w-[1480px] mx-auto px-6 py-7">
        <Outlet />
      </main>
    </div>
  )
}
