import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { LoginPage } from '../pages/LoginPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { TeacherLayout } from '../layouts/TeacherLayout';
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage';
import { TeachersPage } from '../pages/admin/TeachersPage';
import { GroupsPage } from '../pages/admin/GroupsPage';
import { PaymentsPage } from '../pages/admin/PaymentsPage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { TeacherOverviewPage } from '../pages/teacher/TeacherOverviewPage';
import { TeacherGroupsPage } from '../pages/teacher/TeacherGroupsPage';
import { TeacherPaymentsPage } from '../pages/teacher/TeacherPaymentsPage';
import { TeacherProfilePage } from '../pages/teacher/TeacherProfilePage';
import { getSession } from '../utils/session';

function RequireRole({ role, children }) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== role) {
    return <Navigate to={session.role === 'admin' ? '/admin' : '/teacher'} replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      {
        path: 'admin',
        element: (
          <RequireRole role="admin">
            <AdminLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <AdminOverviewPage /> },
          { path: 'teachers', element: <TeachersPage /> },
          { path: 'groups', element: <GroupsPage /> },
          { path: 'payments', element: <PaymentsPage /> },
          { path: 'settings', element: <SettingsPage /> }
        ]
      },
      {
        path: 'teacher',
        element: (
          <RequireRole role="teacher">
            <TeacherLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <TeacherOverviewPage /> },
          { path: 'groups', element: <TeacherGroupsPage /> },
          { path: 'payments', element: <TeacherPaymentsPage /> },
          { path: 'profile', element: <TeacherProfilePage /> }
        ]
      },
      { path: '*', element: <Navigate to="/login" replace /> }
    ]
  }
]);
