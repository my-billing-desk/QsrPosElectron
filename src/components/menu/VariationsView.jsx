import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Layers, Check, Edit3, X, Search } from 'lucide-react';
import { groupService } from '../../services/api';

export function VariationsView() {
    const [showModal, setShowModal] = useState(false);
    const [groups, setGroups] = useState([]); // Assuming this state exists based on usage
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        onlineDisplayName: '',
        departmentName: '',
        isActive: true,
        variants: []
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await groupService.getVariationGroups();
            setGroups(res.data);
        } catch (error) {
            console.error("Failed to load variation groups", error);
        }
    };

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const handleDeleteClick = (id) => {
        setDeleteConfirm(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await groupService.deleteVariationGroup(deleteConfirm);
            loadData();
        } catch (error) {
            alert("Failed to delete group");
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleEditGroup = (group) => {
        setFormData({
            name: group.name,
            onlineDisplayName: group.onlineDisplayName || '',
            departmentName: group.departmentName || '',
            isActive: group.isActive !== false,
            variants: group.Variants && group.Variants.length > 0 ? group.Variants.map(v => ({
                id: v.id,
                name: v.name,
                price: v.price,
                sapCode: v.sapCode || ''
            })) : []
        });
        setEditingGroupId(group.id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingGroupId(null);
        setFormData({ name: '', onlineDisplayName: '', departmentName: '', isActive: true, variants: [] });
    };

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.Variants && g.Variants.some(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const handleSubmit = async () => {
        if (!formData.name) return alert("Group Name is required");
        if (!formData.departmentName) return alert("Department Name is required");

        const payload = {
            name: formData.name,
            onlineDisplayName: formData.onlineDisplayName,
            departmentName: formData.departmentName,
            isActive: formData.isActive,
            variants: formData.variants.filter(v => v.name)
        };

        try {
            setLoading(true);
            if (editingGroupId) {
                await groupService.updateVariationGroup(editingGroupId, payload);
            } else {
                await groupService.createVariationGroup(payload);
            }
            setLoading(false);
            handleCloseModal();
            loadData();
        } catch (error) {
            setLoading(false);
            alert("Failed to save variation group");
            console.error(error);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shadow-sm z-10">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">Variations</h2>
                <button onClick={() => { setShowModal(true); setEditingGroupId(null); setFormData({ name: '', onlineDisplayName: '', departmentName: '', isActive: true, variants: [] }); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 flex items-center gap-2 font-medium transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> Add Variation
                </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Search variation groups or options..."
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-bold text-gray-600 dark:text-gray-300 text-sm">Name</th>
                                <th className="p-4 font-bold text-gray-600 dark:text-gray-300 text-sm">Online Name</th>
                                <th className="p-4 font-bold text-gray-600 dark:text-gray-300 text-sm">Department</th>
                                <th className="p-4 font-bold text-gray-600 dark:text-gray-300 text-sm">Status</th>
                                <th className="p-4 font-bold text-gray-600 dark:text-gray-300 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredGroups.map(group => (
                                <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">{group.name}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{group.onlineDisplayName || '-'}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold border border-blue-100">{group.departmentName}</span>
                                    </td>

                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${group.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {group.isActive ? <Check className="w-3 h-3" /> : ''} {group.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-end gap-2">
                                        <button onClick={() => handleEditGroup(group)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteClick(group.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pl-72 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                {editingGroupId ? 'Edit Variation' : 'Add Variation'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-8">
                            {/* Top Row: Name, Online Name, Department, Status */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
                                    <input
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder=""
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Online Display Name</label>
                                    <input
                                        value={formData.onlineDisplayName} onChange={e => setFormData({ ...formData, onlineDisplayName: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder=""
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Department Name <span className="text-red-500">*</span></label>
                                    <select
                                        value={formData.departmentName} onChange={e => setFormData({ ...formData, departmentName: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select</option>
                                        <option value="Size">Size</option>
                                        <option value="Portion">Portion</option>
                                        <option value="Quantity">Quantity</option>
                                        <option value="Portion Size">Portion Size</option>
                                        <option value="Customisation">Customisation</option>
                                        <option value="Preparation">Preparation</option>
                                    </select>
                                </div>
                                <div className="pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isActive ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
                                            {formData.isActive && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Status</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Variants List Section */}
                        <div className="border-t border-gray-100 dark:border-gray-700 p-6 pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Variation Options</h4>
                                <button
                                    onClick={() => setFormData({ ...formData, variants: [...formData.variants, { name: '', price: '', sapCode: '' }] })}
                                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                                >
                                    + Add Option
                                </button>
                            </div>

                            {formData.variants.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-12 gap-4 px-2 text-xs font-bold text-gray-500 uppercase">
                                        <div className="col-span-6">Name</div>
                                        <div className="col-span-5">SAP Code</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    {formData.variants.map((variant, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="col-span-6">
                                                <input
                                                    value={variant.name}
                                                    onChange={e => {
                                                        const newVars = [...formData.variants];
                                                        newVars[idx].name = e.target.value;
                                                        setFormData({ ...formData, variants: newVars });
                                                    }}
                                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                                    placeholder="e.g. Small"
                                                />
                                            </div>
                                            <div className="col-span-5">
                                                <input
                                                    value={variant.sapCode || ''}
                                                    onChange={e => {
                                                        const newVars = [...formData.variants];
                                                        newVars[idx].sapCode = e.target.value;
                                                        setFormData({ ...formData, variants: newVars });
                                                    }}
                                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                                    placeholder="SAP Code"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button
                                                    onClick={() => {
                                                        const newVars = formData.variants.filter((_, i) => i !== idx);
                                                        setFormData({ ...formData, variants: newVars });
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                    <p className="text-sm text-gray-500">No options added yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="flex justify-end px-6 pb-6 pt-0">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-95"
                            >
                                {loading ? 'Saving...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
            {/* Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Variation?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Are you sure you want to delete this variation group? This action cannot be undone.
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
        </div >
    );
}
