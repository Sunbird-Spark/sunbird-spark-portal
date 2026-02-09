import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { withRoles } from './rbac/withRoles';

import HomePage from './pages/HomePage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminPage from './pages/AdminPage';
import WorkspacePage from './pages/WorkspacePage';
import ReportsPage from './pages/ReportsPage';
import CreateContentPage from './pages/CreateContentPage';
import Index from './pages/Index';
import ForgotPassword from './pages/ForgotPassword';
import PasswordResetSuccess from './pages/PasswordResetSuccess';
import CollectionDetail from './pages/CollectionDetail';
import SignUp from './pages/SignUp';

const AdminProtected = withRoles(['admin'])(AdminPage);
const WorkspaceProtected = withRoles(['content_creator', 'content_reviewer'])(WorkspacePage);
const ReportsProtected = withRoles(['admin'])(ReportsPage);
const CreateContentProtected = withRoles(['content_creator'])(CreateContentPage);

const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password-reset-success" element={<PasswordResetSuccess />} />

        {/* Protected routes */}
        <Route path="/admin" element={<AdminProtected />} />
        <Route path="/workspace" element={<WorkspaceProtected />} />
        <Route path="/reports" element={<ReportsProtected />} />
        <Route path="/create" element={<CreateContentProtected />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;
