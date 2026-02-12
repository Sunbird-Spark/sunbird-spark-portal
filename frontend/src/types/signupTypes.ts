export interface SignupValidationResult {
    isValid: boolean;
    error?: {
        title: string;
        description: string;
    };
}

export interface OtpRequest {
    request: {
        key: string;
        type: 'email' | 'phone';
        otp?: string;
    };
}

export interface SignupRequest {
    request: {
        firstName?: string;
        email?: string;
        phone?: string;
        password: string;
        emailVerified?: boolean;
        phoneVerified?: boolean;
    };
    params?: {
        source?: string;
        signupType?: string;
    };
}

export interface SignupResponse {
    userId: string;
}
