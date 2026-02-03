
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
                    className="h-12 !bg-white rounded-[0.625rem] border-[#828282] focus:border-[#A85236] focus:ring-0 focus:shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236] px-4 text-[0.875rem] placeholder:text-[#B2B2B2]"
                />
                <p className="text-[0.75rem] text-[#757575] mt-1">
                    Email (e.g. user@example.com) or Mobile Number (10 digits starting with 6-9)
                </p>
            </div>

            <div className="form-group mb-5">
                <InputLabel required>Name (as registered)</InputLabel>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    className="h-12 !bg-white rounded-[0.625rem] border-[#828282] focus:border-[#A85236] focus:ring-0 focus:shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236] px-4 text-[0.875rem] placeholder:text-[#B2B2B2]"
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
            <p className="text-[0.875rem] font-medium text-center text-[#222222]">
                Where would you like to receive the OTP?
            </p>

            <div
                className={`flex items-center gap-3 p-4 border rounded-[0.625rem] cursor-pointer transition-all ${isOtpSourceSelected
                    ? 'border-[#A85236] bg-[#FFF5F2] shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236]'
                    : 'border-[#828282] bg-[#ffffff]'
                    }`}
                onClick={() => setIsOtpSourceSelected(!isOtpSourceSelected)}
            >
                <input
                    type="radio"
                    checked={isOtpSourceSelected}
                    onChange={() => setIsOtpSourceSelected(!isOtpSourceSelected)}
                    className="w-4 h-4 accent-[#A85236]"
                />
                <span className="text-[0.875rem] font-medium text-[#4A5568]">{maskedIdentifier}</span>
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
