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
        <section className="pt-[30px] pb-[1.875rem] bg-[#FFF1C7]">
            <div className="w-full pl-[127px] pr-[127px]">

                <div className="flex items-center justify-center gap-4 mb-[20px]">
                    <div className="h-[1px] w-[100px] bg-[#333333]"></div>
                    <span className="font-rubik font-normal text-[16px] leading-[24px] tracking-normal text-[#333333]">
                        Resource Center
                    </span>
                    <div className="h-[1px] w-[100px] bg-[#333333]"></div>
                </div>
                <h2 className="font-rubik font-medium text-[26px] leading-[26px] tracking-normal text-[#333333] text-center mb-[20px]">
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
                            heightClass="h-[459px]"
                        />
                        <ResourceCardComponent
                            id="4"
                            title="Bitcoin Engineering Foundations"
                            type="Epub"
                            image={resourceBitcoin}
                            heightClass="h-[296px]"
                        />
                    </div>

                    {/* Column 2 - Middle: Short top (PDF), Tall bottom (Video) */}
                    <div className="flex flex-col gap-4">
                        <ResourceCardComponent
                            id="2"
                            title="Data Engineering Foundations"
                            type="PDF"
                            image={resourceVR}
                            heightClass="h-[296px]"
                        />
                        <ResourceCardComponent
                            id="5"
                            title="Generative AI for Cybersecurity Professionals"
                            type="Video"
                            image={resourceHacker}
                            heightClass="h-[459px]"
                        />
                    </div>

                    {/* Column 3 - Right: Tall top (HTML), Short bottom (Video) */}
                    <div className="flex flex-col gap-4">
                        <ResourceCardComponent
                            id="3"
                            title="Generative AI for Cybersecurity Professionals"
                            type="HTML"
                            image={resourceHardware}
                            heightClass="h-[430px]"
                        />
                        <ResourceCardComponent
                            id="6"
                            title="Data Engineering Foundations"
                            type="Video"
                            image={resourceEthereum}
                            heightClass="h-[296px]"
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
        <Link to={`/collection/${id}`} className="block group w-[360px]">
            <div className={`relative w-full ${heightClass} rounded-[20px] overflow-hidden`}>
                {/* Background Image Container */}
                <div className="absolute inset-0">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 rounded-[20px]"
                    />
                </div>

                {/* Top-left Badge - Exact 44x38 dimensions */}
                <div className="absolute top-[44px] left-[34px] z-5">
                    <span className="flex items-center justify-center bg-white text-black font-weight-[500] font-bold font-style-[medium] text-[16px] px-3 w-[78px] h-[36px] rounded-[4px] shadow-sm tracking-wide">
                        {type}
                    </span>
                </div>

                {/* Bottom Content - Aligned exactly at bottom-left corner */}
                <div className="absolute bottom-[62px] left-[34px] right-[24px] z-10 flex flex-col items-start gap-1.5">
                    <h3 className="font-rubik font-medium text-[20px] leading-[28px] tracking-normal text-white [text-wrap:balance]">
                        {title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/95 font-semibold text-[14px] group-hover:underline transition-all">
                        {getViewLabel(type)}
                        <FiArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ResourceCenter;
