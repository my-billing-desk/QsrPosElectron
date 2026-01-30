import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, ArrowLeft, Copy, List, Edit, Trash2, Upload, ChevronDown, MoreHorizontal, FileText, ToggleLeft, ToggleRight, Save, GripVertical, Map } from 'lucide-react';
import { AreaPriceUpdateModal } from './AreaPriceUpdateModal';
import { menuService } from '../../services/api';
import { AddItem } from '../AddItem';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Row Component for Items Table
function SortableRow({ id, children }) {
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
        <tr ref={setNodeRef} style={style} className="group hover:bg-blue-50/50 dark:hover:bg-gray-700/30 transition-colors">
            <td className="p-3 w-10 text-center" {...attributes} {...listeners}>
                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab mx-auto" />
            </td>
            {children}
        </tr>
    );
}

// Sortable Item for Category Sidebar
function SortableCategorySidebarItem({ id, category, selectedCategory, onClick }) {
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
        position: 'relative',
        zIndex: isDragging ? 20 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center pr-4 pl-1 py-3 cursor-pointer border-l-4 transition-colors ${selectedCategory === category.name ? 'border-red-600 bg-red-50 dark:bg-red-900/10' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            onClick={onClick}
        >
            <div {...attributes} {...listeners} className="p-2 mr-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3 text-gray-400" />
            </div>
            <span className={`text-sm font-medium ${selectedCategory === category.name ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900'}`}>
                {category.name}
            </span>
        </div>
    );
}

