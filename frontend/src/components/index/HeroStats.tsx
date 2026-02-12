import { useAppI18n } from "@/hooks/useAppI18n";
import { FiArrowRight } from "react-icons/fi";
import Avatar from "react-avatar";

// Icon components matching the design
const BookIcon = () => (
    <svg width="35" height="30" viewBox="0 0 35 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.56087 24.1457H11.6826C14.6381 24.1457 17.0239 26.5368 17.0239 29.487V11.6826C17.0239 6.64754 17.0239 4.12822 15.4571 2.565C13.8903 0.999996 11.3799 1 6.34131 1H4.56087C2.88726 1 2.05053 0.999999 1.5164 1.52167C1.00007 2.04333 1 2.88192 1 4.56087V20.5848C1 22.2637 1.00007 23.1023 1.5164 23.624C2.05053 24.1457 2.88726 24.1457 4.56087 24.1457Z" stroke="#CC8545" strokeWidth="2" />
        <path d="M29.487 24.1457H22.3652C19.4097 24.1457 17.0239 26.5368 17.0239 29.487V11.6826C17.0239 6.64754 17.0239 4.12822 18.5907 2.565C20.1575 0.999996 22.6679 1 27.7065 1H29.487C31.1606 1 31.9973 0.999999 32.5315 1.52167C33.0478 2.04333 33.0479 2.88192 33.0479 4.56087V20.5848C33.0479 22.2637 33.0478 23.1023 32.5315 23.624C31.9973 24.1457 31.1606 24.1457 29.487 24.1457Z" stroke="#CC8545" strokeWidth="2" />
    </svg>
);

const UsersIcon = () => (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24.0164 28.5484C23.4844 26.8839 22.3115 25.4218 20.6829 24.3796C19.0527 23.3374 17.0553 22.7773 15.0004 22.7773C12.9455 22.7773 10.9482 23.3374 9.31794 24.3796C7.68927 25.4218 6.51638 26.8839 5.98438 28.5484" stroke="#CC8545" strokeWidth="2" />
        <path d="M15.0002 16.5557C17.5775 16.5557 19.6668 14.4664 19.6668 11.8891C19.6668 9.31175 17.5775 7.22241 15.0002 7.22241C12.4228 7.22241 10.3335 9.31175 10.3335 11.8891C10.3335 14.4664 12.4228 16.5557 15.0002 16.5557Z" stroke="#CC8545" strokeWidth="2" strokeLinecap="round" />
        <path d="M24.3333 1H5.66667C3.08934 1 1 3.08934 1 5.66667V24.3333C1 26.9107 3.08934 29 5.66667 29H24.3333C26.9107 29 29 26.9107 29 24.3333V5.66667C29 3.08934 26.9107 1 24.3333 1Z" stroke="#CC8545" strokeWidth="2" />
    </svg>
);

const CertificateIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_309_2667)">
            <path d="M17.7333 27.0667H16.8C16.8 27.4202 16.9997 27.7433 17.3159 27.9014C17.6321 28.0595 18.0105 28.0254 18.2933 27.8133L17.7333 27.0667ZM21.4667 24.2667L22.0267 23.52C21.6948 23.2712 21.2386 23.2712 20.9067 23.52L21.4667 24.2667ZM25.2 27.0667L24.64 27.8133C24.9228 28.0254 25.3012 28.0595 25.6174 27.9014C25.9336 27.7433 26.1333 27.4202 26.1333 27.0667H25.2ZM21.4667 20.5333C18.8894 20.5333 16.8 18.444 16.8 15.8667H14.9333C14.9333 19.4749 17.8584 22.4 21.4667 22.4V20.5333ZM26.1333 15.8667C26.1333 18.444 24.044 20.5333 21.4667 20.5333V22.4C25.0749 22.4 28 19.4749 28 15.8667H26.1333ZM21.4667 11.2C24.044 11.2 26.1333 13.2893 26.1333 15.8667H28C28 12.2584 25.0749 9.33333 21.4667 9.33333V11.2ZM21.4667 9.33333C17.8584 9.33333 14.9333 12.2584 14.9333 15.8667H16.8C16.8 13.2893 18.8894 11.2 21.4667 11.2V9.33333ZM16.8 19.6V27.0667H18.6667V19.6H16.8ZM18.2933 27.8133L22.0267 25.0133L20.9067 23.52L17.1733 26.32L18.2933 27.8133ZM20.9067 25.0133L24.64 27.8133L25.76 26.32L22.0267 23.52L20.9067 25.0133ZM26.1333 27.0667V19.6H24.2667V27.0667H26.1333ZM28 9.33333V2.8H26.1333V9.33333H28ZM25.2 0H2.8V1.86667H25.2V0ZM0 2.8V25.2H1.86667V2.8H0ZM2.8 28H14.9333V26.1333H2.8V28ZM0 25.2C0 26.7463 1.2536 28 2.8 28V26.1333C2.28454 26.1333 1.86667 25.7154 1.86667 25.2H0ZM2.8 0C1.2536 0 0 1.2536 0 2.8H1.86667C1.86667 2.28454 2.28454 1.86667 2.8 1.86667V0ZM28 2.8C28 1.2536 26.7463 0 25.2 0V1.86667C25.7154 1.86667 26.1333 2.28454 26.1333 2.8H28ZM5.6 9.33333H14.9333V7.46667H5.6V9.33333ZM5.6 14.9333H11.2V13.0667H5.6V14.9333Z" fill="#CC8545" />
        </g>
        <defs>
            <clipPath id="clip0_309_2667">
                <rect width="28" height="28" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

