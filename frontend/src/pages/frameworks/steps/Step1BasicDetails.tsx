import { FiStar } from 'react-icons/fi';

interface Step1Props {
    name: string;
    description: string;
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onNext: () => void;
}

const MAX_DESC = 2000;

const Step1BasicDetails = ({ name, description, onNameChange, onDescriptionChange, onNext }: Step1Props) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form */}
            <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-800">
                            Framework Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => onNameChange(e.target.value)}
                            placeholder="e.g., National Automotive Maintenance Standard"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sunbird-dark-blue))] focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500">The unique title used to identify this framework throughout the portal.</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-800">Framework Description</label>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">OPTIONAL</span>
                        </div>
                        <textarea
                            value={description}
                            onChange={e => onDescriptionChange(e.target.value.slice(0, MAX_DESC))}
                            placeholder="Describe the objectives, target audience, and key learning outcomes..."
                            rows={6}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sunbird-dark-blue))] focus:border-transparent resize-none"
                        />
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">Markdown support is enabled for rich text descriptions.</p>
                            <span className="text-xs text-gray-400">{description.length} / {MAX_DESC} characters</span>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="flex justify-end">
                        <button
                            onClick={onNext}
                            disabled={!name.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[hsl(var(--sunbird-dark-blue))] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                        >
                            Next: Trade Selection →
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <FiStar className="w-4 h-4 text-[hsl(var(--sunbird-ginger))]" />
                        <h3 className="text-sm font-semibold text-[hsl(var(--sunbird-ginger))]">Pro Tip</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        A clear and concise framework name helps administrators and trainers locate relevant content faster. Use industry-standard terminology to ensure consistency across the vocational training landscape.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-5 text-white">
                    <p className="text-sm font-semibold leading-snug">Standardizing Vocational Excellence since 2024</p>
                    <p className="text-xs text-blue-200 mt-1">Sunbird Spark TVET Framework Builder</p>
                </div>
            </div>
        </div>
    );
};

export default Step1BasicDetails;
