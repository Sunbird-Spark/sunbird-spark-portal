import { UserService } from './UserService';
import userAuthInfoService from './userAuthInfoService/userAuthInfoService';

class UserProfileService {
    private static instance: UserProfileService;
    private channel: string | null = null;
    private isInitialized = false;
    private initializationPromise: Promise<void> | null = null;
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
     * 
     * Multiple concurrent calls will share the same initialization promise to prevent
     * duplicate API requests.
     * 
     * Note: On initialization failure, isInitialized remains false to allow retry on
     * subsequent calls. This ensures transient network errors don't permanently break
     * the service.
     */
    async initialize(): Promise<void> {
        // Return existing initialization promise if in progress
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        if (this.isInitialized) {
            return;
        }

        const userId = userAuthInfoService.getUserId();
        if (!userId) {
            console.warn('UserProfileService: No userId available for initialization');
            return;
        }

        // Create and store initialization promise to prevent concurrent calls
        this.initializationPromise = (async () => {
            try {
                const response = await this.userService.userRead(userId);
                this.channel = (response as any)?.data?.response?.channel || null;
                this.isInitialized = true;
                console.log('UserProfileService: Initialized with channel:', this.channel);
            } catch (err) {
                console.error('UserProfileService: Failed to initialize user profile:', err);
                // Don't set isInitialized = true on error to allow retry
                throw err;
            } finally {
                this.initializationPromise = null;
            }
        })();

        return this.initializationPromise;
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
}

export default UserProfileService.getInstance();
export { UserProfileService };
