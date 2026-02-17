import { useAppI18n } from "@/hooks/useAppI18n";
import { CourseGrid } from "@/components/common/CourseGrid";
import { collectionCards } from "@/configs/mockData";

const MostPopularContent = () => {
    const { t } = useAppI18n();

    return (
        <section className="pt-8 lg:pt-[3.75rem] pb-8 bg-white">
            <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
                <CourseGrid
                    title={t("popular.title")}
                    courses={collectionCards}
                    className="mb-0"
                />
            </div>
        </section>
    );
};

export default MostPopularContent;
