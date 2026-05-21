import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { AuthCallback } from '@/components/auth/AuthCallback'
import { LoginPage } from '@/components/auth/LoginPage'
import { Layout } from '@/components/layout/Layout'
import { CardsPage } from '@/pages/CardsPage'
import { SchedulePage } from '@/pages/SchedulePage'
import { ComparePage } from '@/pages/ComparePage'
import { SalaryPage } from '@/pages/SalaryPage'
import { BriefingPage } from '@/pages/BriefingPage'
import { AnalysisPage } from '@/pages/AnalysisPage'
import { ChatPage } from '@/pages/ChatPage'
import { InterviewPage } from '@/pages/InterviewPage'

function LoginPageWithError() {
  const [params] = useSearchParams()
  const error =
    params.get('error') === 'unauthorized'
      ? 'Only @intellaworld.com accounts can access this dashboard.'
      : undefined
  return <LoginPage error={error} />
}

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NuqsAdapter>
          <Routes>
            <Route path="/login" element={<LoginPageWithError />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Layout />
                </AuthGuard>
              }
            >
              <Route index element={<Navigate to="/cards" replace />} />
              <Route path="cards" element={<CardsPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="compare" element={<ComparePage />} />
              <Route path="salary" element={<SalaryPage />} />
              <Route path="briefing" element={<BriefingPage />} />
              <Route path="analysis" element={<AnalysisPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="interview/:candidateId" element={<InterviewPage />} />
            </Route>
          </Routes>
        </NuqsAdapter>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
