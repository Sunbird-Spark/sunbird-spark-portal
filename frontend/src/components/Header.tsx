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
import { useAppI18n, type LanguageCode } from "@/hooks/useAppI18n";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const [isSearchOpen, setIsSearchOpen] = useState(false);
  // const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, languages, currentCode, changeLanguage } = useAppI18n();

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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 pr-[56px] pl-[13px]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-[72px] pl-[60px]" style={{
          paddingLeft: '0px',
          marginLeft: '0px',
          paddingRight: '35px',
        }}>
          {/* Logo */}
          <Link to="/" className="flex items-center md:pl-[30px]">
            <img
              src={sunbirdLogo}
              alt="Sunbird"
              className="h-8 w-auto"
              style={{ paddingRight: 0, width: '195px' }}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" style={{
            paddingRight: '80px',
          }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-[15px] transition-colors ${isActive(link.href)
                  ? 'text-sunbird-brick font-medium'
                  : 'text-gray-900 font-normal hover:text-sunbird-brick'
                  }`}
              >
                <span className="flex items-center gap-1">
                  {link.label}
                  {link.href === "/explore" && <FiChevronDown className={`w-4 h-4 pl-[5px] mt-[3px] ${isActive(link.href) ? 'text-sunbird-brick' : 'text-gray-400'}`} />}
                </span>
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1">
              {/* Search */}
              <button className="p-2.5 text-sunbird-brick hover:bg-gray-50 rounded-lg transition-colors" onClick={() => { navigate("/search") }}>
                <FiSearch className="w-[18px] h-[18px] stroke-[2]" />
              </button>

              {/* Notifications - Filled Bell */}
              <button className="p-2.5 text-sunbird-brick hover:bg-gray-50 rounded-lg transition-colors">
                <FiBell className="w-[21px] h-[21px] fill-sunbird-brick" />
              </button>

              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 p-2.5 text-sunbird-brick hover:bg-gray-50 rounded-lg transition-colors">
                    <img src={translationIcon} alt="Language" width={21} height={21} />
                    <FiChevronDown className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[150px] bg-white z-50">
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
              onClick={() => window.location.href = "/home"}
              className="flex items-center justify-center w-[72px] h-[30px] bg-sunbird-brick text-white rounded-[6px] text-sm font-medium p-0"
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
              onClick={() => window.location.href = "/home"}
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
