import { useNavigate } from "react-router-dom";
import { FiHome, FiBook, FiUser, FiHelpCircle } from "react-icons/fi";
import { GoHomeFill } from "react-icons/go";

interface HomeSidebarProps {
    activeNav: string;
    onNavChange: (nav: string) => void;
}

// Custom Explore icon matching the design
const ExploreIcon = ({ className }: { className?: string }) => (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M11.1424 6.85705C13.0359 6.85705 14.5709 5.32205 14.5709 3.42852C14.5709 1.535 13.0359 0 11.1424 0C9.24887 0 7.71387 1.535 7.71387 3.42852C7.71387 5.32205 9.24887 6.85705 11.1424 6.85705Z" fill="currentColor" />
        <path fillRule="evenodd" clipRule="evenodd" d="M9.42844 3.42911C9.42844 2.48626 10.1956 1.71484 11.1427 1.71484C12.0898 1.71484 12.857 2.48626 12.857 3.42911H9.42844ZM5.99992 3.42911C5.99992 2.82911 6.10278 2.25484 6.2922 1.71484H0.857131C0.383738 1.71484 0 2.10055 0 2.57197C0 3.0434 0.383738 3.42911 0.857131 3.42911H5.99992ZM6.68819 6.0005C7.0859 6.6862 7.63875 7.27762 8.29874 7.71476H0.857131C0.383738 7.71476 0 7.32905 0 6.85763C0 6.38621 0.383738 6.0005 0.857131 6.0005H6.68819ZM0.857131 10.2862C0.383738 10.2862 0 10.6719 0 11.1433C0 11.6147 0.383738 12.0004 0.857131 12.0004H12.857C13.3301 12.0004 13.7141 11.6147 13.7141 11.1433C13.7141 10.6719 13.3301 10.2862 12.857 10.2862H0.857131Z" fill="currentColor" />
    </svg>
);

// Custom Profile icon matching the design (Filled version for Active state)
const ProfileNavIconFilled = ({ className }: { className?: string }) => (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M0.0996094 6.5001C0.0996094 3.4841 0.099607 1.97213 1.03721 1.03613C1.97401 0.100133 3.48281 0.100098 6.49961 0.100098H9.69961C12.7164 0.100098 14.2252 0.100133 15.162 1.03613C16.0996 1.97213 16.0996 3.4841 16.0996 6.5001V9.7001C16.0996 12.7161 16.0996 14.2281 15.162 15.1641C14.2252 16.1001 12.7164 16.1001 9.69961 16.1001H6.49961C3.48281 16.1001 1.97401 16.1001 1.03721 15.1641C0.099607 14.2281 0.0996094 12.7161 0.0996094 9.7001V6.5001ZM4.69082 11.6601C5.66842 10.9081 6.86681 10.5001 8.09961 10.5001C9.33241 10.5001 10.5308 10.9081 11.5084 11.6601C12.4868 12.4041 13.19 13.4601 13.5084 14.6521C13.6228 15.0761 13.37 15.5161 12.9428 15.6281C12.5164 15.7481 12.078 15.4921 11.9636 15.0681C11.7356 14.2121 11.2332 13.4601 10.5348 12.9241C9.83641 12.3881 8.98041 12.1001 8.09961 12.1001C7.21881 12.1001 6.3628 12.3881 5.6644 12.9241C4.966 13.4601 4.4636 14.2121 4.2356 15.0681C4.1212 15.4921 3.6828 15.7481 3.2564 15.6281C2.8292 15.5161 2.57642 15.0761 2.69082 14.6521C3.00922 13.4601 3.71242 12.4041 4.69082 11.6601ZM6.49961 5.7001C6.49961 4.8201 7.21561 4.1001 8.09961 4.1001C8.98361 4.1001 9.69961 4.8201 9.69961 5.7001C9.69961 6.5801 8.98361 7.3001 8.09961 7.3001C7.21561 7.3001 6.49961 6.5801 6.49961 5.7001ZM8.09961 2.5001C6.33241 2.5001 4.89961 3.9321 4.89961 5.7001C4.89961 7.4681 6.33241 8.9001 8.09961 8.9001C9.86681 8.9001 11.2996 7.4681 11.2996 5.7001C11.2996 3.9321 9.86681 2.5001 8.09961 2.5001Z" fill="#A85236" />
        <path d="M12.9 0.5H3.3C1.7536 0.5 0.5 1.7536 0.5 3.3V12.9C0.5 14.4464 1.7536 15.7 3.3 15.7H12.9C14.4464 15.7 15.7 14.4464 15.7 12.9V3.3C15.7 1.7536 14.4464 0.5 12.9 0.5Z" stroke="#A85236" />
    </svg>
);

