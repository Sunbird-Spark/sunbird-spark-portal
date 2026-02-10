import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { withRoles } from './rbac/withRoles';

import Home from './pages/home/Home';
import Profile from './pages/profile/Profile';
import UnauthorizedPage from './pages/unauthorized/UnauthorizedPage';
import AdminPage from './pages/admin/AdminPage';
import WorkspacePage from './pages/workspace/WorkspacePage';
import ReportsPage from './pages/reports/ReportsPage';
import CreateContentPage from './pages/content/CreateContentPage';
import Index from './pages/Index';

import ForgotPassword from './pages/ForgotPassword';
import PasswordResetSuccess from './pages/PasswordResetSuccess';
import SignUp from './pages/SignUp';
import CollectionDetail from './pages/CollectionDetail';

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
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password-reset-success" element={<PasswordResetSuccess />} />
        <Route path="/collection/:collectionId" element={<CollectionDetail />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />

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
