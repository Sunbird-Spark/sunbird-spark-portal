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
                <div className="absolute bottom-[-14px] left-0 right-0 w-full">
                    <img
                        src={creamWave}
                        alt=""
                        className="w-full h-auto object-cover min-h-[26.75rem]"
                    />
                </div>

                {/* Decorative dots - positioned conditionally based on direction */}
                <div
                    className={`absolute w-8 h-8 rounded-full hidden lg:block bg-sunbird-brick top-[-3%] ${isRTL ? 'left-[38%]' : 'right-[24%]'}`}
                />
                <div
                    className={`absolute w-10 h-10 rounded-full hidden lg:block bg-sunbird-yellow top-[20.71%] ${isRTL ? 'left-[48%]' : 'right-[30%]'}`}
                />
                <div
                    className={`absolute w-4 h-4 rounded-full hidden lg:block bg-sunbird-brick top-[15.73%] ${isRTL ? 'left-[98%]' : 'right-[12%]'}`}
                />

                <div className="w-full relative z-10 pl-[127px] pr-[127px]" style={{ marginTop: '30px' }}>
                    <div className="grid lg:grid-cols-2 gap-8 items-start min-h-[30.25rem] pt-8 lg:pt-12" style={{ paddingTop: '50px' }}>
                        {/* Content - Left Side (becomes Right in RTL grid) */}
                        <div className="max-w-xl pt-8">
                            <h1
                                className="text-[2.5rem] md:text-5xl lg:text-[3.5rem] font-semibold leading-[1.1] mb-6 text-gray-900"
                            >
                                {t("hero.title", "Knowledge that moves you forward.").split(/(\n)/).map((line, i) =>
                                    line === "\n" ? <br key={i} /> : line
                                )}
                            </h1>

                            <p
                                className="text-[0.9375rem] md:text-base mb-[30px] leading-relaxed max-w-md text-gray-500"
                            >
                                {t("hero.subtitle")}
                            </p>

                            <Link to="/explore">
                                <Button
                                    size="lg"
                                    className="text-white font-semibold text-[0.9375rem] w-[17.5rem] h-[3.125rem] px-0 rounded-[12px] shadow-md hover:shadow-lg transition-all flex items-center justify-center bg-sunbird-brick"
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
                            <div className="absolute bottom-[15px] right-[15px] w-[21.25rem]">
                                <img
                                    src={tealShape}
                                    alt=""
                                    className="w-full h-auto rotate-[-0.5deg] origin-center pb-[1rem] pr-[1rem]"
                                    style={{ paddingBottom: '157px' }}
                                />
                            </div>
                            <div className="relative z-10  flex items-end justify-center h-full">
                                <img
                                    src={heroWoman}
                                    alt="Professional learning"
                                    className="w-[22.5rem] h-auto object-contain"
                                    style={{ width: '400px', height: '570px', paddingBottom: '100px' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-20 -mt-24 lg:-mt-36">
                <div className="w-full pl-[127px] pr-[127px]">
                    <HeroStats />
                </div>
            </div>
        </section>
    );
};

export default HeroWithStats;
