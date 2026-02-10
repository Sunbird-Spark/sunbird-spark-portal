import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/common/Button";

const continueCourse = {
    id: "1",
    title: "The AI Engineer Course 2026: \n Complete AI Engineer Bootcamp",
    thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
    progress: 30,
};

// Circular progress component
const CircularProgress = ({ progress }: { progress: number }) => {
    const size = 24;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle (non-completed) */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className="stroke-sunbird-ginger/40"
                strokeWidth={strokeWidth}
            />
            {/* Progress circle (completed) */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className="stroke-sunbird-brick"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
            />
        </svg>
    );
};

const HomeContinueLearning = () => {
    const navigate = useNavigate();

    return (
        <div className="home-continue-learning-card">
            <div className="flex flex-col lg:flex-row gap-5">
                {/* Thumbnail */}
                <div className="home-continue-learning-thumbnail">
                    <img
                        src={continueCourse.thumbnail}
                        alt={continueCourse.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h4 className="home-continue-learning-title">
                            {continueCourse.title}
                        </h4>

                        {/* Progress */}
                        <div className="flex items-center gap-2 pt-4 lg:pt-5">
                            <CircularProgress progress={continueCourse.progress} />
                            <span className="text-sm text-muted-foreground">
                                Completed : {continueCourse.progress}%
                            </span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-6 lg:mt-0">
                        <Button
                            onClick={() => navigate(`/course/${continueCourse.id}`)}
                            className="home-continue-learning-btn group"
                        >
                            Continue Learning
                            <FiArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeContinueLearning;
