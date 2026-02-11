import { getClient } from '../../lib/http-client';
import type { ApiResponse } from '../../lib/http-client';

interface AuthStatusResponse {
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
    async getAuthInfo(deviceId?: string): Promise<AuthStatusResponse> {
        try {
            const config = deviceId ? { headers: { 'x-device-id': deviceId } } : {};
            const response = await getClient().get<any>(
                '/user/v1/auth/info', config);

            // Check for API level error
            if (response.data.params?.status === 'failed') {
                const errorMessage = response.data.params.errmsg || 'Failed to fetch auth status';
                throw new Error(errorMessage);
            }

            // Handle unwrapped response or direct response
            const result = response.data.result || response.data;

            this.sessionId = result.sid;
            this.userId = result.uid;
            this.isAuthenticated = result.isAuthenticated;
            return result;
        } catch (error) {
            console.error('Error fetching auth status:', error);
            if (error && typeof error === 'object' && 'response' in error) {
                const httpError = error as { response?: { status?: number; data?: any } };
                console.error('Status:', httpError.response?.status);
                // Avoid logging full response data which may contain sensitive fields
                const safeData = httpError.response?.data ? {
                    responseCode: httpError.response.data.responseCode,
                    status: httpError.response.data.params?.status,
                    errmsg: httpError.response.data.params?.errmsg
                } : undefined;
                console.error('Response:', safeData);
            }
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
