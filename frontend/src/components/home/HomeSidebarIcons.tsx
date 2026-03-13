// Sidebar navigation icons — outline (inactive) and filled (active) variants.
// All icons use `currentColor` so they respond to the parent's text color class.
// White internal lines use `hsl(var(--sunbird-white))` instead of a hardcoded value.

export const ExploreIcon = ({ className }: { className?: string }) => (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M11.1424 6.85705C13.0359 6.85705 14.5709 5.32205 14.5709 3.42852C14.5709 1.535 13.0359 0 11.1424 0C9.24887 0 7.71387 1.535 7.71387 3.42852C7.71387 5.32205 9.24887 6.85705 11.1424 6.85705Z" fill="currentColor" />
        <path fillRule="evenodd" clipRule="evenodd" d="M9.42844 3.42911C9.42844 2.48626 10.1956 1.71484 11.1427 1.71484C12.0898 1.71484 12.857 2.48626 12.857 3.42911H9.42844ZM5.99992 3.42911C5.99992 2.82911 6.10278 2.25484 6.2922 1.71484H0.857131C0.383738 1.71484 0 2.10055 0 2.57197C0 3.0434 0.383738 3.42911 0.857131 3.42911H5.99992ZM6.68819 6.0005C7.0859 6.6862 7.63875 7.27762 8.29874 7.71476H0.857131C0.383738 7.71476 0 7.32905 0 6.85763C0 6.38621 0.383738 6.0005 0.857131 6.0005H6.68819ZM0.857131 10.2862C0.383738 10.2862 0 10.6719 0 11.1433C0 11.6147 0.383738 12.0004 0.857131 12.0004H12.857C13.3301 12.0004 13.7141 11.6147 13.7141 11.1433C13.7141 10.6719 13.3301 10.2862 12.857 10.2862H0.857131Z" fill="currentColor" />
    </svg>
);

