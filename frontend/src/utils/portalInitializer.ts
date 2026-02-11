import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';
import appCoreService from '../services/AppCoreService';

/**
 * Portal initialization logic
 * Handles all required initializations when the application starts
 */
export const portalInitializer = async (): Promise<void> => {
  try {
    await appCoreService.initialize();
    await userAuthInfoService.getAuthInfo();
    // eslint-disable-next-line no-console
    console.log('Portal initialized successfully');
  } catch (error) {
    console.error('Portal initialization failed:', error);
    throw error;
  }
};
