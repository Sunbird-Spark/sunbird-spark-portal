import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";

export interface ResourceItem {
    id: string;
    title: string;
    type: string; // "Video" | "PDF" | "HTML" | "Epub" | etc.
    image: string;
    heightClass?: string;
}

interface ResourceCardProps {
    item: ResourceItem;
    className?: string;
}

export const ResourceCard = ({ item, className = "" }: ResourceCardProps) => {
    const { t } = useAppI18n();

    const getViewLabel = (type: string) => {
        switch (type) {
            case "Video": return t("resource.viewVideo", { defaultValue: "Watch Video" });
            case "PDF": return t("resource.viewPdf", { defaultValue: "View PDF" });
            case "HTML": return t("resource.viewHtml", { defaultValue: "View HTML" });
            case "Epub": return t("resource.viewEpub", { defaultValue: "Read Epub" });
            default: return t("view", { defaultValue: "View" });
        }
    };

    // Default height if not provided to match ExploreGrid's CourseCard height approx
    const heightClass = item.heightClass || "h-[24.5rem]"; 

    return (
        <Link to={`/collection/${item.id}`} className={`block group w-full ${className}`}>
            <div className={`relative w-full ${heightClass} rounded-[1.25rem] overflow-hidden`}>
                {/* Background Image Container */}
                <div className="absolute inset-0">
                    <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 rounded-[1.25rem]"
                    />
                </div>

                {/* Top-left Badge - Exact 44x38 dimensions */}
                <div className="absolute top-[2.75rem] left-[2.125rem] z-[5]">
                    <span className="flex items-center justify-center bg-white text-black font-medium text-[1rem] px-3 w-[4.875rem] h-[2.25rem] rounded-[0.25rem] shadow-sm tracking-wide">
                        {item.type}
                    </span>
                </div>

                {/* Bottom Content - Aligned exactly at bottom-left corner */}
                <div className="absolute bottom-[3.875rem] left-[2.125rem] right-[1.5rem] z-10 flex flex-col items-start gap-1.5">
                    <h3 className="font-rubik font-medium text-[1.25rem] leading-[1.75rem] tracking-normal text-white [text-wrap:balance] line-clamp-2">
                        {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/95 font-semibold text-[0.875rem] group-hover:underline transition-all">
                        {getViewLabel(item.type)}
                        <FiArrowRight className="w-4 h-4" />
                    </div>
                </div>
                
                 {/* Gradient Overlay for better readability */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </div>
        </Link>
    );
};
