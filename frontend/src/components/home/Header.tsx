import { useState } from "react";
import { FiMenu, FiX, FiSearch, FiChevronDown, FiBell } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, languages, currentCode, changeLanguage } = useAppI18n();

  const navLinks = [
    { label: t("home"), href: "/" },
    { label: t("explore"), href: "/explore" },
    { label: t("about"), href: "#about" },
    { label: t("contact"), href: "#contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    if (href === "/explore") return location.pathname === "/explore";
    return location.pathname.startsWith(href) && href !== "/";
  };



  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 pr-[3.5rem] pl-[0.8125rem]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-[4.5rem] pl-[3.75rem]" style={{
          paddingLeft: '0',
          marginLeft: '0',
          paddingRight: '2.1875rem',
        }}>
          {/* Logo */}
          <Link to="/" className="flex items-center md:pl-[1.875rem]">
            <img
              src={sunbirdLogo}
              alt="Sunbird"
              className="h-8 w-auto"
              style={{ paddingRight: 0, width: '12.1875rem' }}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" style={{
            paddingRight: '5rem',
          }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-[0.9375rem] transition-colors ${isActive(link.href)
                  ? 'text-sunbird-brick font-medium'
                  : 'text-gray-900 font-normal hover:text-sunbird-brick'
                  }`}
              >
                <span className="flex items-center gap-1">
                  {link.label}
                  {link.href === "/explore" && <FiChevronDown className={`w-4 h-4 pl-[0.3125rem] mt-[0.1875rem] ${isActive(link.href) ? 'text-sunbird-brick' : 'text-gray-400'}`} />}
                </span>
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1">
              {/* Search */}
              <button className="p-2.5 text-sunbird-brick hover:bg-gray-50 rounded-lg transition-colors" onClick={() => { navigate("/search") }}>
                <FiSearch className="w-[1.125rem] h-[1.125rem] stroke-[2]" />
              </button>

              {/* Notifications - Filled Bell */}
              <button className="p-2.5 text-sunbird-brick hover:bg-gray-50 rounded-lg transition-colors">
                <FiBell className="w-[1.3125rem] h-[1.3125rem] fill-sunbird-brick" />
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
              onClick={() => navigate("/profile")}
              className="flex items-center justify-center w-[4.5rem] h-[1.875rem] bg-sunbird-brick text-white rounded-[0.375rem] text-sm font-medium p-0"
            >
              {t("login")}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-sunbird-brick"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
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
            <hr />
            <Button
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/profile");
              }}
              className="block w-full text-center bg-sunbird-brick text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {t("login")}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
