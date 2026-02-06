import { useNavigate } from "react-router-dom";

const inProgressItems = [
    {
        id: "1",
        type: "Course",
        title: "Data Engineering Foundations",
        thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=120&fit=crop",
        progress: 70,
    },
    {
        id: "2",
        type: "Textbook",
        title: "The AI Engineer Course 2026: Compl...",
        thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=120&fit=crop",
        progress: 30,
    },
    {
        id: "3",
        type: "Textbook",
        title: "The AI Engineer Course 2026: Compl...",
        thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=120&fit=crop",
        progress: 30,
    },
    {
        id: "4",
        type: "Course",
        title: "Data Engineering Foundations",
        thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=200&h=120&fit=crop",
        progress: 50,
    },
    {
        id: "5",
        type: "Textbook",
        title: "The AI Engineer Course 2026: Compl...",
        thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=120&fit=crop",
        progress: 80,
    },
    {
        id: "6",
        type: "Textbook",
        title: "The AI Engineer Course 2026: Compl...",
        thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=120&fit=crop",
        progress: 80,
    },
];

const HomeInProgressGrid = () => {
    const navigate = useNavigate();

    return (
        <section className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">In Progress Contents</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgressItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => navigate(`/course/${item.id}`)}
                        className="bg-white flex items-center gap-4 p-4 rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-lg transition-all cursor-pointer h-[148px]"
                    >
                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                            <div>
                                {/* Type Badge */}
                                <span className="inline-block mb-3 text-[10px] px-3 py-1 rounded-full bg-[#FFF1C7] border border-[#CC8545] text-[#222222]">
                                    {item.type}
                                </span>

                                {/* Title */}
                                <h4 className="font-semibold text-[#222222] text-sm line-clamp-2 leading-snug h-[42px]">
                                    {item.title}
                                </h4>
                            </div>

                            {/* Progress Bar */}
                            <div className="flex items-center gap-3">
                                <div className="w-24 h-1.5 bg-[#F1F1F1] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#A85236] rounded-full"
                                        style={{ width: `${item.progress}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-medium text-[#777777] shrink-0">{item.progress}%</span>
                            </div>
                        </div>

                        {/* Thumbnail */}
                        <div className="w-[88px] h-[88px] rounded-2xl overflow-hidden shrink-0">
                            <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default HomeInProgressGrid;
