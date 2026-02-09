import { Link } from "react-router-dom";
import { FiStar, FiArrowRight } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";
import { RelatedItem } from "@/data/collectionData";

export const RelatedCourseCard = ({ item }: { item: RelatedItem }) => {
    const { t } = useAppI18n();
    return (

        <Link to={`/collection/${item.id}`} className="group block h-full">
            <div className="bg-white w-full h-full rotate-0 opacity-100 rounded-[20px] overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow flex flex-col">
                <div className="p-3 pb-0">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                            style={{ backgroundImage: `url(${item.image})` }}
                        />
                    </div>

                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <span className="inline-flex items-center justify-center text-[12px] font-bold text-foreground bg-[#fff1C7] border-[1px] border-sunbird-ginger rounded-[36px] w-[78px] h-[30px] mb-2 leading-none">
                        {t(`contentTypes.${item.type.toLowerCase()}`) || item.type}
                    </span>
                    <h3 className="text-base font-semibold text-foreground leading-snug mb-3 line-clamp-2 flex-1">
                        {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            {item.rating}
                            <FiStar className="w-3 h-3 text-sunbird-brick fill-sunbird-brick" />
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>{item.learners} {t("contentStats.learners")}</span>
                        <span className="text-gray-300">•</span>
                        <span>{item.lessons} {t("contentStats.lessons")}</span>
                    </div>
                </div>
            </div>

        </Link >

    );
}

export const RelatedResourceCard = ({ item }: { item: RelatedItem }) => {
    const { t } = useAppI18n();

    return (
        <Link to={`/collection/${item.id}`} className="group h-full block">
            <div className="rounded-xl overflow-hidden relative h-full min-h-[15rem]">
                {/* <div className="p-3 pb-0">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                            style={{ backgroundImage: `url(${item.image})` }}
                        />
                    </div>
                </div> */}
                <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Type Badge */}
                <div className="absolute top-6 left-8">
                    <span className="inline-block bg-white text-foreground text-xs font-medium px-3 py-1.5 rounded-md">
                        {t(`contentTypes.${item.type.toLowerCase()}`) || item.type}
                    </span>
                </div>

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-8">
                    <h3
                        className="text-white font-semibold text-base leading-snug mb-2 text-shadow-card"
                    >
                        {item.title}
                    </h3>
                    <p
                        className="text-white/90 text-sm font-medium flex items-center gap-2 text-shadow-card-sm"
                    >
                        {t("resource.seeCaseStudy")}
                        <FiArrowRight className="w-3.5 h-3.5" />
                    </p>
                </div>
            </div>
        </Link>
    );
};