// Custom Profile icon matching the design (Outline version for Inactive state)
const ProfileNavIconOutline = ({ className }: { className?: string }) => (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12.9 0.5H3.3C1.7536 0.5 0.5 1.7536 0.5 3.3V12.9C0.5 14.4464 1.7536 15.7 3.3 15.7H12.9C14.4464 15.7 15.7 14.4464 15.7 12.9V3.3C15.7 1.7536 14.4464 0.5 12.9 0.5Z" stroke="currentColor" />
        <path d="M8.1 8.9C9.86731 8.9 11.3 7.46731 11.3 5.7C11.3 3.93269 9.86731 2.5 8.1 2.5C6.33269 2.5 4.9 3.93269 4.9 5.7C4.9 7.46731 6.33269 8.9 8.1 8.9Z" stroke="currentColor" />
        <path d="M4.2356 15.0681C4.4636 14.2121 4.966 13.4601 5.6644 12.9241C6.3628 12.3881 7.21881 12.1001 8.09961 12.1001C8.98041 12.1001 9.83641 12.3881 10.5348 12.9241C11.2332 13.4601 11.7356 14.2121 11.9636 15.0681" stroke="currentColor" strokeLinecap="round" />
    </svg>
);

const mainNavItems = [
    { id: "home", label: "Home", icon: FiHome, path: "/home" },
    { id: "learning", label: "My Learning", icon: FiBook, path: "/my-learning" },
    { id: "explore", label: "Explore", icon: ExploreIcon, path: "/explore", isCustomIcon: true },
];

const bottomNavItems = [
    { id: "help", label: "Help and Support", icon: FiHelpCircle, path: "/help" },
    { id: "profile", label: "Profile", icon: ProfileNavIconOutline, path: "/profile" },
];

const HomeSidebar = ({ activeNav, onNavChange }: HomeSidebarProps) => {
    const navigate = useNavigate();

    const handleNavClick = (item: typeof mainNavItems[0]) => {
        onNavChange(item.id);
        if (item.path !== "/home") {
            navigate(item.path);
        }
    };

    const renderNavList = (items: typeof mainNavItems) => (
        <ul className="space-y-1">
            {items.map((item) => {
                const isActive = activeNav === item.id;
                let Icon = item.icon;

                // Conditional Icon Logic
                if (item.id === "home" && isActive) {
                    Icon = GoHomeFill;
                } else if (item.id === "profile" && isActive) {
                    Icon = ProfileNavIconFilled;
                }

                return (
                    <li key={item.id}>
                        <button
                            onClick={() => handleNavClick(item)}
                            className={`
                                w-full flex items-center gap-3 px-10 py-4 text-sm transition-colors
                                ${isActive
                                    ? "text-[#A85236] font-bold"
                                    : "text-[#222222] font-normal hover:bg-gray-50"
                                }
                            `}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-[#A85236]" : "text-[#CC8545]"}`} />
                            <span>{item.label}</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );

    return (
        <aside
            className="w-[242px] bg-white flex flex-col shrink-0 z-20 relative h-[704px]"
            style={{
                boxShadow: '2px 2px 20px 0px rgba(0, 0, 0, 0.09)'
            }}
        >
            <nav className="flex flex-col justify-between h-full pt-[40px] pb-4">
                {/* Main Nav (Top) */}
                {renderNavList(mainNavItems)}

                {/* Bottom Nav (Bottom) */}
                {renderNavList(bottomNavItems)}
            </nav>
        </aside>
    );
};

export default HomeSidebar;
