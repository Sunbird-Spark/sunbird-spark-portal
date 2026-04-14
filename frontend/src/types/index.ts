// Global type definitions for the application

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  uptime: number;
  version: string;
}

export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  enableLogging: boolean;
  features: {
    enableDarkMode: boolean;
    enableNotifications: boolean;
    enableAnalytics: boolean;
  };
}

export interface LocaleData {
  [key: string]: string | LocaleData;
}

export type Theme = 'light' | 'dark' | 'auto';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

export type {
  WorkspaceView,
  UserRole,
  ViewMode,
  SortOption,
  ContentTypeFilter,
  EditorOption,
  EditorCategory,
  WorkspaceSidebarCounts,
  WorkspaceSegment,
  WorkspaceSecondaryAction,
  EmptyStateVariant,
  WorkspaceItem,
  ContentSearchRequest,
  ContentSearchItem,
  ContentSearchResponse,
  UseContentSearchOptions,
} from './workspaceTypes';