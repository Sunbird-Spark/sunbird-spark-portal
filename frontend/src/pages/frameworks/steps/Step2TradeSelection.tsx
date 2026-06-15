import { FiCheck } from 'react-icons/fi';
import type { Trade } from '../types';
import { TRADES } from '../mockData';

interface Step2Props {
    selectedTradeId: string | null;
    onSelectTrade: (tradeId: string) => void;
    onBack: () => void;
    onSaveDraft: () => void;
    onNext: () => void;
}

const TradeGradient = ({ trade }: { trade: Trade }) => (
    <div
        className="w-full h-40 rounded-t-xl flex items-center justify-center text-5xl relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${trade.gradientFrom}, ${trade.gradientTo})` }}
    >
        <span>{trade.icon}</span>
    </div>
);

const Step2TradeSelection = ({ selectedTradeId, onSelectTrade, onBack, onSaveDraft, onNext }: Step2Props) => {
    return (
        <div className="flex flex-col gap-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Choose the Vocational Trade</h2>
                <p className="text-gray-500 mt-1 max-w-xl mx-auto text-sm">
                    Select the primary discipline for this training framework. This will pre-configure competencies and safety standards based on industry requirements.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {TRADES.map(trade => {
                    const isSelected = selectedTradeId === trade.id;
                    return (
                        <button
                            key={trade.id}
                            onClick={() => onSelectTrade(trade.id)}
                            className={`
                                text-left rounded-xl border-2 overflow-hidden transition-all hover:shadow-md
                                ${isSelected
                                    ? 'border-[hsl(var(--sunbird-dark-blue))] shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                                }
                            `}
                        >
                            <div className="relative">
                                <TradeGradient trade={trade} />
                                {isSelected && (
                                    <span className="absolute top-3 right-3 bg-[hsl(var(--sunbird-dark-blue))] text-white text-xs font-bold px-2 py-0.5 rounded">
                                        SELECTED
                                    </span>
                                )}
                            </div>

                            <div className="p-4 bg-white">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">{trade.icon}</span>
                                    <span className="font-semibold text-gray-900">{trade.name}</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed mb-3">{trade.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400 font-medium">{trade.moduleCount} MODULES</span>
                                    {isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-[hsl(var(--sunbird-dark-blue))] flex items-center justify-center">
                                            <FiCheck className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <hr className="border-gray-200" />

            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                    ← Back to Details
                </button>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onSaveDraft}
                        className="px-5 py-2.5 text-[hsl(var(--sunbird-dark-blue))] text-sm font-medium hover:underline transition-colors"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={onNext}
                        disabled={!selectedTradeId}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[hsl(var(--sunbird-dark-blue))] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                        Continue to Curriculum →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step2TradeSelection;
