import { FiArrowRight, FiStar } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Link } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";

interface ContentCourse {
    id: string;
    title: string;
    image: string;
    type: "Course" | "Textbook" | "Skills";
    rating: number;
    learners: string;
    lessons: number;
}

const MostPopularContent = () => {
    const { t } = useAppI18n();

    const courses: ContentCourse[] = [
        {
            id: "1",
            title: "The AI Engineer Course 2026: Complete AI Engineer\n Bootcamp",
            image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
            type: "Course",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
        {
            id: "2",
            title: "Data Engineering Foundations",
            image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop",
            type: "Textbook",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
        {
            id: "3",
            title: "Generative AI for Cybersecurity Professionals",
            image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop",
            type: "Course",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
        {
            id: "4",
            title: "The AI Engineer Course 2026: Complete AI Engineer Bootcamp",
            image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
            type: "Textbook",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
        {
            id: "5",
            title: "Data Engineering Foundations",
            image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=250&fit=crop",
            type: "Skills",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
        {
            id: "6",
            title: "Generative AI for Cybersecurity Professionals",
            image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop",
            type: "Textbook",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
    ];

    const getBadgeStyle = () => {
        return "bg-[#FFF1C7] text-foreground font-rubik font-medium text-[14px] leading-[18px] border-[#CC8545] border-[1px]";
    };

    return (
        <section className="pt-[60px] pb-8 bg-white">
            <div className="w-full pl-[127px] pr-[127px]">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <h2
                        className="font-rubik font-medium text-[26px] leading-[26px] tracking-normal text-foreground"
                    >
                        {t("popular.title")}
                    </h2>
                    <Link to="/explore">
                        <Button
                            variant="ghost"
                            className="p-0 h-auto hover:bg-transparent text-sunbird-brick"
                        >
                            <FiArrowRight className="w-5 h-3" />
                        </Button>
                    </Link>
                </div>

                {/* Course Cards - 3 column grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {courses.map((course) => (
                        <Link key={course.id} to={`/collection/${course.id}`} className="flex justify-center">
                            <div
                                className="group bg-white rounded-[20px] overflow-hidden transition-all duration-300 hover:shadow-lg shadow-[2px_2px_20px_0px_rgba(0,0,0,0.09)] w-[370px] h-[392px] flex flex-col"
                            >
                                {/* Image with padding */}
                                <div className="px-[20px] pt-[20px] w-full">
                                    <div className="relative overflow-hidden rounded-[20px] h-[162px] w-full">
                                        <img
                                            src={course.image}
                                            alt={course.title}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-[20px]"
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-[20px] pt-[20px] pb-5 flex flex-col flex-grow">
                                    {/* Badge below image */}
                                    <Badge
                                        className={`inline-flex items-center justify-center p-0 rounded-[36px] mb-[20px] ${course.type === 'Textbook' ? 'w-[94px]' : 'w-[78px]'} h-[30px] ${getBadgeStyle()}`}
                                    >
                                        {t(`contentTypes.${course.type.toLowerCase()}`) || course.type}
                                    </Badge>

                                    {/* Title */}
                                    <h3
                                        className="font-rubik font-medium text-[20px] leading-[28px] tracking-normal bg-transparent border-0 text-foreground mb-[20px] min-h-[56px]"
                                    >
                                        {course.title}
                                    </h3>

                                    {/* Stats - Pushed to bottom */}
                                    <div
                                        className="flex items-center gap-1.5 text-xs text-muted-foreground pt-[2px] mt-auto"
                                    >
                                        <span
                                            className="font-medium text-foreground"
                                        >
                                            {course.rating.toFixed(1)}
                                        </span>
                                        <FiStar className="w-3.5 h-3.5 fill-sunbird-brick text-sunbird-brick" />
                                        <span className="mx-0.5">•</span>
                                        <span>{course.learners} {t("contentStats.learners")}</span>
                                        <span className="mx-0.5">•</span>
                                        <span>{course.lessons} {t("contentStats.lessons")}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MostPopularContent;
