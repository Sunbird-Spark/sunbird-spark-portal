import { useState, useCallback, useMemo, useRef } from 'react';
import _ from 'lodash';
import { useUpdateProfile } from './useUpdateProfile';
import { useTelemetry } from './useTelemetry';
import { toast } from './useToast';
import { useUserId } from './useAuthInfo';
import { UserProfile } from '../types/userTypes';
import {
  OtpRequiredField,
  EditableField,
  FieldOtpState,
  EditProfileFormData,
  OTP_REQUIRED_FIELDS,
  createInitialFieldOtpState,
  UpdateProfileRequest,
} from '../types/profileTypes';
import {
  createInitialForm,
  createInitialFieldStates,
  buildOriginalData,
  formatTime
} from '../utils/profileUtils';
import { useOtpVerification } from './useOtpVerification';

interface UseEditProfileParams {
  user: UserProfile;
}

export interface UseEditProfileReturn {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;

  form: EditProfileFormData;
  updateField: (field: EditableField, value: string) => void;

  fieldStates: Record<OtpRequiredField, FieldOtpState>;

  initiateOtp: (field: OtpRequiredField, captchaResponse?: string) => Promise<void>;
  setFieldOtp: (field: OtpRequiredField, value: string) => void;
  verifyFieldOtp: (field: OtpRequiredField) => Promise<void>;
  resendFieldOtp: (field: OtpRequiredField, captchaResponse?: string) => Promise<void>;

  canSave: boolean;
  isSaving: boolean;
  handleSave: () => void;

  formatTime: (seconds: number) => string;
}

