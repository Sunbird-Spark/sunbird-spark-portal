import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useNavigate } from "react-router-dom";
import sunbirdLogo from "../../../src/assets/sunbird-logo.svg";
import onboardingImage from "../../../src/assets/onboarding-image.svg";
import { useFormRead } from "@/hooks/useForm";

interface OnboardingField {
  id: string;
  index: number;
  label: string;
  nextScreenId?: string;
}

interface OnboardingScreen {
  title: string;
  selectionType: "single" | "multiple";
  nextScreenId?: string;
  fields: OnboardingField[];
}

interface OnboardingFormData {
  isEnabled: boolean;
  initialScreenId: string;
  screens: Record<string, OnboardingScreen>;
}

// Trace the canonical path (screen-level next, then first field with a next)
// to determine total number of steps for the progress indicator
const computeTotalSteps = (data: OnboardingFormData): number => {
  let current: string | undefined = data.initialScreenId;
  let count = 0;
  const visited = new Set<string>();
  while (current && !visited.has(current)) {
    visited.add(current);
    count++;
    const screenData: OnboardingScreen | undefined = data.screens[current];
    if (!screenData) break;
    current = screenData.nextScreenId ?? screenData.fields.find((f: OnboardingField) => f.nextScreenId)?.nextScreenId;
  }
  return count;
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [screenHistory, setScreenHistory] = useState<string[]>([]);
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  // Per-screen single-selection: Record<screenId, selectedFieldId>
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [otherText, setOtherText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const { data: formApiData, isLoading, isError } = useFormRead({
    request: {
      type: "user",
      subType: "onboarding",
      action: "workflow",
      component: "portal",
    },
  });

  const onboardingData: OnboardingFormData | undefined =
    (formApiData?.data as any)?.form?.data;

  useEffect(() => {
    if (onboardingData && !currentScreenId) {
      if (!onboardingData.isEnabled) {
        navigate("/home");
        return;
      }
      setCurrentScreenId(onboardingData.initialScreenId);
      setScreenHistory([onboardingData.initialScreenId]);
    }
  }, [onboardingData, currentScreenId, navigate]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleBack = () => {
    if (screenHistory.length <= 1) return;
    const newHistory = screenHistory.slice(0, -1);
    setScreenHistory(newHistory);
    setCurrentScreenId(newHistory[newHistory.length - 1] ?? null);
    setOtherText("");
  };

  const handleSkip = () => {
    if (!isSubmitting) navigate("/home");
  };

  const handleNext = () => {
    if (!onboardingData || !currentScreenId) return;
    const screen = onboardingData.screens[currentScreenId];
    if (!screen) return;
    const selectedFieldId = selections[currentScreenId];
    const selectedField = screen.fields.find(f => f.id === selectedFieldId);
    const nextId = screen.nextScreenId ?? selectedField?.nextScreenId;
    if (nextId && onboardingData.screens[nextId]) {
      setCurrentScreenId(nextId);
      setScreenHistory(prev => [...prev, nextId]);
      setOtherText("");
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // TODO: persist selections to backend
    timeoutRef.current = window.setTimeout(() => {
      setIsSubmitting(false);
      navigate("/home");
    }, 1000);
  };

  const handleSelect = (fieldId: string) => {
    if (!currentScreenId) return;
    setSelections(prev => ({ ...prev, [currentScreenId]: fieldId }));
    setOtherText("");
  };

  // Show spinner while form loads or while initializing the first screen
  if (isLoading || (onboardingData && !currentScreenId)) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <span className="onboarding-spinner" />
      </div>
    );
  }

  if (isError || !onboardingData || !currentScreenId) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-muted-foreground">
          Failed to load onboarding.{" "}
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="text-primary underline"
          >
            Skip
          </button>
        </p>
      </div>
    );
  }

  const currentScreen = onboardingData.screens[currentScreenId];
  const totalSteps = computeTotalSteps(onboardingData);
  const currentStep = screenHistory.length;
  const isFirstScreen = currentScreenId === onboardingData.initialScreenId;
  const selectedFieldId = selections[currentScreenId] ?? "";
  const selectedField = currentScreen?.fields.find(f => f.id === selectedFieldId);

  // Determine whether to show "Save and Proceed" or "Submit":
  // - If the screen has a fixed nextScreenId → always "Save and Proceed"
  // - If any field has a nextScreenId: show "Save and Proceed" until a terminal field is selected
  // - Otherwise → "Submit"
  const hasScreenNext = !!currentScreen?.nextScreenId;
  const anyFieldHasNext = currentScreen?.fields.some(f => !!f.nextScreenId) ?? false;
  const selectedFieldHasNext = !!selectedField?.nextScreenId;
  const showNextButton =
    hasScreenNext || (anyFieldHasNext && (!selectedFieldId || selectedFieldHasNext));

  // Show "other text input" only on skills screens when an "other/others" field is selected
  const showOtherInput =
    (selectedFieldId === "other" || selectedFieldId === "others") &&
    currentScreenId.startsWith("skills_");

  const sortedFields = [...(currentScreen?.fields ?? [])].sort(
    (a, b) => a.index - b.index
  );

  const isSubmitDisabled =
    isSubmitting || !selectedFieldId || (showOtherInput && !otherText.trim());

  const ProgressIndicator = () => (
    <div className="flex items-center gap-2 mb-4">
      {!isFirstScreen && (
        <button
          type="button"
          onClick={handleBack}
          disabled={isSubmitting}
          className="flex items-center justify-center w-7 h-7 text-primary hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Go back"
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
            className={`progress-dot ${i < currentStep ? "bg-primary" : "bg-[#C1C1C1]"}`}
          />
        ))}
      </div>
      <span className="text-base text-foreground ml-1">
        {currentStep}/{totalSteps}
      </span>
    </div>
  );

  const OptionChip = ({
    field,
    isSelected,
    onClick,
  }: {
    field: OnboardingField;
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`option-chip ${isSelected ? "option-chip-selected" : "option-chip-default"}`}
    >
      {isSelected && (
        <div className="option-chip-checkmark">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7.5" cy="7.5" r="6.5" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            <path d="M4 7.5L6.625 10L11 5" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
          </svg>
        </div>
      )}
      <span className="text-base font-normal">{field.label}</span>
    </button>
  );

  return (
    <div className="h-screen flex items-center justify-center bg-white p-4 md:p-6 lg:p-8">
      <div className="flex w-full max-w-7xl h-full max-h-[calc(100vh-4rem)] gap-6">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-10 lg:p-12 flex flex-col bg-white rounded-3xl overflow-y-auto">
          {/* Logo */}
          <div className="mb-6">
            <img src={sunbirdLogo} alt="Sunbird" className="onboarding-logo" />
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="onboarding-title">
              We would love to help you personalize your experience!
            </h1>
          </div>

          <div className="flex-1">
            <div className={isFirstScreen ? "space-y-6" : "space-y-8"}>
              <ProgressIndicator />
              <div>
                <h2
                  className={`${
                    isFirstScreen ? "text-2xl font-medium mb-6" : "text-base font-semibold mb-4"
                  } text-foreground`}
                >
                  {currentScreen?.title}
                </h2>
                {!showOtherInput ? (
                  <div className={isFirstScreen ? "onboarding-grid" : "grid grid-cols-3 gap-3 max-w-md"}>
                    {sortedFields.map(field => (
                      <OptionChip
                        key={field.id}
                        field={field}
                        isSelected={selectedFieldId === field.id}
                        onClick={() => handleSelect(field.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md">
                    <Input
                      type="text"
                      placeholder="Please type your preference here"
                      value={otherText}
                      onChange={e => setOtherText(e.target.value)}
                      className="onboarding-input"
                    />
                  </div>
                )}
              </div>

              {showNextButton ? (
                <Button
                  onClick={handleNext}
                  className={isFirstScreen ? "onboarding-button" : "onboarding-button-rounded"}
                  disabled={!selectedFieldId}
                >
                  Save and Proceed
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="onboarding-button-rounded"
                  disabled={isSubmitDisabled}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="onboarding-spinner" />
                      Saving...
                    </span>
                  ) : (
                    "Submit"
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="text-primary hover:text-primary/80 font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip Onboarding
            </button>
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden rounded-3xl">
          <img
            src={onboardingImage}
            alt="Onboarding Image"
            className="onboarding-image-reduced"
          />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;