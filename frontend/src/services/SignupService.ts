import _ from 'lodash';
import { IDENTIFIER_REGEX, PASSWORD_REGEX } from '@/utils/ValidationUtils';
import { SignupValidationResult, OtpRequest } from '@/types/signupTypes';

export class SignupService {
    private static readonly VALIDATION_SUCCESS: SignupValidationResult = { isValid: true };

    private createError(title: string, description: string): SignupValidationResult {
        return {
            isValid: false,
            error: { title, description }
        };
    }

    validateFirstName(firstName: string): SignupValidationResult {
        return _.isEmpty(_.trim(firstName))
            ? this.createError(
                "First Name Required",
                "Please enter your first name."
            )
            : SignupService.VALIDATION_SUCCESS;
    }

    validateIdentifier(emailOrMobile: string): SignupValidationResult {
        return !IDENTIFIER_REGEX.test(emailOrMobile)
            ? this.createError(
                "Invalid Email or Mobile",
                "Please enter a valid email or a 10-digit mobile number starting with 6-9."
            )
            : SignupService.VALIDATION_SUCCESS;
    }

    validatePassword(password: string): SignupValidationResult {
        return !PASSWORD_REGEX.test(password)
            ? this.createError(
                "Weak Password",
                "Password must be at least 8 characters, include an uppercase, a lowercase, a number, and a special character."
            )
            : SignupService.VALIDATION_SUCCESS;
    }

    validatePasswordMatch(password: string, confirmPassword: string): SignupValidationResult {
        return password !== confirmPassword
            ? this.createError(
                "Passwords Mismatch",
                "The confirmed password does not match the entered password."
            )
            : SignupService.VALIDATION_SUCCESS;
    }

    validateSignupForm(
        firstName: string,
        emailOrMobile: string,
        password: string,
        confirmPassword: string,
    ): SignupValidationResult {
        const validations = [
            this.validateFirstName(firstName),
            this.validateIdentifier(emailOrMobile),
            this.validatePassword(password),
            this.validatePasswordMatch(password, confirmPassword),
        ];

        return _.find(validations, { isValid: false }) || SignupService.VALIDATION_SUCCESS;
    }

    getIdentifierType(identifier: string): 'email' | 'phone' {
        return _.includes(identifier, '@') ? 'email' : 'phone';
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

    encodePassword(password: string): string {
        const utf8Bytes = new TextEncoder().encode(password);
        const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
        return btoa(binaryString);
    }
}
