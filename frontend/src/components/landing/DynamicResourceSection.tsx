import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useContentSearch } from "@/hooks/useContent";
import { ContentSearchRequest, ContentSearchItem } from "@/types/workspaceTypes";
import resourceRobotHand from "@/assets/resource-robot-hand.svg";
import resourceVR from "@/assets/resource-vr.svg"
import resourceHardware from "@/assets/resource-hardware.svg"
import resourceBitcoin from "@/assets/resource-bitcoin.svg"
import resourceHacker from "@/assets/resource-hacker.svg"
import resourceEthereum from "@/assets/resource-ethereum.svg"

interface DynamicResourceSectionProps {
    title: string;
    criteria?: {
        request: ContentSearchRequest;
    };
}

const resourceImages = [
    resourceRobotHand,
    resourceVR,
    resourceHardware,
    resourceBitcoin,
    resourceHacker,
    resourceEthereum
];

const DynamicResourceSection = ({ title, criteria }: DynamicResourceSectionProps) => {
    const { data, isLoading, error } = useContentSearch({
        request: criteria?.request,
        enabled: !!criteria?.request,
    });

    if (isLoading) {
        return (
            <section className="pt-[1.875rem] pb-[1.875rem] bg-[#FFF1C7] animate-pulse">
                <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
                    <div className="h-6 w-48 bg-gray-200 mx-auto mb-4 rounded"></div>
                    <div className="h-8 w-96 bg-gray-300 mx-auto mb-8 rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-[48rem] bg-gray-100 rounded-[1.25rem]"></div>)}
                    </div>
                </div>
            </section>
        );
    }

    if (error || !data?.data?.content) {
        return null;
    }

    const contents = data.data.content || [];

    // Layout configuration matching ResourceCenter.tsx
    const columns = [
        {
            items: contents.slice(0, 2),
            heights: ["h-[28.6875rem]", "h-[18.5rem]"]
        },
        {
            items: contents.slice(2, 4),
            heights: ["h-[18.5rem]", "h-[28.6875rem]"]
        },
        {
            items: contents.slice(4, 6),
            heights: ["h-[26.875rem]", "h-[18.5rem]"]
        }
    ];

    return (
        <section className="pt-[1.875rem] pb-[1.875rem] bg-[#FFF1C7]">
            <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">

                <div className="flex items-center justify-center gap-4 mb-[1.25rem]">
                    <div className="h-[0.0625rem] w-12 lg:w-[6.25rem] bg-[#333333]"></div>
                    <span className="font-rubik font-normal text-[1rem] leading-[1.5rem] tracking-normal text-[#333333]">
                        Resource Center
                    </span>
                    <div className="h-[0.0625rem] w-12 lg:w-[6.25rem] bg-[#333333]"></div>
                </div>
                <h2 className="font-rubik font-medium text-[1.625rem] leading-[1.625rem] tracking-normal text-[#333333] text-center mb-[1.25rem]">
                    {title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {columns.map((col, colIdx) => (
                        <div key={colIdx} className="flex flex-col gap-2">
                            {col.items.map((item, itemIdx) => (
                                <ResourceCardComponent
                                    key={item.identifier}
                                    item={item}
                                    image={resourceImages[(colIdx * 2 + itemIdx) % resourceImages.length]}
                                    heightClass={col.heights[itemIdx]}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ResourceCardComponent = ({
    item,
    image,
    heightClass,
}: {
    item: ContentSearchItem;
    image: string;
    heightClass: string;
}) => {
    const mimeTypeMap: Record<string, string> = {
        'application/pdf': 'PDF',
        'video/mp4': 'Video',
        'video/webm': 'Video',
        'video/x-youtube': 'Video',
        'application/vnd.ekstep.html-archive': 'HTML',
        'application/vnd.ekstep.ecml-archive': 'HTML',
        'application/epub+zip': 'Epub',
    };

    const typeLabel = mimeTypeMap[item.mimeType || ''] || 'Content';

    const getViewLabel = (type: string) => {
        switch (type) {
            case "Video": return "Watch Video";
            case "PDF": return "View PDF";
            case "HTML": return "View Content";
            case "Epub": return "Read Epub";
            default: return "View";
        }
    };

    return (
        <Link to={`/content/${item.identifier}`} className="block group w-full max-w-[22.5rem] mx-auto md:mx-0">
            <div className={`relative w-full ${heightClass} rounded-[1.25rem] overflow-hidden`}>
                <div className="absolute inset-0">
                    <img
                        src={image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 rounded-[1.25rem]"
                    />
                </div>

                <div className="absolute top-[2.75rem] left-[2.125rem] z-[5]">
                    <span className="flex items-center justify-center bg-white text-black font-medium text-[1rem] px-3 w-[4.875rem] h-[2.25rem] rounded-[0.25rem] shadow-sm tracking-wide">
                        {typeLabel}
                    </span>
                </div>

                <div className="absolute bottom-[3.875rem] left-[2.125rem] right-[1.5rem] z-10 flex flex-col items-start gap-1.5">
                    <h3 className="font-rubik font-medium text-[1.25rem] leading-[1.75rem] tracking-normal text-white [text-wrap:balance]">
                        {item.name}
                    </h3>
                    <div className="flex items-center gap-2 text-white/95 font-semibold text-[0.875rem] group-hover:underline transition-all">
                        {getViewLabel(typeLabel)}
                        <FiArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default DynamicResourceSection;
