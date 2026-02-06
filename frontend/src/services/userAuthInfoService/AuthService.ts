import axios from 'axios';

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

class AuthService {
    private static instance: AuthService;
    private sessionId: string | null = null;
    private userId: string | null = null;
    private isAuthenticated: boolean = false;

    private constructor() {
        // Private constructor for singleton pattern
    }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    /**
     * Fetches the authentication status from the backend
     * This includes the session ID (sid) and user ID (uid)
     * @param deviceId - The device ID to send in the x-device-id header
     * @returns Promise with the auth status response
     */
    async getAuthInfo(deviceId: string): Promise<AuthStatusResponse['result']> {
        try {
            const response = await axios.get<AuthStatusResponse>(
                '/portal/user/v1/auth/info',
                {
                    headers: {
                        'x-device-id': deviceId
                    },
                    withCredentials: true // Important for session cookies
                }
            );

            if (response.data.params.status === 'successful') {
                this.sessionId = response.data.result.sid;
                this.userId = response.data.result.uid;
                this.isAuthenticated = response.data.result.isAuthenticated;

                return response.data.result;
            } else {
                throw new Error(response.data.params.errmsg || 'Failed to fetch auth status');
            }
        } catch (error) {
            console.error('Error fetching auth status:', error);
            if (axios.isAxiosError(error)) {
                console.error('   Status:', error.response?.status);
                console.error('   Data:', error.response?.data);
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
export default AuthService.getInstance();
export { AuthService };
