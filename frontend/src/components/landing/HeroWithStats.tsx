import { FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { Link } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import heroWoman from "@/assets/hero-woman-new.svg";
import creamWave from "@/assets/cream-wave.svg";
import tealShape from "@/assets/teal-shape.svg";
import HeroStats from "./HeroStats";

const HeroWithStats = () => {
    const { t, isRTL } = useAppI18n();

    return (
        <section className="relative bg-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-white pb-24 lg:pb-32">
                {/* Cream Wave Background - positioned at bottom */}
                <div className="absolute bottom-[5rem] top-[9.375rem] left-0 right-0 w-full">
                    <img
                        src={creamWave}
                        alt=""
                        className="w-full h-auto object-cover min-h-[26.75rem]"
                    />
                </div>

                {/* Decorative dots - positioned conditionally based on direction */}
                <div
                    className={`absolute w-8 h-8 rounded-full hidden lg:block bg-sunbird-brick top-[-3%] ${isRTL ? 'left-[38%]' : 'right-[27%]'}`}
                />
                <div
                    className={`absolute w-10 h-10 rounded-full hidden lg:block bg-sunbird-yellow top-[25.71%] ${isRTL ? 'left-[48%]' : 'right-[32%]'}`}
                />
                <div
                    className={`absolute w-4 h-4 rounded-full hidden lg:block bg-sunbird-brick top-[21.73%] ${isRTL ? 'left-[98%]' : 'right-[14%]'}`}
                />

                <div className="w-full relative z-10 px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
                    <div className="grid lg:grid-cols-[60%_40%] gap-8 items-start min-h-[30.25rem]" style={{ paddingTop: '0.625rem' }}>
                        {/* Content - Left Side (becomes Right in RTL grid) */}
                        <div className="max-w-[700px] pt-8">
                            <h1
                                className="font-rubik font-semibold text-4xl lg:text-[3.75rem] leading-tight lg:leading-[4.375rem] tracking-normal mb-6 text-sunbird-obsidian max-w-[46.875rem] w-[46.875rem]"
                            >
                                {t("hero.title", "Knowledge that moves you forward.").split(/(\n)/).map((line, i) =>
                                    line === "\n" ? <br key={i} /> : line
                                )}
                            </h1>

                            <p
                                className="font-rubik font-normal text-lg lg:text-[1.125rem] leading-[1.625rem] tracking-normal mb-8 lg:mb-[2.8125rem] text-sunbird-gray-75 max-w-[37.5rem]"
                            >
                                {t("hero.subtitle")}
                            </p>

                            <Link to="/explore">
                                <Button
                                    size="lg"
                                    className="font-rubik font-medium text-[1.125rem] leading-[100%] tracking-normal text-white w-full lg:w-[20rem] h-[3.75rem] px-0 rounded-[0.75rem] shadow-md hover:shadow-lg transition-all flex items-center justify-center bg-sunbird-brick"
                                >
                                    {t("hero.cta")}
                                    {isRTL ? (
                                        <FiArrowRight className="w-4 h-4 mr-2 rotate-180" />
                                    ) : (
                                        <FiArrowRight className="w-4 h-4 ml-2" />
                                    )}
                                </Button>
                            </Link>
                        </div>

                        {/* Hero Image with teal shape - Right Side (becomes Left in RTL grid) */}
                        <div className="hidden lg:flex justify-end items-end relative h-[28rem] -mb-16 ">
                            <div className="absolute bottom-[0.9375rem] right-[0.9375rem] w-[26.25rem]">
                                <img
                                    src={tealShape}
                                    alt=""
                                    className="w-full h-auto rotate-[-0.5deg] origin-center pb-[1rem]  pl-[6.25rem]"
                                    style={{ paddingBottom: '6.075rem' }}
                                />
                            </div>
                            <div className="relative z-10  flex items-end justify-center h-full">
                                <img
                                    src={heroWoman}
                                    alt="Professional learning"
                                    className="w-[55.5rem] h-[44.875rem] object-contain pb-[0.0625rem] pt-[9.975rem]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-20 -mt-24 lg:-mt-36">
                <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
                    <HeroStats />
                </div>
            </div>
        </section>
    );
};

export default HeroWithStats;