export const useEditProfile = ({ user }: UseEditProfileParams): UseEditProfileReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<EditProfileFormData>(createInitialForm());
  const userId = useUserId();
  const telemetry = useTelemetry();

  const originalData = useRef<EditProfileFormData>(createInitialForm());
  const updateProfileMutation = useUpdateProfile();

  const {
    fieldStates,
    setFieldStates,
    updateFieldState,
    initiateOtp: initiateFieldOtp,
    setFieldOtp,
    verifyFieldOtp,
    resendFieldOtp
  } = useOtpVerification(form, isOpen);

  const initiateOtp = useCallback(async (field: OtpRequiredField, captchaResponse?: string) => {
    const trimmedValue = _.trim(form[field]);

    // Cross-field duplicate check: email and alternate email must differ
    if (field === 'alternateEmail' && trimmedValue && trimmedValue === _.trim(form.emailId)) {
      updateFieldState(field, {
        status: 'error',
        errorMessage: 'Alternate email cannot be the same as primary email',
      });
      return;
    }
    if (field === 'emailId' && trimmedValue && trimmedValue === _.trim(form.alternateEmail)) {
      updateFieldState(field, {
        status: 'error',
        errorMessage: 'Primary email cannot be the same as alternate email',
      });
      return;
    }

    return initiateFieldOtp(field, captchaResponse);
  }, [form, initiateFieldOtp, updateFieldState]);

  const openDialog = useCallback(() => {
    const data = buildOriginalData(user);
    originalData.current = data;
    setForm({ ...data });
    setFieldStates(createInitialFieldStates());
    setIsOpen(true);
  }, [user, setFieldStates]);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setForm(createInitialForm());
    setFieldStates(createInitialFieldStates());
  }, [setFieldStates]);

  const updateField = useCallback((field: EditableField, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));

    if (field === 'fullName') return;

    const otpField = field as OtpRequiredField;
    const original = originalData.current[otpField];

    if (value === original) {
      updateFieldState(otpField, {
        status: 'pristine',
        otp: '',
        resendTimer: 0,
        resendCount: 0,
        errorMessage: '',
      });
    } else {
      setFieldStates(prev => {
        if (prev[otpField].status === 'verified' || prev[otpField].status === 'pristine') {
          return {
            ...prev,
            [otpField]: {
              ...createInitialFieldOtpState(),
              status: 'modified' as const,
            },
          };
        }
        return prev;
      });
    }
  }, [updateFieldState, setFieldStates]);

  const canSave = useMemo(() => {
    const currentFullName = _.trim(form.fullName || '');
    const originalFullName = _.trim(originalData.current.fullName || '');

    const nameChanged = currentFullName !== originalFullName;
    const anyOtpFieldVerified = _.some(OTP_REQUIRED_FIELDS, (field) => fieldStates[field].status === 'verified');

    const hasAnyChange = nameChanged || anyOtpFieldVerified;

    if (!hasAnyChange) return false;

    // Block save if any field is in 'modified' or 'error' state (needs validation/fixing)
    return _.every(OTP_REQUIRED_FIELDS, (field) => {
      const status = fieldStates[field].status;
      return status === 'pristine' || status === 'verified';
    });
  }, [form.fullName, fieldStates]);

  const handleSave = useCallback(async () => {
    if (!canSave) return;

    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'User not authenticated',
      });
      return;
    }

    const request: UpdateProfileRequest = { request: { userId } };
    let hasDataToUpdate = false;

    // Handle Name Update
    const currentFullName = _.trim(form.fullName || '');
    const originalFullName = _.trim(originalData.current.fullName || '');
    if (currentFullName !== originalFullName) {
      hasDataToUpdate = true;
      const spaceIndex = currentFullName.indexOf(' ');
      if (spaceIndex > 0) {
        request.request.firstName = _.trim(currentFullName.substring(0, spaceIndex));
        request.request.lastName = _.trim(currentFullName.substring(spaceIndex + 1));
      } else {
        request.request.firstName = currentFullName;
        request.request.lastName = '';
      }
    }

    // Email cross-validation - only if one of them is actually being changed/verified
    if (fieldStates.emailId.status === 'verified' || fieldStates.alternateEmail.status === 'verified') {
      const primaryEmail = _.trim(form.emailId);
      const recoveryEmail = _.trim(form.alternateEmail);
      if (recoveryEmail && primaryEmail && recoveryEmail === primaryEmail) {
        toast({
          variant: 'destructive',
          title: 'Update failed',
          description: 'Alternate email cannot be the same as primary email',
        });
        return;
      }
    }

    if (fieldStates.mobileNumber.status === 'verified') {
      request.request.phone = _.trim(form.mobileNumber);
      request.request.phoneVerified = true;
      hasDataToUpdate = true;
    }
    if (fieldStates.emailId.status === 'verified') {
      request.request.email = _.trim(form.emailId);
      request.request.emailVerified = true;
      hasDataToUpdate = true;
    }
    if (fieldStates.alternateEmail.status === 'verified') {
      request.request.recoveryEmail = _.trim(form.alternateEmail);
      hasDataToUpdate = true;
    }

    if (!hasDataToUpdate) return;

    try {
      await updateProfileMutation.mutateAsync(request);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        variant: 'success',
      });
      telemetry.audit({
        edata: {
          props: ['profileDetails'],
          state: 'Updated',
        },
        object: { id: userId, type: 'User' },
      });
      telemetry.log({
        edata: {
          type: 'api',
          level: 'INFO',
          message: 'Profile updated successfully',
          pageid: 'profile',
        },
      });
      closeDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: message,
      });
      telemetry.log({
        edata: {
          type: 'api',
          level: 'ERROR',
          message: `Profile update failed: ${message}`,
          pageid: 'profile',
        },
      });
    }
  }, [canSave, userId, form, fieldStates, updateProfileMutation, closeDialog]);

  return {
    isOpen,
    openDialog,
    closeDialog,
    form,
    updateField,
    fieldStates,
    initiateOtp,
    setFieldOtp,
    verifyFieldOtp,
    resendFieldOtp,
    canSave,
    isSaving: updateProfileMutation.isPending,
    handleSave,
    formatTime,
  };
};
