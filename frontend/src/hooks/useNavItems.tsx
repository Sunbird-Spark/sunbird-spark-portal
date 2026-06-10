import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiPieChart, FiLogOut } from 'react-icons/fi';
import HomeSidebarIcons from '@/components/home/HomeSidebarIcons';
import { usePermissions } from '@/hooks/usePermission';
import { useAppI18n } from '@/hooks/useAppI18n';
import { clearForceSyncUsed } from '@/services/forceSyncStorage';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  isLogout?: boolean;
}

export function useNavItems() {
  const { hasAnyRole, canAccessFeature } = usePermissions();
  const { t } = useAppI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = hasAnyRole(['ORG_ADMIN']);

  const items: NavItem[] = [
    { id: 'home',        label: t('sidebar.home'),           path: '/home',            icon: <HomeSidebarIcons.Home /> },
    { id: 'learning',    label: t('sidebar.myLearning'),     path: '/my-learning',     icon: <HomeSidebarIcons.Learning /> },
    { id: 'explore',     label: t('sidebar.explore'),        path: '/explore',         icon: <HomeSidebarIcons.Explore /> },
    ...(canAccessFeature('view_workspace')
      ? [{ id: 'workspace', label: t('sidebar.workspace'), path: '/workspace', icon: <HomeSidebarIcons.Workspace /> }]
      : []),
    { id: 'profile',     label: t('sidebar.profile'),        path: '/profile',         icon: <HomeSidebarIcons.Profile /> },
    { id: 'user-report', label: t('sidebar.userReport'),     path: '/reports/user/me', icon: <FiPieChart /> },
    ...(isAdmin
      ? [
          { id: 'user-management', label: t('sidebar.userManagement'), path: '/user-management',  icon: <HomeSidebarIcons.Users /> },
          { id: 'admin-reports',   label: t('sidebar.adminReports'),   path: '/reports/platform', icon: <HomeSidebarIcons.Reports /> },
        ]
      : []),
    { id: 'help',   label: t('sidebar.helpAndSupport'), path: '/help-support',  icon: <HomeSidebarIcons.Help /> },
    { id: 'logout', label: t('sidebar.logout'),         path: '/portal/logout', icon: <FiLogOut />, isLogout: true },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.isLogout) {
      clearForceSyncUsed();
      window.location.href = item.path;
      return;
    }
    if (location.pathname !== item.path) {
      navigate(item.path);
    }
  };

  return { items, handleNavClick };
}