export function ItemsView() {
    // 1. All Hooks First (useState, useSensor, useEffect)
    const [view, setView] = useState('list');
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [hideEmpty, setHideEmpty] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showAreaPriceModal, setShowAreaPriceModal] = useState(false);
    const [areaPriceItem, setAreaPriceItem] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [activeDropdown, setActiveDropdown] = useState(null); // 'action', 'quickAction', etc.
    const [actionSearch, setActionSearch] = useState('');
    const [quickActionSearch, setQuickActionSearch] = useState('');

    const [deleteConfirm, setDeleteConfirm] = useState(null);

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

    // Effects
    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handlers
    const loadData = async () => {
        try {
            const [catRes, itemRes] = await Promise.all([
                menuService.getCategories(),
                menuService.getItems()
            ]);
            setCategories(catRes.data);
            setItems(itemRes.data);
        } catch (error) {
            console.error("Failed to load data", error);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirm(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await menuService.deleteItem(deleteConfirm);
            loadData();
        } catch (error) {
            console.error("Failed to delete item", error);
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleItemDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    sortOrder: index
                }));
                menuService.reorder('item', updates).catch(err => console.error("Reorder failed", err));

                return newItems;
            });
        }
    };

    const handleCategoryDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setCategories((cats) => {
                const oldIndex = cats.findIndex((c) => `cat-${c.id}` === active.id);
                const newIndex = cats.findIndex((c) => `cat-${c.id}` === over.id);

                if (oldIndex === -1 || newIndex === -1) return cats;

                const newCats = arrayMove(cats, oldIndex, newIndex);

                const updates = newCats.map((cat, index) => ({
                    id: cat.id,
                    sortOrder: index
                }));

                menuService.reorder('category', updates).catch(err => console.error("Category reorder failed", err));

                return newCats;
            });
        }
    };

    // 2. Computed Values
    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
    );

    const filteredItems = items.filter(i => {
        const matchesCategory = selectedCategory === 'All' ? true : i.Category?.name === selectedCategory;
        const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (i.shortCode && i.shortCode.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const actionItems = [
        { label: 'Available', onClick: () => console.log('Available') },
        { label: 'Update Online Availability', onClick: () => console.log('Update Online Availability') },
        // ... (keep short for brevity in replace, rest is same logical content)
    ];

    const quickActionItems = [
        { label: 'Generate Barcode', onClick: () => console.log('Generate Barcode') },
        // ...
    ];

    // Filter action items
    const filteredActions = actionItems.filter(item => item.label.toLowerCase().includes(actionSearch.toLowerCase()));

    // THIS IS TRICKY: quickActionItems was defined inline before.
    // I need to ensure I don't break the filters.
    // Actually, just returning the UI.

    // 3. Conditional Returns
    if (view === 'add') {
        return <AddItem itemToEdit={editingItem} onBack={() => { setView('list'); setEditingItem(null); loadData(); }} />;
    }

    // 4. Main Render
    // (Re-declaring action lists here to ensure they are available for render)
    const fullActionItems = [
        { label: 'Available', onClick: () => console.log('Available') },
        { label: 'Update Online Availability', onClick: () => console.log('Update Online Availability') },
        { label: 'Active/Inactive Areas', onClick: () => console.log('Active/Inactive Areas') },
        { label: 'Mark As Veg', onClick: () => console.log('Mark As Veg') },
        { label: 'Mark As Non Veg', onClick: () => console.log('Mark As Non Veg') },
        { label: 'Mark As Egg Item', onClick: () => console.log('Mark As Egg Item') },
        { label: 'Remove Items', onClick: () => console.log('Remove Items') },
        { label: 'Update Favorite Item', onClick: () => console.log('Update Favorite Item') },
        { label: 'Update Ignore Tax', onClick: () => console.log('Update Ignore Tax') },
        { label: 'Update Ignore Discount', onClick: () => console.log('Update Ignore Discount') },
        { label: 'Update Ignore Packing Charge (Online)', onClick: () => console.log('Update Ignore Packing Charge') },
        { label: 'Update Swiggy recommended', onClick: () => console.log('Update Swiggy recommended') },
        { label: 'Disable Swiggy POP Items', onClick: () => console.log('Disable Swiggy POP Items') },
        { label: 'Update in Captain', onClick: () => console.log('Update in Captain') },
        { label: 'Update Quantity Popup', onClick: () => console.log('Update Quantity Popup') },
        { label: 'Update in Kiosk', onClick: () => console.log('Update in Kiosk') },
        { label: 'Update Dinein QR', onClick: () => console.log('Update Dinein QR') },
        { label: 'Update Pickup QR', onClick: () => console.log('Update Pickup QR') },
        { label: 'Mark Out of Stock', onClick: () => console.log('Mark Out of Stock') },
        { label: 'Mark In Stock', onClick: () => console.log('Mark In Stock') },
        { label: 'Mark Do Not Track', onClick: () => console.log('Mark Do Not Track') },
        { label: 'Update MRP tag', onClick: () => console.log('Update MRP tag') },
        { label: 'Remove Nutrition Data', onClick: () => console.log('Remove Nutrition Data') },
        { label: 'Remove Image(s)', onClick: () => console.log('Remove Image(s)') },
        { label: 'Remove Serve(s)', onClick: () => console.log('Remove Serve(s)') },
        { label: 'Update Dine In Order Type', onClick: () => console.log('Update Dine In Order Type') },
        { label: 'Update Delivery Order Type', onClick: () => console.log('Update Delivery Order Type') },
        { label: 'Update Pick Up Order Type', onClick: () => console.log('Update Pick Up Order Type') },
        { label: 'Update service/goods tag', onClick: () => console.log('Update service/goods tag') },
        { label: 'Create Self Item Recipe', onClick: () => console.log('Create Self Item Recipe') },
        { label: 'Update Image', onClick: () => console.log('Update Image') },
        { label: 'Apply Zomato Tags', onClick: () => console.log('Apply Zomato Tags') },
        { label: 'Assign Addon Group(s)', onClick: () => console.log('Assign Addon Group(s)') },
        { label: 'Update Open Item', onClick: () => console.log('Update Open Item') },
        { label: 'Update Item Timings', onClick: () => console.log('Update Item Timings') },
        { label: 'Remove Variation(s)', onClick: () => console.log('Remove Variation(s)') },
    ];

    const fullQuickActionItems = [
        { label: 'Generate Barcode', onClick: () => console.log('Generate Barcode') },
        { label: 'Update Base Menu', onClick: () => console.log('Update Base Menu') },
        { label: 'Update Item Rank/Order', onClick: () => console.log('Update Item Rank/Order') },
        { label: 'Area-wise bulk sheet', onClick: () => console.log('Area-wise bulk sheet') },
        { label: 'Update Item Packing Charge', onClick: () => console.log('Update Item Packing Charge') },
        { label: 'Update Nutrition Data', onClick: () => console.log('Update Nutrition Data') },
        { label: 'Recently Deleted', onClick: () => console.log('Recently Deleted') },
        { label: 'Update Kiosk Item Price/Status', onClick: () => console.log('Update Kiosk Item Price/Status') },
        { label: 'Increase/Reduce Price', onClick: () => console.log('Increase/Reduce Price') },
        { label: 'Download Base Menu [Backup]', onClick: () => console.log('Download Base Menu') },
        { label: 'Replace Item Variation(s)', onClick: () => console.log('Replace Item Variation(s)') },
    ];

    const actualFilteredActions = fullActionItems.filter(item => item.label.toLowerCase().includes(actionSearch.toLowerCase()));
    const actualFilteredQuickActions = fullQuickActionItems.filter(item => item.label.toLowerCase().includes(quickActionSearch.toLowerCase()));

    return (
        <div className="flex flex-1 overflow-hidden h-[calc(100vh-140px)] bg-gray-50 dark:bg-gray-900">
            {/* Sidebar Categories */}
            <div className={`${isSidebarOpen ? 'w-64 border-r' : 'w-0 border-none'} bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}>
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-3">Categories</h3>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Hide empty categories</span>
                        <button
                            onClick={() => setHideEmpty(!hideEmpty)}
                            className={`w-8 h-4 rounded-full p-0.5 transition-colors ${hideEmpty ? 'bg-red-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${hideEmpty ? 'translate-x-4' : ''}`} />
                        </button>
                    </div>
                </div>
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={categorySearchTerm}
                            onChange={(e) => setCategorySearchTerm(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-red-500 outline-none dark:bg-gray-800"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto pt-2">
                    <div
                        className={`group flex items-center px-4 py-3 cursor-pointer border-l-4 transition-colors ${selectedCategory === 'All' ? 'border-red-600 bg-red-50 dark:bg-red-900/10' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        onClick={() => setSelectedCategory('All')}
                    >
                        <div className="p-2 mr-1 opacity-0">
                            <div className="w-3 h-3" /> {/* Spacer for alignment */}
                        </div>
                        <span className={`text-sm font-medium ${selectedCategory === 'All' ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900'}`}>All Categories</span>
                    </div>

                    {/* Category List with DnD */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleCategoryDragEnd}
                        id="categories-dnd"
                    >
                        <SortableContext
                            items={filteredCategories.map(c => `cat-${c.id}`)}
                            strategy={verticalListSortingStrategy}
                        >
                            {filteredCategories.map(cat => (
                                <SortableCategorySidebarItem
                                    key={`cat-${cat.id}`}
                                    id={`cat-${cat.id}`}
                                    category={cat}
                                    selectedCategory={selectedCategory}
                                    onClick={() => setSelectedCategory(cat.name)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Toolbar */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between shrink-0 z-10 gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 border border-gray-200 rounded hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-500"
                        >
                            {isSidebarOpen ? <ArrowLeft className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4 rotate-180" />}
                        </button>

                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-3 py-1.5 border rounded text-sm w-64 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700"
                                placeholder="Search items..."
                            />
                        </div>

                        {/* Action Dropdown */}
                        <div className="relative action-dropdown-container">
                            <button
                                onClick={() => setActiveDropdown(activeDropdown === 'action' ? null : 'action')}
                                className="px-3 py-1.5 border rounded text-sm flex items-center gap-1 text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                            >
                                Action <ChevronDown className="w-3 h-3" />
                            </button>
                            {activeDropdown === 'action' && (
                                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-96 overflow-y-auto">
                                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                                        <input
                                            type="text"
                                            value={actionSearch}
                                            onChange={(e) => setActionSearch(e.target.value)}
                                            placeholder="Search..."
                                            className="w-full px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                                            autoFocus
                                        />
                                    </div>
                                    {actualFilteredActions.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { item.onClick(); setActiveDropdown(null); }}
                                            className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions Dropdown */}
                        <div className="relative action-dropdown-container">
                            <button
                                onClick={() => setActiveDropdown(activeDropdown === 'quickAction' ? null : 'quickAction')}
                                className="px-3 py-1.5 border rounded text-sm flex items-center gap-1 text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                            >
                                Quick Actions <ChevronDown className="w-3 h-3" />
                            </button>
                            {activeDropdown === 'quickAction' && (
                                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-96 overflow-y-auto">
                                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                                        <input
                                            type="text"
                                            value={quickActionSearch}
                                            onChange={(e) => setQuickActionSearch(e.target.value)}
                                            placeholder="Search..."
                                            className="w-full px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                                            autoFocus
                                        />
                                    </div>
                                    {actualFilteredQuickActions.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { item.onClick(); setActiveDropdown(null); }}
                                            className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="px-4 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 whitespace-nowrap">
                            Save
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setView('add')}
                            className="px-4 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 flex items-center gap-1 shadow-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Add Items
                        </button>
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto bg-white dark:bg-gray-800">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleItemDragEnd}
                        id="items-dnd"
                    >
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="p-3 w-10 text-center">
                                        #
                                    </th>
                                    <th className="p-3 w-10">
                                        <input type="checkbox" className="rounded border-gray-300" />
                                    </th>
                                    <th className="p-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Name *</th>
                                    <th className="p-3 text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Short Code *</th>
                                    <th className="p-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                                    <th className="p-3 text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Price *</th>
                                    <th className="p-3 text-xs font-bold text-gray-700 uppercase tracking-wider w-40 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                <SortableContext
                                    items={filteredItems.map(i => i.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {filteredItems.map(item => (
                                        <SortableRow key={item.id} id={item.id}>
                                            <td className="p-3 relative">
                                                {/* Veg/Non-Veg Indicator Strip */}
                                                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <input type="checkbox" className="rounded border-gray-300 ml-2" />
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{item.name}</div>
                                                <div className="flex gap-2 mt-1">
                                                    {/* Indicators */}
                                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded border border-red-100" title="Visible Online">O</span>
                                                    {item.availableOndc && (
                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded border border-blue-100" title="Listed on ONDC">ONDC</span>
                                                    )}
                                                    {item.Variants?.length > 0 && (
                                                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded border border-red-100" title="Multiple Variations">V</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm text-gray-600">{item.shortCode || '-'}</td>
                                            <td className="p-3 text-sm text-gray-500 truncate max-w-xs">{item.description || '-'}</td>
                                            <td className="p-3 text-sm font-bold text-gray-800">₹{item.price}</td>
                                            <td className="p-3">
                                                <div className="flex justify-center items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setEditingItem(item); setView('add'); }}
                                                        className="p-1.5 hover:bg-gray-100 rounded text-blue-500"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(item.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </SortableRow>
                                    ))}
                                </SortableContext>
                            </tbody>
                        </table>
                    </DndContext>
                </div>

                {/* Footer / Legend */}
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-500 flex justify-between items-center shrink-0">
                    <div>
                        Showing 1 to {filteredItems.length} of {filteredItems.length} records
                    </div>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><b className="text-red-600">O</b> Expose in online order</span>
                        <span className="flex items-center gap-1"><b className="text-blue-600">ONDC</b> Listed on ONDC Network</span>
                        <span className="flex items-center gap-1"><b className="text-red-600">V</b> Item having Variation</span>
                        <span className="flex items-center gap-1"><b className="text-red-600">A</b> Addon details</span>
                        <span className="flex items-center gap-1"><b className="text-red-600">C</b> Set as combo</span>
                        <span className="flex items-center gap-1"><b className="text-red-600">F</b> Favourite Item</span>
                        <span className="flex items-center gap-1"><b className="text-red-600">K</b> Expose in kiosk order</span>
                    </div>
                </div>
            </div>



            {showAreaPriceModal && (
                <AreaPriceUpdateModal
                    item={areaPriceItem}
                    onClose={() => setShowAreaPriceModal(false)}
                    onSave={async (data) => {
                        try {
                            const payload = {
                                price: data.basePrice,
                                areaPrices: data.areaPrices,
                                isAvailable: data.isActive
                            };
                            await menuService.updateItem(data.itemId, payload);
                            loadData(); // Refresh the list
                            setShowAreaPriceModal(false);
                            // Ideally show a success toast here
                        } catch (error) {
                            console.error("Failed to update area prices", error);
                            alert("Failed to update area prices");
                        }
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Item?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Are you sure you want to delete item <b>{items.find(i => i.id === deleteConfirm)?.name}</b>?
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
