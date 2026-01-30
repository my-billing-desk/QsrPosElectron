import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Filter, Circle, Disc, Menu
} from 'lucide-react';
import { menuService } from '../../services/api';
import toast from 'react-hot-toast';

export const MenuOnOff = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [catSearchQuery, setCatSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filterType, setFilterType] = useState('all'); // all, veg, non-veg

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [itemsRes, catsRes] = await Promise.all([
                menuService.getItems(),
                menuService.getCategories()
            ]);
            setItems(itemsRes.data || []);
            setCategories(catsRes.data || []);
        } catch (error) {
            console.error("Failed to load menu data", error);
            toast.error("Failed to load menu items");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (itemId, field, currentStatus) => {
        const newStatus = !currentStatus;

        // Optimistic update
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, [field]: newStatus } : item
        ));

        try {
            await menuService.updateStatus(itemId, { [field]: newStatus });
            const fieldLabel = field === 'availableOffline' ? 'Offline' : field === 'availableSwiggy' ? 'Swiggy' : field === 'availableOndc' ? 'ONDC' : 'Zomato';
            toast.success(`${fieldLabel} updated`);
        } catch (error) {
            // Revert on error
            setItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, [field]: currentStatus } : item
            ));
            toast.error("Failed to update status");
        }
    };

    // Derived state for grouping
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
            const matchesType = filterType === 'all' ||
                (filterType === 'veg' && item.type === 'veg') ||
                (filterType === 'non-veg' && item.type === 'non-veg');

            return matchesSearch && matchesCategory && matchesType;
        });
    }, [items, searchQuery, selectedCategory, filterType]);

    const groupedItems = useMemo(() => {
        const groups = {};
        // Initialize groups
        categories.forEach(cat => {
            groups[cat.id] = { name: cat.name, items: [] };
        });

        // If 'all' is selected, show all categories that have items. 
        // If specific category is selected, the filter above handles it, but we still group by category for display structure.
        filteredItems.forEach(item => {
            if (groups[item.categoryId]) {
                groups[item.categoryId].items.push(item);
            }
        });

        return Object.values(groups).filter(g => g.items.length > 0);
    }, [filteredItems, categories]);

    const ToggleSwitch = ({ checked, onChange }) => (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={onChange}
            />
            {/* Base Track */}
            <div className={`
                w-10 h-5 rounded-full peer peer-focus:outline-none transition-colors duration-200
                ${checked ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}
            `}></div>

            {/* Knob */}
            <div className={`
                absolute top-[2px] left-[2px] bg-white border border-gray-300 dark:border-gray-500 rounded-full h-4 w-4 transition-transform duration-200
                ${checked ? 'translate-x-full border-white' : 'translate-x-0'}
            `}></div>
        </label>
    );

    const VegIcon = () => (
        <div className="w-4 h-4 border border-green-600 flex items-center justify-center p-[2px]">
            <div className="w-full h-full bg-green-600 rounded-full"></div>
        </div>
    );

    const NonVegIcon = () => (
        <div className="w-4 h-4 border border-red-600 flex items-center justify-center p-[2px]">
            <div className="w-full h-full bg-red-600 rounded-full"></div>
        </div>
    );

    const EggIcon = () => (
        <div className="w-4 h-4 border border-yellow-600 flex items-center justify-center p-[2px]">
            <div className="w-full h-full bg-yellow-600 rounded-full"></div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-gray-900 font-sans">

            {/* LEFT SIDEBAR - CATEGORIES */}
            <div className="w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-sm z-20 hidden md:flex">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Category</span>
                        <Filter size={16} className="text-gray-400" />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                        <input
                            type="text"
                            placeholder="Find category..."
                            value={catSearchQuery}
                            onChange={(e) => setCatSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-[10px] rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-1 focus:ring-red-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`w-full flex items-center justify-between px-4 py-2 text-xs font-medium border-b border-gray-100 dark:border-gray-700 transition-colors
                            ${selectedCategory === 'all'
                                ? 'bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 border-l-4 border-l-red-500'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-l-transparent'}`}
                    >
                        <span>All Items</span>
                        <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full">
                            {items.length}
                        </span>
                    </button>

                    {categories
                        .filter(cat => cat.name.toLowerCase().includes(catSearchQuery.toLowerCase()))
                        .map(cat => {
                            const count = items.filter(i => i.categoryId === cat.id).length;
                            if (count === 0 && selectedCategory !== 'all') return null;

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full flex items-center justify-between px-4 py-2 text-xs font-medium border-b border-gray-100 dark:border-gray-700 transition-colors
                                        ${selectedCategory === cat.id
                                            ? 'bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 border-l-4 border-l-red-500'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-l-transparent'}`}
                                >
                                    <span className="truncate pr-2">{cat.name}</span>
                                    <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                </div>
            </div>

            {/* RIGHT MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-gray-900">

                {/* Top Header Bar */}
                <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 bg-white dark:bg-gray-800 shrink-0">
                    <div className="md:hidden">
                        <Menu size={16} className="text-gray-500" />
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search by item name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                        />
                    </div>

                    {/* Type Filters */}
                    <div className="flex items-center gap-1.5 ml-auto">
                        <button
                            onClick={() => setFilterType('veg')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all ${filterType === 'veg' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <VegIcon /> Veg
                        </button>
                        <button
                            onClick={() => setFilterType('non-veg')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all ${filterType === 'non-veg' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <NonVegIcon /> Non-Veg
                        </button>
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-3 py-1 rounded-full border text-[10px] font-semibold transition-all ${filterType === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                            All
                        </button>
                    </div>
                </div>

                {/* Items List Area */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Sticky Table Header */}
                    <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <div className="flex-1">Item Details</div>
                        <div className="w-20 text-center">Offline</div>
                        <div className="w-20 text-center">Swiggy</div>
                        <div className="w-20 text-center">Zomato</div>
                        <div className="w-20 text-center">ONDC</div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mb-2"></div>
                                <span className="text-gray-500 text-xs">Loading Menu...</span>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <span className="text-4xl mb-2">🍽️</span>
                                <p className="text-sm">No items found</p>
                            </div>
                        ) : (
                            <div className="pb-10">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                                                Image
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Item Details
                                            </th>
                                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Offline
                                            </th>
                                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Swiggy
                                            </th>
                                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Zomato
                                            </th>
                                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                ONDC
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {groupedItems.map((group) => (
                                            <React.Fragment key={group.name}>
                                                <tr>
                                                    <td colSpan="5" className="bg-gray-100 dark:bg-gray-700 px-4 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 sticky top-[37px] z-10">
                                                        {group.name} ({group.items.length})
                                                    </td>
                                                </tr>
                                                {group.items.map(item => (
                                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-4 py-2">
                                                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                                {item.image ? (
                                                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                        <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="shrink-0">
                                                                        {item.type === 'veg' ? <VegIcon /> : item.type === 'non-veg' ? <NonVegIcon /> : <EggIcon />}
                                                                    </div>
                                                                    <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.name}</span>
                                                                </div>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">₹{item.price}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <ToggleSwitch
                                                                checked={item.availableOffline !== false}
                                                                onChange={() => handleToggleStatus(item.id, 'availableOffline', item.availableOffline !== false)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <ToggleSwitch
                                                                checked={item.availableSwiggy !== false}
                                                                onChange={() => handleToggleStatus(item.id, 'availableSwiggy', item.availableSwiggy !== false)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <ToggleSwitch
                                                                checked={item.availableZomato !== false}
                                                                onChange={() => handleToggleStatus(item.id, 'availableZomato', item.availableZomato !== false)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <ToggleSwitch
                                                                checked={item.availableOndc !== false}
                                                                onChange={() => handleToggleStatus(item.id, 'availableOndc', item.availableOndc !== false)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
