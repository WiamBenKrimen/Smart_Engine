import { Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';
import LandingPage from '../features/landing/pages/LandingPage';
import LoginPage from '../features/auth/pages/LoginPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import WorkspaceSelectorPage from '../features/workspaces/pages/WorkspaceSelectorPage';
import AdminLayout from '../layouts/AdminLayout';
import MainLayout from '../layouts/MainLayout';
import AdminDashboardPage from '../features/dashboards/pages/AdminDashboardPage';
import UserDashboardPage from '../features/dashboards/pages/UserDashboardPage';
import UserListPage from '../features/users/pages/UserListPage';
import ProfilePage from '../features/users/pages/ProfilePage';
import WorkspaceListPage from '../features/workspaces/pages/WorkspaceListPage';
import WorkspacePage from '../features/workspaces/pages/WorkspacePage';
import FormBuilderPage from '../features/form-builder/pages/FormBuilderPage';
import WorkflowDesignerPage from '../features/workflow-designer/pages/WorkflowDesignerPage';
import ProcessListPage from '../features/processes/pages/ProcessListPage';
import ProcessFormPage from '../features/processes/pages/ProcessFormPage';
import AuditLogPage from '../features/audit/pages/AuditLogPage';
import RequestCreatePage from '../features/requests/pages/RequestCreatePage';
import RequestListPage from '../features/requests/pages/RequestListPage';
import RequestDetailsPage from '../features/requests/pages/RequestDetailsPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/workspace-select" element={<WorkspaceSelectorPage />} />
        <Route path="/workspaces/:id" element={<WorkspacePage />} />

        <Route path="/employee" element={<MainLayout />}>
          <Route index element={<UserDashboardPage />} />
          <Route path="new-request" element={<RequestCreatePage />} />
          <Route path="requests" element={<RequestListPage />} />
          <Route path="requests/:id" element={<RequestDetailsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<UserListPage />} />
          <Route path="workspaces" element={<WorkspaceListPage />} />
          <Route path="form-builder" element={<FormBuilderPage />} />
          <Route path="workflow-designer" element={<WorkflowDesignerPage />} />
          <Route path="processes" element={<ProcessListPage />} />
          <Route path="process-creator" element={<ProcessFormPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
