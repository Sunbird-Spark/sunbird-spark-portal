import { UserService } from './UserService';
import userAuthInfoService from './userAuthInfoService/userAuthInfoService';

class UserProfileService {
    private static instance: UserProfileService;
    private channel = '';
    private profileFetched = false;
    private fetchPromise: Promise<void> | null = null;
    private userService = new UserService();

    private constructor() {}

    static getInstance(): UserProfileService {
        if (!UserProfileService.instance) {
            UserProfileService.instance = new UserProfileService();
        }
        return UserProfileService.instance;
    }

    async getChannel(): Promise<string> {
        if (this.profileFetched) return this.channel;
        if (!this.fetchPromise) {
            this.fetchPromise = (async () => {
                const userId = userAuthInfoService.getUserId();
                if (userId) {
                    try {
                        const response = await this.userService.userRead(userId);
                        this.channel = (response as any)?.data?.response?.channel || '';
                    } catch (err) {
                        console.warn('Failed to fetch user profile for channel:', err);
                    }
                }
                this.profileFetched = true;
                this.fetchPromise = null;
            })();
        }
        await this.fetchPromise;
        return this.channel;
    }

    clearCache(): void {
        this.channel = '';
        this.profileFetched = false;
        this.fetchPromise = null;
    }
}

export default UserProfileService.getInstance();
export { UserProfileService };
