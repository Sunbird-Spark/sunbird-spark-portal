import { OrganizationService } from '../services/OrganizationService';

/**
 * Initialize channel ID for the application
 * The backend middleware automatically fetches and stores the channel ID
 * This function just triggers a request to activate the middleware
 */
export const initializeChannelId = async (): Promise<boolean> => {
  try {
    // Make any API call to trigger the anonymous org middleware
    // The middleware will fetch org data and store channel ID automatically
    const response = await fetch('/health');
    
    if (response.ok) {
      console.log('Channel ID initialization triggered');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to initialize channel ID:', error);
    return false;
  }
};
