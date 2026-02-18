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
