import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import resourceRobotHand from "@/assets/resource-robot-hand.svg";
import resourceVR from "@/assets/resource-vr.svg"
import resourceHardware from "@/assets/resource-hardware.svg"
import resourceBitcoin from "@/assets/resource-bitcoin.svg"
import resourceHacker from "@/assets/resource-hacker.svg"
import resourceEthereum from "@/assets/resource-ethereum.svg"

interface ResourceCardProps {
    id: string;
    title: string;
    type: "Video" | "PDF" | "HTML" | "Epub";
    image: string;
    heightClass: string;
}

const ResourceCenter = () => {
    const { t } = useAppI18n();

    return (
        <section className="pt-[1.875rem] pb-[1.875rem] bg-[#FFF1C7]">
            <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">

                <div className="flex items-center justify-center gap-4 mb-[1.25rem]">
                    <div className="h-[0.0625rem] w-12 lg:w-[6.25rem] bg-[#333333]"></div>
                    <span className="font-rubik font-normal text-[1rem] leading-[1.5rem] tracking-normal text-[#333333]">
                        {t("resource.header")}
                    </span>
                    <div className="h-[0.0625rem] w-12 lg:w-[6.25rem] bg-[#333333]"></div>
                </div>
                <h2 className="font-rubik font-medium text-[1.625rem] leading-[1.625rem] tracking-normal text-[#333333] text-center mb-[1.25rem]">
                    {t("resource.title")}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1 - Left: Tall top (Video), Short bottom (Epub) */}
                    <div className="flex flex-col gap-2">
                        <ResourceCardComponent
                            id="1"
                            title="Elm Partners with Udacity to Build a Graduate Development Program"
                            type="Video"
                            image={resourceRobotHand}
                            heightClass="h-[28.6875rem]"
                        />
                        <ResourceCardComponent
                            id="4"
                            title="Bitcoin Engineering Foundations"
                            type="Epub"
                            image={resourceBitcoin}
                            heightClass="h-[18.5rem]"
                        />
                    </div>

                    {/* Column 2 - Middle: Short top (PDF), Tall bottom (Video) */}
                    <div className="flex flex-col gap-2">
                        <ResourceCardComponent
                            id="2"
                            title="Data Engineering Foundations"
                            type="PDF"
                            image={resourceVR}
                            heightClass="h-[18.5rem]"
                        />
                        <ResourceCardComponent
                            id="5"
                            title="Generative AI for Cybersecurity Professionals"
                            type="Video"
                            image={resourceHacker}
                            heightClass="h-[28.6875rem]"
                        />
                    </div>

                    {/* Column 3 - Right: Tall top (HTML), Short bottom (Video) */}
                    <div className="flex flex-col gap-2">
                        <ResourceCardComponent
                            id="3"
                            title="Generative AI for Cybersecurity Professionals"
                            type="HTML"
                            image={resourceHardware}
                            heightClass="h-[26.875rem]"
                        />
                        <ResourceCardComponent
                            id="6"
                            title="Data Engineering Foundations"
                            type="Video"
                            image={resourceEthereum}
                            heightClass="h-[18.5rem]"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const ResourceCardComponent = ({
    id,
    title,
    type,
    image,
    heightClass,
}: ResourceCardProps) => {
    const { t } = useAppI18n();

    const getViewLabel = (type: string) => {
        switch (type) {
            case "Video": return t("resource.viewVideo");
            case "PDF": return t("resource.viewPdf");
            case "HTML": return t("resource.viewHtml");
            case "Epub": return t("resource.viewEpub");
            default: return t("view");
        }
    };

    return (
        <Link to={`/collection/${id}`} className="block group w-full max-w-[22.5rem] mx-auto md:mx-0">
            <div className={`relative w-full ${heightClass} rounded-[1.25rem] overflow-hidden`}>
                {/* Background Image Container */}
                <div className="absolute inset-0">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 rounded-[1.25rem]"
                    />
                </div>

                {/* Top-left Badge - Exact 44x38 dimensions */}
                <div className="absolute top-[2.75rem] left-[2.125rem] z-[5]">
                    <span className="flex items-center justify-center bg-white text-black font-medium text-[1rem] px-3 w-[4.875rem] h-[2.25rem] rounded-[0.25rem] shadow-sm tracking-wide">
                        {type}
                    </span>
                </div>

                {/* Bottom Content - Aligned exactly at bottom-left corner */}
                <div className="absolute bottom-[3.875rem] left-[2.125rem] right-[1.5rem] z-10 flex flex-col items-start gap-1.5">
                    <h3 className="font-rubik font-medium text-[1.25rem] leading-[1.75rem] tracking-normal text-white [text-wrap:balance]">
                        {title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/95 font-semibold text-[0.875rem] group-hover:underline transition-all">
                        {getViewLabel(type)}
                        <FiArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ResourceCenter;
