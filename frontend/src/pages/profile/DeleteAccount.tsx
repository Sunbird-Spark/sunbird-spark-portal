import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useUserRead } from "@/hooks/useUserRead";
import { useUserId } from "@/hooks/useAuthInfo";
import { useGenerateOtp, useVerifyOtp } from "@/hooks/useOtp";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useDeleteUser, useUserRoles } from "@/hooks/useUser";
import useImpression from "@/hooks/useImpression";
import useInteract from "@/hooks/useInteract";
import PageLoader from "@/components/common/PageLoader";
import { OTP_REGEX } from "@/utils/ValidationUtils";
import { CONDITION_KEYS, ConsentStep, OtpStep } from "./DeleteAccountSteps";

const TELEMETRY_PAGE_ID = "delete-account-page";

type Stage = "consent" | "otp";
const RESEND_COOLDOWN_SECONDS = 20;

const DeleteAccount = () => {
    const { t } = useAppI18n();
    const navigate = useNavigate();
    useImpression({ type: "view", pageid: TELEMETRY_PAGE_ID, env: "profile" });
    const { interact } = useInteract();

    const { data: userResponse, isLoading } = useUserRead();
    const user = userResponse?.data?.response;
    const resolvedUserId = useUserId();
    const email = user?.email;
    const { data: roles, isLoading: rolesLoading } = useUserRoles();
    const isAdmin = (roles ?? []).some((r) => r.role === "ORG_ADMIN");

    const [stage, setStage] = useState<Stage>("consent");
    const [checkedConditions, setCheckedConditions] = useState<Record<string, boolean>>({});
    const [otp, setOtp] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [resendCounter, setResendCounter] = useState(RESEND_COOLDOWN_SECONDS);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [resendTrigger, setResendTrigger] = useState(0);
    const [pendingAction, setPendingAction] = useState<"send" | "resend" | null>(null);

    const generateOtp = useGenerateOtp();
    const verifyOtp = useVerifyOtp();
    const deleteUser = useDeleteUser();
    const { data: captchaSiteKeyData } = useSystemSetting('portal_google_recaptcha_site_key');
    const googleCaptchaSiteKey = (captchaSiteKeyData?.data as any)?.response?.value || '';
    const captchaRef = useRef<ReCAPTCHA>(null);

    const allConditionsAccepted = useMemo(
        () => CONDITION_KEYS.every((k) => checkedConditions[k]),
        [checkedConditions],
    );

    useEffect(() => {
        if (stage !== "otp") return;
        window.scrollTo({ top: 0, behavior: "smooth" });
        setResendDisabled(true);
        setResendCounter(RESEND_COOLDOWN_SECONDS);
        const interval = setInterval(() => {
            setResendCounter((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setResendDisabled(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [stage, resendTrigger]);

    const toggleCondition = (key: string) =>
        setCheckedConditions((prev) => ({ ...prev, [key]: !prev[key] }));

    const buildOtpRequest = () => ({
        request: {
            key: email,
            type: "email",
            userId: resolvedUserId,
        },
    });

    const runGenerateOtp = async (
        action: "send" | "resend",
        captchaResponse?: string,
    ) => {
        try {
            await generateOtp.mutateAsync({ request: buildOtpRequest(), captchaResponse });
            interact({
                id: "delete-account-otp-sent",
                pageid: TELEMETRY_PAGE_ID,
                extra: { action },
            });
            if (action === "send") {
                setStage("otp");
            } else {
                setResendTrigger((n) => n + 1);
            }
        } catch (err) {
            const status =
                (err as { status?: number; response?: { status?: number } })?.status ??
                (err as { response?: { status?: number } })?.response?.status;
            setErrorMessage(
                status === 429
                    ? t("deleteAccount.error.rateLimited")
                    : t("deleteAccount.error.otpSendFailed"),
            );
            interact({
                id: "delete-account-otp-failed",
                pageid: TELEMETRY_PAGE_ID,
                extra: { action, status: status ?? null },
            });
            captchaRef.current?.reset();
        }
    };

    const triggerOtpRequest = (action: "send" | "resend") => {
        setErrorMessage("");
        if (action === "resend") setOtp("");
        if (googleCaptchaSiteKey) {
            setPendingAction(action);
            captchaRef.current?.reset();
            captchaRef.current?.execute();
        } else {
            runGenerateOtp(action);
        }
    };

    const handleCaptchaToken = (token: string | null) => {
        if (!token || !pendingAction) return;
        const action = pendingAction;
        setPendingAction(null);
        runGenerateOtp(action, token);
    };

    const handleSendOtp = () => {
        if (!email || !resolvedUserId) {
            setErrorMessage(t("deleteAccount.error.missingEmail"));
            return;
        }
        interact({ id: "delete-account-submit", pageid: TELEMETRY_PAGE_ID });
        triggerOtpRequest("send");
    };

    const handleResendOtp = () => {
        if (resendDisabled) return;
        triggerOtpRequest("resend");
    };

    const handleConfirmDelete = async () => {
        if (!OTP_REGEX.test(otp)) {
            setErrorMessage(t("deleteAccount.error.invalidOtp"));
            return;
        }
        setSubmitting(true);
        setErrorMessage("");
        try {
            await verifyOtp.mutateAsync({
                request: {
                    request: {
                        key: email,
                        type: "email",
                        otp,
                        userId: resolvedUserId,
                    },
                },
            });
            interact({ id: "delete-account-otp-verified", pageid: TELEMETRY_PAGE_ID });
        } catch {
            setErrorMessage(t("deleteAccount.error.invalidOtp"));
            interact({ id: "delete-account-otp-invalid", pageid: TELEMETRY_PAGE_ID });
            setSubmitting(false);
            setOtp("");
            return;
        }

        try {
            if (!resolvedUserId) {
                setErrorMessage(t("deleteAccount.error.deleteFailed"));
                interact({ id: "delete-account-delete-failed", pageid: TELEMETRY_PAGE_ID });
                setSubmitting(false);
                return;
            }
            await deleteUser.mutateAsync({ userId: resolvedUserId });
            interact({ id: "delete-account-success", pageid: TELEMETRY_PAGE_ID });
            window.location.assign("/portal/logout");
        } catch {
            setErrorMessage(t("deleteAccount.error.deleteFailed"));
            interact({ id: "delete-account-delete-failed", pageid: TELEMETRY_PAGE_ID });
            setSubmitting(false);
        }
    };

    if (isLoading || rolesLoading) {
        return (
            <main className="profile-main-content">
                <PageLoader message={t("profilePage.loading")} fullPage={false} />
            </main>
        );
    }

    if (isAdmin) {
        return <Navigate to="/profile" replace />;
    }

    return (
        <main className="profile-main-content delete-account-main bg-white">
            <div className={`delete-account-page ${stage === "consent" ? "!max-w-4xl" : ""}`}>
                {stage === "consent" ? (
                    <ConsentStep
                        email={email}
                        checkedConditions={checkedConditions}
                        toggleCondition={toggleCondition}
                        allConditionsAccepted={allConditionsAccepted}
                        isSending={generateOtp.isPending}
                        errorMessage={errorMessage}
                        onSendOtp={handleSendOtp}
                        onCancel={() => navigate("/profile")}
                    />
                ) : (
                    <OtpStep
                        email={email}
                        otp={otp}
                        setOtp={setOtp}
                        resendCounter={resendCounter}
                        resendDisabled={resendDisabled}
                        submitting={submitting}
                        errorMessage={errorMessage}
                        onResend={handleResendOtp}
                        onConfirm={handleConfirmDelete}
                        onBack={() => {
                            setStage("consent");
                            setOtp("");
                            setErrorMessage("");
                        }}
                    />
                )}

                {googleCaptchaSiteKey && (
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey={googleCaptchaSiteKey}
                        size="invisible"
                        onChange={handleCaptchaToken}
                    />
                )}
            </div>
        </main>
    );
};

export default DeleteAccount;
