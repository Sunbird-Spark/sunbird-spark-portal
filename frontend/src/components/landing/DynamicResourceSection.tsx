import { useContentSearch } from "@/hooks/useContent";
import { ContentSearchRequest } from "@/types/workspaceTypes";
import ResourceCard from "@/components/content/ResourceCard";
import "./landing.css";

interface DynamicResourceSectionProps {
    title: string;
    criteria?: {
        request: ContentSearchRequest;
    };
    innerClassName?: string;
}

const DynamicResourceSection = ({ title, criteria, innerClassName = "landing-section-inner" }: DynamicResourceSectionProps) => {
    const { data, isLoading, error } = useContentSearch({
        request: criteria?.request,
        enabled: !!criteria?.request,
    });

    if (isLoading) {
        return (
            <section className="resource-section-skeleton">
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
        <section className="resource-section">
            <div className={innerClassName}>
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
