import { useState } from 'react';
import type { LevelConfig } from '../types';
import { FIXED_SUBJECTS, getTradeById } from '../mockData';
import LevelMilestonesPanel from './LevelMilestonesPanel';

interface Step3Props {
    selectedTradeId: string;
    levels: LevelConfig[];
    onLevelsChange: (levels: LevelConfig[]) => void;
    onBack: () => void;
    onSaveDraft: () => void;
    onNext: () => void;
}

function makeLevelId() {
    return `lvl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeDefaultLevel(index: number): LevelConfig {
    return {
        id: makeLevelId(),
        name: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Expert'][index] ?? 'Level',
        timeWeeks: (index + 1) * 12,
        minScore: 60 + index * 10,
        mandatoryExam: index === 0,
        subjectConfigs: FIXED_SUBJECTS.map(s => ({ subjectId: s.id, selectedTopicIds: [] })),
    };
}

const Step3LevelConfig = ({ selectedTradeId, levels, onLevelsChange, onBack, onSaveDraft, onNext }: Step3Props) => {
    const [activeLevelIndex, setActiveLevelIndex] = useState(0);
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

    const trade = getTradeById(selectedTradeId);

    function getTopicsForSubject(subjectId: string | null) {
        if (!subjectId || !trade) return [];
        const fixedSubject = FIXED_SUBJECTS.find(s => s.id === subjectId);
        if (!fixedSubject) return [];
        const lastWord = fixedSubject.name.split(' ').pop()!.toLowerCase();
        const tradeSubject = trade.subjects.find(s => s.name.toLowerCase().endsWith(lastWord));
        if (!tradeSubject) return [];
        const levelNum = Math.min(activeLevelIndex + 1, 3) as 1 | 2 | 3;
        return tradeSubject.topics.filter(t => !t.level || t.level === levelNum);
    }

    const activeLevel = levels[activeLevelIndex];
    const resolvedSubjectId = activeSubjectId ?? FIXED_SUBJECTS[0]?.id ?? null;
    const activeSubjectConfig = activeLevel?.subjectConfigs.find(sc => sc.subjectId === resolvedSubjectId);
    const selectedTopicIds = activeSubjectConfig?.selectedTopicIds ?? [];
    const totalSelected = activeLevel?.subjectConfigs.reduce((sum, sc) => sum + sc.selectedTopicIds.length, 0) ?? 0;
    const predictionScore = Math.min(50 + totalSelected * 2, 95);

    function updateLevel(index: number, patch: Partial<LevelConfig>) {
        onLevelsChange(levels.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    }

    function updateTopicSelection(topicId: string, checked: boolean) {
        if (!activeLevel) return;
        onLevelsChange(levels.map((l, i) => {
            if (i !== activeLevelIndex) return l;
            return {
                ...l,
                subjectConfigs: l.subjectConfigs.map(sc => {
                    if (sc.subjectId !== resolvedSubjectId) return sc;
                    const ids = checked
                        ? [...sc.selectedTopicIds, topicId]
                        : sc.selectedTopicIds.filter(id => id !== topicId);
                    return { ...sc, selectedTopicIds: ids };
                }),
            };
        }));
    }

    function selectAll() {
        if (!activeLevel) return;
        const allIds = getTopicsForSubject(resolvedSubjectId).map(t => t.id);
        onLevelsChange(levels.map((l, i) => {
            if (i !== activeLevelIndex) return l;
            return {
                ...l,
                subjectConfigs: l.subjectConfigs.map(sc =>
                    sc.subjectId === resolvedSubjectId ? { ...sc, selectedTopicIds: allIds } : sc
                ),
            };
        }));
    }

    function addLevel() {
        if (levels.length >= 5) return;
        onLevelsChange([...levels, makeDefaultLevel(levels.length)]);
        setActiveLevelIndex(levels.length);
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LevelMilestonesPanel
                    levels={levels}
                    activeLevelIndex={activeLevelIndex}
                    predictionScore={predictionScore}
                    onLevelClick={setActiveLevelIndex}
                    onLevelChange={updateLevel}
                    onAddLevel={addLevel}
                />

                {/* Right — Topics Selection */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-50 rounded flex items-center justify-center">
                                <span className="text-orange-500 text-xs font-bold">≡</span>
                            </div>
                            <h3 className="font-semibold text-gray-800 text-sm">Topics Selection (L{activeLevelIndex + 1})</h3>
                        </div>
                        <span className="text-xs bg-[hsl(var(--sunbird-dark-blue))] text-white px-2 py-0.5 rounded-full font-medium">
                            {totalSelected} Topics Selected
                        </span>
                    </div>

                    {FIXED_SUBJECTS.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No subjects available for this trade.</div>
                    ) : (
                        <div className="flex h-[420px]">
                            <div className="w-36 border-r border-gray-100 overflow-y-auto flex-shrink-0">
                                {FIXED_SUBJECTS.map(subject => {
                                    const config = activeLevel?.subjectConfigs.find(sc => sc.subjectId === subject.id);
                                    const count = config?.selectedTopicIds.length ?? 0;
                                    const isActive = resolvedSubjectId === subject.id;
                                    return (
                                        <button
                                            key={subject.id}
                                            onClick={() => setActiveSubjectId(subject.id)}
                                            className={`w-full text-left px-3 py-3 text-xs transition-colors border-b border-gray-50 ${isActive ? 'bg-[hsl(var(--sunbird-dark-blue))] text-white font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            <div>{subject.name}</div>
                                            <div className={`mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {count}/{getTopicsForSubject(subject.id).length}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {resolvedSubjectId && (
                                    <>
                                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 sticky top-0 bg-white">
                                            <span className="text-xs font-semibold text-gray-600">Select Module Topics</span>
                                            <button onClick={selectAll} className="text-xs text-[hsl(var(--sunbird-dark-blue))] font-medium hover:underline">
                                                Select All
                                            </button>
                                        </div>
                                        <div className="flex flex-col">
                                            {getTopicsForSubject(resolvedSubjectId).map(topic => (
                                                <label key={topic.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTopicIds.includes(topic.id)}
                                                        onChange={e => updateTopicSelection(topic.id, e.target.checked)}
                                                        className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[hsl(var(--sunbird-dark-blue))] flex-shrink-0"
                                                    />
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <span className="text-sm text-gray-800 leading-snug">{topic.name}</span>
                                                        {/* <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-semibold tracking-wide text-gray-400">{topic.type}</span>
                                                            <span className="text-[10px] text-gray-400">• {topic.hours} HOURS</span>
                                                        </div> */}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-gray-200" />

            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    ← Back to Trade Selection
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={onSaveDraft} className="px-5 py-2.5 border border-[hsl(var(--sunbird-dark-blue))] text-[hsl(var(--sunbird-dark-blue))] text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors">
                        Save as Draft
                    </button>
                    <button onClick={onNext} className="flex items-center gap-2 px-6 py-2.5 bg-[hsl(var(--sunbird-dark-blue))] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                        Review &amp; Summary →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step3LevelConfig;
