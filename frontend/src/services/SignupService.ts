import { hashPassword } from '@/utils/passwordUtils';
import { IDENTIFIER_REGEX, PASSWORD_REGEX } from '@/utils/ValidationUtils';
import { SignupValidationResult, OtpRequest, SignupRequest } from '@/types/signupTypes';

export class SignupService {

    validateFirstName(firstName: string): SignupValidationResult {
        if (!firstName.trim()) {
            return {
                isValid: false,
                error: {
                    title: "First Name Required",
                    description: "Please enter your first name.",
                }
            };
        }
        return { isValid: true };
    }

    validateIdentifier(emailOrMobile: string): SignupValidationResult {
        if (!IDENTIFIER_REGEX.test(emailOrMobile)) {
            return {
                isValid: false,
                error: {
                    title: "Invalid Email or Mobile",
                    description: "Please enter a valid email or a 10-digit mobile number starting with 6-9.",
                }
            };
        }
        return { isValid: true };
    }

    validatePassword(password: string): SignupValidationResult {
        if (!PASSWORD_REGEX.test(password)) {
            return {
                isValid: false,
                error: {
                    title: "Weak Password",
                    description: "Password must be at least 8 characters, include an uppercase, a lowercase, a number, and a special character.",
                }
            };
        }
        return { isValid: true };
    }

    validatePasswordMatch(password: string, confirmPassword: string): SignupValidationResult {
        if (password !== confirmPassword) {
            return {
                isValid: false,
                error: {
                    title: "Passwords Mismatch",
                    description: "The confirmed password does not match the entered password.",
                }
            };
        }
        return { isValid: true };
    }

    validateTermsAccepted(isTermsAccepted: boolean): SignupValidationResult {
        if (!isTermsAccepted) {
            return {
                isValid: false,
                error: {
                    title: "Terms Not Accepted",
                    description: "Please accept the Terms of Use to continue.",
                }
            };
        }
        return { isValid: true };
    }

    validateStep1(
        firstName: string,
        emailOrMobile: string,
        password: string,
        confirmPassword: string,
        isTermsAccepted: boolean
    ): SignupValidationResult {
        const validations = [
            this.validateFirstName(firstName),
            this.validateIdentifier(emailOrMobile),
            this.validatePassword(password),
            this.validatePasswordMatch(password, confirmPassword),
            this.validateTermsAccepted(isTermsAccepted),
        ];

        for (const validation of validations) {
            if (!validation.isValid) {
                return validation;
            }
        }

        return { isValid: true };
    }

    getIdentifierType(identifier: string): 'email' | 'phone' {
        return identifier.includes('@') ? 'email' : 'phone';
    }

    createOtpGenerationRequest(identifier: string): OtpRequest {
        return {
            request: {
                key: identifier,
                type: this.getIdentifierType(identifier),
            }
        };
    }

    createOtpVerificationRequest(identifier: string, otp: string): OtpRequest {
        return {
            request: {
                key: identifier,
                type: this.getIdentifierType(identifier),
                otp,
            }
        };
    }

    async prepareSignupRequest(
        firstName: string,
        identifier: string,
        password: string,
        deviceId?: string
    ): Promise<SignupRequest> {
        const hashedPassword = await hashPassword(password);
        return {
            firstName: firstName.trim(),
            identifier,
            password: hashedPassword,
            deviceId,
        };
    }
}
