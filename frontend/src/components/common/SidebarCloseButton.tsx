interface SidebarCloseButtonProps {
    onClick: () => void;
    collapsed?: boolean;
}

/**
 * A small circular button with a chevron, used to toggle
 * the desktop sidebar.
 */
const SidebarCloseButton = ({ onClick, collapsed = false }: SidebarCloseButtonProps) => (
    <div className={`absolute -right-[0.75rem] top-[0.5rem] z-[20] transition-all duration-300`}>
        <button
            onClick={onClick}
            aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="w-[1.5rem] h-[1.5rem] bg-sunbird-gray-ef rounded-full flex items-center justify-center shadow-sm text-sunbird-brick hover:opacity-80 transition-opacity"
        >
            <svg
                width="6"
                height="10"
                viewBox="0 0 6 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            >
                <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    </div>
);

export default SidebarCloseButton;
