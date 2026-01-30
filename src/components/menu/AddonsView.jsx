import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Save, ArrowLeft, Layers, GripVertical, Search } from 'lucide-react';
import { groupService } from '../../services/api';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableAddonRow({ id, index, addon, handleRowChange, handleRemoveRow }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative'
    };

    return (
        <div ref={setNodeRef} style={style} className="flex gap-4 items-start bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div {...attributes} {...listeners} className="mt-2 cursor-grab hover:text-gray-600">
                <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1">
                <input
                    placeholder="Item Name"
                    value={addon.name} onChange={e => handleRowChange(index, 'name', e.target.value)}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
            </div>
            <div className="w-32">
                <input
                    type="number" placeholder="Price"
                    value={addon.price} onChange={e => handleRowChange(index, 'price', e.target.value)}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
            </div>
            <div className="w-32">
                <select
                    value={addon.type} onChange={e => handleRowChange(index, 'type', e.target.value)}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                    <option value="egg">Egg</option>
                </select>
            </div>
            <button onClick={() => handleRemoveRow(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

export function AddonsView() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        selectionType: 'single', // 'single' or 'multiple'
        addons: [{ _key: 'initial', name: '', price: '', type: 'veg' }]
    });

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await groupService.getAddonGroups();
            setGroups(res.data);
        } catch (error) {
            console.error("Failed to load groups", error);
        }
    };

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const handleDeleteClick = (id) => {
        setDeleteConfirm(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await groupService.deleteAddonGroup(deleteConfirm);
            loadData();
        } catch (error) {
            console.error("Failed to delete group", error);
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleAddRow = () => {
        setFormData(prev => ({
            ...prev,
            addons: [...prev.addons, { _key: Math.random().toString(36).substr(2, 9), name: '', price: '', type: 'veg' }]
        }));
    };

    const handleRemoveRow = (index) => {
        setFormData(prev => ({
            ...prev,
            addons: prev.addons.filter((_, i) => i !== index)
        }));
    };

    const handleRowChange = (index, field, value) => {
        const newAddons = [...formData.addons];
        newAddons[index][field] = value;
        setFormData(prev => ({ ...prev, addons: newAddons }));
    };

    const [editingGroupId, setEditingGroupId] = useState(null);

    const handleEditGroup = (group) => {
        setFormData({
            name: group.name,
            description: group.description,
            selectionType: group.maxSelection > 1 ? 'multiple' : 'single',
            addons: group.Addons.length > 0 ? group.Addons.map(a => ({
                id: a.id,
                _key: Math.random().toString(36).substr(2, 9),
                name: a.name,
                price: a.price,
                type: a.type || 'veg'
            })) : [{ _key: Math.random().toString(36).substr(2, 9), name: '', price: '', type: 'veg' }]
        });
        setEditingGroupId(group.id);
        setView('add');
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setFormData(prev => {
                const oldIndex = prev.addons.findIndex(a => a._key === active.id);
                const newIndex = prev.addons.findIndex(a => a._key === over.id);
                return {
                    ...prev,
                    addons: arrayMove(prev.addons, oldIndex, newIndex)
                };
            });
        }
    };

    const handleSubmit = async () => {
        if (!formData.name) return alert("Group Name is required");

        const payload = {
            name: formData.name,
            description: formData.description,
            minSelection: 0,
            maxSelection: formData.selectionType === 'single' ? 1 : 10,
            addons: formData.addons.filter(a => a.name && a.price).map((a, i) => ({
                ...a,
                sortOrder: i
            }))
        };

        try {
            setLoading(true);
            if (editingGroupId) {
                // Update existing group logic would go here
                // For now, delete and re-create is a simple way right now
                await groupService.deleteAddonGroup(editingGroupId);
                await groupService.createAddonGroup(payload);
            } else {
                await groupService.createAddonGroup(payload);
            }
            setLoading(false);
            setView('list');
            setEditingGroupId(null);
            setFormData({ name: '', description: '', selectionType: 'single', addons: [{ _key: 'new', name: '', price: '', type: 'veg' }] });
            loadData();
        } catch (error) {
            setLoading(false);
            alert("Failed to save group");
        }
    };

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.Addons && g.Addons.some(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    if (view === 'add') {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                    <button onClick={() => { setView('list'); setEditingGroupId(null); }} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">{editingGroupId ? 'Edit Addon Group' : 'Create Addon Group'}</h2>
                    <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2 hover:bg-red-700 disabled:opacity-50">
                        <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Group'}
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Group Details */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-blue-500" /> Group Details
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name *</label>
                                    <input
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                        placeholder="e.g., Choice of Cheese"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selection Type</label>
                                    <select
                                        value={formData.selectionType} onChange={e => setFormData({ ...formData, selectionType: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                    >
                                        <option value="single">Single Select (Radio)</option>
                                        <option value="multiple">Multi Select (Checkbox)</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Addons List */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 dark:text-gray-200">Addon Items</h3>
                                <button onClick={handleAddRow} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Add Item Row
                                </button>
                            </div>
                            <div className="space-y-3">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={formData.addons.map(a => a._key)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {formData.addons.map((addon, index) => (
                                            <SortableAddonRow
                                                key={addon._key}
                                                id={addon._key}
                                                index={index}
                                                addon={addon}
                                                handleRowChange={handleRowChange}
                                                handleRemoveRow={handleRemoveRow}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">Addon Groups</h2>
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            placeholder="Search groups or addons..."
                        />
                    </div>
                </div>
                <button onClick={() => { setView('add'); setEditingGroupId(null); setFormData({ name: '', description: '', selectionType: 'single', addons: [{ _key: Math.random().toString(36).substr(2, 9), name: '', price: '', type: 'veg' }] }); }} className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Create Group
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredGroups.map(group => (
                        <div key={group.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{group.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{group.description || 'No description'}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${group.maxSelection > 1 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {group.maxSelection > 1 ? 'Multi' : 'Single'}
                                </span>
                            </div>
                            <div className="p-4 flex-1">
                                <div className="space-y-2">
                                    {group.Addons && group.Addons.map(addon => (
                                        <div key={addon.id} className="flex justify-between text-sm border-b border-dashed border-gray-100 dark:border-gray-700 pb-1 last:border-0 last:pb-0">
                                            <span className="text-gray-600 dark:text-gray-300">{addon.name}</span>
                                            <span className="font-medium text-gray-900 dark:text-white">₹{addon.price}</span>
                                        </div>
                                    ))}
                                    {(!group.Addons || group.Addons.length === 0) && (
                                        <p className="text-xs text-gray-400 italic">No items in this group</p>
                                    )}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                                <button onClick={() => handleEditGroup(group)} className="text-blue-600 hover:bg-blue-50 p-2 rounded text-xs flex items-center gap-1 font-medium">
                                    Edit
                                </button>
                                <button onClick={() => handleDeleteClick(group.id)} className="text-red-500 hover:bg-red-50 p-2 rounded text-xs flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Addon Group?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Are you sure you want to delete this addon group? This action cannot be undone.
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
