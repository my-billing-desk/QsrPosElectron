import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus, FileSpreadsheet, FileText, RotateCcw, Calendar, Filter, Printer } from 'lucide-react';
import { SmartTable } from '../ui/SmartTable';
import { inventoryService } from '../../services/api';
import { getTodayLocal, formatDateDisplay } from '../../utils/dateUtils';

export function StockHistory() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [filters, setFilters] = useState({
        fromDate: getTodayLocal(),
        toDate: getTodayLocal(),
        category: 'All',
        product: 'All'
    });

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await inventoryService.getStockSummaryReport({
                fromDate: filters.fromDate,
                toDate: filters.toDate
            });
            setReportData(res.data || []);
        } catch (err) {
            console.error('Failed to fetch stock history:', err);
            setError('Failed to load report data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleGenerateReport = () => {
        fetchReport();
    };

    const handleReset = () => {
        setFilters({
            fromDate: getTodayLocal(),
            toDate: getTodayLocal(),
            category: 'All',
            product: 'All'
        });
    };

    const columns = [
        {
            key: 'sku',
            header: 'SKU',
            render: (item) => <span className="text-gray-500 font-mono text-[11px]">{item.sku || '---'}</span>
        },
        {
            key: 'name',
            header: 'Product Name',
            render: (item) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 text-sm">{item.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase leading-tight">{item.unit || 'units'}</span>
                </div>
            )
        },
        {
            key: 'opening',
            header: 'Initial Qty',
            align: 'right',
            render: (item) => <span className="font-medium text-gray-600">{(item.opening || 0).toFixed(2)}</span>
        },
        {
            key: 'purchase',
            header: 'Added (+)',
            align: 'right',
            render: (item) => <span className="font-medium text-green-600">{(item.purchase || 0).toFixed(2)}</span>
        },
        {
            key: 'consumed',
            header: 'Sold (-)',
            align: 'right',
            render: (item) => <span className="font-medium text-red-500">{(item.consumed || 0).toFixed(2)}</span>
        },
        {
            key: 'wastage',
            header: 'Defective (-)',
            align: 'right',
            render: (item) => <span className="font-medium text-orange-500">{(item.wastage || 0).toFixed(2)}</span>
        },
        {
            key: 'closingStock',
            header: 'Final Qty',
            align: 'right',
            render: (item) => <span className="font-bold text-gray-900 border-l pl-4 border-gray-100 ml-2">{(item.closingStock || 0).toFixed(2)}</span>
        }
    ];

    return (
        <div className="p-6 max-w-full mx-auto font-sans relative">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Stock History</h1>
                    <p className="text-sm text-gray-500">View and manage inventory transformations</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-all active:rotate-180 duration-500"
                        title="Reset Filters"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filters Panel - Clean & Functional */}
            <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-300 items-end">
                <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">From Date</label>
                    <input
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/30"
                    />
                </div>
                <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">To Date</label>
                    <input
                        type="date"
                        value={filters.toDate}
                        onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/30"
                    />
                </div>
                <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Category</label>
                    <div className="relative">
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/30 font-medium text-gray-700"
                        >
                            <option>All</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                </div>
                <button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="h-[42px] px-8 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:bg-indigo-300 active:scale-95"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {/* Table Panel - Compact & High Visibility */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Stock Summary Results</h2>
                    <div className="flex gap-1.5">
                        <button className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"><FileText className="w-4 h-4" /></button>
                        <button className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-green-600 transition-colors"><FileSpreadsheet className="w-4 h-4" /></button>
                        <button className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-gray-900 transition-colors"><Printer className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="overflow-x-auto min-h-[400px]">
                    <SmartTable
                        data={reportData}
                        columns={columns}
                        isLoading={loading}
                        emptyMessage="No inventory records found for the selected period."
                        pagination={true}
                    />
                </div>
            </div>
        </div>
    );
}
