import { useState } from "react";
import { FiMenu, FiX, FiSearch, FiChevronDown } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import AuthenticatedHeader from "./AuthenticatedHeader";
import { usePermissions } from "@/hooks/usePermission";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";
import { Link, useLocation } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import SearchModal from "@/components/common/SearchModal";

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const defaultToggleSidebar = () => { };

const Header = ({ isSidebarOpen = false, onToggleSidebar = defaultToggleSidebar }: HeaderProps) => {
  const { isAuthenticated, isLoading } = usePermissions();
  const location = useLocation();
  const { t, languages, currentCode, changeLanguage } = useAppI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (isLoading && location.pathname !== "/") {
    return <div className="sticky top-0 z-50 bg-white shadow-[0_14px_14px_rgba(0,0,0,0.05)] h-16 md:h-[4.5rem]" />;
  }

  if (!isLoading && isAuthenticated && location.pathname !== "/" && onToggleSidebar === defaultToggleSidebar) {
    if (import.meta.env.MODE !== "production") {
      // Warn when authenticated header is rendered without a real sidebar toggle handler.
      console.warn(
        "Header: onToggleSidebar was not provided. Sidebar toggle buttons will not function as expected."
      );
    }
  }

  if (!isLoading && isAuthenticated && location.pathname !== "/") {
    return <AuthenticatedHeader isSidebarOpen={isSidebarOpen} onToggleSidebar={onToggleSidebar} />;
  }

  const navLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.explore"), href: "/explore" },
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.contact"), href: "#contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    if (href === "/explore") return location.pathname === "/explore";
    return location.pathname.startsWith(href) && href !== "/";
  };



  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-[0_14px_14px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto px-0">
          <div className="flex items-center justify-between h-16 md:h-[4.5rem] px-4 lg:pl-[3.75rem] lg:pr-[7.9375rem]">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src={sunbirdLogo}
                alt="Sunbird"
                className="h-8 w-auto md:w-[13.1875rem]"
                style={{ paddingRight: 0 }}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 lg:pr-20">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`font-rubik text-[1.125rem] leading-[1.625rem] tracking-normal transition-colors
                  ${isActive(link.href)
                      ? "font-medium text-sunbird-brick"
                      : "font-normal text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <span className="flex items-center gap-1">
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1">
                {/* Search */}
                <button
                  className="p-2.5 text-sunbird-brick hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label={t("header.search")}
                >
                  <FiSearch className="w-[1.125rem] h-[1.125rem] stroke-[2]" aria-hidden="true" />
                </button>



                {/* Language Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 p-2.5 text-sunbird-brick hover:bg-gray-50 rounded-lg transition-colors">
                      <img src={translationIcon} alt="Language" width={21} height={21} />
                      <FiChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[9.375rem] bg-white z-50">
                    {languages.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        className={`cursor-pointer hover:bg-gray-50 ${currentCode === lang.code ? 'font-medium text-sunbird-brick' : ''
                          }`}
                        onClick={() => changeLanguage(lang.code)}
                      >
                        {lang.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Login Button */}
              <Button
                onClick={() => window.location.href = "/portal/login?prompt=none"}
                className="font-rubik font-medium text-[1rem] leading-[1rem] tracking-normal min-w-[4.5rem] h-[1.875rem] rounded-[0.375rem] bg-sunbird-brick text-white hover:bg-opacity-90 flex items-center justify-center px-4 py-0"
              >
                {t("login")}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-sunbird-brick"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? t("header.closeMenu") : t("header.openMenu")}
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block text-sm font-medium ${isActive(link.href) ? 'text-sunbird-brick' : 'text-gray-600'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2 flex flex-col gap-4">
                {/* Search */}
                <button
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-sunbird-brick"
                  onClick={() => {
                    setIsSearchOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  <FiSearch className="w-5 h-5" />
                  <span>{t("header.search")}</span>
                </button>

                {/* Language */}
                <div className="flex items-center gap-2">
                  <img src={translationIcon} alt="Language" className="w-5 h-5" />
                  <select
                    className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none"
                    value={currentCode}
                    onChange={(e) => changeLanguage(e.target.value as any)}
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <hr />
              <Button
                onClick={() => {
                  setIsMenuOpen(false);
                  window.location.href = "/portal/login?prompt=none";
                }}
                className="block w-full text-center bg-sunbird-brick text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {t("login")}
              </Button>
            </div>
          </div>
        )}
      </header>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;
