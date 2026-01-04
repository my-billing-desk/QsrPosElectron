import React, { useState, useEffect } from 'react';
import { Search, Clock, Download } from 'lucide-react';
import { inventoryService } from '../../services/api';
import { getTodayLocal } from '../../utils/dateUtils';

export default function StockSummary() {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState([]);
    const [filters, setFilters] = useState({
        rawMaterial: '',
        category: 'All',
        unitType: 'Purchase Unit',
        fromDate: getTodayLocal(),
        toDate: getTodayLocal()
    });

    const categories = ['All', 'Dairy', 'Vegetable', 'Bakery', 'Frozen', 'Spices'];

    const handleSearch = async () => {
        setLoading(true);
        try {
            // Fetch real-time calculated report from backend
            const res = await inventoryService.getStockSummaryReport({
                fromDate: filters.fromDate,
                toDate: filters.toDate
            });

            let report = res.data;

            // Client-side filtering for Name and Category
            if (filters.category !== 'All' || filters.rawMaterial) {
                report = report.filter(r => {
                    const matchesName = !filters.rawMaterial || r.name.toLowerCase().includes(filters.rawMaterial.toLowerCase());
                    // const matchesCategory = filters.category === 'All' || r.category === filters.category;
                    return matchesName;
                });
            }

            setSummary(report);

        } catch (error) {
            console.error("Failed to fetch stock summary:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setFilters({
            rawMaterial: '',
            category: 'All',
            unitType: 'Purchase Unit',
            fromDate: getTodayLocal(),
            toDate: getTodayLocal()
        });
        // Reload to reset
        handleSearch();
    };

    useEffect(() => {
        handleSearch();
    }, []);

    const [selectedItemForDetails, setSelectedItemForDetails] = useState(null);

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative font-sans">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Stock Summary</h1>
                    <p className="text-slate-500 text-sm mt-1">Real-time inventory tracking and valuation</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 shadow-sm">
                        <Clock className="w-4 h-4 mr-2" /> Schedule
                    </button>
                    <button className="flex items-center px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 shadow-sm">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white px-6 py-4 shadow-sm border-b border-slate-200 shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Raw Material</label>
                        <input
                            type="text"
                            value={filters.rawMaterial}
                            onChange={(e) => setFilters(prev => ({ ...prev, rawMaterial: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="Search item..."
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    {/* Simplified Filters for Modern Look */}
                    <div className="space-y-1 col-span-2">
                        <label className="text-xs font-bold text-slate-700">Date Range</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                    </div>
                    <div className="space-y-1 col-span-2">
                        {/* Spacer or additional filter, simplified to button here */}
                        <label className="text-xs font-bold text-slate-700 opacity-0">Action</label>
                        <div className="flex gap-2">
                            <button onClick={handleSearch} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow flex items-center justify-center gap-2">
                                <Search className="w-4 h-4" /> Generate Report
                            </button>
                            <button onClick={handleClear} className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 shadow-sm font-medium">
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modern Table Area */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                                <th className="p-3 sticky left-0 bg-slate-50 z-20 shadow-sm">Item Details</th>
                                <th className="p-3 text-center">Opening</th>
                                <th className="p-3 text-center text-emerald-600">Purchase</th>
                                <th className="p-3 text-center">Total In</th>
                                <th className="p-3 text-center text-rose-600">Consumed</th>
                                <th className="p-3 text-center">Wastage</th>
                                <th className="p-3 text-center">Total Out</th>
                                <th className="p-3 text-center font-extrabold text-slate-700">Closing</th>
                                <th className="p-3 text-center">Actual</th>
                                <th className="p-3 text-center">Diff</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="10" className="p-12 text-center text-slate-400">Loading inventory data...</td></tr>
                            ) : summary.length === 0 ? (
                                <tr><td colSpan="10" className="p-12 text-center text-slate-400">Specify filters to generate report</td></tr>
                            ) : (
                                summary.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50 group">
                                        <td className="p-3 sticky left-0 bg-white z-10 font-medium group-hover:bg-slate-50 border-r border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-slate-700 font-bold">{row.name}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{row.unit}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center text-slate-500">{(row.opening || 0).toFixed(2)}</td>
                                        <td className="p-3 text-center text-emerald-600 font-bold bg-emerald-50/50 rounded-lg">{(row.purchase || 0).toFixed(2)}</td>
                                        <td className="p-3 text-center text-slate-500">{(row.totalInput || 0).toFixed(2)}</td>

                                        <td
                                            className="p-3 text-center text-rose-600 font-bold cursor-pointer hover:bg-rose-50 rounded-lg transition-colors underline decoration-dotted underline-offset-4"
                                            onClick={() => setSelectedItemForDetails(row)}
                                        >
                                            {(row.consumed || 0).toFixed(2)}
                                        </td>

                                        <td className="p-3 text-center text-slate-500">{(row.wastage || 0).toFixed(2)}</td>
                                        <td className="p-3 text-center text-slate-500">{(row.totalOutput || 0).toFixed(2)}</td>
                                        <td className="p-3 text-center font-extrabold text-slate-800 bg-slate-50/50">{(row.closingStock || 0).toFixed(2)}</td>
                                        <td className="p-3 text-center text-slate-500">{(row.closingSummary || 0).toFixed(2)}</td>
                                        <td className={`p-3 text-center font-bold ${(row.difference || 0) < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                            {(row.difference || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Re-implementation with new styles */}
            {selectedItemForDetails && (
                <div className="absolute inset-0 z-50 flex justify-end font-sans">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" onClick={() => setSelectedItemForDetails(null)}></div>
                    <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Consumption Details</h2>
                                <p className="text-sm text-slate-500">Breakdown for <span className="text-blue-600 font-bold">{selectedItemForDetails.name}</span></p>
                            </div>
                            <button onClick={() => setSelectedItemForDetails(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                                        <tr>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Item</th>
                                            <th className="p-3 text-right">Qty</th>
                                            <th className="p-3">Invoice</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Simplified Mock Rows */}
                                        <tr>
                                            <td className="p-3">
                                                <div className="font-bold text-slate-700">24 Dec, 2025</div>
                                                <div className="text-xs text-slate-400">15:06 PM</div>
                                            </td>
                                            <td className="p-3">Classic Veg Burger</td>
                                            <td className="p-3 text-right font-bold text-rose-600">1.00</td>
                                            <td className="p-3">
                                                <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">#2644</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
