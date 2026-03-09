import { getClient } from '../../lib/http-client';

interface AuthStatusResponse {
    sid: string;
    uid: string | null;
    isAuthenticated: boolean;
}

/**
 * Service for managing authentication information.
 * 
 * IMPORTANT: For React components, prefer using the hooks from '@/hooks/useAuthInfo':
 * - useAuthInfo() - Get full auth info with React Query caching
 * - useSessionId() - Get session ID
 * - useUserId() - Get user ID
 * - useIsAuthenticated() - Check authentication status
 * 
 * This service should only be used in:
 * - Non-React contexts (services, utilities)
 * - Server-side code
 * - Places where hooks cannot be used
 */
class userAuthInfoService {
    private static instance: userAuthInfoService;
    private sessionId: string | null = null;
    private userId: string | null = null;
    private isAuthenticated: boolean = false;
    private cachedPromise: Promise<AuthStatusResponse> | null = null;

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
     * Uses in-memory caching to prevent duplicate requests
     * @returns Promise with the auth status response
     */
    async getAuthInfo(): Promise<AuthStatusResponse> {
        // Return cached promise if it exists (prevents duplicate in-flight requests)
        if (this.cachedPromise) {
            return this.cachedPromise;
        }

        // Create and cache the promise
        this.cachedPromise = (async () => {
            try {
                const response = await getClient().get<AuthStatusResponse>(
                    '/user/v1/auth/info');
                this.sessionId = response.data.sid;
                this.userId = response.data.uid;
                this.isAuthenticated = response.data.isAuthenticated;
                return response.data;
            } catch (error) {
                // Clear cache on error so retry is possible
                this.cachedPromise = null;
                
                if (error && typeof error === 'object' && 'response' in error) {
                    const httpError = error as { response?: { status?: number; data?: { responseCode?: string; params?: { status?: string; errmsg?: string } } } };
                    console.error('Error fetching auth status:', error);
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
        })();

        return this.cachedPromise;
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
        this.cachedPromise = null;
    }
}

// Export singleton instance
export default userAuthInfoService.getInstance();
export { userAuthInfoService };
