import { useAppI18n } from "@/hooks/useAppI18n";
import { CourseGrid } from "@/components/common/CourseGrid";
import { collectionCards } from "@/configs/mockData";

const PopularContent = () => {
    const { t } = useAppI18n();

    return (
        <section className="pt-8 lg:pt-[3.75rem] bg-white">
            <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
                <CourseGrid
                    courses={collectionCards.slice(0, 3)}
                    title={t("trending.mostViewed")}
                    className="mb-[3.75rem]"
                />
                <CourseGrid
                    courses={collectionCards.slice(3, 6)}
                    title={t("trending.trending")}
                    className="mb-0"
                />
            </div>
        </section>
    );
};

export default PopularContent;
