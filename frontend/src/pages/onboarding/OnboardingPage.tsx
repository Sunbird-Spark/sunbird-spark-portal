import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useNavigate } from "react-router-dom";
import sunbirdLogo from "../../../src/assets/sunbird-logo.svg";
import onboardingImage from "../../../src/assets/onboarding-image.svg";
import { useFormRead } from "@/hooks/useForm";
import { OnboardingFormData } from '@/types/formTypes';
import { computeTotalSteps } from './utils';
import { ProgressIndicator, OptionChip } from './OnboardingComponents';
const Onboarding = () => {
  const navigate = useNavigate();
  const [screenHistory, setScreenHistory] = useState<string[]>([]);
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [otherText, setOtherText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: formApiData, isLoading, isError } = useFormRead({
    request: {
      type: "user",subType: "onboarding",action: "workflow",component: "portal",
    },
  });
  const onboardingData: OnboardingFormData | undefined =
    (formApiData?.data as { form?: { data?: OnboardingFormData } })?.form?.data;
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
    // TODO: Remove this temporary logging once backend storage is configured
    console.log('[Onboarding] User skipped onboarding at screen:', {
      currentScreenId,currentStep: screenHistory.length,partialSelections: selections,
    });
    if (!isSubmitting) navigate("/home");
  };
  const handleNext = () => {
    if (!onboardingData || !currentScreenId) return;
    const screen = onboardingData.screens[currentScreenId];
    if (!screen) return;
    const selectedFieldId = selections[currentScreenId];
    const selectedField = screen.fields.find(f => f.id === selectedFieldId);
    const nextId = screen.nextScreenId ?? selectedField?.nextScreenId;
    if (nextId) {
      if (onboardingData.screens[nextId]) {
        setCurrentScreenId(nextId);
        setScreenHistory(prev => [...prev, nextId]);
        setOtherText("");
      } else {
        console.error(`Invalid nextScreenId: "${nextId}" does not exist in onboarding screens`);
        // Fallback: treat as terminal screen and allow submission
      }
    }
  };
  const handleSubmit = () => {
    setIsSubmitting(true);
    // TODO: Remove this temporary logging once backend storage is configured
    console.log('[Onboarding] Final submission data:', {
      selections,
      otherText: otherText || null,
      screenHistory,
      timestamp: new Date().toISOString(),
    });
    // Format selections with labels for better readability
    const formattedSelections = Object.entries(selections).map(([screenId, fieldId]) => {
      const screen = onboardingData?.screens[screenId];
      const field = screen?.fields.find(f => f.id === fieldId);
      return {
        screenId,
        screenTitle: screen?.title,
        fieldId,
        fieldLabel: field?.label,
        otherText: fieldId === 'other' || fieldId === 'others' ? otherText : null,
      };
    });
    console.log('[Onboarding] Formatted selections:', formattedSelections);
    timeoutRef.current = setTimeout(() => {
      setIsSubmitting(false);
      navigate("/home");
    }, 1000);
  };
  const handleSelect = (fieldId: string) => {
    if (!currentScreenId) return;
    setSelections(prev => ({ ...prev, [currentScreenId]: fieldId }));
    setOtherText("");   
    // TODO: Remove this temporary logging once backend storage is configured
    console.log('[Onboarding] User selection:', {
      screenId: currentScreenId, fieldId,screenTitle: onboardingData?.screens[currentScreenId]?.title,
      fieldLabel: onboardingData?.screens[currentScreenId]?.fields.find(f => f.id === fieldId)?.label,
    });
  };
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
            type="button" onClick={() => navigate("/home")} className="text-primary underline"
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
  const hasScreenNext = !!currentScreen?.nextScreenId;
  const anyFieldHasNext = currentScreen?.fields.some(f => !!f.nextScreenId) ?? false;
  const selectedFieldHasNext = !!selectedField?.nextScreenId;
  const showNextButton =
    hasScreenNext || (anyFieldHasNext && (!selectedFieldId || selectedFieldHasNext));
  const showOtherInput = !!selectedField?.requiresTextInput;
  const sortedFields = [...(currentScreen?.fields ?? [])].sort((a, b) => a.index - b.index);
  const isSubmitDisabled = isSubmitting || !selectedFieldId || (showOtherInput && !otherText.trim());
  return (
    <div className="h-screen flex items-center justify-center bg-white p-4 md:p-6 lg:p-8">
      <div className="flex w-full max-w-7xl h-full max-h-[calc(100vh-4rem)] gap-6">
        <div className="w-full lg:w-1/2 p-8 md:p-10 lg:p-12 flex flex-col bg-white rounded-3xl overflow-y-auto">
          <div className="mb-6">
            <img src={sunbirdLogo} alt="Sunbird" className="onboarding-logo" />
          </div>
          <div className="mb-8">
            <h1 className="onboarding-title">
              We would love to help you personalize your experience!
            </h1>
          </div>
          <div className="flex-1">
            <div className={isFirstScreen ? "space-y-6" : "space-y-8"}>
              <ProgressIndicator
                totalSteps={totalSteps}
                currentStep={currentStep}
                isFirstScreen={isFirstScreen}
                onBack={handleBack}
                isSubmitting={isSubmitting}
              />           
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
                        key={field.id} field={field} isSelected={selectedFieldId === field.id}
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
                      onChange={e => {
                        const value = e.target.value;
                        setOtherText(value);
                        // TODO: Remove this temporary logging once backend storage is configured
                        console.log('[Onboarding] Other text input:', {
                          screenId: currentScreenId,
                          text: value,
                        });
                      }}
                      className="onboarding-input"
                    />
                  </div>
                )}
              </div>
              {showNextButton ? (
                <Button  onClick={handleNext}
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
              type="button" onClick={handleSkip} disabled={isSubmitting}
              className="text-primary hover:text-primary/80 font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip Onboarding
            </button>
          </div>
        </div>
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden rounded-3xl">
          <img
            src={onboardingImage} alt="Onboarding Image" className="onboarding-image-reduced"
          />
        </div>
      </div>
    </div>
  );
};
export default Onboarding;