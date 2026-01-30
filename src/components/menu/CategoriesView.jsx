import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Search } from 'lucide-react';
import { menuService } from '../../services/api';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableCategoryRow({ id, category, handleDelete }) {
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
        <tr ref={setNodeRef} style={style} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td className="p-4 w-10 text-center" {...attributes} {...listeners}>
                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab mx-auto" />
            </td>
            <td className="p-4 text-gray-900 dark:text-gray-100">{category.name}</td>
            <td className="p-4 text-right">
                <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-800 p-2"><Trash2 className="w-4 h-4" /></button>
            </td>
        </tr>
    );
}

export function CategoriesView() {
    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [blockingItems, setBlockingItems] = useState([]);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const res = await menuService.getCategories();
            setCategories(res.data);
        } catch (e) { console.error(e); }
    };

    const handleAdd = async () => {
        if (!newCat) return;
        await menuService.createCategory({ name: newCat });
        setNewCat('');
        loadData();
    };

    const handleDelete = async (id) => {
        // Check if items are using this category
        try {
            const res = await menuService.getItems();
            const items = res.data;
            // Check for items linked to this category. Assuming item.categoryId or item.Category.id
            const linkedItems = items.filter(i => i.categoryId == id || (i.Category && i.Category.id == id));

            if (linkedItems.length > 0) {
                setBlockingItems(linkedItems);
                setCategoryToDelete(null); // Ensure we don't accidentally delete
                return;
            }

            setCategoryToDelete(id);
            setDeleteModalOpen(true);
        } catch (error) {
            console.error("Error checking linked items", error);
            // Fallback to normal delete confirm if check fails, or show error?
            // Safer to just show confirm modal and let server reject if constraint fails
            setCategoryToDelete(id);
            setDeleteModalOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (categoryToDelete) {
            try {
                await menuService.deleteCategory(categoryToDelete);
                await loadData();
                setDeleteModalOpen(false);
                setCategoryToDelete(null);
            } catch (error) {
                console.error("Failed to delete category:", error);
                alert("Failed to delete category. " + (error.response?.data?.error || error.message));
                setDeleteModalOpen(false);
            }
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    sortOrder: index
                }));
                menuService.reorder('category', updates).catch(err => console.error("Reorder failed", err));

                return newItems;
            });
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-4xl mx-auto font-sans relative">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                <p className="text-sm text-gray-500">Manage menu categories</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-300 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Category Name</label>
                    <input
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
                        placeholder="e.g. Beverages"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                </div>
                <button
                    onClick={handleAdd}
                    className="h-[38px] px-6 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-10"></th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <SortableContext
                                items={filteredCategories.map(c => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {filteredCategories.map(cat => (
                                    <SortableCategoryRow
                                        key={cat.id}
                                        id={cat.id}
                                        category={cat}
                                        handleDelete={handleDelete}
                                    />
                                ))}
                            </SortableContext>
                        </tbody>
                    </table>
                </DndContext>
            </div>

            {/* Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Category?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Are you sure you want to delete this category? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
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

            {/* Blocking Items Modal */}
            {blockingItems.length > 0 && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 flex flex-col max-h-[80vh]">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                Cannot Delete Category
                            </h3>
                            <p className="text-sm text-gray-500 mt-2">
                                This category is currently assigned to the following items. Please reassign or remove these items before deleting the category.
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0 border border-gray-100 rounded-md bg-gray-50 p-3 mb-4">
                            <ul className="space-y-2">
                                {blockingItems.map(item => (
                                    <li key={item.id} className="text-sm text-gray-700 flex justify-between">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-xs text-gray-500">ID: {item.id}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setBlockingItems([])}
                                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
