import { FiCheck, FiEdit2, FiCheckCircle } from 'react-icons/fi';
import type { LevelConfig } from '../types';
import { getTradeById, FIXED_SUBJECTS } from '../mockData';

interface Step4Props {
    name: string;
    description: string;
    selectedTradeId: string;
    levels: LevelConfig[];
    onBack: () => void;
    onSaveDraft: () => void;
    onSubmit: () => void;
}

const Step4Review = ({ name, description, selectedTradeId, levels, onBack, onSaveDraft, onSubmit }: Step4Props) => {
    const trade = getTradeById(selectedTradeId);

    const totalTopics = levels.reduce((sum, l) =>
        sum + l.subjectConfigs.reduce((s, sc) => s + sc.selectedTopicIds.length, 0), 0
    );
    const totalWeeks = levels.reduce((sum, l) => sum + l.timeWeeks, 0);
    const assessmentPoints = levels.filter(l => l.mandatoryExam).length;
    const completionPct = levels.length > 0 && totalTopics > 0 ? 100 : Math.min(levels.length * 20, 80);

    const [firstLevel, ...restLevels] = levels;

    function getSubjectSummary(level: LevelConfig) {
        return level.subjectConfigs
            .map(sc => {
                const subject = FIXED_SUBJECTS.find(s => s.id === sc.subjectId);
                return subject ? { name: subject.name, count: sc.selectedTopicIds.length } : null;
            })
            .filter((s): s is { name: string; count: number } => s !== null && s.count > 0);
    }

    function getLevelTopicCount(level: LevelConfig) {
        return level.subjectConfigs.reduce((s, sc) => s + sc.selectedTopicIds.length, 0);
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Review Your Framework</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Validate all levels and topic distributions before proceeding.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onSaveDraft}
                        className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Save as Draft
                    </button>
                    <button
                        onClick={onSubmit}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[hsl(var(--sunbird-dark-blue))] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Submit Framework →
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Levels column */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* Framework info strip */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Framework</span>
                        <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                        {description && <p className="text-sm text-gray-500">{description}</p>}
                        {trade && <span className="text-xs text-gray-400">Trade: {trade.name}</span>}
                    </div>

                    {/* Level 1 — large card */}
                    {firstLevel && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <span className="text-xs font-bold text-[hsl(var(--sunbird-ginger))] uppercase tracking-widest">
                                        Level 1: Foundation
                                    </span>
                                    <h3 className="text-xl font-bold text-gray-900 mt-0.5">{firstLevel.name}</h3>
                                </div>
                                <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                    <FiEdit2 className="w-3 h-3" /> Edit
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Duration</p>
                                    <p className="font-semibold text-gray-800">{firstLevel.timeWeeks} Weeks</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Total Topics</p>
                                    <p className="font-semibold text-gray-800">{getLevelTopicCount(firstLevel)} Selected</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Min Score</p>
                                    <p className="font-semibold text-gray-800">{firstLevel.minScore}%</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 mb-2 font-medium">Topic Distribution</p>
                                <div className="flex flex-wrap gap-2">
                                    {getSubjectSummary(firstLevel).map(s => (
                                        <div key={s.name} className="bg-gray-100 rounded-lg px-3 py-2">
                                            <p className="text-xs text-gray-500">{s.name}</p>
                                            <p className="text-sm font-semibold text-gray-800">{s.count} Topics</p>
                                        </div>
                                    ))}
                                    {getSubjectSummary(firstLevel).length === 0 && (
                                        <p className="text-xs text-gray-400 italic">No topics selected for this level.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Remaining levels — smaller cards */}
                    {restLevels.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {restLevels.map((level, i) => {
                                const subjectSummary = getSubjectSummary(level);
                                return (
                                    <div key={level.id} className="bg-white border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs font-bold text-blue-700">L{i + 2}</span>
                                                </div>
                                                <span className="font-semibold text-gray-800">Level {i + 2}: {level.name}</span>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <FiEdit2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-1.5 text-sm">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Duration</span>
                                                <span className="font-medium">{level.timeWeeks} Weeks</span>
                                            </div>
                                            {subjectSummary.slice(0, 2).map(s => (
                                                <div key={s.name} className="flex justify-between text-gray-600">
                                                    <span>{s.name} Topics</span>
                                                    <span className="font-medium">{s.count}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-3 h-1 bg-gray-100 rounded-full">
                                            <div
                                                className="h-1 rounded-full"
                                                style={{
                                                    width: `${Math.min((getLevelTopicCount(level) / 10) * 100, 100)}%`,
                                                    background: `hsl(var(--sunbird-ginger))`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {levels.length === 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
                            No levels configured. Go back and add levels.
                        </div>
                    )}

                    {/* Notice */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                        <FiCheck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                            By proceeding, you will lock the structural configuration of these levels. Content mapping will allow you to assign specific video, PDF, and interactive assets to the selected topics.
                        </p>
                    </div>
                </div>

                {/* Right — Completion Progress */}
                <div className="flex flex-col gap-4">
                    <div className="bg-[hsl(var(--sunbird-dark-blue))] text-white rounded-xl p-5">
                        <p className="text-xs uppercase tracking-widest text-blue-300 mb-2">Completion Progress</p>
                        <p className="text-5xl font-black mb-1">{completionPct}%</p>
                        <p className="text-sm text-blue-200">
                            {completionPct === 100
                                ? 'All configuration steps are complete and validated for structural integrity.'
                                : 'Add more topics to levels to improve your framework coverage.'}
                        </p>
                        {completionPct === 100 && (
                            <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                                <FiCheckCircle className="w-3.5 h-3.5 text-green-300" />
                                <span className="text-xs text-green-300 font-medium">Structure Validated</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Final Validation</p>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{levels.length} Active Level{levels.length !== 1 ? 's' : ''} (L1–L{levels.length})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiCheckCircle className={`w-4 h-4 flex-shrink-0 ${totalTopics > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                                <span className="text-sm text-gray-700">{totalTopics} Total Competencies</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiCheckCircle className={`w-4 h-4 flex-shrink-0 ${assessmentPoints > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                                <span className="text-sm text-gray-700">{assessmentPoints} Assessment Point{assessmentPoints !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiCheckCircle className={`w-4 h-4 flex-shrink-0 ${totalWeeks > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                                <span className="text-sm text-gray-700">{totalWeeks} Total Weeks</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <hr className="border-gray-200" />

            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                    ← Back to Level Config
                </button>
                <button
                    onClick={onSubmit}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[hsl(var(--sunbird-dark-blue))] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                    Submit Framework →
                </button>
            </div>
        </div>
    );
};

export default Step4Review;
