import React, { useState, useEffect } from 'react';
import { menuService, orderService, settingsService } from '../services/api';
import { Search, Plus, Minus, Trash2, ShoppingBag, Bike, Utensils, Printer, ChefHat } from 'lucide-react';

export function Billing({ resetSignal }) {
    const [cart, setCart] = useState([]);
    const [orderType, setOrderType] = useState('dine-in');
    const [activeCategory, setActiveCategory] = useState('All');

    // Data State
    const [categories, setCategories] = useState(['All']);
    const [items, setItems] = useState([]);
    const [settings, setSettings] = useState({ gst_mode: 'exclusive', gst_percentage: '5' });

    // Customization State
    const [customizingItem, setCustomizingItem] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedAddons, setSelectedAddons] = useState({}); // { groupId: [addonId, addonId] }

    useEffect(() => {
        loadData();
    }, []);

    // Handle Reset Signal
    useEffect(() => {
        if (resetSignal > 0) {
            setCart([]);
            setOrderType('dine-in');
            setCustomizingItem(null);
            // Optionally reset category too
            setActiveCategory('All');
        }
    }, [resetSignal]);

    const loadData = async () => {
        try {
            const [catRes, itemRes, settingsRes] = await Promise.all([
                menuService.getCategories(),
                menuService.getItems(),
                settingsService.getSettings()
            ]);

            // Transform categories
            const catNames = ['All', ...catRes.data.map(c => c.name)];
            setCategories(catNames);

            // Settings
            if (settingsRes.data) {
                setSettings(settingsRes.data);
            }

            // Transform items - Ensure variants/addons are passed through
            setItems(itemRes.data.map(i => ({ ...i, type: i.isVeg ? 'Veg' : 'Non-Veg', color: 'bg-white' })));
        } catch (error) {
            console.error("Failed to load data", error);
        }
    };

    const initiateAddToCart = (item) => {
        const hasVariants = item.Variants && item.Variants.length > 0;
        const hasAddons = item.addonGroups && item.addonGroups.length > 0;

        if (hasVariants || hasAddons) {
            setCustomizingItem(item);
            // Default variant selection
            if (hasVariants) setSelectedVariant(item.Variants[0]);
            else setSelectedVariant(null);
            setSelectedAddons({});
        } else {
            addToCart(item, null, []);
        }
    };

    const handleAddonToggle = (group, addon) => {
        setSelectedAddons(prev => {
            const current = prev[group.id] || [];
            const isMulti = group.maxSelection > 1;

            if (isMulti) {
                if (current.includes(addon.id)) {
                    return { ...prev, [group.id]: current.filter(id => id !== addon.id) };
                } else {
                    return { ...prev, [group.id]: [...current, addon.id] };
                }
            } else {
                // Single select
                return { ...prev, [group.id]: [addon.id] };
            }
        });
    };

    const confirmCustomization = () => {
        if (!customizingItem) return;

        // Flatten selected addons
        const addonsList = [];
        if (customizingItem.addonGroups) {
            customizingItem.addonGroups.forEach(g => {
                const selectedIds = selectedAddons[g.id] || [];
                selectedIds.forEach(id => {
                    const addon = g.Addons.find(a => a.id === id);
                    if (addon) addonsList.push(addon);
                });
            });
        }

        addToCart(customizingItem, selectedVariant, addonsList);
        setCustomizingItem(null);
        setSelectedVariant(null);
        setSelectedAddons({});
    };

    const addToCart = (item, variant, addons = []) => {
        setCart(prev => {
            // Generate unique signature for "same item" check
            const signature = `${item.id}-${variant ? variant.id : 'base'}-${addons.map(a => a.id).sort().join(',')}`;

            const existingIndex = prev.findIndex(i => i.signature === signature);
            if (existingIndex >= 0) {
                const newCart = [...prev];
                newCart[existingIndex].qty += 1;
                return newCart;
            }

            // Calculate base price
            let finalPrice = variant ? variant.price : item.price;
            // Add addons price
            const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
            finalPrice += addonsTotal;

            return [...prev, {
                ...item,
                signature,
                qty: 1,
                variant: variant,
                selectedAddons: addons,
                displayPrice: finalPrice, // Store the unit price for this configuration
                price: finalPrice // Override base price for calculation
            }];
        });
    };

    const updateQty = (signature, delta) => {
        setCart(prev => prev.map(item => {
            if (item.signature === signature) {
                return { ...item, qty: Math.max(1, item.qty + delta) };
            }
            return item;
        }));
    };

    const removeItem = (signature) => {
        setCart(prev => prev.filter(i => i.signature !== signature));
    };

    // Calculation Logic
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const gstPercent = parseFloat(settings.gst_percentage) || 0;
    const isInclusive = settings.gst_mode === 'inclusive';

    let taxAmount = 0;
    let finalTotal = 0;

    if (isInclusive) {
        finalTotal = subtotal;
        taxAmount = subtotal - (subtotal / (1 + (gstPercent / 100)));
    } else {
        taxAmount = subtotal * (gstPercent / 100);
        finalTotal = subtotal + taxAmount;
    }

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        try {
            const orderData = {
                items: cart.map(i => ({
                    itemId: i.id,
                    itemName: i.name,
                    price: i.price,
                    quantity: i.qty,
                    variantId: i.variant?.id,
                    variantName: i.variant?.name,
                    addons: i.selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price }))
                })),
                totalAmount: finalTotal,
                taxAmount: taxAmount,
                type: orderType,
                orderNumber: `ORD-${Date.now()}`
            };

            await orderService.createOrder(orderData);
            alert("Order Placed Successfully!");
            setCart([]);
        } catch (error) {
            console.error("Checkout failed", error);
            alert(`Failed to place order: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleKOT = () => {
        if (cart.length === 0) return;
        alert(`KOT Generated for ${orderType.toUpperCase()} Order! \nItems sent to kitchen.`);
    };

    const filteredItems = activeCategory === 'All'
        ? items
        : items.filter(i => (i.Category?.name || 'Uncategorized') === activeCategory); // Updated filter logic

    return (
        <div className="flex h-full gap-6 p-6 overflow-hidden relative">
            {/* Customization Modal */}
            {customizingItem && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden transform transition-all scale-100">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{customizingItem.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize your order</p>
                            </div>
                            <button
                                onClick={() => setCustomizingItem(null)}
                                className="p-2 hover:bg-gray-200 rounded-full dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <Trash2 className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Variants Section */}
                            {customizingItem.Variants && customizingItem.Variants.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">Choose Variation</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {customizingItem.Variants.map(v => {
                                            const isSelected = selectedVariant?.id === v.id;
                                            return (
                                                <div
                                                    key={v.id}
                                                    onClick={() => setSelectedVariant(v)}
                                                    className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${isSelected
                                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md'
                                                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-sm'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-orange-500' : 'border-gray-300 dark:border-gray-600 group-hover:border-orange-400'}`}>
                                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                                                        </div>
                                                        <span className={`font-semibold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{v.name}</span>
                                                    </div>
                                                    <span className={`font-bold ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>₹{v.price}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Addons Section */}
                            {customizingItem.addonGroups && customizingItem.addonGroups.map(group => (
                                <div key={group.id} className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">{group.name}</h4>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full uppercase tracking-wider">
                                            {group.maxSelection > 1 ? `Select up to ${group.maxSelection}` : 'Select 1'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {group.Addons.map(addon => {
                                            const isSelected = (selectedAddons[group.id] || []).includes(addon.id);
                                            return (
                                                <label key={addon.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-sm' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex items-center justify-center w-5 h-5 rounded ${group.maxSelection > 1 ? 'border-2' : 'border-2 rounded-full'} ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                                            {group.maxSelection > 1
                                                                ? (isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>)
                                                                : (isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />)
                                                            }
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleAddonToggle(group, addon)}
                                                            className="hidden"
                                                        />
                                                        <span className={`font-medium flex items-center gap-2 ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                            <span className="text-[10px]">{addon.type === 'veg' ? '🟢' : '🔴'}</span> {addon.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">+₹{addon.price}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer (Total & Action) */}
                        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Amount</p>
                                <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    ₹{((selectedVariant ? selectedVariant.price : customizingItem.price) +
                                        (
                                            customizingItem.addonGroups?.reduce((acc, g) => {
                                                const selectedIds = selectedAddons[g.id] || [];
                                                const groupTotal = selectedIds.reduce((sum, id) => {
                                                    const a = g.Addons.find(x => x.id === id);
                                                    return sum + (a ? a.price : 0);
                                                }, 0);
                                                return acc + groupTotal;
                                            }, 0) || 0
                                        )
                                    ).toFixed(2)}
                                </div>
                            </div>
                            <button
                                onClick={confirmCustomization}
                                className="px-8 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-600/30 transition-all transform active:scale-95 flex items-center gap-2"
                            >
                                <span>Add Item</span>
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Menu Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Order Type Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <button
                        onClick={() => setOrderType('dine-in')}
                        className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${orderType === 'dine-in' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Utensils className="w-4 h-4" /> Dine-in
                    </button>
                    <button
                        onClick={() => setOrderType('delivery')}
                        className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${orderType === 'delivery' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <ShoppingBag className="w-4 h-4" /> Delivery
                    </button>
                    <button
                        onClick={() => setOrderType('takeaway')}
                        className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${orderType === 'takeaway' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <ChefHat className="w-4 h-4" /> Takeaway
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Categories Sidebar */}
                    <div className="w-48 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 p-2 space-y-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat
                                    ? 'bg-orange-600 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-gray-800">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => initiateAddToCart(item)}
                                    className="group relative flex flex-col items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md transition-all bg-gray-50 dark:bg-gray-700/30"
                                >
                                    <div className={`w-20 h-20 rounded-full mb-3 ${item.color} dark:bg-opacity-20 flex items-center justify-center text-3xl shadow-sm group-hover:scale-105 transition-transform`}>
                                        🍔
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-center text-sm">{item.name}</h4>
                                    <p className="text-orange-600 font-bold mt-1 text-sm">₹{item.price}</p>
                                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-orange-600">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cart Area */}
            <div className="w-80 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">Current Order</h3>
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold shadow-sm border border-blue-200 uppercase">
                        {orderType}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <ShoppingBag className="w-12 h-12 mb-2 opacity-20" />
                            <p>Cart is empty</p>
                            <p className="text-sm">Select items to start ordering</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.signature} className="flex flex-col p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</h4>
                                        {/* Variation Tag */}
                                        {item.variant && <span className="text-[10px] bg-orange-100 text-orange-800 px-1 rounded block w-fit mt-0.5">{item.variant.name}</span>}
                                        {/* Addons List */}
                                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                                            <div className="text-[10px] text-gray-500 mt-1">
                                                {item.selectedAddons.map(a => (
                                                    <span key={a.id} className="block">+ {a.name} (₹{a.price})</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">₹{(item.price * item.qty).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">@ ₹{item.price.toFixed(2)}/ea</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateQty(item.signature, -1)} className="p-1 rounded bg-white dark:bg-gray-600 shadow-sm hover:bg-gray-100 text-gray-600 dark:text-gray-200">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-6 text-center font-medium text-sm">{item.qty}</span>
                                        <button onClick={() => updateQty(item.signature, 1)} className="p-1 rounded bg-white dark:bg-gray-600 shadow-sm hover:bg-gray-100 text-gray-600 dark:text-gray-200">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                        <div className="w-4"></div>
                                        <button onClick={() => removeItem(item.signature)} className="text-red-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>
                                {isInclusive ? 'Included GST' : 'GST'} ({gstPercent}%)
                            </span>
                            <span>₹{taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span>Total</span>
                            <span>₹{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleKOT}
                            className="py-3 rounded-xl font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> KOT
                        </button>
                        <button
                            onClick={handleCheckout}
                            className="py-3 rounded-xl font-bold bg-orange-600 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-700 hover:shadow-orange-600/50 transition-all transform active:scale-95"
                        >
                            Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
