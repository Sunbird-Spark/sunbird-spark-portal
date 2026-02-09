import { getClient } from '../../lib/http-client';
import type { ApiResponse } from '../../lib/http-client';

interface AuthStatusResponse {
    id: string;
    ver: string;
    ts: Date;
    params: {
        resmsgid: string;
        msgid: string;
        status: string;
        err: string | null;
        errmsg: string | null;
    };
    responseCode: string;
    result: {
        sid: string;
        uid: string | null;
        isAuthenticated: boolean;
    };
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
    async getAuthInfo(deviceId?: string): Promise<AuthStatusResponse['result']> {
        try {
            const headers: Record<string, string> = {};
            if (deviceId) {
                headers['x-device-id'] = deviceId;
            }

            const response: ApiResponse<AuthStatusResponse> = await getClient().get<AuthStatusResponse>(
                '/user/v1/auth/info',
                headers
            );

            const data = response?.data;

            if (!data) {
                throw new Error('No data received from auth API');
            }

            // Check if response has the expected structure
            if (!data.params || typeof data.params.status !== 'string') {
                // Log only non-sensitive fields to avoid leaking sid/uid
                console.warn('Auth API returned unexpected structure. Status:', data.params?.status, 'ResponseCode:', data.responseCode);
                throw new Error('Invalid response structure from auth API');
            }

            if (data.params.status === 'successful' && data.result) {
                this.sessionId = data.result.sid;
                this.userId = data.result.uid;
                this.isAuthenticated = data.result.isAuthenticated;

                return data.result;
            } else {
                const errmsg =
                    typeof data.params.errmsg === 'string' && data.params.errmsg.trim().length > 0
                        ? data.params.errmsg
                        : 'Failed to fetch auth status';
                throw new Error(errmsg);
            }
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
