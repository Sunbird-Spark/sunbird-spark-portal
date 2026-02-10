import { FiMenu } from "react-icons/fi";

import { Button } from "@/components/common/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import { useAppI18n, type LanguageCode } from "@/hooks/useAppI18n";

const LanguageIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <text
      x="2"
      y="16"
      fontSize="11"
      fontWeight="600"
      fill="currentColor"
    >
      A
    </text>
    <text
      x="12"
      y="16"
      fontSize="9"
      fontWeight="500"
      fill="currentColor"
    >
      あ
    </text>
  </svg>
);

interface WorkspacePageHeaderProps {
  isMobile: boolean;
  onMenuOpen: () => void;
  onBack: () => void;
}

const WorkspacePageHeader = ({
  isMobile,
  onMenuOpen,
  onBack,
}: WorkspacePageHeaderProps) => {
  const { t, languages, currentCode, changeLanguage } = useAppI18n();

  const handleLanguageChange = (code: LanguageCode) => {
    void changeLanguage(code);
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        {/* Left: Menu Toggle + Title */}
        <div className="flex items-center gap-2 md:gap-3">
          {isMobile && (
            <button
              type="button"
              onClick={onMenuOpen}
              className="text-sunbird-ginger hover:text-sunbird-brick transition-colors p-1"
            >
              <FiMenu className="w-5 h-5" />
            </button>
          )}
          {/* Back Arrow */}
          <button
            type="button"
            onClick={onBack}
            className="text-sunbird-brick hover:text-sunbird-ginger transition-colors p-1"
          >
            <svg
              width="8"
              height="14"
              viewBox="0 0 8 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 1L1 7L7 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-sunbird-obsidian font-['Rubik']">
            {t("workspace")}
          </h1>
        </div>

        {/* Right: Language */}
        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-gray-600 hover:text-sunbird-ginger"
              >
                <LanguageIcon />
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white border-gray-200 rounded-xl"
            >
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as LanguageCode)}
                  className={`font-['Rubik'] ${
                    currentCode === lang.code ? "bg-sunbird-ivory" : ""
                  }`}
                >
                  <span className="mr-2">{lang.label}</span>
                  <span className="text-gray-400 text-xs">
                    ({lang.code})
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default WorkspacePageHeader;

