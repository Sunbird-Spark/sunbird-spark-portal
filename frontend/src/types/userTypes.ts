export interface UserProfile {
    firstName: string;
    lastName: string;
    userName: string; // Sunbird ID
    email?: string;
    phone?: string;
    maskedEmail?: string;
    maskedPhone?: string;
    profileLocation?: Array<{ type: string; id: string; name?: string }>;
    recoveryEmail?: string;
    recoveryPhone?: string;
    roles?: Array<{ role: string; [key: string]: any }>;
    [key: string]: any;
}

export interface UserReadResponse {
    response: UserProfile;
}
