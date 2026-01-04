import React, { useState, useEffect } from 'react';
import { Search, Save, FileText, Calendar } from 'lucide-react';
import { inventoryService, menuService } from '../../services/api';
import toast from 'react-hot-toast';
import { getTodayLocal } from '../../utils/dateUtils';

export default function ClosingStock() {
    const [materials, setMaterials] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDate, setSelectedDate] = useState(getTodayLocal());
    const [updateFrequency, setUpdateFrequency] = useState('Daily');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Inputs
    const [inputData, setInputData] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [matRes, catRes] = await Promise.all([
                inventoryService.getRawMaterials(),
                menuService.getCategories()
            ]);
            setMaterials(matRes.data || []);
            // Extract categories from materials or API
            // const uniqueCats = [...new Set(matRes.data.map(m => m.category || 'Uncategorized'))];
            // setCategories(uniqueCats);
            setCategories(catRes.data || []);
        } catch (error) {
            console.error("Failed to load data", error);
            // toast.error("Failed to load stock data");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (id, field, value) => {
        setInputData(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        const updates = Object.entries(inputData).map(([idStr, data]) => {
            const id = parseInt(idStr);
            const item = materials.find(m => m.id === id);
            if (!item) return null;

            const pQty = parseFloat(data.purchaseQty || 0);
            const cQty = parseFloat(data.consumptionQty || 0);

            const hasPurchase = data.hasOwnProperty('purchaseQty') && data.purchaseQty !== '';
            const hasConsumption = data.hasOwnProperty('consumptionQty') && data.consumptionQty !== '';

            if (!hasPurchase && !hasConsumption && !data.comments) return null;

            const conversion = item.conversionFactor || 1;
            const totalStock = (pQty * conversion) + cQty;

            return {
                id: item.id,
                closingStock: totalStock,
                unit: item.consumptionUnit,
                comments: data.comments,
                date: selectedDate
            };
        }).filter(u => u !== null);

        if (updates.length === 0) {
            // toast('No changes to save');
            return;
        }

        try {
            await inventoryService.updateClosingStock({ updates });
            // toast.success("Closing stock updated successfully");
            toast.success("Closing stock updated successfully");
            loadData();
            setInputData({});
        } catch (error) {
            console.error(error);
            // toast.error("Failed to save stock");
            toast.error("Failed to save stock");
        }
    };

    // Filter Logic
    const filteredMaterials = materials.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
        // Handle categories from API which are objects vs strings from raw material
        const itemCat = m.Category?.name || m.category || 'Uncategorized';

        // If categories state is array of strings (from admin logic) or objects (from API)
        // Admin logic was: uniqueCats from materials.
        // Let's assume m.category is the string for now.
        const matchesCategory = selectedCategory === 'All' || itemCat === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMaterials.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);

    const changePage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 font-sans text-sm">
            {/* Note: Sidebar was removed for POS integration */}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header Title */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                    <h1 className="text-xl font-bold text-gray-800">Closing Stock</h1>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 text-xs text-nowrap">
                            <Save className="w-4 h-4" /> Add Stock
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 font-medium hover:bg-gray-50 text-xs text-gray-600">
                            <FileText className="w-4 h-4" /> Files
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end shrink-0">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Raw Material</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-xs bg-gray-50"
                                placeholder="Search..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-xs bg-gray-50"
                        >
                            <option value="All">All</option>
                            {/* Assuming categories are objects with name or just strings if previously mapped */}
                            {categories.map((c, i) => {
                                const name = typeof c === 'string' ? c : c.name;
                                return <option key={i} value={name}>{name}</option>;
                            })}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-xs bg-gray-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Closing Stock Updated On</label>
                        <select
                            value={updateFrequency}
                            onChange={e => setUpdateFrequency(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-xs bg-gray-50"
                        >
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button className="flex-1 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 font-bold text-xs">
                            Load
                        </button>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                            className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-xs"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto bg-gray-50 p-6">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-purple-50/50 text-xs font-bold text-gray-700 uppercase">
                                <tr>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Raw Material</th>
                                    <th className="p-4">Closing Stock ({selectedDate})</th>
                                    <th className="p-4 w-96">Update Your Closing Stock</th>
                                    <th className="p-4">Comments</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td>
                                    </tr>
                                ) : currentItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-gray-500 font-medium">
                                            {item.Category?.name || item.category || 'Uncategorized'}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{item.name}</div>
                                            <div className="text-xs text-gray-400 mt-1">[ Unit: {item.consumptionUnit} ]</div>
                                        </td>
                                        <td className="p-4 font-bold text-gray-700">
                                            {(() => {
                                                const stock = item.currentStock || 0;
                                                const factor = item.conversionFactor || 1;

                                                if (factor > 1 && item.purchaseUnit !== item.consumptionUnit) {
                                                    const pQty = Math.floor(stock / factor);
                                                    const cQty = stock % factor;

                                                    let display = `${pQty} ${item.purchaseUnit}`;
                                                    if (cQty > 0) {
                                                        display += ` (${cQty % 1 === 0 ? cQty : cQty.toFixed(2)} ${item.consumptionUnit})`;
                                                    }
                                                    if (pQty === 0) {
                                                        display = `${cQty % 1 === 0 ? cQty : cQty.toFixed(2)} ${item.consumptionUnit}`;
                                                    }
                                                    return display;
                                                }
                                                return `${stock} ${item.consumptionUnit}`;
                                            })()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="number"
                                                            value={inputData[item.id]?.purchaseQty || ''}
                                                            onChange={e => handleInputChange(item.id, 'purchaseQty', e.target.value)}
                                                            className="w-full pr-12 pl-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-sm"
                                                            placeholder="0"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                                            / {item.purchaseUnit}
                                                        </span>
                                                    </div>
                                                </div>

                                                {item.purchaseUnit !== item.consumptionUnit && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="number"
                                                                value={inputData[item.id]?.consumptionQty || ''}
                                                                onChange={e => handleInputChange(item.id, 'consumptionQty', e.target.value)}
                                                                className="w-full pr-12 pl-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-sm"
                                                                placeholder="0"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                                                / {item.consumptionUnit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <input
                                                type="text"
                                                value={inputData[item.id]?.comments || ''}
                                                onChange={e => handleInputChange(item.id, 'comments', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 text-sm placeholder-gray-300"
                                                placeholder="Comments"
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {!loading && currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">No items found matching your filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer / Pagination */}
                <div className="bg-white border-top border-gray-200 p-4 flex justify-between items-center shrink-0">
                    <div className="text-xs text-gray-500 font-medium">
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMaterials.length)} of {filteredMaterials.length} items
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex mr-4">
                            <button
                                onClick={() => changePage(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-gray-200 rounded-l-lg hover:bg-gray-50 text-xs font-bold disabled:opacity-50"
                            >
                                First
                            </button>
                            <button
                                onClick={() => changePage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border-t border-b border-gray-200 hover:bg-gray-50 text-xs font-bold disabled:opacity-50"
                            >
                                Prev
                            </button>
                            {/* Simple pagination numbers - kept minimal */}
                            <button
                                onClick={() => changePage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border-t border-b border-gray-200 hover:bg-gray-50 text-xs font-bold disabled:opacity-50"
                            >
                                Next
                            </button>
                            <button
                                onClick={() => changePage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border border-gray-200 rounded-r-lg hover:bg-gray-50 text-xs font-bold disabled:opacity-50"
                            >
                                Last
                            </button>
                        </div>

                        <button
                            onClick={handleSave}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Save Closing Stock
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
