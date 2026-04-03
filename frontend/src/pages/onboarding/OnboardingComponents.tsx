import { OnboardingField } from '@/types/formTypes';
import { useAppI18n } from '@/hooks/useAppI18n';
import { resolveTitleText } from '@/utils/i18nUtils';

interface ProgressIndicatorProps {
  totalSteps: number;
  currentStep: number;
  isFirstScreen: boolean;
  onBack: () => void;
  isSubmitting: boolean;
}

export const ProgressIndicator = ({ totalSteps, currentStep, isFirstScreen, onBack, isSubmitting }: ProgressIndicatorProps) => {
  const { t } = useAppI18n();
  return (
  <div className="flex items-center gap-2 mb-4">
    {!isFirstScreen && (
      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
        className="flex items-center justify-center w-7 h-7 text-primary hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        aria-label={t('onboarding.goBack')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    )}
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`progress-dot ${i < currentStep ? "bg-primary" : "bg-sunbird-gray-d0"}`}
        />
      ))}
    </div>
    <span className="text-base text-foreground ml-1">
      {currentStep}/{totalSteps}
    </span>
  </div>
);
}

interface OptionChipProps {
  field: OnboardingField;
  isSelected: boolean;
  onClick: () => void;
  [key: string]: any;
}

export const OptionChip = ({ field, isSelected, onClick, ...props }: OptionChipProps) => {
  const { currentCode } = useAppI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`option-chip ${isSelected ? "option-chip-selected" : "option-chip-default"}`}
      {...props}
    >
      {isSelected && (
        <div className="option-chip-checkmark">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7.5" cy="7.5" r="6.5" stroke="hsl(var(--primary-foreground) / 0.6)" strokeWidth="2" />
            <path d="M4 7.5L6.625 10L11 5" stroke="hsl(var(--primary-foreground) / 0.6)" strokeWidth="2" />
          </svg>
        </div>
      )}
      <span className="text-sm font-normal text-center break-words w-full px-2 leading-snug">
        {resolveTitleText(field.label, currentCode)}
      </span>
    </button>
  );
};
