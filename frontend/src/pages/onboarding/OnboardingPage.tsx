import React, { useState } from "react";
import { FiCheck, FiCode, FiEdit3, FiTrendingUp, FiBriefcase, FiLayout, FiMoreHorizontal, FiCpu, FiServer, FiBox, FiTerminal, FiGitBranch } from "react-icons/fi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useNavigate } from "react-router-dom";
import sunbirdLogo from "../../../src/assets/sunbird-logo.svg";
import onboardingImage from "../../../src/assets/onboarding-image.svg"


type OnboardingStep = 1 | 2 | 3;

interface OptionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

const languageOptions: OptionItem[] = [
  { id: "english", label: "English" },
  { id: "arabic", label: "Arabic" },
  { id: "french", label: "French" },
  { id: "hindi", label: "Hindi" },
  { id: "kannada", label: "Kannada" },
  { id: "other", label: "Other" },
];

const roleOptions: OptionItem[] = [
  { id: "developer", label: "Developer", icon: <FiCode className="w-5 h-5" /> },
  { id: "teacher", label: "Teacher", icon: <FiEdit3 className="w-5 h-5" /> },
  { id: "marketer", label: "Marketer", icon: <FiTrendingUp className="w-5 h-5" /> },
  { id: "entrepreneur", label: "Entrepreneur", icon: <FiBriefcase className="w-5 h-5" /> },
  { id: "designer", label: "Designer", icon: <FiLayout className="w-5 h-5" /> },
  { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
];

const skillsByRole: Record<string, OptionItem[]> = {
  developer: [
    { id: "ai-ml", label: "AI and ML", icon: <FiCpu className="w-5 h-5" /> },
    { id: "nodejs", label: "Node JS", icon: <FiServer className="w-5 h-5" /> },
    { id: "reactjs", label: "React JS", icon: <FiBox className="w-5 h-5" /> },
    { id: "javascript", label: "JavaScript", icon: <FiTerminal className="w-5 h-5" /> },
    { id: "devops", label: "DevOps", icon: <FiGitBranch className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
  teacher: [
    { id: "curriculum", label: "Curriculum Design", icon: <FiEdit3 className="w-5 h-5" /> },
    { id: "assessment", label: "Assessment", icon: <FiCheck className="w-5 h-5" /> },
    { id: "elearning", label: "E-Learning", icon: <FiLayout className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
  marketer: [
    { id: "digital", label: "Digital Marketing", icon: <FiTrendingUp className="w-5 h-5" /> },
    { id: "content", label: "Content Marketing", icon: <FiEdit3 className="w-5 h-5" /> },
    { id: "seo", label: "SEO", icon: <FiCode className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
  entrepreneur: [
    { id: "startup", label: "Startup Management", icon: <FiBriefcase className="w-5 h-5" /> },
    { id: "finance", label: "Finance", icon: <FiTrendingUp className="w-5 h-5" /> },
    { id: "leadership", label: "Leadership", icon: <FiCheck className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
  designer: [
    { id: "ui-ux", label: "UI/UX Design", icon: <FiLayout className="w-5 h-5" /> },
    { id: "graphic", label: "Graphic Design", icon: <FiEdit3 className="w-5 h-5" /> },
    { id: "motion", label: "Motion Design", icon: <FiBox className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
  other: [
    { id: "general", label: "General Skills", icon: <FiCheck className="w-5 h-5" /> },
    { id: "communication", label: "Communication", icon: <FiEdit3 className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
};

const Onboarding = () => {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [otherSkillText, setOtherSkillText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSkip = () => {
    navigate("/home");
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as OnboardingStep);
    }
  };

  const handleSubmit = () => {
    setIsLoading(true);
    // Simulate saving preferences
    setTimeout(() => {
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

        {/* Step Content */}
        <div className="flex-1">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Skip Link */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleSkip}
            className="text-primary hover:text-primary/80 font-medium transition-colors text-sm"
          >
            Skip Onboarding
          </button>
        </div>
      </div>

      {/* Right Side - Image */}
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
