import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Plus, FileText, Download, RotateCcw } from 'lucide-react';
import { inventoryService } from '../../services/api';
import { getTodayLocal } from '../../utils/dateUtils';

export default function AvailableStock() {
    const [loading, setLoading] = useState(false);
    const [materials, setMaterials] = useState([]);
    const [filters, setFilters] = useState({
        rawMaterial: '',
        category: 'All',
        date: getTodayLocal() // Default to today
    });
    const [hasLoaded, setHasLoaded] = useState(false);

    // Mock Categories (should come from API)
    const categories = ['All', 'Dairy', 'Vegetable', 'Bakery', 'Frozen', 'Spices'];

    const handleLoad = async () => {
        setLoading(true);
        try {
            // Fetch logic
            const res = await inventoryService.getRawMaterials();
            let data = res.data;

            // Apply filters client side for now
            if (filters.category !== 'All') {
                data = data.filter(m => m.category === filters.category);
            }
            if (filters.rawMaterial) {
                data = data.filter(m => m.name.toLowerCase().includes(filters.rawMaterial.toLowerCase()));
            }

            setMaterials(data);
            setHasLoaded(true);
        } catch (error) {
            console.error("Failed to load stock:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setFilters({
            rawMaterial: '',
            category: 'All',
            date: getTodayLocal()
        });
        setMaterials([]);
        setHasLoaded(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Available Stock</h1>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50">
                        <FileText className="w-4 h-4" /> Files
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 font-medium">
                        <Plus className="w-4 h-4" /> Add Stock
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 shadow-sm border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">Raw Material</label>
                        <input
                            type="text"
                            value={filters.rawMaterial}
                            onChange={(e) => setFilters(prev => ({ ...prev, rawMaterial: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-sm"
                            placeholder="Search Material"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-sm"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">Date</label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleLoad}
                            className="flex-1 px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded hover:bg-red-50 transition-colors"
                        >
                            Load
                        </button>
                        <button
                            onClick={handleClear}
                            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-600 font-medium rounded hover:bg-gray-50 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {!hasLoaded ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="mb-6 opacity-80">
                            {/* Placeholder Illustration mimicking the screenshot */}
                            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                                <div className="absolute inset-0 bg-red-50 rounded-full animate-pulse opacity-50"></div>
                                <Search className="w-12 h-12 text-gray-300" />
                            </div>
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">Available Stock Report Not Found</h3>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                                <tr>
                                    <th className="p-4">Raw Material</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4 text-right">Current Stock</th>
                                    <th className="p-4 text-right">Unit Price</th>
                                    <th className="p-4 text-right">Stock Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {materials.length > 0 ? materials.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-900">{item.name}</td>
                                        <td className="p-4 text-gray-500">{item.category || '-'}</td>
                                        <td className="p-4 text-right font-medium text-blue-600">
                                            {item.currentStock} {item.consumptionUnit}
                                        </td>
                                        <td className="p-4 text-right">₹ {item.purchasePrice} / {item.purchaseUnit}</td>
                                        <td className="p-4 text-right font-bold">
                                            ₹ {((item.currentStock / item.conversionFactor) * item.purchasePrice).toFixed(2)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">No items found matching criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
