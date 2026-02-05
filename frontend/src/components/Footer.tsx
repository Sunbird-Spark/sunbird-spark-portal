import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { FaFacebook, FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa";
import sunbirdLogo from "@/assets/sunbird-logo.svg";
import { useAppI18n } from "@/hooks/useAppI18n";

const Footer = () => {
  const { t } = useAppI18n();

  const footerLinks = {
    courses: [
      { label: "Leadership", href: "#" },
      { label: "Project Management", href: "#" },
      { label: "IT & Software", href: "#" },
      { label: "Communication", href: "#" },
      { label: "Data Analytics", href: "#" },
    ],
    company: [
      { label: t("about"), href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Press", href: "#" },
      { label: "Partners", href: "#" },
    ],
    support: [
      { label: "Help Center", href: "#" },
      { label: t("contact"), href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Community", href: "#" },
      { label: "Accessibility", href: "#" },
    ],
    legal: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Refund Policy", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: FaFacebook, href: "#", label: "Facebook" },
    { icon: FaTwitter, href: "#", label: "Twitter" },
    { icon: FaLinkedin, href: "#", label: "LinkedIn" },
    { icon: FaYoutube, href: "#", label: "YouTube" },
  ];

  return (
    <footer id="contact" className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <img
                src={sunbirdLogo}
                alt="Sunbird Spark"
                className="h-10 w-auto brightness-0 invert"
              />
            </a>
            <p className="text-background/70 mb-6 max-w-sm">
              Empowering professionals worldwide with industry-leading training and certification programs.
            </p>
            <div className="space-y-3 text-sm text-background/70">
              <div className="flex items-center gap-2">
                <FiMail className="w-4 h-4" />
                <span>contact@sunbirdspark.org</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4" />
                <span>Global</span>
              </div>
            </div>
          </div>

          {/* Courses */}
          <div>
            <h4 className="font-semibold mb-4">{t("courses")}</h4>
            <ul className="space-y-2">
              {footerLinks.courses.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/70 hover:text-secondary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/70 hover:text-secondary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/70 hover:text-secondary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/70 hover:text-secondary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-background/60 text-center md:text-start">
              © {new Date().getFullYear()} Sunbird Spark. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
