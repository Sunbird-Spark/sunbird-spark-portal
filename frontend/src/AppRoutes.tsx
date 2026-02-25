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

const AdminProtected = withRoles(['admin'])(AdminPage);
const WorkspaceProtected = withRoles(['content_creator', 'content_reviewer'])(WorkspacePage);
const ReportsProtected = withRoles(['admin'])(ReportsPage);
const CreateContentProtected = withRoles(['content_creator'])(CreateContentPage);
const ContentEditorProtected = withRoles(['content_creator'])(ContentEditorPage);
const GenericEditorProtected = withRoles(['content_creator'])(GenericEditorPage);

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
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/help-support" element={<HelpSupport />} />
        <Route path="/help-support/:categoryId" element={<HelpCategoryDetail />} />
        <Route path="/content/:contentId" element={<ContentPlayerPage />} />
        <Route path="/explore" element={<Explore />} />
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

        {/* Protected routes */}
        <Route path="/admin" element={<AdminProtected />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/workspace/review/:contentId" element={<ContentReviewPage />} />
        <Route path="/reports" element={<ReportsProtected />} />
        <Route path="/create" element={<CreateContentPage />} />
        <Route path="/edit/content-editor/:contentId" element={<ContentEditorPage />} />
        <Route path="/my-learning" element={<MyLearning />} />
        <Route path="/edit/collection-editor/:contentId" element={<CollectionEditorPage />} />
        <Route path="/edit/quml-editor/:contentId" element={<QumlEditorPage />} />

        {/* Generic Editor routes */}
        <Route path="/workspace/content/edit/generic" element={<GenericEditorPage />} />
        <Route path="/workspace/content/edit/generic/:contentId/:state/:framework/:contentStatus" element={<GenericEditorPage />} />
        <Route path="/workspace/content/edit/generic/:contentId/:state/:framework" element={<GenericEditorPage />} />
        <Route path="/workspace/content/edit/editorforlargecontent" element={<GenericEditorPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;
