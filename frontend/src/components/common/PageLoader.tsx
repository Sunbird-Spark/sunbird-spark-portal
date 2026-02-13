import sunbirdLogo from "@/assets/sunbird-logo.svg";
import { FiRefreshCw } from "react-icons/fi";

interface PageLoaderProps {
  message?: string;
  error?: string | null;
  onRetry?: () => void;
}

const PageLoader = ({ message = "Loading...", error = null, onRetry }: PageLoaderProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-background to-home-ivory/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Logo Container */}
        <div className="relative w-24 h-24">
          {error ? (
            <>
              {/* Static error ring */}
              <div className="absolute inset-0 rounded-full border-4 border-destructive/30" />
              <div className="absolute inset-2 rounded-full border-2 border-destructive/15" />
              {/* Logo with muted tint */}
              <div className="absolute inset-4 bg-gradient-to-br from-destructive/80 to-home-ginger/60 rounded-full flex items-center justify-center shadow-xl">
                <img
                  src={sunbirdLogo}
                  alt="Error"
                  className="h-12 w-12 object-contain brightness-0 invert opacity-70"
                />
              </div>
            </>
          ) : (
            <>
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-4 border-home-brick/20 border-t-home-brick animate-spin" />
              {/* Middle pulsing ring */}
              <div className="absolute inset-2 rounded-full border-2 border-home-ginger/30 animate-pulse" />
              {/* Inner logo */}
              <div className="absolute inset-4 bg-gradient-to-br from-home-brick to-home-ginger rounded-full flex items-center justify-center shadow-xl">
                <img
                  src={sunbirdLogo}
                  alt="Loading"
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
              <p className="text-destructive font-semibold text-lg">Something went wrong</p>
              <p className="text-muted-foreground text-sm text-center max-w-xs">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-home-brick to-home-ginger text-primary-foreground font-medium rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Retry
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-home-ink font-semibold text-lg">{message}</p>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-home-brick animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-home-ginger animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-home-brick animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
