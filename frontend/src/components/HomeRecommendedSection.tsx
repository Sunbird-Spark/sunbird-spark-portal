import { useNavigate, Link } from "react-router-dom";
import { FiArrowRight, FiStar } from "react-icons/fi";

const recommendedItems = [
    {
        id: "1",
        type: "Course",
        title: "The AI Engineer Course 2026: Complete AI Engineer Bootcamp",
        thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
        rating: 4.5,
        learners: "9k",
        lessons: 25,
        isVideo: false,
    },
    {
        id: "2",
        type: "Video",
        title: "Generative AI for Cybersecurity Professionals",
        thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop",
        rating: null,
        learners: null,
        lessons: null,
        isVideo: true,
    },
    {
        id: "3",
        type: "Textbook",
        title: "Data Engineering Foundations",
        thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop",
        rating: 4.5,
        learners: "9k",
        lessons: 25,
        isVideo: false,
    },
];

const HomeRecommendedSection = () => {
    const navigate = useNavigate();

    return (
        <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="home-section-title-large">Recommended Contents</h3>
                <Link to="/explore" className="text-sunbird-brick hover:text-sunbird-brick/90 transition-colors">
                    <FiArrowRight className="w-5 h-5 stroke-[3px]" />
                </Link>
            </div>

            <div className="home-recommended-grid">
                {recommendedItems.map((item) => (
                    item.isVideo ? (
                        // Video Card
                        <Link
                            key={item.id}
                            to={`/course/${item.id}`}
                            className="home-recommended-card-video group no-underline"
                        >
                            <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Dark Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 flex flex-col justify-between p-6">
                                {/* Badge */}
                                {item.isVideo ? (
                                    <div>
                                        <span className="home-recommended-badge-video">
                                            {item.type}
                                        </span>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="home-recommended-badge-standard">
                                            {item.type}
                                        </span>
                                    </div>
                                )}

                                {/* Content */}
                                <div>
                                    <h4 className="home-recommended-card-video-title">
                                        {item.title}
                                    </h4>

                                    <button className="flex items-center gap-2 text-white text-base font-bold hover:gap-3 transition-all">
                                        View The Video
                                        <FiArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        // Course/Textbook Card
                        <Link
                            key={item.id}
                            to={`/course/${item.id}`}
                            className="home-recommended-card-standard no-underline"
                        >
                            {/* Thumbnail */}
                            <div className="p-4 pb-0">
                                <div className="rounded-2xl overflow-hidden h-[11.875rem] w-full">
                                    <img
                                        src={item.thumbnail}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex-1 flex flex-col relative">
                                {/* Type Badge */}
                                <div className="mb-3">
                                    <span className="home-recommended-badge-standard">
                                        {item.type}
                                    </span>
                                </div>

                                <h4 className="home-recommended-card-title">
                                    {item.title}
                                </h4>

                                {/* Stats */}
                                <div
                                    className="flex items-center gap-2 text-sm text-sunbird-gray-77 mt-4 pb-5"
                                >
                                    {item.rating && (
                                        <div className="flex items-center gap-1 font-normal text-sunbird-obsidian">
                                            <span>{item.rating}</span>
                                            <FiStar className="w-4 h-4 fill-sunbird-brick text-sunbird-brick" />
                                        </div>
                                    )}

                                    {(item.rating && (item.learners || item.lessons)) && (
                                        <span className="text-sunbird-gray-d9">•</span>
                                    )}

                                    {item.learners && (
                                        <span>{item.learners} Learners</span>
                                    )}

                                    {(item.learners && item.lessons) && (
                                        <span className="text-sunbird-gray-d9">•</span>
                                    )}

                                    {item.lessons && (
                                        <span>{item.lessons} Lessons</span>
                                    )}
                                </div>
                            </div>
                        </Link >
                    )
                ))}
            </div >
        </section >
    );
};

export default HomeRecommendedSection;
