import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ChefHat, Info, Check, Search, Edit2 } from 'lucide-react';

export function ItemCustomizationModal({ item, isOpen, onClose, onAddToCart, editMode = false, initialVariant = null, initialAddons = {} }) {
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedAddons, setSelectedAddons] = useState({}); // { groupId: [addonId] }
    const [quantity, setQuantity] = useState(1);
    const [cookingInstructions, setCookingInstructions] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        if (isOpen && item) {
            if (editMode && initialVariant) {
                // Edit mode: use pre-selected variant
                setSelectedVariant(initialVariant);
            } else if (item.Variants && item.Variants.length > 0) {
                // New item: auto-select first variant
                setSelectedVariant(item.Variants[0]);
            } else {
                setSelectedVariant(null);
            }

            if (editMode && initialAddons && Object.keys(initialAddons).length > 0) {
                // Edit mode: use pre-selected addons
                setSelectedAddons(initialAddons);
            } else {
                setSelectedAddons({});
            }

            setQuantity(1);
            setCookingInstructions('');
            setShowInstructions(false);
        }
    }, [isOpen, item, editMode, initialVariant, initialAddons]);

    if (!isOpen || !item) return null;

    const hasVariants = item.Variants && item.Variants.length > 0;
    const hasAddons = item.addonGroups && item.addonGroups.length > 0;

    const currentBasePrice = selectedVariant ? selectedVariant.price : item.price;

    // Calculate addons total
    let addonsPrice = 0;
    const flattenedAddons = [];
    if (hasAddons) {
        item.addonGroups.forEach(group => {
            const selectedIds = selectedAddons[group.id] || [];
            selectedIds.forEach(id => {
                const addon = group.Addons.find(a => a.id === id);
                if (addon) {
                    addonsPrice += addon.price;
                    flattenedAddons.push(addon);
                }
            });
        });
    }

    const unitPrice = currentBasePrice + addonsPrice;
    const totalPrice = unitPrice * quantity;

    const handleAddonToggle = (group, addon) => {
        setSelectedAddons(prev => {
            const current = prev[group.id] || [];
            const isMulti = group.maxSelection > 1;

            if (isMulti) {
                if (current.includes(addon.id)) {
                    return { ...prev, [group.id]: current.filter(id => id !== addon.id) };
                } else {
                    if (current.length < group.maxSelection) {
                        return { ...prev, [group.id]: [...current, addon.id] };
                    }
                    return prev;
                }
            } else {
                return { ...prev, [group.id]: [addon.id] };
            }
        });
    };

    const handleConfirm = () => {
        onAddToCart(item, selectedVariant, flattenedAddons, quantity, cookingInstructions);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                            {item.name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Customize your selection
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Variants Section */}
                    {hasVariants && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Select Variation</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {item.Variants.map((variant) => {
                                    const isSelected = selectedVariant?.id === variant.id;
                                    return (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                                                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-orange-200 dark:hover:border-orange-900/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-orange-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                                                </div>
                                                <span className={`font-bold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {variant.name}
                                                </span>
                                            </div>
                                            <span className="font-black text-orange-600 dark:text-orange-400">₹{variant.price}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Addons Section */}
                    {hasAddons && item.addonGroups.map((group) => (
                        <div key={group.id} className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{group.name}</h3>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${group.isRequired ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                    {group.maxSelection > 1 ? `Up to ${group.maxSelection}` : 'Select 1'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {group.Addons.map((addon) => {
                                    const isSelected = (selectedAddons[group.id] || []).includes(addon.id);
                                    return (
                                        <button
                                            key={addon.id}
                                            onClick={() => handleAddonToggle(group, addon)}
                                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                                : 'border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-blue-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded ${group.maxSelection > 1 ? 'border-2' : 'border-2 rounded-full'} flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                                    {isSelected && (group.maxSelection > 1 ? <Check className="w-3 h-3 stroke-[4]" /> : <div className="w-2 h-2 rounded-full bg-white" />)}
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className={`font-bold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {addon.name}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
                                                        {addon.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                                +₹{addon.price}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Quantity & Instructions */}
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ChefHat className="w-5 h-5 text-gray-400" />
                                <span className="font-bold text-gray-700 dark:text-gray-300">Set Quantity</span>
                            </div>
                            <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
                                    <Minus className="w-5 h-5" />
                                </button>
                                <span className="text-xl font-black w-8 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Special Instructions</span>
                            </div>
                            <textarea
                                value={cookingInstructions}
                                onChange={(e) => setCookingInstructions(e.target.value)}
                                placeholder="E.g., No onion, extra spicy, etc."
                                className="w-full h-24 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none text-sm resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Configuration</p>
                        <div className="text-3xl font-black text-gray-900 dark:text-white flex items-baseline gap-1">
                            <span className="text-lg">₹</span>
                            {totalPrice.toFixed(2)}
                        </div>
                    </div>
                    <button
                        onClick={handleConfirm}
                        className={`px-10 py-4 ${editMode ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'} text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-3`}
                    >
                        <span>{editMode ? 'Update Item' : 'Add to Order'}</span>
                        {editMode ? <Edit2 className="w-5 h-5" /> : <Plus className="w-6 h-6 stroke-[3]" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
