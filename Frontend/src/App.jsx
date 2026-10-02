import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LoginPage from './pages/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';
import DashboardRouter from './pages/common/DashboardRouter';
import NewProjectPage from './pages/student/NewProjectPage';
import ProjectDetailsPage from './pages/common/ProjectDetailsPage';
import SearchFilterPage from './pages/common/SearchFilterPage';
import AnalyticsDashboard from './pages/common/AnalyticsDashboard';
import ReportsPage from './pages/common/ReportsPage';
import AdminConsole from './pages/admin/AdminConsole';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-semibold text-slate-500">Authenticating session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-semibold text-slate-500">Loading KLU Academic System...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRouter />} />
        <Route path="projects" element={<SearchFilterPage />} />
        <Route path="projects/new" element={<NewProjectPage />} />
        <Route path="projects/:id" element={<ProjectDetailsPage />} />
        <Route path="drafts" element={<SearchFilterPage />} />
        <Route path="pending-reviews" element={<DashboardRouter />} />
        <Route path="pending-evaluation" element={<DashboardRouter />} />
        <Route path="approved-projects" element={<SearchFilterPage />} />
        <Route path="rejected-projects" element={<SearchFilterPage />} />
        <Route path="review-history" element={<SearchFilterPage />} />
        <Route path="notifications" element={<DashboardRouter />} />

        {/* Reports & Analytics */}
        <Route path="reports" element={<ReportsPage />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />

        {/* Admin Routes */}
        <Route path="admin/users" element={<AdminConsole />} />
        <Route path="admin/assignments" element={<AdminConsole />} />
        <Route path="admin/repository" element={<AdminConsole />} />
        <Route path="admin/settings" element={<AdminConsole />} />
        <Route path="admin/audit-logs" element={<AdminConsole />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
