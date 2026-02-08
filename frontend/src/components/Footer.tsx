import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { FaFacebook, FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa";
import sunbirdLogo from "@/assets/sunbird-logo.svg";
import { Link } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";

const Footer = () => {
  const { t } = useAppI18n();

  const productLinks = [
    { label: t("courses"), href: "/explore" },
    { label: t("footer.resources"), href: "#" },
    { label: t("footer.videos"), href: "#" },
  ];

  const companyLinks = [
    { label: t("about"), href: "#about" },
    { label: t("contact"), href: "#contact" },
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
          </div>

          {/* Links - Right aligned */}
          <div className="flex flex-col sm:flex-row gap-10 md:gap-20 lg:gap-28 lg:pr-[100px] w-full lg:w-auto">
            {/* Products */}
            <div>
              <h4 className="font-semibold text-[14px] mb-4 text-white">
                {t("footer.products")}
              </h4>
              <ul className="space-y-3">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[14px] text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div id="about">
              <h4 className="font-semibold text-[14px] mb-4 text-white">
                {t("footer.company")}
              </h4>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.label} id={link.href === "#contact" ? "contact" : undefined}>
                    <Link
                      to={link.href}
                      className="text-[14px] text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Darker strip */}
      <div className="bg-[#000000]">
        <div className="w-full py-4 px-6 md:px-12 lg:pl-[108px] lg:pr-[82px]">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-4 md:gap-6 text-[13px] lg:pr-[104px]">
            <a
              href="#"
              className="hover:opacity-80 transition-opacity text-sunbird-brick"
            >
              {t("footer.terms")}
            </a>
            <a
              href="#"
              className="hover:opacity-80 transition-opacity text-sunbird-brick"
            >
              {t("footer.privacy")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
