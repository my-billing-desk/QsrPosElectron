import React, { useState, useEffect } from 'react';
import { Search, Calendar, Download, Eye, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { orderService } from '../services/api';

export function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        orderNumber: '',
        type: 'All',
        status: 'All',
        customerName: '',
        paymentMode: 'All'
    });

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const params = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'All')
            );
            const res = await orderService.getOrders(params);
            setOrders(res.data);
        } catch (error) {
            console.error("Failed to load orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = () => {
        loadOrders();
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Order ID</label>
                        <input
                            value={filters.orderNumber}
                            onChange={e => handleFilterChange('orderNumber', e.target.value)}
                            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm"
                            placeholder="#1234"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Customer</label>
                        <input
                            value={filters.customerName}
                            onChange={e => handleFilterChange('customerName', e.target.value)}
                            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm"
                            placeholder="Name / Phone"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Status</label>
                        <select
                            value={filters.status}
                            onChange={e => handleFilterChange('status', e.target.value)}
                            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm"
                        >
                            <option value="All">All</option>
                            <option value="placed">Placed</option>
                            <option value="served">Served</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Filter</label>
                        <button onClick={handleSearch} className="w-full py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 flex justify-center items-center gap-2">
                            <Search className="w-4 h-4" /> Search
                        </button>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Refresh</label>
                        <button onClick={loadOrders} className="w-full py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-100 flex justify-center items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Sync
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="p-3 font-medium">Order #</th>
                                <th className="p-3 font-medium">Type</th>
                                <th className="p-3 font-medium">Customer</th>
                                <th className="p-3 font-medium">Items</th>
                                <th className="p-3 font-medium">Total</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No recent orders found.</td></tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-3 font-medium">#{order.orderNumber}</td>
                                        <td className="p-3 capitalize">{order.type}</td>
                                        <td className="p-3">{order.customerName || '-'}</td>
                                        <td className="p-3 truncate max-w-xs text-gray-500">
                                            {order.items?.length} Items
                                        </td>
                                        <td className="p-3 font-semibold">₹{order.totalAmount}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-xs border capitalize ${order.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button className="text-blue-600 hover:underline text-xs">View</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
