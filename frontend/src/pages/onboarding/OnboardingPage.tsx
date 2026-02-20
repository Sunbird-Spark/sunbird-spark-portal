import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useNavigate } from "react-router-dom";
import sunbirdLogo from "../../../src/assets/sunbird-logo.svg";
import onboardingImage from "../../../src/assets/onboarding-image.svg";
import { languageOptions, roleOptions, skillsByRole, type OptionItem } from "./onboardingData";

type OnboardingStep = 1 | 2 | 3;

const Onboarding = () => {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [otherSkillText, setOtherSkillText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSkip = () => {
    if (!isLoading) {
      navigate("/home");
    }
  };

  const handleNext = () => {
    setStep((prev) => (prev < 3 ? ((prev + 1) as OnboardingStep) : prev));
  };

  const handleSubmit = () => {
    setIsLoading(true);
    // Simulate saving preferences
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      navigate("/home");
    }, 1000);
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : [...prev, skillId]
    );
  };
  const getSkillsForRole = (role: string): OptionItem[] => {
    const skills = role ? skillsByRole[role as keyof typeof skillsByRole] : undefined;
    return skills ?? skillsByRole.developer ?? [];
  };
  const currentSkills = getSkillsForRole(selectedRole);
  const showOtherInput = selectedSkills.includes("other");
  const ProgressIndicator = () => (
    <div className="flex items-center gap-1 mb-4">
      <div className={`progress-dot ${step >= 1 ? 'bg-primary' : 'bg-[#C1C1C1]'}`} />
      <div className={`progress-dot ${step >= 2 ? 'bg-primary' : 'bg-[#C1C1C1]'}`} />
      <div className={`progress-dot ${step >= 3 ? 'bg-primary' : 'bg-[#C1C1C1]'}`} />
      <span className="text-base text-foreground ml-2">{step}/3</span>
    </div>
  );
  const OptionChip = ({ 
    option, 
    isSelected, 
    onClick,
    showIcon = false 
  }: { 
    option: OptionItem; 
    isSelected: boolean; 
    onClick: () => void;
    showIcon?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`option-chip ${isSelected ? 'option-chip-selected' : 'option-chip-default'}`}
    >
      {isSelected && (
        <div className="option-chip-checkmark">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7.5" cy="7.5" r="6.5" stroke="rgba(255,255,255,0.6)" strokeWidth="2"/>
            <path d="M4 7.5L6.625 10L11 5" stroke="rgba(255,255,255,0.6)" strokeWidth="2"/>
          </svg>
        </div>
      )}
      {showIcon && option.icon && (
        <span className={`${isSelected ? 'text-white/80' : 'text-[#376673]'}`}>
          {option.icon}
        </span>
      )}
      <span className="text-base font-normal">{option.label}</span>
    </button>
  );
  const renderStep1 = () => (
    <div className="space-y-6">
      <ProgressIndicator />
      <div>
        <h2 className="text-2xl font-medium text-foreground mb-6">
          What is your language preference?
        </h2>
        <div className="onboarding-grid">
          {languageOptions.map((option) => (
            <OptionChip
              key={option.id}
              option={option}
              isSelected={selectedLanguage === option.id}
              onClick={() => setSelectedLanguage(option.id)}
            />
          ))}
        </div>
      </div>
      <Button
        onClick={handleNext}
        className="onboarding-button"
        disabled={!selectedLanguage}
      >
        Save and Proceed
      </Button>
    </div>
  );
  const renderStep2 = () => (
    <div className="space-y-8">
      <ProgressIndicator />
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">
          What role describes you the best?
        </h2>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          {roleOptions.map((option) => (
            <OptionChip
              key={option.id}
              option={option}
              isSelected={selectedRole === option.id}
              onClick={() => {
                setSelectedRole(option.id);
                setSelectedSkills([]);
                setOtherSkillText("");
              }}
              showIcon
            />
          ))}
        </div>
      </div>
      <Button
        onClick={handleNext}
        className="onboarding-button-rounded"
        disabled={!selectedRole}
      >
        Save and Proceed
      </Button>
    </div>
  );
  const renderStep3 = () => (
    <div className="space-y-8">
      <ProgressIndicator /> 
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">
          What skills would you like to learn as a {selectedRole || 'developer'}?
        </h2>    
        {!showOtherInput ? (
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {currentSkills.map((option) => (
              <OptionChip
                key={option.id}
                option={option}
                isSelected={selectedSkills.includes(option.id)}
                onClick={() => toggleSkill(option.id)}
                showIcon
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-w-md">
            <Input
              type="text"
              placeholder="Please type your preference here"
              value={otherSkillText}
              onChange={(e) => setOtherSkillText(e.target.value)}
              className="onboarding-input"
            />
          </div>
        )}
      </div>
      <Button
        onClick={handleSubmit}
        className="onboarding-button-rounded"
        disabled={isLoading || (selectedSkills.length === 0 && !showOtherInput) || (showOtherInput && !otherSkillText.trim())}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="onboarding-spinner" />
            Saving...
          </span>
        ) : (
          "Submit"
        )}
      </Button>
    </div>
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
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
        <div className="mt-6">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isLoading}
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
