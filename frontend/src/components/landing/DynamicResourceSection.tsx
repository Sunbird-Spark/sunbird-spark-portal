import { useContentSearch } from "@/hooks/useContent";
import { ContentSearchRequest } from "@/types/workspaceTypes";
import ResourceCard from "@/components/content/ResourceCard";

interface DynamicResourceSectionProps {
    title: string;
    criteria?: {
        request: ContentSearchRequest;
    };
}

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
        <section className="pt-[1.875rem] pb-[1.875rem] bg-[#FFF1C7]">
            <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
                <h2 className="font-rubik font-medium text-[1.625rem] leading-[1.625rem] tracking-normal text-[#333333] text-center mb-[1.25rem]">
                    {title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {columns.map((col, colIdx) => (
                        <div key={colIdx} className="flex flex-col gap-2">
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
