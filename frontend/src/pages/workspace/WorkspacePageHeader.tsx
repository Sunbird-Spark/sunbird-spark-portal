import { useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiMenu, FiChevronDown } from "react-icons/fi";
import { Input } from "@/components/common/Input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import { useAppI18n, type LanguageCode } from "@/hooks/useAppI18n";
import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";

interface WorkspacePageHeaderProps {
  isMobile: boolean;
  isSidebarOpen: boolean;
  onMenuOpen: () => void;
}

const WorkspacePageHeader = ({
  isMobile,
  isSidebarOpen,
  onMenuOpen,
}: WorkspacePageHeaderProps) => {
  const navigate = useNavigate();
  const { t, languages, currentCode, changeLanguage } = useAppI18n();

  return (
    <header
      className={isMobile ? "home-header-mobile" : "home-header"}
    >
      <div className="flex items-center justify-between">
        {/* Left: Sunbird Logo + Align with Sidebar */}
        <div
          className={`flex items-center transition-all ${!isMobile && isSidebarOpen ? "w-[13.25rem]" : "w-auto"} ${isMobile ? "pl-0" : "pl-[1.875rem]"}`}
        >
          {isMobile ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onMenuOpen}
                className="text-sunbird-ginger hover:text-sunbird-brick transition-colors p-2 -ml-2"
                aria-label="Open Menu"
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold text-sunbird-obsidian">
                {t("workspace")}
              </h1>
            </div>
          ) : (
            isSidebarOpen ? (
              <img
                src={sunbirdLogo}
                alt="Sunbird"
                className="w-auto"
                style={{ height: "2.4375rem" }}
              />
            ) : (
              <button
                onClick={onMenuOpen}
                className="text-sunbird-brick hover:text-sunbird-brick/90 transition-colors p-1"
              >
                <svg
                  width="20"
                  height="14"
                  viewBox="0 0 20 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M1 7H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M1 13H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )
          )}
        </div>

        {/* Right: Search + Language */}
        <div className={`flex items-center ${isMobile ? "gap-2" : "gap-4"}`}>
          {/* Search Bar */}
          {isMobile ? (
            <button
              onClick={() => navigate("/search")}
              className="text-sunbird-brick hover:text-sunbird-brick p-2"
            >
              <FiSearch className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              className="home-search-container w-full md:w-[25rem] h-[2.875rem] text-left relative"
              onClick={() => navigate("/search")}
            >
              <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sunbird-brick w-4 h-4 cursor-pointer" />
              <Input
                type="text"
                placeholder={t("header.search")}
                className="home-search-input pointer-events-none bg-transparent pl-4 pr-10 h-[2.875rem]"
                readOnly
              />
            </button>
          )}

          {/* Notifications */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiBell className="w-5 h-5 text-sunbird-brick" />
          </button>

          {/* Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <img
                  src={translationIcon}
                  alt="Translate"
                  className="w-5 h-5"
                />
                <FiChevronDown className="w-4 h-4 text-sunbird-brick" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[9.375rem] p-2 bg-white border-gray-100 z-50">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onSelect={() => changeLanguage(lang.code as LanguageCode)}
                  className={`cursor-pointer p-2 rounded-md ${currentCode === lang.code ? "bg-sunbird-brick/10 text-sunbird-brick font-semibold" : ""}`}
                >
                  {lang.label}
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
