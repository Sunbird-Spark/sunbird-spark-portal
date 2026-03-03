export type OtpRequiredField = 'mobileNumber' | 'emailId' | 'alternateEmail';

export type EditableField = 'fullName' | OtpRequiredField;

export type FieldVerificationStatus =
  | 'pristine'
  | 'modified'
  | 'otp_sending'
  | 'otp_sent'
  | 'otp_verifying'
  | 'verified'
  | 'error';

export interface FieldOtpState {
  status: FieldVerificationStatus;
  otp: string;
  resendTimer: number;
  resendCount: number;
  maxResendAttempts: number;
  errorMessage: string;
}

export interface EditProfileFormData {
  fullName: string;
  mobileNumber: string;
  emailId: string;
  alternateEmail: string;
}

export interface OnboardingDetail {
  screenId: string;
  screenTitle: string | null;
  fieldId: string;
  fieldLabel: string | null;
  otherText: string | null;
}

export interface UpdateProfileRequest {
  request: {
    userId: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    phoneVerified?: boolean;
    email?: string;
    emailVerified?: boolean;
    recoveryEmail?: string;
    framework?: {
      onboardingDetails?: OnboardingDetail[] | string[];
    };
  };
}

export interface UpdateProfileResponse {
  response: string;
}

export const FIELD_OTP_TYPE_MAP: Record<OtpRequiredField, 'phone' | 'email'> = {
  mobileNumber: 'phone',
  emailId: 'email',
  alternateEmail: 'email',
};

export const OTP_REQUIRED_FIELDS: OtpRequiredField[] = ['mobileNumber', 'emailId', 'alternateEmail'];

export const RESEND_COOLDOWN_SECONDS = 20;
export const MAX_RESEND_ATTEMPTS = 4;

export const createInitialFieldOtpState = (): FieldOtpState => ({
  status: 'pristine',
  otp: '',
  resendTimer: 0,
  resendCount: 0,
  maxResendAttempts: MAX_RESEND_ATTEMPTS,
  errorMessage: '',
});
