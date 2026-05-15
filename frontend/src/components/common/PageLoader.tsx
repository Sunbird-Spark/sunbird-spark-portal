import sunbirdLogo from "@/assets/sunbird-logo.svg";
import { useAppI18n } from "@/hooks/useAppI18n";
import { FiRefreshCw } from "react-icons/fi";
import { DissolveLoader } from "./DissolveLoader";

interface PageLoaderProps {
  message?: string;
  error?: string | null;
  onRetry?: () => void;
  fullPage?: boolean;
}

const PageLoader = ({
  message,
  error = null,
  onRetry,
  fullPage = true,
}: PageLoaderProps) => {
  const { t } = useAppI18n();
  const displayMessage = message || t("loading");

  const wrapperClass = fullPage
    ? "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-background to-sunbird-ivory/50 backdrop-blur-sm"
    : "flex flex-1 self-stretch w-full items-center justify-center rounded-[1.25rem] border border-border";

  return (
    <div className={wrapperClass} data-testid="page-loader" aria-busy={!error} aria-live="polite">
      <div className="flex flex-col items-center justify-center animate-fade-in w-full h-full min-h-[25rem]">
        {!error ? (
          <>
            {/* Visually hidden live-region so screen readers announce loading state */}
            <span className="sr-only" role="status">{displayMessage}</span>
            <DissolveLoader />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-center max-w-xs h-full w-full">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sunbird-brick to-sunbird-ginger flex items-center justify-center shadow-sunbird-lg">
              <img src={sunbirdLogo} alt={t("error")} className="h-9 w-9 object-contain brightness-0 invert" />
            </div>
            <p className="text-sunbird-brick font-semibold text-lg font-rubik">{t("somethingWentWrong")}</p>
            <p className="text-sunbird-ink text-sm">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 flex items-center gap-2 px-6 py-2.5 bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all"
              >
                <FiRefreshCw className="w-4 h-4" />
                {t("retry")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageLoader;
