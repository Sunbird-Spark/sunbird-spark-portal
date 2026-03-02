import sunbirdLogo from "@/assets/sunbird-logo.svg";
import { Link } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import { TermsAndConditionsDialog } from "@/components/common/TermsAndConditionsDialog";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useGetTncUrl } from "@/hooks/useTnc";

const Footer = () => {
  const { t } = useAppI18n();

  const { data: tncConfigRes } = useSystemSetting("tncConfig");
  const { data: privacyConfigRes } = useSystemSetting("privacyPolicyConfig");

  const { data: termsUrl } = useGetTncUrl(tncConfigRes ?? null);
  const { data: privacyUrl } = useGetTncUrl(privacyConfigRes ?? null);

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
    <footer className="bg-sunbird-footer-bg font-rubik">
      <div className="w-full py-[2.5rem] px-4 md:px-12 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 pb-[1.875rem] ">
          {/* Logo */}
          <div className="shrink-0">
            <Link to="/" className="inline-block">
              <img
                src={sunbirdLogo}
                alt={t("onboarding.altSunbird")}
                className="h-8 w-auto md:w-[12.25rem] h-[2.4375rem] pr-0 lg:pr-[5rem]"
              />
            </Link>
          </div>

          {/* Links - Right aligned */}
          <div className="flex flex-col sm:flex-row gap-10 md:gap-20 lg:gap-28 lg:pr-[6.25rem] w-full lg:w-auto">
            {/* Products */}
            <div>
              <h4 className="font-semibold text-sm mb-6 text-white">
                {t("footer.products")}
              </h4>
              <ul className="space-y-3">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div id="about">
              <h4 className="font-semibold text-sm mb-6 text-white">
                {t("footer.company")}
              </h4>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.label} id={link.href === "#contact" ? "contact" : undefined}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
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
      <div className="bg-black">
        <div className="w-full py-4 px-6 md:px-12 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-4 md:gap-6 text-[0.8125rem] lg:pr-[6.5rem]">
            {termsUrl ? (
              <TermsAndConditionsDialog termsUrl={termsUrl} title={t("footer.terms")}>
                <button
                  type="button"
                  className="hover:opacity-80 transition-opacity text-sunbird-brick"
                >
                  {t("footer.terms")}
                </button>
              </TermsAndConditionsDialog>
            ) : (
              <span className="text-sunbird-brick">{t("footer.terms")}</span>
            )}
            {(privacyUrl || termsUrl) ? (
              <TermsAndConditionsDialog termsUrl={(privacyUrl || termsUrl)!} title={t("footer.privacy")}>
                <button
                  type="button"
                  className="hover:opacity-80 transition-opacity text-sunbird-brick"
                >
                  {t("footer.privacy")}
                </button>
              </TermsAndConditionsDialog>
            ) : (
              <span className="text-sunbird-brick">{t("footer.privacy")}</span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
