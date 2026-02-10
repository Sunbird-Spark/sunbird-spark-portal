import { useNavigate, Link } from "react-router-dom";

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
            <h3 className="home-inprogress-section-title">In Progress Contents</h3>

            <div className="home-inprogress-grid">
                {inProgressItems.map((item) => (
                    <Link
                        key={item.id}
                        to={`/course/${item.id}`}
                        className="home-inprogress-card no-underline"
                    >
                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                            <div>
                                <div className="flex-1 min-w-0">
                                    <span className="home-inprogress-badge">
                                        {item.type}
                                    </span>
                                    <h4 className="home-inprogress-card-title">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-auto">
                                        <div className="flex-1">
                                            <div className="w-21 h-1.5 bg-sunbird-gray-f1 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-sunbird-brick rounded-full"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-[0.625rem] font-medium text-sunbird-gray-77 shrink-0">{item.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Thumbnail */}
                        <div className="w-[5.5rem] h-[5.5rem] rounded-2xl overflow-hidden shrink-0">
                            <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default HomeInProgressGrid;
