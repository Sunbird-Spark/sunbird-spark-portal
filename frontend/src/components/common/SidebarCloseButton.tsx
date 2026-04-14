import { useAppI18n } from "@/hooks/useAppI18n";

interface SidebarCloseButtonProps {
    onClick: () => void;
    collapsed?: boolean;
}

/**
 * A small circular button with a chevron, used to toggle
 * the desktop sidebar.
 */
const SidebarCloseButton = ({ onClick, collapsed = false }: SidebarCloseButtonProps) => {
    const { t, dir } = useAppI18n();
    
    // Determine rotation based on collapsed state and text direction
    const getRotation = () => {
        if (dir === 'rtl') {
            return collapsed ? 'rotate-0' : 'rotate-180';
        }
        return collapsed ? 'rotate-180' : 'rotate-0';
    };
    
    return (
        <div className={`absolute top-[0.5rem] z-[20] transition-all duration-300 ltr:-right-[0.75rem] rtl:-left-[0.75rem]`}>
            <button
                onClick={onClick}
                aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
                className="w-[1.5rem] h-[1.5rem] bg-sunbird-gray-ef rounded-full flex items-center justify-center shadow-sm text-sunbird-brick hover:opacity-80 transition-opacity"
            >
                <svg
                    width="6"
                    height="10"
                    viewBox="0 0 6 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    className={`transition-transform duration-300 ${getRotation()}`}
                >
                    <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
};

export default SidebarCloseButton;
