import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { ScanPage } from './pages/ScanPage';
import { EndpointsPage } from './pages/EndpointsPage';
import { EndpointDetailPage } from './pages/EndpointDetailPage';
import { LoadTestConfigPage } from './pages/LoadTestConfigPage';
import { LiveLoadTestPage } from './pages/LiveLoadTestPage';
import { ReportPage } from './pages/ReportPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Main Authenticated Platform Shell */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailsPage />} />
                <Route path="/projects/:id/scan" element={<ScanPage />} />
                <Route path="/projects/:id/endpoints" element={<EndpointsPage />} />
                <Route path="/projects/:id/endpoints/:endpointId" element={<EndpointDetailPage />} />
                <Route path="/projects/:id/load-test" element={<LoadTestConfigPage />} />
                <Route path="/load-tests/:id" element={<LiveLoadTestPage />} />
                <Route path="/load-tests/:id/report" element={<ReportPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
