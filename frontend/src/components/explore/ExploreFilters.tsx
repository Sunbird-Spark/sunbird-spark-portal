
import React, { BaseSyntheticEvent } from "react";
import { Checkbox } from "../common/CheckBox";
import { useAppI18n } from "../../hooks/useAppI18n";
import type { FilterState } from "../../pages/Explore";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../landing/Accordion";

interface ExploreFiltersProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const ExploreFilters = ({ filters, setFilters }: ExploreFiltersProps) => {
    const { t } = useAppI18n();

    //TODO: Hardcoded filters, to be replaced with dynamic filters
    const collections = [
        { id: "Collection", label: "Collection" },
        { id: "Resource", label: "Resource" },
        { id: "Content Playlist", label: "Content Playlist" },
        { id: "Course", label: "Course" },
        { id: "Course Assessment", label: "Course Assessment" },
    ];

    const contentTypes = [
        { id: "video", label: "Video" },
        { id: "audio", label: "Audio" },
        { id: "pdf", label: "PDF" },
        { id: "epub", label: "Epub" },
        { id: "youtube", label: "Youtube" },
        { id: "html", label: "HTML" },
        { id: "interactive", label: "Interactive" },
    ];

    const categories = [
        { id: "ai-ml", label: "AI/ML" },
        { id: "cyber-security", label: "Cyber Security" },
        { id: "ux-design", label: "UX Design" },
        { id: "devops", label: "DevOps" },
        { id: "data-science", label: "Data Science" },
        { id: "blockchain", label: "Blockchain" },
    ];

    const handleCheckboxChange = (
        category: keyof FilterState,
        id: string,
        checked: boolean
    ) => {
        setFilters((prev) => ({
            ...prev,
            [category]: checked
                ? [...prev[category], id]
                : prev[category].filter((item) => item !== id),
        }));
    };

    const handleAccordionItemClick = (e: BaseSyntheticEvent) => {
        e.stopPropagation();
    }

    return (
        <div className="bg-[#F8F9FA] rounded-[1.375rem] p-5">
            {/* Filters Title */}
            <h2 className="text-lg font-bold text-foreground mb-4 px-1">{t("filters")}</h2>

            <Accordion type="multiple" defaultValue={["collections", "contentTypes", "categories"]} className="w-full space-y-3">
                {/* Collections Section */}
                <AccordionItem value="collections" className="bg-white rounded-xl border-none px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline py-4 [&>svg]:text-sunbird-brick">
                        <span className="text-sm font-semibold text-foreground">{t("collections")}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-1 pb-4">
                            {collections.map((item) => (
                                <label
                                    key={item.id}
                                    className="flex items-center justify-start gap-3 cursor-pointer group"
                                    onClick={handleAccordionItemClick}
                                >
                                    <Checkbox
                                        checked={filters.collections.includes(item.id)}
                                        onCheckedChange={(checked) =>
                                            handleCheckboxChange("collections", item.id, checked as boolean)
                                        }
                                        className="h-5 w-5 rounded border-sunbird-ginger data-[state=checked]:bg-sunbird-ginger data-[state=checked]:border-sunbird-ginger"
                                    />
                                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                                        {item.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Content Type Section */}
                <AccordionItem value="contentTypes" className="bg-white rounded-xl border-none px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline py-4 [&>svg]:text-sunbird-brick">
                        <span className="text-sm font-semibold text-foreground">{t("contentType")}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-1 pb-4">
                            {contentTypes.map((item) => (
                                <label
                                    key={item.id}
                                    className="flex items-center justify-start gap-3 cursor-pointer group"
                                    onClick={handleAccordionItemClick}

                                >
                                    <Checkbox
                                        checked={filters.contentTypes.includes(item.id)}
                                        onCheckedChange={(checked) =>
                                            handleCheckboxChange("contentTypes", item.id, checked as boolean)
                                        }
                                        className="h-5 w-5 rounded border-sunbird-ginger data-[state=checked]:bg-sunbird-ginger data-[state=checked]:border-sunbird-ginger"
                                    />
                                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                                        {t(`contentTypes.${item.id}`)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Categories Section */}
                <AccordionItem value="categories" className="bg-white rounded-xl border-none px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline py-4 [&>svg]:text-sunbird-brick">
                        <span className="text-sm font-semibold text-foreground">{t("categories")}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-1 pb-4">
                            {categories.map((item) => (
                                <label
                                    key={item.id}
                                    className="flex items-center justify-start gap-3 cursor-pointer group"
                                    onClick={handleAccordionItemClick}
                                >
                                    <Checkbox
                                        checked={filters.categories.includes(item.id)}
                                        onCheckedChange={(checked) =>
                                            handleCheckboxChange("categories", item.id, checked as boolean)
                                        }
                                        className="h-5 w-5 rounded border-sunbird-ginger data-[state=checked]:bg-sunbird-ginger data-[state=checked]:border-sunbird-ginger"
                                    />
                                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                                        {t(`categoriesList.${item.id}`)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
};

export default ExploreFilters;
