import React from "react";
import { useAppI18n } from "@/hooks/useAppI18n";
import { CourseGrid } from "@/components/common/CourseGrid";
import { ContentCourse } from "@/components/common/CourseCard";

const PopularContent = () => {
    const { t } = useAppI18n();

    const mostViewedCourses: ContentCourse[] = [
        {
            id: "1",
            title: "The AI Engineer Course 2026: Complete AI Engineer Bootcamp",
            image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=280&fit=crop",
            type: "Course",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
        {
            id: "2",
            title: "Data Engineering Foundations",
            image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=280&fit=crop",
            type: "Textbook",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
        {
            id: "3",
            title: "Generative AI for Cybersecurity Professionals",
            image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=280&fit=crop",
            type: "Course",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
    ];

    const trendingCourses: ContentCourse[] = [
        {
            id: "4",
            title: "The AI Engineer Course 2026: Complete AI Engineer Bootcamp",
            image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=280&fit=crop",
            type: "Course",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
        {
            id: "5",
            title: "Data Engineering Foundations",
            image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=280&fit=crop",
            type: "Textbook",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
        {
            id: "6",
            title: "Generative AI for Cybersecurity Professionals",
            image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=280&fit=crop",
            type: "Course",
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
    ];

    return (
        <section className="pt-[3.75rem] bg-white">
            <div className="w-full pl-[7.9375rem] pr-[7.9375rem]">
                <CourseGrid
                    courses={mostViewedCourses}
                    title={t("trending.mostViewed")}
                    className="mb-[3.75rem]"
                />
                <CourseGrid
                    courses={trendingCourses}
                    title={t("trending.trending")}
                    className="mb-0"
                />
            </div>
        </section>
    );
};

export default PopularContent;