const HeroStats = () => {
    const { t, isRTL } = useAppI18n();
    const floatingShadow = "shadow-[0_1.125rem_2.5rem_-1.75rem_hsl(var(--foreground)/0.22),0_0.375rem_1.125rem_-0.75rem_hsl(var(--foreground)/0.10)]";

    const avatarNames = ["John Doe", "Jane Smith"];

    return (
        <div className="flex w-full flex-wrap items-center gap-4 lg:gap-10 lg:flex-nowrap">
            {/* Stats Card */}
            <div
                className={`flex flex-col lg:flex-row items-center px-6 py-6 lg:py-0 rounded-2xl bg-surface ${floatingShadow} w-full lg:w-[35.5rem] h-auto lg:h-[11.625rem] gap-6 lg:gap-0`}
            >
                {/* 500+ Courses */}
                <div className="flex-1 text-center relative w-full lg:w-auto">
                    <div className="flex justify-center mb-[0.625rem]">
                        <BookIcon />
                    </div>
                    <div className="font-rubik font-semibold text-[2.125rem] leading-[2.875rem] tracking-normal text-center text-foreground">
                        500+
                    </div>
                    <div className="font-rubik font-normal text-[1.125rem] leading-[1.25rem] tracking-normal text-center text-[#757575]">
                        {t("stats.courses")}
                    </div>
                </div>

                {/* 50K+ Active Learners */}
                <div className="flex-1 text-center relative w-full lg:w-auto">
                    <div className="flex justify-center mb-1.5">
                        <UsersIcon />
                    </div>
                    <div className="font-rubik font-semibold text-[2.125rem] leading-[2.875rem] tracking-normal text-center text-foreground">
                        50K+
                    </div>
                    <div className="font-rubik font-normal text-[1.125rem] leading-[1.25rem] tracking-normal text-center text-[#757575]">
                        {t("stats.activeLearners")}
                    </div>
                </div>

                {/* 200+ Certifications */}
                <div className="flex-1 text-center w-full lg:w-auto">
                    <div className="flex justify-center mb-1.5">
                        <CertificateIcon />
                    </div>
                    <div className="font-rubik font-semibold text-[2.125rem] leading-[2.875rem] tracking-normal text-center text-foreground">
                        200+
                    </div>
                    <div className="font-rubik font-normal text-[1.125rem] leading-[1.25rem] tracking-normal text-center text-[#757575]">
                        {t("stats.certifications")}
                    </div>
                </div>
            </div>

            {/* Learning Process Card */}
            <div
                className={`flex flex-col justify-between px-7 py-[1.25rem] rounded-2xl bg-surface ${floatingShadow} w-full lg:w-[16.25rem] h-[11.625rem]`}
            >
                <div>
                    <p className="font-rubik font-medium text-[1.25rem] leading-[1.5rem] tracking-normal mb-4 text-foreground line-clamp-2 pt-[0.625rem] pl-[0.0625rem]">
                        {t("hero.processSimple")}
                    </p>
                </div>
                <div>
                    <span className="flex items-center justify-center w-[5rem] h-[2.125rem] rounded-[1.375rem] border border-[#D2D6DE] font-rubik font-normal text-[0.875rem] leading-[1.25rem] tracking-[0rem] text-center opacity-[0.99] text-foreground">
                        {t("hero.online")}
                    </span>
                </div>
            </div>

            {/* Study at your own pace Card */}
            <div className="relative w-full lg:w-[16.6875rem] h-[11.625rem]">
                <div className="h-full w-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)]">
                    <div
                        className="relative flex h-full flex-col justify-between bg-white px-6 py-6 rounded-2xl card-mask-custom"
                    >
                        <p className="font-rubik font-medium text-[1.25rem] leading-[1.5rem] tracking-normal text-foreground max-w-[80%] line-clamp-2 pt-[0.625rem] pl-[0.0625rem]">
                            {t("hero.studyPace")}
                        </p>

                        <div className="flex -space-x-3 mb-1">
                            {avatarNames.map((name, index) => (
                                <div
                                    key={index}
                                    className="relative z-10 rounded-full border-[0.1875rem] border-white"
                                >
                                    <Avatar
                                        name={name}
                                        size="40"
                                        round={true}
                                        textSizeRatio={2}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Arrow Button positioned inside cutout */}
                <button
                    className={`absolute bottom-0 right-0 
                        w-[3.5rem] h-[3.5rem] 
                        rounded-full 
                        bg-sunbird-brick 
                        text-white 
                        flex items-center justify-center 
                        shadow-lg
                        hover:scale-105 active:scale-95
                        transition-all`}
                    aria-label="Go"
                >
                    {isRTL ? (
                        <FiArrowRight className="w-6 h-6 rotate-180" />
                    ) : (
                        <FiArrowRight className="w-6 h-6" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default HeroStats;
