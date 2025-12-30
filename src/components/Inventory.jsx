import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingDown, DollarSign, Search, Zap, RefreshCw, Layers, ArrowUpRight } from 'lucide-react';
import { inventoryService } from '../services/api';

export default function Inventory() {
    const [stats, setStats] = useState({
        totalItems: 0,
        lowStockCount: 0,
        totalStockValue: 0,
        totalWastage: 0,
        marginGap: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const res = await inventoryService.getStats();
            setStats(res.data);
        } catch (error) {
            console.error("Inventory Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Layers className="w-8 h-8 text-blue-600" />
                        Inventory Overview
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time stock levels and alerts</p>
                </div>
                <button
                    onClick={loadStats}
                    className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                {/* Total Items */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{stats.totalItems}</h3>
                    <p className="text-sm text-gray-500">Total Stock Items</p>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-rose-200 dark:border-rose-900/50 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        {stats.lowStockCount > 0 && (
                            <span className="px-2 py-1 bg-rose-100 text-rose-600 text-xs font-bold rounded uppercase">Action Needed</span>
                        )}
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1 relative z-10">{stats.lowStockCount}</h3>
                    <p className="text-sm text-gray-500 relative z-10">Low Stock Items</p>
                </div>

                {/* Stock Value */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">₹{stats.totalStockValue?.toLocaleString()}</h3>
                    <p className="text-sm text-gray-500">Total Asset Value</p>
                </div>

                {/* Wastage */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">₹{stats.totalWastage?.toLocaleString()}</h3>
                    <p className="text-sm text-gray-500">Total Wastage (30 Days)</p>
                </div>
            </div>

            {/* Quick Actions / Placeholders for future sub-modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Detailed Stock Check</h3>
                        <p className="text-indigo-100 mb-6 text-sm">Perform a manual stock count at the end of the shift to ensure accuracy.</p>
                        <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                            Start Audit <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Add Wastage Entry</h3>
                        <p className="text-sm text-gray-500">Log spoiled or damaged items immediately.</p>
                    </div>
                    <button className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 transition-colors">
                        <TrendingDown className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {stats.lowStockCount > 5 && (
                <div className="mt-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-4 rounded-xl flex items-start gap-3 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100">Critical Stock Warning</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Multiple items are below minimum stock levels. Please check the Admin Panel for a full purchase report.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
