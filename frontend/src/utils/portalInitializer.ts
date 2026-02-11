import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

/**
 * Portal initialization logic
 * Handles all required initializations when the application starts
 */
export const portalInitializer = async (): Promise<void> => {
  try {
    await userAuthInfoService.getAuthInfo();
    console.log('Portal initialized successfully');
  } catch (error) {
    console.error('Portal initialization failed:', error);
    throw error;
  }
};
