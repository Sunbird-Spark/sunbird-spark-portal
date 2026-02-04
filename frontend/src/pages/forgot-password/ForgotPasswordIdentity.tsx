
import { Input } from '@/components/input';
import { Header, InputLabel, PrimaryButton } from './ForgotPasswordUI';

interface StepIdentificationProps {
    identifier: string;
    setIdentifier: (val: string) => void;
    name: string;
    setName: (val: string) => void;
    handleContinue: () => void;
    isRecoverValid: boolean;
}

export const StepIdentification = ({
    identifier,
    setIdentifier,
    name,
    setName,
    handleContinue,
    isRecoverValid
}: StepIdentificationProps) => (
    <>
        <Header
            title="Forgot Password?"
            subtitle="Don’t worry! Share your details and we will send you a code to reset your password."
        />

        <div className="space-y-5">
            <div className="form-group mb-5">
                <InputLabel required>Email ID / Mobile Number</InputLabel>
                <Input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter Email ID / Mobile Number"
                    className="h-12 !bg-white rounded-[0.625rem] border-sunbird-ink/50 focus:border-sunbird-brick focus:ring-0 focus:shadow-[0_0_0_0.125rem_white,0_0_0_0.25rem_theme(colors.sunbird.brick)] px-4 text-[0.875rem] placeholder:text-sunbird-ink/40"
                />
                <p className="text-[0.75rem] text-sunbird-ink mt-1">
                    Email (e.g. user@example.com) or Mobile Number (10 digits starting with 6-9)
                </p>
            </div>

            <div className="form-group mb-5">
                <InputLabel required>Name (as registered)</InputLabel>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    className="h-12 !bg-white rounded-[0.625rem] border-sunbird-ink/50 focus:border-sunbird-brick focus:ring-0 focus:shadow-[0_0_0_0.125rem_white,0_0_0_0.25rem_theme(colors.sunbird.brick)] px-4 text-[0.875rem] placeholder:text-sunbird-ink/40"
                />
            </div>

            <PrimaryButton
                disabled={!isRecoverValid}
                onClick={handleContinue}
                className="mt-8"
            >
                Continue
            </PrimaryButton>
        </div>
    </>
);

interface StepDeliveryOptionProps {
    isOtpSourceSelected: boolean;
    setIsOtpSourceSelected: (val: boolean) => void;
    maskedIdentifier: string;
    handleGetOtp: () => void;
}

export const StepDeliveryOption = ({
    isOtpSourceSelected,
    setIsOtpSourceSelected,
    maskedIdentifier,
    handleGetOtp
}: StepDeliveryOptionProps) => (
    <>
        <Header
            title="Forgot Password"
            subtitle="You will receive an OTP. After you validate it, you can recover your account."
        />

        <div className="space-y-5">
            <p className="text-[0.875rem] font-medium text-center text-sunbird-ink">
                Where would you like to receive the OTP?
            </p>

            <div
                className={`flex items-center gap-3 p-4 border rounded-[0.625rem] cursor-pointer transition-all ${isOtpSourceSelected
                    ? 'border-sunbird-brick bg-sunbird-ivory shadow-[0_0_0_0.125rem_white,0_0_0_0.25rem_theme(colors.sunbird.brick)]'
                    : 'border-sunbird-ink/50 bg-white'
                    }`}
                onClick={() => setIsOtpSourceSelected(!isOtpSourceSelected)}
            >
                <input
                    type="radio"
                    checked={isOtpSourceSelected}
                    onChange={() => setIsOtpSourceSelected(!isOtpSourceSelected)}
                    className="w-4 h-4 accent-sunbird-brick"
                />
                <span className="text-[0.875rem] font-medium text-sunbird-ink">{maskedIdentifier}</span>
            </div>

            <PrimaryButton
                disabled={!isOtpSourceSelected}
                onClick={handleGetOtp}
            >
                Get OTP
            </PrimaryButton>
        </div>
    </>
);
