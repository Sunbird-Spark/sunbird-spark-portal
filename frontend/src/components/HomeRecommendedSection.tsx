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
                <h3 className="text-xl font-bold text-[#222222]">Recommended Contents</h3>
                <Link to="/explore" className="text-[#A85236] hover:text-[#A85236]/90 transition-colors">
                    <FiArrowRight className="w-5 h-5 stroke-[3px]" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedItems.map((item) => (
                    item.isVideo ? (
                        // Video Card
                        <div
                            key={item.id}
                            onClick={() => navigate(`/course/${item.id}`)}
                            className="relative rounded-[20px] overflow-hidden cursor-pointer h-[392px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.1)] group"
                        >
                            <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Dark Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 flex flex-col justify-between p-6">
                                {/* Badge */}
                                <div>
                                    <span className="inline-block text-[10px] font-bold px-3 py-1 rounded-[4px] bg-white border border-gray-200 text-[#222222]">
                                        {item.type}
                                    </span>
                                </div>

                                {/* Content */}
                                <div>
                                    <h4 className="font-bold text-white text-[1.75rem] leading-tight mb-4 tracking-tight">
                                        {item.title}
                                    </h4>

                                    <button className="flex items-center gap-2 text-white text-base font-bold hover:gap-3 transition-all">
                                        View The Video
                                        <FiArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Course/Textbook Card
                        <div
                            key={item.id}
                            onClick={() => navigate(`/course/${item.id}`)}
                            className="bg-white rounded-[20px] overflow-hidden shadow-[0px_4px_20px_0px_rgba(0,0,0,0.1)] border border-gray-100 hover:shadow-lg transition-all cursor-pointer h-[392px] flex flex-col"
                        >
                            {/* Thumbnail */}
                            <div className="p-4 pb-0">
                                <div className="rounded-2xl overflow-hidden h-[190px] w-full">
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
                                    <span className={`inline-block text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-[4px] border ${item.type === 'Course' || item.type === 'Textbook'
                                        ? 'bg-[#FFF9F3] border-[#FFE7CC] text-[#A85236]'
                                        : 'bg-gray-100 border-gray-200 text-gray-700'
                                        }`}>
                                        {item.type}
                                    </span>
                                </div>

                                <h4 className="font-bold text-[#222222] text-xl leading-tight line-clamp-3 mb-auto">
                                    {item.title}
                                </h4>

                                {/* Stats */}
                                <div
                                    className="flex items-center gap-2 text-sm text-[#777777] mt-4 pb-5"
                                >
                                    {item.rating && (
                                        <div className="flex items-center gap-1 font-bold text-[#222222]">
                                            <span>{item.rating}</span>
                                            <FiStar className="w-4 h-4 fill-[#A85236] text-[#A85236]" />
                                        </div>
                                    )}

                                    {(item.rating && (item.learners || item.lessons)) && (
                                        <span className="text-[#D9D9D9]">•</span>
                                    )}

                                    {item.learners && (
                                        <span>{item.learners} Learners</span>
                                    )}

                                    {(item.learners && item.lessons) && (
                                        <span className="text-[#D9D9D9]">•</span>
                                    )}

                                    {item.lessons && (
                                        <span>{item.lessons} Lessons</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                ))}
            </div>
        </section>
    );
};

export default HomeRecommendedSection;
