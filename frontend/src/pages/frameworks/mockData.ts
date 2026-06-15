import type { Framework, Trade } from './types';
import { TRADES } from './tradesData';

export { TRADES } from './tradesData';

export const FIXED_SUBJECTS = [
    { id: 'trade-theory', name: 'Trade Theory' },
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'engineering-science', name: 'Engineering Science' },
    { id: 'engineering-drawing', name: 'Engineering Drawing' },
];

const initialFrameworks: Framework[] = [
    {
        id: 'fw-001',
        name: 'Advanced Carpentry Level 4',
        description: 'Senior-level carpentry framework covering advanced joinery, structural framing, and project management.',
        category: 'Technical - Construction',
        tradeId: 'carpentry',
        tradeName: 'Carpentry',
        status: 'DRAFTING',
        lastModified: '2h ago',
        levels: [],
    },
    {
        id: 'fw-002',
        name: 'Healthcare Assistant Basics',
        description: 'Entry-level healthcare assistant training covering patient care and clinical support.',
        category: 'Vocational - Nursing',
        tradeId: 'healthcare-assistant',
        tradeName: 'Healthcare Assistant',
        status: 'REVIEWING',
        lastModified: 'Yesterday',
        levels: [],
    },
    {
        id: 'fw-003',
        name: 'Renewable Energy Systems',
        description: 'Training on solar, wind, and hybrid renewable energy installation and maintenance.',
        category: 'Engineering - Green Tech',
        tradeId: 'electrician',
        tradeName: 'Electrician (ITI)',
        status: 'DRAFTING',
        lastModified: 'Oct 12, 2023',
        levels: [],
    },
];

let frameworksStore: Framework[] = [...initialFrameworks];

export function getFrameworks(): Framework[] {
    return frameworksStore;
}

export function addFramework(framework: Framework): void {
    frameworksStore = [framework, ...frameworksStore];
}

export function getTradeById(id: string): Trade | undefined {
    return TRADES.find(t => t.id === id);
}
