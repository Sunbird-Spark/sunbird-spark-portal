import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { withRoles } from './rbac/withRoles';

import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminPage from './pages/AdminPage';
import WorkspacePage from './pages/WorkspacePage';
import ReportsPage from './pages/ReportsPage';
import CreateContentPage from './pages/CreateContentPage';

const AdminProtected = withRoles(['admin'])(AdminPage);
const WorkspaceProtected = withRoles(['content_creator', 'content_reviewer'])(WorkspacePage);
const ReportsProtected = withRoles(['content_reviewer'])(ReportsPage);
const CreateContentProtected = withRoles(['content_creator'])(CreateContentPage);

const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected routes */}
        <Route path="/admin" element={<AdminProtected />} />
        <Route path="/workspace" element={<WorkspaceProtected />} />
        <Route path="/reports" element={<ReportsProtected />} />
        <Route path="/create" element={<CreateContentProtected />} />

        {/* Redirect root to workspace */}
        <Route path="/" element={<Navigate to="/workspace" replace />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;
