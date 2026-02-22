import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import axios from 'axios';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OptionsPage } from './pages/OptionsPage';
import { AccountsPage } from './pages/AccountsPage';
import { PnLPage } from './pages/PnLPage';
import { NextStepsPage } from './pages/NextStepsPage';
import { LoadingScreen } from './components/ui/Spinner';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { setAuth, logout } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Attempt silent token refresh using the httpOnly refresh cookie
    axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const { token, user } = res.data as {
          token: string;
          user: { id: number; username: string; created_at: string };
        };
        setAuth(user, token);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setInitializing(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initializing) return <LoadingScreen />;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthGate>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="options" element={<OptionsPage />} />
              <Route path="pnl" element={<PnLPage />} />
              <Route path="next-steps" element={<NextStepsPage />} />
              <Route path="accounts" element={<AccountsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthGate>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
