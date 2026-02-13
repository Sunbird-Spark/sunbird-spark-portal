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
    <footer className="bg-[#1C1C1C] font-rubik">
      <div className="w-full py-12 pl-[108px] pr-[82px]">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          {/* Logo */}
          <div>
            <Link to="/" className="inline-block">
              <img
                src={sunbirdLogo}
                alt="Sunbird"
                className="h-8 w-auto"
                style={{ width: '212px', paddingRight: '50px', height: '39px' }}
              />
            </Link>
          </div>

          {/* Links - Right aligned */}
          <div className="flex gap-20 md:gap-28" style={{ paddingRight: '100px' }}>
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
        <div className="w-full py-4 pr-[82px] pl-[108px]">
          <div className="flex flex-col md:flex-row items-center justify-end gap-6 text-[13px]" style={{ paddingRight: '104px' }}>
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
