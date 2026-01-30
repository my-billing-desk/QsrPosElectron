import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { configService } from '../../services/api';

export function TablesView() {
    const [tables, setTables] = useState([]);
    const [formData, setFormData] = useState({ name: '', capacity: '4', area: 'Main Hall' });

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const res = await configService.getTables();
        setTables(res.data);
    };

    const handleAdd = async () => {
        if (!formData.name) return;
        await configService.createTable(formData);
        setFormData({ name: '', capacity: '4', area: 'Main Hall' });
        loadData();
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirm(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await configService.deleteTable(deleteConfirm);
            loadData();
        } catch (error) {
            console.error(error);
        } finally {
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto font-sans relative">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
                <p className="text-sm text-gray-500">Manage restaurant tables</p>
            </div>

            <div className="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-300 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Table Name</label>
                    <input
                        placeholder="e.g. T1"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
                    />
                </div>
                <div className="w-32">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Capacity</label>
                    <input
                        placeholder="Capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Area</label>
                    <input
                        placeholder="Area"
                        value={formData.area}
                        onChange={e => setFormData({ ...formData, area: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
                    />
                </div>
                <button onClick={handleAdd} className="h-[38px] px-6 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Area</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tables.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-sm font-medium text-gray-900">{t.name}</td>
                                <td className="p-4 text-sm text-gray-600">{t.area}</td>
                                <td className="p-4 text-sm text-gray-600">{t.capacity} Pax</td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleDeleteClick(t.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {tables.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-500 text-sm">
                                    No tables configured yet.
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
                            <h3 className="text-lg font-bold text-gray-900">Delete Table?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Are you sure you want to delete table <b>{tables.find(t => t.id === deleteConfirm)?.name}</b>?
                                <br />This action cannot be undone.
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
