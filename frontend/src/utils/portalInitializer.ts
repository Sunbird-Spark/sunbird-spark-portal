import { QueryClient } from '@tanstack/react-query';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';
import appCoreService from '../services/AppCoreService';

/**
 * Portal initialization logic
 * Handles all required initializations when the application starts.
 * Seeds the React Query cache for ['authInfo'] so that guards such as
 * ProtectedRoute never see an empty cache on first render and incorrectly
 * redirect authenticated users away from their target page.
 */
export const portalInitializer = async (queryClient: QueryClient): Promise<void> => {
  try {
    await appCoreService.initialize();
    const authInfo = await userAuthInfoService.getAuthInfo();
    queryClient.setQueryData(['authInfo'], authInfo);
    // eslint-disable-next-line no-console
    console.log('Portal initialized successfully');
  } catch (error) {
    console.error('Portal initialization failed:', error);
    throw error;
  }
};
