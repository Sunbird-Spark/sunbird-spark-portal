import { useState, useEffect } from "react";
import { FiMenu, FiX, FiSearch, FiGlobe, FiChevronDown } from "react-icons/fi";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import sunbirdLogo from "@/assets/sunbird-logo.svg";
import { useAppI18n, type LanguageCode } from "@/hooks/useAppI18n";
import { NotificationPopover } from "./NotificationPopover";

interface Notification {
  id: string;
  message: string;
  date: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    message: "COURSE_TEST_1 has been assigned to Group 1312 group by Content Creator",
    date: "Tue, 13 January 3:12",
  },
  {
    id: "2",
    message: "You have been added to Group 1312 group by Content Creator",
    date: "Tue, 13 January 2:48",
  },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const { t, languages, currentLanguage, changeLanguage, dir } = useAppI18n();

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const navLinks = [
    { label: t("courses"), href: "/courses" },
    { label: t("categories"), href: "#categories" },
    { label: t("about"), href: "#about" },
    { label: t("contact"), href: "#contact" },
  ];

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = currentLanguage.code;
  }, [currentLanguage, dir]);

  const handleLanguageChange = (code: string) => {
    changeLanguage(code as LanguageCode);
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img
              src={sunbirdLogo}
              alt="Sunbird Spark"
              className="h-10 w-auto"
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-foreground/80 hover:text-primary font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                className="pl-10 w-56 bg-muted/50 border-border focus:bg-card focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Notifications */}
            <NotificationPopover
              notifications={notifications}
              onDelete={handleDeleteNotification}
              isOpen={isNotificationOpen}
              onOpenChange={setIsNotificationOpen}
            />

            {/* Language Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FiGlobe className="w-4 h-4" />
                  <span className="hidden lg:inline">{currentLanguage.label}</span>
                  <FiChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={currentLanguage.code === lang.code ? "bg-muted" : ""}
                  >
                    <span className="mr-2">{lang.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <a href="/profile">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                {t("login")}
              </Button>
            </a>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Notifications */}
            <NotificationPopover
              notifications={notifications}
              onDelete={handleDeleteNotification}
              isMobile
            />

            {/* Mobile Language Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <FiGlobe className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={currentLanguage.code === lang.code ? "bg-muted" : ""}
                  >
                    <span className="mr-2">{lang.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <FiSearch className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                className="pl-10 w-full bg-muted/50"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 px-4">
                <a href="/profile" className="block">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    {t("login")}
                  </Button>
                </a>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
