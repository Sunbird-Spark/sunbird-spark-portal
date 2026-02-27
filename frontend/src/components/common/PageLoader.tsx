import sunbirdLogo from "@/assets/sunbird-logo.svg";
import { FiRefreshCw } from "react-icons/fi";
import { useAppI18n } from '@/hooks/useAppI18n';

interface PageLoaderProps {
  message?: string;
  error?: string | null;
  onRetry?: () => void;
  fullPage?: boolean;
}

const PageLoader = ({ message, error = null, onRetry, fullPage = true }: PageLoaderProps) => {
  const { t } = useAppI18n();
  const displayMessage = message || t("loading");

  const wrapperClass = fullPage
    ? "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-background to-home-ivory/50 backdrop-blur-sm"
    : "flex flex-1 h-full w-full items-center justify-center bg-white rounded-[1.25rem] border border-border shadow-sm p-8";
  return (
    <div className={wrapperClass}>
      <div className="flex flex-col items-center gap-6">
        {/* Logo Container */}
        <div className="relative w-24 h-24">
          {error ? (
            <>
              {/* Static error ring - Sunbird colors */}
              <div className="absolute inset-0 rounded-full border-4 border-sunbird-brick/30" />
              <div className="absolute inset-2 rounded-full border-2 border-sunbird-brick/15" />
              {/* Logo - Sunbird brick/ginger gradient */}
              <div className="absolute inset-4 bg-gradient-to-br from-sunbird-brick to-sunbird-ginger rounded-full flex items-center justify-center shadow-xl">
                <img
                  src={sunbirdLogo}
                  alt={t("error")}
                  className="h-12 w-12 object-contain brightness-0 invert"
                />
              </div>
            </>
          ) : (
            <>
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-4 border-sunbird-brick/20 border-t-sunbird-brick animate-spin" />
              {/* Middle pulsing ring */}
              <div className="absolute inset-2 rounded-full border-2 border-sunbird-ginger/30 animate-pulse" />
              {/* Inner logo */}
              <div className="absolute inset-4 bg-gradient-to-br from-sunbird-brick to-sunbird-ginger rounded-full flex items-center justify-center shadow-xl">
                <img
                  src={sunbirdLogo}
                  alt={t("loading")}
                  className="h-12 w-12 object-contain brightness-0 invert"
                />
              </div>
            </>
          )}
        </div>

        {/* Text & Action */}
        <div className="flex flex-col items-center gap-3">
          {error ? (
            <>
              <p className="text-sunbird-brick font-semibold text-lg">{t("somethingWentWrong")}</p>
              <p className="text-sunbird-ink text-sm text-center max-w-xs">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  {t("retry")}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-sunbird-ink font-semibold text-lg">{displayMessage}</p>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-sunbird-brick animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-sunbird-ginger animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-sunbird-brick animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageLoader;