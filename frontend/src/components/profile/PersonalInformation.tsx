import { useRef, useCallback } from "react";
import ReCAPTCHA from 'react-google-recaptcha';
import { FiEdit2 } from "react-icons/fi";
import { UserProfile } from "@/types/userTypes";
import _ from 'lodash';
import EditProfileDialog from "./EditProfileDialog";
import { useEditProfile } from "@/hooks/useEditProfile";
import { useSystemSetting } from '@/hooks/useSystemSetting';
import { useToast } from "@/hooks/useToast";
import { useAppI18n } from "@/hooks/useAppI18n";

interface PersonalInformationProps {
    user: UserProfile;
}

const PersonalInformation = ({ user }: PersonalInformationProps) => {
    const { t } = useAppI18n();
    const editProfile = useEditProfile({ user });
    const { toast } = useToast();
    const captchaRef = useRef<ReCAPTCHA>(null);
    const pendingCaptchaAction = useRef<((token?: string) => void) | null>(null);

    const { data: captchaSiteKeyData } = useSystemSetting('portal_google_recaptcha_site_key');
    const googleCaptchaSiteKey = (captchaSiteKeyData?.data as any)?.response?.value || '';

    const handleCaptchaChange = (token: string | null) => {
        if (token && pendingCaptchaAction.current) {
            pendingCaptchaAction.current(token);
            pendingCaptchaAction.current = null;
        }
        captchaRef.current?.reset();
    };

    const triggerCaptcha = useCallback((callback: (token?: string) => void) => {
        if (!googleCaptchaSiteKey || !captchaRef.current) {
            // No captcha configured — proceed without token, same as signup
            callback();
            return;
        }
        pendingCaptchaAction.current = callback;
        captchaRef.current?.execute();
    }, [googleCaptchaSiteKey]);

    const firstName = _.get(user, 'firstName', '');
    const lastName = _.get(user, 'lastName', '');
    const fullName = `${firstName} ${lastName}`;
    const truncatedName = fullName.length > 20 ? `${fullName.substring(0, 20)}...` : fullName;

    const maskedEmail = _.get(user, 'maskedEmail');
    const email = _.get(user, 'email');
    const maskedPhone = _.get(user, 'maskedPhone');
    const recoveryEmail = _.get(user, 'recoveryEmail');

    const displayEmail = maskedEmail || email || "";
    const displayPhone = maskedPhone || "";
    const alternateEmail = recoveryEmail || "";

    return (
        <div className="personal-info-card">
            {/* Header with Edit */}
            <div className="personal-info-header">
                <div className="personal-info-title-wrapper">
                    <div className="personal-info-accent" />
                    <h2 className="personal-info-title">
                        {t("personalInfo.title")}
                    </h2>
                </div>
                <button
                    className="personal-info-edit-btn"
                    onClick={editProfile.openDialog}
                >
                    <FiEdit2 className="w-3.5 h-3.5" />
                    {t("edit")}
                </button>
            </div>

            {/* Form Fields Grid */}
            <dl className="personal-info-grid">
                {/* Full Name */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        {t("personalInfo.fullName")}
                    </dt>
                    <dd className="personal-info-value-container min-w-0">
                        <span className="personal-info-value block truncate" title={fullName}>
                            {truncatedName}
                        </span>
                    </dd>
                </div>

                {/* Mobile Number */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        {t("personalInfo.mobileNumber")}
                    </dt>
                    <dd className="personal-info-value-container min-w-0">
                        <span className={`personal-info-value block truncate ${!displayPhone ? 'text-sunbird-gray-75' : ''}`} title={displayPhone || t("personalInfo.mobileNumber")}>
                            {displayPhone || t("personalInfo.mobileNumber")}
                        </span>
                    </dd>
                </div>

                {/* Email ID */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        {t("personalInfo.emailId")}
                    </dt>
                    <dd className="personal-info-value-container min-w-0">
                        <span
                            className={`personal-info-value block truncate ${!displayEmail ? 'text-sunbird-gray-75' : ''}`}
                            title={displayEmail || t("personalInfo.emailId")}
                        >
                            {displayEmail || t("personalInfo.emailId")}
                        </span>
                    </dd>
                </div>

                {/* Alternate Email ID */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        {t("personalInfo.alternateEmailId")}
                    </dt>
                    <dd className="personal-info-value-container min-w-0">
                        <span className={`personal-info-value block truncate ${!alternateEmail ? 'text-sunbird-gray-75' : ''}`} title={alternateEmail || t("personalInfo.alternateEmailId")}>
                            {alternateEmail || t("personalInfo.alternateEmailId")}
                        </span>
                    </dd>
                </div>
            </dl>

            <EditProfileDialog
                isOpen={editProfile.isOpen}
                onClose={editProfile.closeDialog}
                form={editProfile.form}
                updateField={editProfile.updateField}
                fieldStates={editProfile.fieldStates}
                initiateOtp={editProfile.initiateOtp}
                setFieldOtp={editProfile.setFieldOtp}
                verifyFieldOtp={editProfile.verifyFieldOtp}
                resendFieldOtp={editProfile.resendFieldOtp}
                canSave={editProfile.canSave}
                isSaving={editProfile.isSaving}
                handleSave={editProfile.handleSave}
                formatTime={editProfile.formatTime}
                triggerCaptcha={triggerCaptcha}
            />

            {/* ReCAPTCHA rendered outside any Dialog so its iframe is not blocked by modal overlays */}
            {googleCaptchaSiteKey && (
                <ReCAPTCHA
                    ref={captchaRef}
                    sitekey={googleCaptchaSiteKey}
                    size="invisible"
                    onChange={handleCaptchaChange}
                    onErrored={() => {
                        pendingCaptchaAction.current = null;
                        captchaRef.current?.reset();
                        // toast({
                        //     title: "Verification Error",
                        //     description: "Failed to load reCAPTCHA. If you are on localhost, this domain might not be supported by the site key.",
                        //     variant: "destructive",
                        // });
                    }}
                />
            )}
        </div>
    );
};

export default PersonalInformation;
