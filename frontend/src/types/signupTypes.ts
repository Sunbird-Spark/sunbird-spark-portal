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
    firstName: string;
    identifier: string;
    password: string;
    deviceId?: string;
}
