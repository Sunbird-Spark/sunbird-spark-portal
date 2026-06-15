import { FiCheck } from 'react-icons/fi';

interface WizardStepperProps {
    currentStep: number;
    steps: string[];
}

const WizardStepper = ({ currentStep, steps }: WizardStepperProps) => {
    return (
        <div className="flex items-center w-full mb-8">
            {steps.map((label, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isActive = stepNumber === currentStep;

                return (
                    <div key={stepNumber} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                            <div
                                className={`
                                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0
                                    ${isCompleted
                                        ? 'bg-[hsl(var(--sunbird-dark-blue))] text-white'
                                        : isActive
                                            ? 'bg-[hsl(var(--sunbird-dark-blue))] text-white ring-4 ring-blue-100'
                                            : 'bg-gray-200 text-gray-500'
                                    }
                                `}
                            >
                                {isCompleted ? <FiCheck className="w-4 h-4" /> : stepNumber}
                            </div>
                            <span
                                className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                                    isActive ? 'text-[hsl(var(--sunbird-dark-blue))]' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                                }`}
                            >
                                {label}
                            </span>
                        </div>

                        {index < steps.length - 1 && (
                            <div
                                className={`h-0.5 flex-1 mx-2 mb-5 ${
                                    isCompleted ? 'bg-[hsl(var(--sunbird-dark-blue))]' : 'bg-gray-200'
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default WizardStepper;
