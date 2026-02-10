import { FiLoader } from "react-icons/fi";
import sunbirdLogo from "@/assets/sunbird-logo.svg";

interface PageLoaderProps {
  message?: string;
}

const PageLoader = ({ message = "Loading..." }: PageLoaderProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <img
              src={sunbirdLogo}
              alt="Loading"
              className="h-10 w-10 object-contain brightness-0 invert"
            />
          </div>
          <FiLoader className="absolute -bottom-1 -right-1 w-6 h-6 text-primary animate-spin" />
        </div>
        <p className="text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;
