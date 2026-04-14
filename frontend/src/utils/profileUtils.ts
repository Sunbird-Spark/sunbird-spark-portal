import _ from 'lodash';
import dayjs from 'dayjs';
import { UserProfile } from '../types/userTypes';
import {
    OtpRequiredField,
    FieldOtpState,
    EditProfileFormData,
    createInitialFieldOtpState,
    FIELD_OTP_TYPE_MAP,
} from '../types/profileTypes';

export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const createInitialFieldStates = (): Record<OtpRequiredField, FieldOtpState> => ({
    mobileNumber: createInitialFieldOtpState(),
    emailId: createInitialFieldOtpState(),
    alternateEmail: createInitialFieldOtpState(),
});

export const createInitialForm = (): EditProfileFormData => ({
    fullName: '',
    mobileNumber: '',
    emailId: '',
    alternateEmail: '',
});

export const buildOriginalData = (u: UserProfile): EditProfileFormData => {
    const firstName = _.get(u, 'firstName', '') || '';
    const lastName = _.get(u, 'lastName', '') || '';
    return {
        fullName: _.trim(`${firstName} ${lastName}`),
        mobileNumber: _.get(u, 'phone', '') || '',
        emailId: _.get(u, 'email', '') || '',
        alternateEmail: _.get(u, 'recoveryEmail', '') || '',
    };
};

export const validateFieldFormat = (field: OtpRequiredField, value: string): string | null => {
    const trimmed = _.trim(value);
    if (_.isEmpty(trimmed)) {
        return 'This field cannot be empty';
    }

    const otpType = FIELD_OTP_TYPE_MAP[field];
    if (otpType === 'phone' && !PHONE_REGEX.test(trimmed)) {
        return 'Enter a valid 10-digit mobile number starting with 6-9';
    }
    if (otpType === 'email' && !EMAIL_REGEX.test(trimmed)) {
        return 'Enter a valid email address';
    }
    return null;
};

export const formatTime = (seconds: number): string => {
    return dayjs().startOf('day').add(seconds, 'second').format('mm:ss');
};
