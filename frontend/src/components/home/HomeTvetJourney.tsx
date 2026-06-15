import { FiCheck, FiLock, FiPlayCircle } from 'react-icons/fi';

const MOCK_JOURNEY = {
    tradeName: 'Plumbing',
    frameworkName: 'Plumbing Journey',
    category: 'Engineering Studies',
    levels: [
        { label: 'Level 1', status: 'completed' as const },
        { label: 'Level 2', status: 'in-progress' as const },
        { label: 'Level 3', status: 'locked' as const },
    ],
    currentLevelIndex: 1,
    topicsComplete: 4,
    totalTopics: 8,
    ongoingCourse: 'Advanced Pipe Welding & Hydraulics',
    courseProgress: 30,
    resumeTopicNumber: 5,
};

const HomeTvetJourney = () => {
    const { tradeName, frameworkName, category, levels, currentLevelIndex, topicsComplete, totalTopics, ongoingCourse, courseProgress, resumeTopicNumber } = MOCK_JOURNEY;

    return (
        <section className="mb-8">
            <h3 className="home-section-title-large mb-4">
                My {tradeName} Learning Path Journey
            </h3>

            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left — journey card */}
                <div
                    className="flex-1 bg-white rounded-[1.25rem] p-6"
                    style={{ boxShadow: '0.125rem 0.125rem 1.25rem 0 rgba(0,0,0,0.09)' }}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <h4 className="font-rubik font-semibold text-[1.125rem] text-sunbird-obsidian leading-snug">
                            {frameworkName}
                        </h4>
                        <span className="ml-3 shrink-0 text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full font-medium">
                            {category}
                        </span>
                    </div>

                    {/* Level stepper */}
                    <div className="flex items-start mb-6">
                        {levels.map((level, i) => (
                            <div key={level.label} className="flex items-start flex-1 last:flex-none">
                                <div className="flex flex-col items-center">
                                    {level.status === 'completed' && (
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{ background: 'hsl(var(--sunbird-moss))' }}
                                        >
                                            <FiCheck className="w-5 h-5 text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                    {level.status === 'in-progress' && (() => {
                                        const r = 16;
                                        const circ = 2 * Math.PI * r;
                                        const pct = Math.round((topicsComplete / totalTopics) * 100);
                                        const dashOffset = circ * (1 - pct / 100);
                                        return (
                                            <svg width="40" height="40" viewBox="0 0 40 40">
                                                <circle cx="20" cy="20" r={r} fill="white" stroke="hsl(var(--sunbird-ginger) / 0.4)" strokeWidth="3.5" />
                                                <circle
                                                    cx="20" cy="20" r={r}
                                                    fill="none"
                                                    stroke="hsl(var(--sunbird-brick))"
                                                    strokeWidth="3.5"
                                                    strokeDasharray={circ}
                                                    strokeDashoffset={dashOffset}
                                                    strokeLinecap="round"
                                                    transform="rotate(-90 20 20)"
                                                />
                                                <text x="20" y="24" textAnchor="middle" fontSize="8" fontWeight="700" fill="hsl(var(--sunbird-brick))">{pct}%</text>
                                            </svg>
                                        );
                                    })()}
                                    {level.status === 'locked' && (
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <FiLock className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}
                                    <span
                                        className={`mt-2 text-xs font-medium text-center leading-tight ${
                                            i === currentLevelIndex
                                                ? 'font-semibold'
                                                : level.status === 'locked'
                                                ? 'text-gray-400'
                                                : 'text-sunbird-obsidian'
                                        }`}
                                        style={i === currentLevelIndex ? { color: 'hsl(var(--sunbird-dark-blue))' } : undefined}
                                    >
                                        {level.label}
                                    </span>
                                </div>

                                {/* Connector line (not after last) */}
                                {i < levels.length - 1 && (
                                    <div
                                        className="flex-1 h-0.5 mt-5 mx-1"
                                        style={{
                                            background: level.status === 'completed'
                                                ? 'hsl(var(--sunbird-moss))'
                                                : 'hsl(var(--sunbird-gray-d0))',
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <hr className="border-gray-100 mb-4" />

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[0.625rem] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                                Current Progress
                            </p>
                            <p className="font-rubik font-semibold text-sunbird-obsidian text-[1rem]">
                                Currently in L{currentLevelIndex + 1} · {topicsComplete} of {totalTopics} topics complete
                            </p>
                        </div>
                        <button
                            className="shrink-0 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 bg-sunbird-brick"
                        >
                            View Roadmap
                        </button>
                    </div>
                </div>

                {/* Right — Continue Learning */}
                {/* <div
                    className="w-full lg:w-72 rounded-[1.25rem] p-6 text-white flex flex-col gap-4"
                    style={{ background: 'hsl(var(--sunbird-dark-blue))' }}
                >
                    <h4 className="font-rubik font-bold text-[1.125rem]">Continue Learning</h4>

                    <div className="bg-white/10 rounded-xl p-4 flex flex-col gap-3">
                        <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-blue-200">
                            Ongoing Course
                        </p>
                        <p className="font-rubik font-semibold text-white text-[0.9375rem] leading-snug">
                            {ongoingCourse}
                        </p>
                        <div>
                            <div className="flex items-center justify-between text-xs text-blue-200 mb-1.5">
                                <span>Course Progress</span>
                                <span>{courseProgress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/20">
                                <div
                                    className="h-1.5 rounded-full"
                                    style={{
                                        width: `${courseProgress}%`,
                                        background: 'hsl(var(--sunbird-ginger))',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <button className="flex items-center justify-center gap-2 w-full py-3 bg-white rounded-xl font-rubik font-semibold text-sm transition-opacity hover:opacity-90"
                        style={{ color: 'hsl(var(--sunbird-dark-blue))' }}
                    >
                        <FiPlayCircle className="w-4 h-4" />
                        Resume Topic {resumeTopicNumber}
                    </button>
                </div> */}
            </div>
        </section>
    );
};

export default HomeTvetJourney;
