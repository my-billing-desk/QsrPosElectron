import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { configService } from '../../services/api';

export function TaxesView() {
    const [taxes, setTaxes] = useState([]);
    const [formData, setFormData] = useState({ name: '', percentage: '', status: 'active' });

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const res = await configService.getTaxes();
            const mapped = (res.data || []).map(t => ({ ...t, status: t.status || 'active' }));
            setTaxes(mapped);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.percentage) return;

        try {
            await configService.createTax(formData);
            setFormData({ name: '', percentage: '', status: 'active' });
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirm(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await configService.deleteTax(deleteConfirm);
            loadData();
        } catch (err) {
            console.error(err);
        } finally {
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto font-sans relative">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Taxes</h1>
                <p className="text-sm text-gray-500">Manage order taxes</p>
            </div>

            {/* Simple Form Panel */}
            <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-300 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tax Name</label>
                    <input
                        type="text"
                        placeholder="e.g. GST"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
                    />
                </div>
                <div className="w-32">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Percentage (%)</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={formData.percentage}
                        onChange={e => setFormData({ ...formData, percentage: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    className="h-[38px] px-6 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>

            {/* Simple Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tax Name</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Percentage</th>

                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {taxes.map(tax => (
                            <tr key={tax.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-sm font-medium text-gray-900">{tax.name}</td>
                                <td className="p-4 text-sm text-gray-600 font-mono">{tax.percentage}%</td>

                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleDeleteClick(tax.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {taxes.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-500 text-sm">
                                    No taxes configured yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Tax?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Are you sure you want to delete this tax? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
