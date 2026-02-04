
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
                    className="fp-input-field"
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
                    className="fp-input-field"
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
            <p className="fp-input-label font-medium text-center">
                Where would you like to receive the OTP?
            </p>

            <div
                className={`fp-radio-option ${isOtpSourceSelected
                    ? 'fp-radio-option-active'
                    : 'fp-radio-option-inactive'
                    }`}
                onClick={() => setIsOtpSourceSelected(!isOtpSourceSelected)}
            >
                <input
                    type="radio"
                    checked={isOtpSourceSelected}
                    onChange={() => setIsOtpSourceSelected(!isOtpSourceSelected)}
                    className="fp-radio-input"
                />
                <span className="fp-input-label mb-0">{maskedIdentifier}</span>
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
