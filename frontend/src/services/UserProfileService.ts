import { UserService } from './UserService';
import userAuthInfoService from './userAuthInfoService/userAuthInfoService';

class UserProfileService {
    private static instance: UserProfileService;
    private channel: string | null = null;
    private isInitialized = false;
    private userService = new UserService();

    private constructor() {}

    static getInstance(): UserProfileService {
        if (!UserProfileService.instance) {
            UserProfileService.instance = new UserProfileService();
        }
        return UserProfileService.instance;
    }

    /**
     * Initialize user profile data. Should be called once during workspace initialization.
     * This fetches and stores the user's channel for use throughout the application.
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        const userId = userAuthInfoService.getUserId();
        if (!userId) {
            console.warn('UserProfileService: No userId available for initialization');
            this.isInitialized = true;
            return;
        }

        try {
            const response = await this.userService.userRead(userId);
            this.channel = (response as any)?.data?.response?.channel || null;
            this.isInitialized = true;
            console.log('UserProfileService: Initialized with channel:', this.channel);
        } catch (err) {
            console.error('UserProfileService: Failed to initialize user profile:', err);
            this.isInitialized = true;
            throw err;
        }
    }

    /**
     * Get the user's channel. If not initialized, will attempt to fetch.
     * For best performance, call initialize() during workspace setup.
     */
    async getChannel(): Promise<string> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return this.channel || '';
    }

    /**
     * Get the channel synchronously. Returns empty string if not initialized.
     * Use this in editors after workspace initialization is complete.
     */
    getChannelSync(): string {
        if (!this.isInitialized) {
            console.warn('UserProfileService: getChannelSync called before initialization');
        }
        return this.channel || '';
    }

    /**
     * Check if the service has been initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Reset the service state. Useful for logout or user switching.
     */
    reset(): void {
        this.channel = null;
        this.isInitialized = false;
    }
}

export default UserProfileService.getInstance();
export { UserProfileService };
