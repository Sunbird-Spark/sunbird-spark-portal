export type FrameworkStatus = 'DRAFTING' | 'REVIEWING' | 'PUBLISHED';

export interface Topic {
    id: string;
    name: string;
    type: 'THEORY' | 'PRACTICAL' | 'SAFETY';
    hours: number;
    level?: 1 | 2 | 3;
}

export interface Subject {
    id: string;
    name: string;
    topics: Topic[];
}

export interface Trade {
    id: string;
    name: string;
    description: string;
    icon: string;
    moduleCount: number;
    gradientFrom: string;
    gradientTo: string;
    subjects: Subject[];
}

export interface SubjectConfig {
    subjectId: string;
    selectedTopicIds: string[];
}

export interface LevelConfig {
    id: string;
    name: string;
    timeWeeks: number;
    minScore: number;
    mandatoryExam: boolean;
    subjectConfigs: SubjectConfig[];
}

export interface Framework {
    id: string;
    name: string;
    description: string;
    category: string;
    tradeId: string;
    tradeName: string;
    status: FrameworkStatus;
    lastModified: string;
    levels: LevelConfig[];
}

export interface WizardFormState {
    step: 1 | 2 | 3 | 4;
    name: string;
    description: string;
    selectedTradeId: string | null;
    levels: LevelConfig[];
    activeLevelIndex: number;
    activeSubjectId: string | null;
}
