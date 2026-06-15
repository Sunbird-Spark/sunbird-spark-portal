import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiEye } from 'react-icons/fi';
import { getFrameworks } from './mockData';
import type { FrameworkStatus } from './types';

const STATUS_STYLES: Record<FrameworkStatus, string> = {
    DRAFTING: 'bg-amber-100 text-amber-700',
    REVIEWING: 'bg-blue-100 text-blue-700',
    PUBLISHED: 'bg-green-100 text-green-700',
};

const FrameworksPage = () => {
    const navigate = useNavigate();
    // Re-read from module store each render so newly submitted frameworks appear
    const [, forceUpdate] = useState(0);
    const frameworks = getFrameworks();

    return (
        <main className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
            {/* Page header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-rubik">Frameworks / Learning Paths</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage and create vocational training frameworks.</p>
                </div>
                <button
                    onClick={() => navigate('/frameworks/create')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[hsl(var(--sunbird-brick))] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                    <FiPlus className="w-4 h-4" />
                    Create New Framework
                </button>
            </div>

            {/* Frameworks table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {frameworks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                            <FiPlus className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-700">No frameworks yet</p>
                            <p className="text-sm text-gray-400 mt-0.5">Create your first vocational training framework to get started.</p>
                        </div>
                        <button
                            onClick={() => navigate('/frameworks/create')}
                            className="px-5 py-2 bg-[hsl(var(--sunbird-brick))] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Create Framework
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 text-left">
                                <th className="px-5 py-3.5 font-semibold text-gray-600">Title</th>
                                <th className="px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Category / Trade</th>
                                <th className="px-5 py-3.5 font-semibold text-gray-600 hidden sm:table-cell">Last Modified</th>
                                <th className="px-5 py-3.5 font-semibold text-gray-600">Status</th>
                                <th className="px-5 py-3.5 font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {frameworks.map((fw, idx) => (
                                <tr
                                    key={fw.id}
                                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx === frameworks.length - 1 ? 'border-b-0' : ''}`}
                                >
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-gray-900">{fw.name}</div>
                                        {fw.description && (
                                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{fw.description}</div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 hidden md:table-cell text-gray-500">{fw.category || fw.tradeName}</td>
                                    <td className="px-5 py-4 hidden sm:table-cell text-gray-500">{fw.lastModified}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded uppercase tracking-wide ${STATUS_STYLES[fw.status]}`}>
                                            {fw.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                title="View"
                                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                                                onClick={() => forceUpdate(n => n + 1)}
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                            <button
                                                title="Edit"
                                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                                                onClick={() => navigate('/frameworks/create')}
                                            >
                                                <FiEdit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Frameworks', value: frameworks.length },
                    { label: 'Drafting', value: frameworks.filter(f => f.status === 'DRAFTING').length },
                    { label: 'Reviewing', value: frameworks.filter(f => f.status === 'REVIEWING').length },
                    { label: 'Published', value: frameworks.filter(f => f.status === 'PUBLISHED').length },
                ].map(stat => (
                    <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default FrameworksPage;
