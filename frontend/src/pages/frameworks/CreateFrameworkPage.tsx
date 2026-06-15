import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStepper from './steps/WizardStepper';
import Step1BasicDetails from './steps/Step1BasicDetails';
import Step2TradeSelection from './steps/Step2TradeSelection';
import Step3LevelConfig from './steps/Step3LevelConfig';
import Step4Review from './steps/Step4Review';
import type { LevelConfig, WizardFormState } from './types';
import { addFramework, getTradeById, FIXED_SUBJECTS } from './mockData';

const WIZARD_STEPS = ['Basic Details', 'Trade Selection', 'Level Config', 'Review & Summary'];

function makeLevelId() {
    return `lvl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function buildDefaultLevels(): LevelConfig[] {
    return [0, 1, 2].map(i => ({
        id: makeLevelId(),
        name: ['Beginner', 'Intermediate', 'Advanced'][i] ?? 'Level',
        timeWeeks: (i + 1) * 12,
        minScore: 60 + i * 10,
        mandatoryExam: i === 0,
        subjectConfigs: FIXED_SUBJECTS.map(s => ({ subjectId: s.id, selectedTopicIds: [] })),
    }));
}

const INITIAL_STATE: WizardFormState = {
    step: 1,
    name: '',
    description: '',
    selectedTradeId: null,
    levels: [],
    activeLevelIndex: 0,
    activeSubjectId: null,
};

const CreateFrameworkPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState<WizardFormState>(INITIAL_STATE);

    function goTo(step: WizardFormState['step']) {
        setForm(prev => ({ ...prev, step }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleSelectTrade(tradeId: string) {
        setForm(prev => ({
            ...prev,
            selectedTradeId: tradeId,
            levels: buildDefaultLevels(),
        }));
    }

    function handleSaveDraft() {
        navigate('/frameworks');
    }

    function handleSubmit() {
        const trade = form.selectedTradeId ? getTradeById(form.selectedTradeId) : null;
        addFramework({
            id: `fw-${Date.now()}`,
            name: form.name,
            description: form.description,
            category: trade ? `Vocational - ${trade.name}` : 'General',
            tradeId: form.selectedTradeId ?? '',
            tradeName: trade?.name ?? '',
            status: 'DRAFTING',
            lastModified: 'Just now',
            levels: form.levels,
        });
        navigate('/frameworks');
    }

    const step = form.step;

    return (
        <main className="flex flex-col gap-0 max-w-5xl mx-auto w-full p-6 bg-white">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                <button onClick={() => navigate('/frameworks')} className="hover:text-gray-800 transition-colors">
                    Frameworks
                </button>
                <span>›</span>
                <span className="text-gray-800 font-medium">Create New Framework</span>
            </div>

            <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900 font-rubik">
                    {step === 1 && 'Setup Basic Details'}
                    {step === 2 && 'Select Vocational Trade'}
                    {step === 3 && 'Level Configuration'}
                    {step === 4 && 'Review Your Framework'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {step === 1 && 'Provide the core identity for your vocational framework.'}
                    {step === 2 && 'Select the primary discipline. This pre-configures competencies and safety standards.'}
                    {step === 3 && 'Define learning milestones, durations, and competency assessments for the Vocational Framework.'}
                    {step === 4 && 'Validate all levels and topic distributions before proceeding.'}
                </p>
            </div>

            <div className="mt-6">
                <WizardStepper currentStep={step} steps={WIZARD_STEPS} />
            </div>

            {step === 1 && (
                <Step1BasicDetails
                    name={form.name}
                    description={form.description}
                    onNameChange={name => setForm(prev => ({ ...prev, name }))}
                    onDescriptionChange={description => setForm(prev => ({ ...prev, description }))}
                    onNext={() => goTo(2)}
                />
            )}

            {step === 2 && (
                <Step2TradeSelection
                    selectedTradeId={form.selectedTradeId}
                    onSelectTrade={handleSelectTrade}
                    onBack={() => goTo(1)}
                    onSaveDraft={handleSaveDraft}
                    onNext={() => goTo(3)}
                />
            )}

            {step === 3 && form.selectedTradeId && (
                <Step3LevelConfig
                    selectedTradeId={form.selectedTradeId}
                    levels={form.levels}
                    onLevelsChange={levels => setForm(prev => ({ ...prev, levels }))}
                    onBack={() => goTo(2)}
                    onSaveDraft={handleSaveDraft}
                    onNext={() => goTo(4)}
                />
            )}

            {step === 4 && form.selectedTradeId && (
                <Step4Review
                    name={form.name}
                    description={form.description}
                    selectedTradeId={form.selectedTradeId}
                    levels={form.levels}
                    onBack={() => goTo(3)}
                    onSaveDraft={handleSaveDraft}
                    onSubmit={handleSubmit}
                />
            )}
        </main>
    );
};

export default CreateFrameworkPage;
