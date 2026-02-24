import { useContentSearch } from "@/hooks/useContent";
import { ContentSearchRequest } from "@/types/workspaceTypes";
import ResourceCard from "@/components/content/ResourceCard";
import { useAppI18n } from "@/hooks/useAppI18n";
import "./landing.css";

interface DynamicResourceSectionProps {
    title: string;
    sectionLabel?: string;
    criteria?: {
        request: ContentSearchRequest;
    };
    sectionClassName?: string;
    innerClassName?: string;
}

const DynamicResourceSection = ({ title, sectionLabel, criteria, sectionClassName = "resource-section", innerClassName = "landing-section-inner" }: DynamicResourceSectionProps) => {
    const { t } = useAppI18n();
    const { data, isLoading, error } = useContentSearch({
        request: criteria?.request,
        enabled: !!criteria?.request,
    });
    const skeletonClassName = sectionClassName.includes("resource-section-home")
        ? "resource-section-skeleton-home"
        : "resource-section-skeleton";

    if (isLoading) {
        return (
            <section className={skeletonClassName}>
                <div className={innerClassName}>
                    <div className="resource-section-skeleton-title"></div>
                    <div className="resource-section-skeleton-subtitle"></div>
                    <div className="resource-section-skeleton-grid">
                        {[1, 2, 3].map(i => <div key={i} className="resource-section-skeleton-card"></div>)}
                    </div>
                </div>
            </section>
        );
    }

    if (error || !data?.data?.content) {
        return null;
    }

    const contents = data.data.content || [];

    // Layout configuration matching ResourceCenter.tsx, but adaptive to content length
    const baseHeights = [
        ["h-[28.6875rem]", "h-[18.5rem]"],
        ["h-[18.5rem]", "h-[28.6875rem]"],
        ["h-[26.875rem]", "h-[18.5rem]"],
    ];
    
    const columns = baseHeights
        .map((heights, colIdx) => {
            const start = colIdx * 2;
            const end = start + 2;
            const items = contents.slice(start, end);
            return { items, heights };
        })
        // Avoid rendering completely empty columns when there are fewer than 6 items
        .filter(col => col.items.length > 0);

    return (
        <section className={sectionClassName}>
            <div className={innerClassName}>
                {sectionLabel && (
                    <div className="resource-section-label-row">
                        <hr className="resource-section-label-line" />
                        <span className="resource-section-label">{t(sectionLabel)}</span>
                        <hr className="resource-section-label-line" />
                    </div>
                )}
                <h2 className="resource-section-title">
                    {title}
                </h2>

                <div className="resource-section-grid">
                    {columns.map((col, colIdx) => (
                        <div key={colIdx} className="resource-section-column">
                            {col.items.map((item) => {
                                if (!item) return null;
                                return (
                                    <ResourceCard
                                        key={item.identifier}
                                        item={item}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DynamicResourceSection;
