import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentProjectsPage from '../student/StudentProjectsPage';
import SupervisorDashboard from '../supervisor/SupervisorDashboard';
import CoordinatorDashboard from '../coordinator/CoordinatorDashboard';
import AdminDashboard from '../admin/AdminDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'STUDENT':
      return <StudentProjectsPage />;
    case 'SUPERVISOR':
      return <SupervisorDashboard />;
    case 'COORDINATOR':
      return <CoordinatorDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <StudentProjectsPage />;
  }
}
