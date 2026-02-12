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
                <div className="absolute bottom-[-50px] left-0 right-0 w-full">
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
                    className={`absolute w-10 h-10 rounded-full hidden lg:block bg-sunbird-yellow top-[30.71%] ${isRTL ? 'left-[48%]' : 'right-[32%]'}`}
                />
                <div
                    className={`absolute w-4 h-4 rounded-full hidden lg:block bg-sunbird-brick top-[25.73%] ${isRTL ? 'left-[98%]' : 'right-[14%]'}`}
                />

                <div className="w-full relative z-10 pl-[127px] pr-[127px]" style={{ marginTop: '30px' }}>
                    <div className="grid lg:grid-cols-[60%_40%] gap-8 items-start min-h-[30.25rem] pt-8 lg:pt-12" style={{ paddingTop: '50px' }}>
                        {/* Content - Left Side (becomes Right in RTL grid) */}
                        <div className="max-w-[700px] pt-8">
                            <h1
                                className="font-rubik font-semibold text-[60px] leading-[70px] tracking-normal mb-6 text-gray-900"
                            >
                                {t("hero.title", "Knowledge that moves you forward.").split(/(\n)/).map((line, i) =>
                                    line === "\n" ? <br key={i} /> : line
                                )}
                            </h1>

                            <p
                                className="font-rubik font-normal text-[18px] leading-[26px] tracking-normal mb-[45px] max-w-[550px] text-gray-500"
                            >
                                {t("hero.subtitle")}
                            </p>

                            <Link to="/explore">
                                <Button
                                    size="lg"
                                    className="font-rubik font-medium text-[18px] leading-[100%] tracking-normal text-white w-[20rem] h-[3.75rem] px-0 rounded-[12px] shadow-md hover:shadow-lg transition-all flex items-center justify-center bg-sunbird-brick"
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
                            <div className="absolute bottom-[15px] right-[15px] w-[26.25rem]">
                                <img
                                    src={tealShape}
                                    alt=""
                                    className="w-full h-auto rotate-[-0.5deg] origin-center pb-[1rem]  pl-[100px]"
                                    style={{ paddingBottom: '110px' }}
                                />
                            </div>
                            <div className="relative z-10  flex items-end justify-center h-full">
                                <img
                                    src={heroWoman}
                                    alt="Professional learning"
                                    className="w-[22.5rem] h-auto object-contain"
                                    style={{ width: '840px', height: '750px', paddingBottom: '1px', paddingTop: '166px' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-20 -mt-24 lg:-mt-36">
                <div className="w-full pl-[127px] pr-[127px]" style={{ marginTop: '70px' }}>
                    <HeroStats />
                </div>
            </div>
        </section>
    );
};

export default HeroWithStats;
