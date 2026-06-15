import { FiAlignJustify, FiPlus, FiZap } from 'react-icons/fi';
import type { LevelConfig } from '../types';

interface LevelMilestonesPanelProps {
    levels: LevelConfig[];
    activeLevelIndex: number;
    predictionScore: number;
    onLevelClick: (index: number) => void;
    onLevelChange: (index: number, patch: Partial<LevelConfig>) => void;
    onAddLevel: () => void;
}

const LEVEL_COLORS = ['#1e3a5f', '#4a6fa5', '#6d9dc5', '#8ab4d4', '#a8cce0'];

const LevelMilestonesPanel = ({
    levels,
    activeLevelIndex,
    predictionScore,
    onLevelClick,
    onLevelChange,
    onAddLevel,
}: LevelMilestonesPanelProps) => (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <FiAlignJustify className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Level Milestones</h3>
        </div>

        <div className="flex flex-col gap-4">
            {levels.map((level, index) => {
                const isActive = index === activeLevelIndex;
                return (
                    <div
                        key={level.id}
                        onClick={() => onLevelClick(index)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${isActive ? 'border-l-4 border-[hsl(var(--sunbird-dark-blue))] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: LEVEL_COLORS[index] ?? '#999' }} />
                                <span className="text-xs font-bold text-gray-500 tracking-widest">L{index + 1} CONFIGURATION</span>
                            </div>
                            <FiAlignJustify className="w-4 h-4 text-gray-400" />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Level Name</label>
                                <input
                                    type="text"
                                    value={level.name}
                                    onChange={e => onLevelChange(index, { name: e.target.value })}
                                    onClick={e => e.stopPropagation()}
                                    placeholder="e.g. Beginner, Level 1..."
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-500">Time (Weeks)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={level.timeWeeks}
                                        onChange={e => onLevelChange(index, { timeWeeks: parseInt(e.target.value) || 0 })}
                                        onClick={e => e.stopPropagation()}
                                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-500">Min Score %</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={level.minScore}
                                        onChange={e => onLevelChange(index, { minScore: parseInt(e.target.value) || 0 })}
                                        onClick={e => e.stopPropagation()}
                                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-700">Mandatory Level Exam</label>
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); onLevelChange(index, { mandatoryExam: !level.mandatoryExam }); }}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${level.mandatoryExam ? 'bg-[hsl(var(--sunbird-dark-blue))]' : 'bg-gray-300'}`}
                                    role="switch"
                                    aria-checked={level.mandatoryExam}
                                >
                                    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${level.mandatoryExam ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {levels.length < 5 && (
            <button
                onClick={onAddLevel}
                className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
                <FiPlus className="w-4 h-4" />
                Add Another Level
            </button>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
            <div className="w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <FiZap className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
                <p className="text-xs font-bold text-amber-800">Spark Prediction</p>
                <p className="text-xs text-amber-700 mt-0.5">
                    Current configuration leads to a {predictionScore}% employability rating for this vocational track.
                </p>
            </div>
        </div>
    </div>
);

export default LevelMilestonesPanel;
