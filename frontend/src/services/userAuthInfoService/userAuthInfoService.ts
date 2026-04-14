import { getClient } from '../../lib/http-client';

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
    private cachedPromise: Promise<AuthStatusResponse> | null = null;
    private requestGeneration: number = 0;

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
     * Uses in-memory caching to prevent duplicate in-flight requests
     * @returns Promise with the auth status response
     */
    async getAuthInfo(): Promise<AuthStatusResponse> {
        // Return cached promise if it exists (prevents duplicate in-flight requests)
        if (this.cachedPromise) {
            return this.cachedPromise;
        }

        // Create and cache the promise
        const currentGeneration = ++this.requestGeneration;
        this.cachedPromise = (async () => {
            try {
                const response = await getClient().get<AuthStatusResponse>(
                    '/user/v1/auth/info');
                
                // Only update state if this is still the current request generation
                if (currentGeneration === this.requestGeneration) {
                    this.sessionId = response.data.sid;
                    this.userId = response.data.uid;
                    this.isAuthenticated = response.data.isAuthenticated;
                }
                
                return response.data;
            } catch (error) {
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
            } finally {
                // Clear cache after completion (success or error) to allow re-fetching
                this.cachedPromise = null;
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
        this.requestGeneration++; // Invalidate any in-flight requests
    }
}

// Export singleton instance
export default userAuthInfoService.getInstance();
export { userAuthInfoService };
export type { AuthStatusResponse };
