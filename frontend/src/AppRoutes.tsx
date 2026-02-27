import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './rbac/ProtectedRoute';

import Home from './pages/home/Home';
import Profile from './pages/profile/Profile';
import AdminPage from './pages/admin/AdminPage';
import WorkspacePage from './pages/workspace/WorkspacePage';
import ReportsPage from './pages/reports/ReportsPage';
import CreateContentPage from './pages/content/CreateContentPage';
import CollectionDetailPage from './pages/collection/CollectionDetailPage';
import Index from './pages/Index';
import ForgotPassword from './pages/forgotPassword/ForgotPassword';
import PasswordResetSuccess from './pages/forgotPassword/PasswordResetSuccess';
import SignUp from './pages/signup/SignUp';
import HelpSupport from './pages/helpSupport/HelpSupport';
import HelpCategoryDetail from './pages/helpSupport/HelpCategoryDetail';
import ContentPlayerPage from './pages/content/ContentPlayerPage';
import ContentEditorPage from './pages/content/ContentEditorPage';
import CollectionEditorPage from './pages/content/CollectionEditorPage';
import Explore from './pages/Explore';
import MyLearning from './pages/myLearning/MyLearning';
import GenericEditorPage from './pages/workspace/editors/GenericEditorPage';
import QumlEditorPage from './pages/content/QumlEditorPage';
import ContentReviewPage from './pages/workspace/ContentReviewPage';
import Onboarding from './pages/onboarding/OnboardingPage';
import CourseDashboardPage from './pages/courseDashboard/CourseDashboardPage';
import UserManagementPage from './pages/user-management/UserManagementPage';
import PlatformReports from './pages/reports/PlatformReports';
import CourseReport from './pages/reports/CourseReport';
import UserReport from './pages/reports/UserReport';


const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/home" element={<Home />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password-reset-success" element={<PasswordResetSuccess />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/help-support" element={<HelpSupport />} />
        <Route path="/help-support/:categoryId" element={<HelpCategoryDetail />} />
        <Route path="/content/:contentId" element={<ContentPlayerPage />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/my-learning" element={<MyLearning />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="collection">
          <Route path=":collectionId" element={<CollectionDetailPage />}>
            <Route path="content/:contentId" element={null} />
          </Route>
          <Route path=":collectionId/batch/:batchId" element={<CollectionDetailPage />}>
            <Route path="content/:contentId" element={null} />
          </Route>
          <Route path=":collectionId/dashboard/:tab" element={<CourseDashboardPage />} />
        </Route>

        {/* Public admin routes */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        {/* Protected routes */}
        <Route path="/user-management" element={<UserManagementPage />} />
        <Route path="/workspace" element={
          <ProtectedRoute allowedRoles={['CONTENT_CREATOR', 'CONTENT_REVIEWER', 'BOOK_CREATOR', 'BOOK_REVIEWER']}>
            <WorkspacePage />
          </ProtectedRoute>
        } />
        <Route path="/workspace/review/:contentId" element={
          <ProtectedRoute allowedRoles={['CONTENT_REVIEWER']}>
            <ContentReviewPage />
          </ProtectedRoute>
        } />
        <Route path="/reports/platform" element={<PlatformReports />} />
        <Route path="/reports/course/:courseId" element={<CourseReport />} />
        <Route path="/reports/user/:userId" element={<UserReport />} />
        <Route path="/create" element={
          <ProtectedRoute allowedRoles={['CONTENT_CREATOR']}>
            <CreateContentPage />
          </ProtectedRoute>
        } />
        <Route path="/edit/content-editor/:contentId" element={
          <ProtectedRoute allowedRoles={['CONTENT_CREATOR']}>
            <ContentEditorPage />
          </ProtectedRoute>
        } />
        <Route path="/edit/collection-editor/:contentId" element={
          <ProtectedRoute allowedRoles={['CONTENT_CREATOR','CONTENT_REVIEWER']}>
            <CollectionEditorPage />
          </ProtectedRoute>
        } />
        <Route path="/edit/quml-editor/:contentId" element={
          <ProtectedRoute allowedRoles={['CONTENT_CREATOR','CONTENT_REVIEWER']}>
            <QumlEditorPage />
          </ProtectedRoute>
        } />

        {/* Generic Editor routes */}
        <Route path="/workspace/content/edit/generic" element={
          <ProtectedRoute allowedRoles={['CONTENT_CREATOR']}>
            <GenericEditorPage />
          </ProtectedRoute>
        } />
        <Route path="/workspace/content/edit/generic/:contentId/:state/:framework/:contentStatus" element={
          <ProtectedRoute allowedRoles={['CONTENT_CREATOR']}>
            <GenericEditorPage />
          </ProtectedRoute>
        } />
        <Route path="/workspace/content/edit/generic/:contentId/:state/:framework" element={
          <ProtectedRoute allowedRoles={['CONTENT_CREATOR']}>
            <GenericEditorPage />
          </ProtectedRoute>
        } />
        <Route path="/workspace/content/edit/editorforlargecontent" element={
          <ProtectedRoute allowedRoles={['CONTENT_CREATOR']}>
            <GenericEditorPage />
          </ProtectedRoute>
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;