// Help & Support — outline
export const HelpSupportIcon = ({ className }: { className?: string }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M14.75 7.75C14.75 4.45038 14.75 2.80012 13.7262 1.7755C12.7025 0.749997 11.0487 0.75 7.75 0.75C4.45125 0.75 2.79754 0.749997 1.77379 1.7755C0.750038 2.80012 0.75 4.45038 0.75 7.75V13C0.75 13.8251 0.750034 14.2373 1.00378 14.4936C1.26628 14.75 1.6775 14.75 2.5 14.75H7.75C11.0487 14.75 12.7025 14.75 13.7262 13.7245C14.75 12.6999 14.75 11.0496 14.75 7.75Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.125 6H10.375" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.125 9.5H7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Help & Support — filled (box filled, inner lines use white CSS variable)
export const HelpSupportIconFill = ({ className }: { className?: string }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M14.75 7.75C14.75 4.45038 14.75 2.80012 13.7262 1.7755C12.7025 0.749997 11.0487 0.75 7.75 0.75C4.45125 0.75 2.79754 0.749997 1.77379 1.7755C0.750038 2.80012 0.75 4.45038 0.75 7.75V13C0.75 13.8251 0.750034 14.2373 1.00378 14.4936C1.26628 14.75 1.6775 14.75 2.5 14.75H7.75C11.0487 14.75 12.7025 14.75 13.7262 13.7245C14.75 12.6999 14.75 11.0496 14.75 7.75Z" fill="currentColor" />
        <path d="M5.125 6H10.375" stroke="hsl(var(--sunbird-white))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.125 9.5H7.75" stroke="hsl(var(--sunbird-white))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// My Learning — outline
export const MyLearningIcon = ({ className }: { className?: string }) => (
    <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M2.41667 11.5833H5.75C7.13333 11.5833 8.25 12.7025 8.25 14.0833V5.75C8.25 3.39333 8.25 2.21416 7.51666 1.4825C6.78333 0.749998 5.60833 0.75 3.25 0.75H2.41667C1.63333 0.75 1.2417 0.749999 0.991699 0.994166C0.750033 1.23833 0.75 1.63083 0.75 2.41667V9.91667C0.75 10.7025 0.750033 11.095 0.991699 11.3392C1.2417 11.5833 1.63333 11.5833 2.41667 11.5833Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14.0833 11.5833H10.75C9.36667 11.5833 8.25 12.7025 8.25 14.0833V5.75C8.25 3.39333 8.25 2.21416 8.98334 1.4825C9.71667 0.749998 10.8917 0.75 13.25 0.75H14.0833C14.8667 0.75 15.2583 0.749999 15.5083 0.994166C15.75 1.23833 15.75 1.63083 15.75 2.41667V9.91667C15.75 10.7025 15.75 11.095 15.5083 11.3392C15.2583 11.5833 14.8667 11.5833 14.0833 11.5833Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

// My Learning — filled (same book paths, fill instead of stroke)
export const MyLearningIconFill = ({ className }: { className?: string }) => (
    <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M2.41667 11.5833H5.75C7.13333 11.5833 8.25 12.7025 8.25 14.0833V5.75C8.25 3.39333 8.25 2.21416 7.51666 1.4825C6.78333 0.749998 5.60833 0.75 3.25 0.75H2.41667C1.63333 0.75 1.2417 0.749999 0.991699 0.994166C0.750033 1.23833 0.75 1.63083 0.75 2.41667V9.91667C0.75 10.7025 0.750033 11.095 0.991699 11.3392C1.2417 11.5833 1.63333 11.5833 2.41667 11.5833Z" fill="currentColor" />
        <path d="M14.0833 11.5833H10.75C9.36667 11.5833 8.25 12.7025 8.25 14.0833V5.75C8.25 3.39333 8.25 2.21416 8.98334 1.4825C9.71667 0.749998 10.8917 0.75 13.25 0.75H14.0833C14.8667 0.75 15.2583 0.749999 15.5083 0.994166C15.75 1.23833 15.75 1.63083 15.75 2.41667V9.91667C15.75 10.7025 15.75 11.095 15.5083 11.3392C15.2583 11.5833 14.8667 11.5833 14.0833 11.5833Z" fill="currentColor" />
    </svg>
);

// Workspace — filled (document body outlined, only pencil is filled)
export const WorkspaceIconFill = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="currentColor" />
    </svg>
);

// Profile — filled (person inside rounded square)
export const ProfileIconFill = ({ className }: { className?: string }) => (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M0.0996094 6.5001C0.0996094 3.4841 0.099607 1.97213 1.03721 1.03613C1.97401 0.100133 3.48281 0.100098 6.49961 0.100098H9.69961C12.7164 0.100098 14.2252 0.100133 15.162 1.03613C16.0996 1.97213 16.0996 3.4841 16.0996 6.5001V9.7001C16.0996 12.7161 16.0996 14.2281 15.162 15.1641C14.2252 16.1001 12.7164 16.1001 9.69961 16.1001H6.49961C3.48281 16.1001 1.97401 16.1001 1.03721 15.1641C0.099607 14.2281 0.0996094 12.7161 0.0996094 9.7001V6.5001ZM4.69082 11.6601C5.66842 10.9081 6.86681 10.5001 8.09961 10.5001C9.33241 10.5001 10.5308 10.9081 11.5084 11.6601C12.4868 12.4041 13.19 13.4601 13.5084 14.6521C13.6228 15.0761 13.37 15.5161 12.9428 15.6281C12.5164 15.7481 12.078 15.4921 11.9636 15.0681C11.7356 14.2121 11.2332 13.4601 10.5348 12.9241C9.83641 12.3881 8.98041 12.1001 8.09961 12.1001C7.21881 12.1001 6.3628 12.3881 5.6644 12.9241C4.966 13.4601 4.4636 14.2121 4.2356 15.0681C4.1212 15.4921 3.6828 15.7481 3.2564 15.6281C2.8292 15.5161 2.57642 15.0761 2.69082 14.6521C3.00922 13.4601 3.71242 12.4041 4.69082 11.6601ZM6.49961 5.7001C6.49961 4.8201 7.21561 4.1001 8.09961 4.1001C8.98361 4.1001 9.69961 4.8201 9.69961 5.7001C9.69961 6.5801 8.98361 7.3001 8.09961 7.3001C7.21561 7.3001 6.49961 6.5801 6.49961 5.7001ZM8.09961 2.5001C6.33241 2.5001 4.89961 3.9321 4.89961 5.7001C4.89961 7.4681 6.33241 8.9001 8.09961 8.9001C9.86681 8.9001 11.2996 7.4681 11.2996 5.7001C11.2996 3.9321 9.86681 2.5001 8.09961 2.5001Z" fill="currentColor" />
        <path d="M12.9 0.5H3.3C1.7536 0.5 0.5 1.7536 0.5 3.3V12.9C0.5 14.4464 1.7536 15.7 3.3 15.7H12.9C14.4464 15.7 15.7 14.4464 15.7 12.9V3.3C15.7 1.7536 14.4464 0.5 12.9 0.5Z" stroke="currentColor" />
    </svg>
);

// User Report — filled (only the highlighted slice is filled, arc stays as stroke)
export const UserReportIconFill = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" fill="currentColor" />
    </svg>
);

// User Management — filled (front person filled, back person outlined)
export const UsersIconFill = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="9" cy="7" r="4" fill="currentColor" />
        <path d="M1 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2z" fill="currentColor" />
        <path d="M17 11a4 4 0 0 0 0-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// Admin Reports — filled (three solid bars matching FiBarChart2)
export const BarChartIconFill = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="18" y="3" width="3" height="18" rx="1" />
        <rect x="11" y="8" width="3" height="13" rx="1" />
        <rect x="4" y="13" width="3" height="8" rx="1" />
    </svg>
);
