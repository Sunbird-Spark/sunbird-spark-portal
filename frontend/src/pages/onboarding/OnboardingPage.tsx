import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import sunbirdLogo from "../../../src/assets/sunbird-logo.svg";
import onboardingImage from "../../../src/assets/onboarding-image.svg";
import { useAppI18n } from "@/hooks/useAppI18n";
import { resolveTitleText } from "@/utils/i18nUtils";
import { useFormRead } from "@/hooks/useForm";
import { OnboardingFormData } from '@/types/formTypes';
import { computeTotalSteps } from './utils';
import { ProgressIndicator, OptionChip } from './OnboardingComponents';
import useImpression from '@/hooks/useImpression';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useCurrentUserId } from "@/hooks/useUser";
import { useOnboardingRedirect } from './useOnboardingRedirect';
import { toast } from "@/hooks/useToast";
import { TelemetryTracker } from '@/components/telemetry/TelemetryTracker';

const Onboarding = () => {
  const { t, currentCode } = useAppI18n();
  useImpression({ type: 'view', pageid: 'onboarding', env: 'onboarding' });
  const navigate = useNavigate();
  const telemetry = useTelemetry();
  const [screenHistory, setScreenHistory] = useState<string[]>([]);
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userId } = useCurrentUserId();
  const updateProfile = useUpdateProfile();
  const { data: formApiData, isLoading, isError } = useFormRead({
    request: {
      type: "user",subType: "onboarding",action: "workflow",component: "portal",
    },
  });
  const onboardingData: OnboardingFormData | undefined =
    (formApiData?.data as { form?: { data?: OnboardingFormData } })?.form?.data;
  useOnboardingRedirect();

  useEffect(() => {
    if (onboardingData && !currentScreenId) {
      if (!onboardingData.isEnabled) {
        navigate("/home", { replace: true });
        return;
      }
      setCurrentScreenId(onboardingData.initialScreenId);
      setScreenHistory([onboardingData.initialScreenId]);
    }
  }, [onboardingData, currentScreenId, navigate]);

  const handleBack = () => {
    if (screenHistory.length <= 1) return;
    const newHistory = screenHistory.slice(0, -1);
    setScreenHistory(newHistory);
    setCurrentScreenId(newHistory[newHistory.length - 1] ?? null);
  };
  const handleSkip = async () => {
    if (isSubmitting || userId === undefined) return;
    if (userId === null) { navigate("/", { replace: true }); return; }
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        request: { userId, framework: { onboardingDetails: { isSkipped: true, data: {} } } }
      });
      navigate("/home", { replace: true });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to skip onboarding', description: 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
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
      } else {
        console.error(`Invalid nextScreenId: "${nextId}" does not exist in onboarding screens`);
        // Fallback: treat as terminal screen and allow submission
      }
    }
  };
  const handleSubmit = async () => {
    if (isSubmitting || !userId) return;
    setIsSubmitting(true);
    const formattedData: Record<string, { values: string[] }> = {};
    Object.entries(selections).forEach(([screenId, fieldId]) => {
      const screen = onboardingData?.screens[screenId];
      const field = screen?.fields.find(f => f.id === fieldId);
      const value = field?.requiresTextInput && otherTexts[screenId] ? otherTexts[screenId] : fieldId;
      formattedData[screenId] = { values: [value] };
    });
    try {
      await updateProfile.mutateAsync({
        request: {
          userId,
          framework: { onboardingDetails: { isSkipped: false, data: formattedData } }
        }
      });
      telemetry.audit({ edata: { props: ['onboardingSelections'], state: 'Submitted' } });
      telemetry.log({ edata: { type: 'api', level: 'INFO', message: 'Onboarding selections saved', pageid: 'onboarding' } });
      navigate("/home", { replace: true });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save onboarding', description: 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSelect = (fieldId: string) => {
    if (!currentScreenId) return;
    setSelections(prev => ({ ...prev, [currentScreenId]: fieldId }));
    setOtherTexts(prev => ({ ...prev, [currentScreenId]: "" }));
  };
  if (isLoading || (onboardingData && !currentScreenId)) {
    return <div className="h-screen flex items-center justify-center bg-white"><span className="onboarding-spinner" /></div>;
  }
  if (isError || !onboardingData || !currentScreenId) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-muted-foreground">
          Failed to load onboarding.{" "}
          <button type="button" onClick={() => navigate("/home", { replace: true })} className="text-primary underline">Skip</button>
        </p>
      </div>
    );
  }
  const currentScreen = onboardingData.screens[currentScreenId];
  if (!currentScreen) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-muted-foreground">
          Something went wrong.{" "}
          <button type="button" onClick={() => navigate("/home", { replace: true })} className="text-primary underline">Go to Home</button>
        </p>
      </div>
    );
  }
  const totalSteps = computeTotalSteps(onboardingData);
  const currentStep = screenHistory.length;
  const isFirstScreen = currentScreenId === onboardingData.initialScreenId;
  const selectedFieldId = selections[currentScreenId] ?? "";
  const selectedField = currentScreen.fields.find(f => f.id === selectedFieldId);
  const hasScreenNext = !!currentScreen.nextScreenId;
  const anyFieldHasNext = currentScreen.fields.some(f => !!f.nextScreenId);
  const selectedFieldHasNext = !!selectedField?.nextScreenId;
  const showNextButton =
    hasScreenNext || (anyFieldHasNext && (!selectedFieldId || selectedFieldHasNext));
  const showOtherInput = !!selectedField?.requiresTextInput;
  const sortedFields = [...currentScreen.fields].sort((a, b) => a.index - b.index);
  const otherText = otherTexts[currentScreenId] ?? "";
  const isSubmitDisabled = isSubmitting || !userId || !selectedFieldId || (showOtherInput && !otherText.trim());
  return (
    <div className="h-screen flex items-center justify-center bg-white p-4 md:p-6 lg:p-8">
      <TelemetryTracker startEventInput={{ type: 'workflow', mode: 'user-onboarding', pageid: 'onboarding-page' }} endEventInput={{ type: 'workflow', mode: 'user-onboarding', pageid: 'onboarding-page' }} />
      <div className="flex w-full max-w-7xl h-full max-h-[calc(100vh-4rem)] gap-6">
        <div className="w-full lg:w-1/2 p-8 md:p-10 lg:p-12 flex flex-col bg-white rounded-3xl overflow-y-auto">
          <div className="mb-6">
            <img src={sunbirdLogo} alt={t('onboarding.altSunbird')} className="onboarding-logo" />
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
                  {resolveTitleText(currentScreen.title, currentCode)}
                </h2>             
                {!showOtherInput ? (
                  <div className={isFirstScreen ? "onboarding-grid" : "grid grid-cols-3 gap-3 max-w-md"}>
                    {sortedFields.map(field => (
                      <OptionChip
                        key={field.id} field={field} isSelected={selectedFieldId === field.id}
                        onClick={() => handleSelect(field.id)}
                        data-edataid={`onboarding-select-${field.id}`}
                        data-pageid="onboarding"
                        data-cdata={JSON.stringify([{ id: currentScreenId || '', type: 'ScreenId' }])}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md">
                    <Input type="text"  placeholder={t('onboarding.otherPreferencePlaceholder')} value={otherText}
                      onChange={e => setOtherTexts(prev => ({ ...prev, [currentScreenId]: e.target.value }))}
                      className="onboarding-input"
                    />
                  </div>
                )}
              </div>
              {showNextButton ? (
                <Button  onClick={handleNext} className={isFirstScreen ? "onboarding-button" : "onboarding-button-rounded"}  disabled={!selectedFieldId} >
                  Save and Proceed
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="onboarding-button-rounded"
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
            <button type="button" onClick={handleSkip} disabled={isSubmitting || userId === undefined} className="text-primary hover:text-primary/80 font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip Onboarding
            </button>
          </div>
        </div>
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden rounded-3xl">
          <img src={onboardingImage} alt={t('onboarding.altImage')} className="onboarding-image-reduced" />
        </div>
      </div>
    </div>
  );
};
export default Onboarding;