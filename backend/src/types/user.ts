/**
 * User profile structure from API response
 */
export interface UserProfile {
    id?: string | number;
    userId?: string | number;
    userName?: string;
    roles?: Array<{ role: string }> | string[];
    organisations?: Array<{
        organisationId?: string;
        roles?: string[];
    }>;
    rootOrg?: {
        id?: string;
        hashTagId?: string;
        slug?: string;
        orgName?: string;
        channel?: string;
        rootOrgId?: string;
    };
}

/**
 * Standard API response wrapper for user data
 */
export interface UserApiResponse {
    responseCode: string;
    result: {
        response: UserProfile;
    };
}