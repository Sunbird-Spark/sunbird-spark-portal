import { useAppI18n } from "@/hooks/useAppI18n";
import { FiArrowRight } from "react-icons/fi";
import Avatar from "react-avatar";
import BookIcon from "./BookIcon";
import UsersIcon from "./UsersIcon";
import CertificateIcon from "./CertificateIcon";



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
                    <div className="font-rubik font-normal text-[1.125rem] leading-[1.25rem] tracking-normal text-center text-sunbird-gray-75">
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
                    <div className="font-rubik font-normal text-[1.125rem] leading-[1.25rem] tracking-normal text-center text-sunbird-gray-75">
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
                    <div className="font-rubik font-normal text-[1.125rem] leading-[1.25rem] tracking-normal text-center text-sunbird-gray-75">
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
                    <span className="flex items-center justify-center w-[5rem] h-[2.125rem] rounded-[1.375rem] border border-sunbird-gray-d0 font-rubik font-normal text-[0.875rem] leading-[1.25rem] tracking-[0rem] text-center opacity-[0.99] text-foreground">
                        {t("hero.online")}
                    </span>
                </div>
            </div>

            {/* Study at your own pace Card */}
            <div className="relative w-full lg:w-[16.6875rem] h-[11.625rem]">
                <div className="h-full w-full drop-shadow-sunbird-lg">
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
                                        size="2.5rem"
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
                        <FiArrowRight className="w-[1.5rem] h-[1.5rem] rotate-180" />
                    ) : (
                        <FiArrowRight className="w-[1.5rem] h-[1.5rem]" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default HeroStats;
