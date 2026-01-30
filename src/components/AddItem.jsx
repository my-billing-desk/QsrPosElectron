import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Plus, Trash2, Check, ChevronDown, GripVertical } from 'lucide-react';
import { menuService, groupService } from '../services/api'; // Ensure these are exported correctly
import toast from 'react-hot-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper Sortable Row
function SortableVariantRow({ id, index, variant, handleVariantChange, removeVariant }) {
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
        <tr ref={setNodeRef} style={style} className="group hover:bg-blue-50/30 transition-colors">
            <td className="p-3 text-center text-xs text-gray-400 font-mono w-10">
                <div {...attributes} {...listeners} className="cursor-grab hover:text-gray-600">
                    <GripVertical className="w-4 h-4 mx-auto" />
                </div>
            </td>
            <td className="p-3">
                <input
                    value={variant?.name || ''}
                    onChange={e => handleVariantChange(index, 'name', e.target.value)}
                    className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-sm font-medium text-gray-800 dark:text-gray-200 placeholder-gray-400"
                    placeholder="e.g. Small"
                />
            </td>
            <td className="p-3">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                    <input
                        type="number"
                        value={variant?.price || ''}
                        onChange={e => handleVariantChange(index, 'price', e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="0.00"
                    />
                </div>
            </td>
            <td className="p-3 text-center">
                <button
                    onClick={() => removeVariant(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove Variant"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
}

export function AddItem({ onBack, itemToEdit }) {
    const [formData, setFormData] = useState({
        name: '',
        shortCode: '',
        onlineName: '',
        price: '',
        categoryId: '',
        description: '',
        isVeg: true,
        goodsServices: 'Goods',
        orderDelivery: true,
        orderTakeAway: true,
        orderDineIn: true,
        isAvailable: true,
        availableOndc: true,
        ondcTags: { veg_nonveg: 'veg' },
        image: null,
        imagePreview: null,
        showImage: false,
        variants: [], // { _key, name, price }
        addonGroupIds: [],
        itemVariationGroups: []
    });

    const [categories, setCategories] = useState([]);
    const [addonGroups, setAddonGroups] = useState([]);
    const [variationGroups, setVariationGroups] = useState([]);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);

    // Dnd Sensors with Activation Constraint to prevent click blocking
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

    useEffect(() => {
        // Safe Load Data
        const fetchData = async () => {
            try {
                // We use parallel fetching but handle failures gracefully
                const [catRes, groupRes, varRes] = await Promise.allSettled([
                    menuService.getCategories(),
                    groupService.getAddonGroups(),
                    groupService.getVariationGroups()
                ]);

                if (catRes.status === 'fulfilled' && catRes.value?.data) {
                    setCategories(catRes.value.data);
                } else {
                    console.error("Failed to load categories:", catRes.reason);
                }

                if (groupRes.status === 'fulfilled' && groupRes.value?.data) {
                    setAddonGroups(groupRes.value.data);
                } else {
                    console.error("Failed to load addon groups:", groupRes.reason);
                }

                if (varRes.status === 'fulfilled' && varRes.value?.data) {
                    setVariationGroups(varRes.value.data);
                } else {
                    console.error("Failed to load variation groups:", varRes.reason);
                }

            } catch (error) {
                console.error("Critical error loading item data:", error);
                toast.error("Failed to load some data. Please check connection.");
            }
        };

        fetchData();

        // Initialize Form Data
        if (itemToEdit) {
            try {
                setFormData({
                    name: itemToEdit.name || '',
                    shortCode: itemToEdit.shortCode || '',
                    onlineName: itemToEdit.onlineName || '',
                    price: itemToEdit.price || '',
                    categoryId: itemToEdit.categoryId || '',
                    description: itemToEdit.description || '',
                    isVeg: itemToEdit.isVeg !== false, // default true if undefined
                    goodsServices: itemToEdit.goodsServices || 'Goods',
                    orderDelivery: itemToEdit.orderDelivery !== false,
                    orderTakeAway: itemToEdit.orderTakeAway !== false,
                    orderDineIn: itemToEdit.orderDineIn !== false,
                    isAvailable: itemToEdit.isAvailable !== false,
                    image: null,
                    imagePreview: itemToEdit.image ? `http://localhost:5001${itemToEdit.image}` : null,
                    showImage: itemToEdit.showImage === true || itemToEdit.showImage === 1,
                    variants: (itemToEdit.Variants || []).map(v => ({
                        _key: Math.random().toString(36).substr(2, 9),
                        name: v.name || '',
                        price: v.price || ''
                    })),
                    addonGroupIds: (itemToEdit.addonGroups || []).map(g => g.id),
                    itemVariationGroups: (itemToEdit.variationGroups || []).map(vg => vg.id),
                    availableOndc: itemToEdit.availableOndc !== false,
                    ondcTags: itemToEdit.ondcTags || { veg_nonveg: itemToEdit.isVeg ? 'veg' : 'non_veg' }
                });
            } catch (err) {
                console.error("Error parsing item data:", err);
                toast.error("Error loading item details.");
            }
        }
    }, [itemToEdit]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...formData.variants];
        if (newVariants[index]) {
            newVariants[index][field] = value;
            setFormData(prev => ({ ...prev, variants: newVariants }));
        }
    };

    const addVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, {
                _key: Math.random().toString(36).substr(2, 9),
                name: '',
                price: ''
            }]
        }));
    };

    const removeVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setFormData(prev => {
                const oldIndex = prev.variants.findIndex(v => v._key === active.id);
                const newIndex = prev.variants.findIndex(v => v._key === over.id);
                return {
                    ...prev,
                    variants: arrayMove(prev.variants, oldIndex, newIndex)
                };
            });
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.categoryId || !formData.price) {
            toast.error('Please fill Name, Category and Price');
            return;
        }

        try {
            setLoading(true);
            const data = new FormData();
            // Append basic fields, checking for null/undefined
            const append = (key, val) => data.append(key, val === null || val === undefined ? '' : val);

            append('name', formData.name);
            append('shortCode', formData.shortCode);
            append('onlineName', formData.onlineName);
            append('price', formData.price);
            append('categoryId', formData.categoryId);
            append('description', formData.description);
            append('isVeg', formData.isVeg);
            append('goodsServices', formData.goodsServices);
            append('orderDelivery', formData.orderDelivery);
            append('orderTakeAway', formData.orderTakeAway);
            append('orderDineIn', formData.orderDineIn);
            append('isAvailable', formData.isAvailable);
            append('availableOndc', formData.availableOndc);
            append('showImage', formData.showImage);
            append('ondcTags', JSON.stringify(formData.ondcTags || {}));

            if (formData.image instanceof File) {
                data.append('image', formData.image);
            }

            // Variants
            const variantsData = formData.variants.map((v, i) => ({
                name: v.name,
                price: v.price || 0,
                sortOrder: i
            }));
            data.append('variants', JSON.stringify(variantsData));

            // Associations
            data.append('addonGroupIds', JSON.stringify(formData.addonGroupIds));
            data.append('variationGroupIds', JSON.stringify(formData.itemVariationGroups));

            if (itemToEdit && itemToEdit.id) {
                await menuService.updateItem(itemToEdit.id, data);
                toast.success('Item updated successfully');
            } else {
                await menuService.createItem(data);
                toast.success('Item created successfully');
            }

            setLoading(false);
            onBack();
        } catch (error) {
            console.error("Save Error:", error);
            setLoading(false);
            toast.error('Failed to save item: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const res = await menuService.createCategory({ name: newCategoryName });
            if (res.data) {
                setCategories(prev => [...prev, res.data]);
                setFormData(prev => ({ ...prev, categoryId: res.data.id }));
                setShowNewCategoryInput(false);
                toast.success("Category created successfully");
            }
        } catch (err) {
            toast.error("Failed to create category");
        }
    };

    // Safe render for groups
    const safeVariationGroups = Array.isArray(variationGroups) ? variationGroups : [];
    const safeAddonGroups = Array.isArray(addonGroups) ? addonGroups : [];
    const safeCategories = Array.isArray(categories) ? categories : [];

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 absolute inset-0 z-20">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="text-xs text-gray-500">Menu Management - {itemToEdit ? 'Edit Item' : 'Add Item'}</div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{formData.name || (itemToEdit ? 'Edit Item' : 'New Item')}</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 shadow-sm disabled:opacity-50 flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save & Exit'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Basic Info Card */}
                    <div className="bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="grid grid-cols-12 gap-6">
                            {/* Row 1 */}
                            <div className="col-span-12 md:col-span-3">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Name *</label>
                                <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border rounded bg-blue-50/30 border-blue-200 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Item Name" />
                            </div>
                            <div className="col-span-12 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Short Code *</label>
                                <input name="shortCode" value={formData.shortCode} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-1 focus:ring-gray-300 outline-none" placeholder="Code" />
                            </div>
                            <div className="col-span-12 md:col-span-3">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Online Display Name</label>
                                <input name="onlineName" value={formData.onlineName} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-1 focus:ring-gray-300 outline-none" placeholder="Display Name" />
                            </div>
                            <div className="col-span-12 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={(e) => {
                                        if (e.target.value === 'new') { setShowNewCategoryInput(true); setNewCategoryName(''); }
                                        else handleInputChange(e);
                                    }}
                                    className="w-full p-2 border rounded bg-white outline-none"
                                >
                                    <option value="">Select Category</option>
                                    {safeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    <option value="new" className="text-blue-600 font-bold">+ New Category</option>
                                </select>
                            </div>
                            <div className="col-span-12 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Price *</label>
                                <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-1 focus:ring-gray-300 outline-none" placeholder="0" />
                            </div>

                            {/* Row 2 */}
                            <div className="col-span-12 md:col-span-3">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                                <input name="description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-1 focus:ring-gray-300 outline-none" />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Dietary</label>
                                <select
                                    name="isVeg"
                                    value={formData.isVeg.toString()}
                                    onChange={e => setFormData({ ...formData, isVeg: e.target.value === 'true' })}
                                    className="w-full p-2 border rounded bg-white outline-none"
                                >
                                    <option value="true">Veg</option>
                                    <option value="false">Non-Veg</option>
                                </select>
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">GST Type</label>
                                <select name="goodsServices" value={formData.goodsServices} onChange={handleInputChange} className="w-full p-2 border rounded bg-white outline-none">
                                    <option value="Goods">Goods</option>
                                    <option value="Services">Services</option>
                                </select>
                            </div>

                            {/* Order Types */}
                            <div className="col-span-12 md:col-span-5">
                                <label className="block text-xs font-bold text-gray-700 mb-2">Order Type</label>
                                <div className="space-y-1">
                                    {[
                                        { key: 'orderDelivery', label: 'Delivery' },
                                        { key: 'orderTakeAway', label: 'Take Away' },
                                        { key: 'orderDineIn', label: 'Dine In' },
                                        { key: 'isAvailable', label: 'Online Expose' },
                                    ].map(type => (
                                        <label key={type.key} className="flex items-center gap-2 cursor-pointer group">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData[type.key] ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                                {formData[type.key] && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <input type="checkbox" name={type.key} checked={formData[type.key]} onChange={handleInputChange} className="hidden" />
                                            <span className="text-sm text-gray-700 group-hover:text-gray-900">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="col-span-12 border-t border-gray-100 pt-3 mt-2">
                            <div className="flex items-center gap-4">
                                <label className="flex flex-col items-center justify-center w-20 h-20 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                                    {formData.imagePreview ? (
                                        <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center">
                                            <Plus className="w-5 h-5 text-gray-400" />
                                            <p className="text-[9px] text-gray-500 mt-1">Upload</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setFormData(p => ({
                                                    ...p,
                                                    image: file,
                                                    imagePreview: URL.createObjectURL(file)
                                                }));
                                            }
                                        }}
                                    />
                                </label>

                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${formData.showImage ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${formData.showImage ? 'translate-x-4' : ''}`} />
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.showImage}
                                            onChange={(e) => setFormData(p => ({ ...p, showImage: e.target.checked }))}
                                            className="hidden"
                                        />
                                        <span className="text-xs font-semibold text-gray-700">Show Image in POS</span>
                                    </label>

                                    {formData.imagePreview && (
                                        <button
                                            onClick={() => setFormData(p => ({ ...p, image: null, imagePreview: null }))}
                                            className="text-[10px] text-red-500 hover:text-red-700 font-medium text-left flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" /> Remove Image
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variations Section */}
                    <div className="bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Variation Groups</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {safeVariationGroups.length > 0 ? safeVariationGroups.map(group => (
                                <label key={group.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.itemVariationGroups?.includes(group.id)
                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.itemVariationGroups?.includes(group.id) || false}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setFormData(prev => {
                                                const current = prev.itemVariationGroups || [];
                                                return {
                                                    ...prev,
                                                    itemVariationGroups: isChecked
                                                        ? [...current, group.id]
                                                        : current.filter(id => id !== group.id)
                                                };
                                            });
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{group.name}</div>
                                        <div className="text-xs text-gray-500">{group.departmentName}</div>
                                    </div>
                                </label>
                            )) : (
                                <div className="col-span-full text-xs text-gray-400">No variation groups found.</div>
                            )}
                        </div>

                        {/* Custom Variants */}
                        <div className="mt-6 bg-gray-50/50 rounded border border-gray-200 p-4">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase mb-4">Custom Variations</h3>

                            <div className="border rounded-lg overflow-hidden bg-white">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                                            <tr>
                                                <th className="p-3 w-10">#</th>
                                                <th className="p-3">Variation Name</th>
                                                <th className="p-3 w-48">Price (₹)</th>
                                                <th className="p-3 w-20 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            <SortableContext items={formData.variants.map(v => v._key)} strategy={verticalListSortingStrategy}>
                                                {formData.variants.map((variant, index) => (
                                                    <SortableVariantRow
                                                        key={variant._key}
                                                        id={variant._key}
                                                        index={index}
                                                        variant={variant}
                                                        handleVariantChange={handleVariantChange}
                                                        removeVariant={removeVariant}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </tbody>
                                    </table>
                                </DndContext>
                                {formData.variants.length === 0 && (
                                    <div className="text-center py-6 text-gray-400 text-sm">No custom variations added.</div>
                                )}
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button onClick={addVariant} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                                    <Plus className="w-4 h-4 text-blue-500" /> API Add Empty Row
                                </button>
                            </div>
                        </div>

                        {/* Addon Group */}
                        <div className="mt-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Addon Group</label>
                            <select
                                className="w-full p-2 border rounded bg-white text-gray-700 outline-none"
                                value={formData.addonGroupIds[0] || ''}
                                onChange={(e) => setFormData(p => ({ ...p, addonGroupIds: [e.target.value] }))}
                            >
                                <option value="">Select Addon Group</option>
                                {safeAddonGroups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* New Category Modal */}
                    {showNewCategoryInput && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-96 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold">Create New Category</h3>
                                    <button onClick={() => setShowNewCategoryInput(false)}><X className="w-4 h-4" /></button>
                                </div>
                                <input
                                    autoFocus
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                                    className="w-full p-2 border rounded mb-4"
                                    placeholder="Category Name"
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setShowNewCategoryInput(false)} className="px-3 py-1 text-gray-600">Cancel</button>
                                    <button onClick={handleCreateCategory} className="px-3 py-1 bg-blue-600 text-white rounded">Create</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AddItem;
