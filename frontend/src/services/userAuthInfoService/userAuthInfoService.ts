import { getClient } from '../../lib/http-client';
import type { ApiResponse } from '../../lib/http-client';

interface AuthStatusResult {
    sid: string;
    uid: string | null;
    isAuthenticated: boolean;
}

class userAuthInfoService {
    private static instance: userAuthInfoService;
    private sessionId: string | null = null;
    private userId: string | null = null;
    private isAuthenticated: boolean = false;

    private constructor() {
        // Private constructor for singleton pattern
    }

    static getInstance(): userAuthInfoService {
        if (!userAuthInfoService.instance) {
            userAuthInfoService.instance = new userAuthInfoService();
        }
        return userAuthInfoService.instance;
    }

    /**
     * Fetches the authentication status from the backend
     * This includes the session ID (sid) and user ID (uid)
     * @param deviceId - Optional device ID to send in the x-device-id header
     * @returns Promise with the auth status response
     */
    async getAuthInfo(deviceId?: string): Promise<AuthStatusResult> {
        try {
            const headers: Record<string, string> = {};
            if (deviceId) {
                headers['x-device-id'] = deviceId;
            }

            // The AxiosAdapter unwraps the response, so 'data' corresponds to the 'result' property of the API response
            const response: ApiResponse<AuthStatusResult> = await getClient().get<AuthStatusResult>(
                '/user/v1/auth/info',
                headers
            );

            const data = response?.data;

            if (!data) {
                throw new Error('No data received from auth API');
            }

            // Since the adapter unwraps the 'result', we expect data to be AuthStatusResult
            if (data.sid) {
                this.sessionId = data.sid;
                this.userId = data.uid;
                this.isAuthenticated = data.isAuthenticated;

                return data;
            } else {
               // If unwrap failed or structure is different (e.g. error response), handle it
               // Ideally we should typecheck or assume success if no error thrown by adapter
               throw new Error('Invalid response structure from auth API');
            }
        } catch (error) {
            console.error('Error fetching auth status:', error);
            throw error;
        }
    }

    /**
     * Get the cached session ID
     */
    getSessionId(): string | null {
        return this.sessionId;
    }

    /**
     * Get the cached user ID
     */
    getUserId(): string | null {
        return this.userId;
    }

    /**
     * Check if user is authenticated
     */
    isUserAuthenticated(): boolean {
        return this.isAuthenticated;
    }

    /**
     * Clear cached auth data
     */
    clearAuth(): void {
        this.sessionId = null;
        this.userId = null;
        this.isAuthenticated = false;
    }
}

// Export singleton instance
export default userAuthInfoService.getInstance();
export { userAuthInfoService };
