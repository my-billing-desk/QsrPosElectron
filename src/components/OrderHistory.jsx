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

    const [selectedOrder, setSelectedOrder] = useState(null);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 space-y-4 relative">
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
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
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
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                                className="text-blue-600 hover:underline text-xs"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Full Screen Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-full flex flex-col rounded-xl shadow-2xl relative border border-gray-200 dark:border-gray-700">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-t-xl">
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 dark:text-white">Order Details</h3>
                                <p className="text-sm text-gray-500">#{selectedOrder.orderNumber}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
                            >
                                <ChevronLeft className="w-6 h-6 rotate-180" /> {/* Using Chevron as Close/Back */}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Key Info Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                                    <div className="font-bold text-lg capitalize text-orange-600 mt-1">{selectedOrder.status}</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Type</span>
                                    <div className="font-bold text-lg capitalize text-gray-800 dark:text-gray-200 mt-1">{selectedOrder.type}</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Payment</span>
                                    <div className="font-bold text-lg capitalize text-gray-800 dark:text-gray-200 mt-1">{selectedOrder.paymentMode || 'Pending'}</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
                                    <div className="font-bold text-lg text-gray-800 dark:text-gray-200 mt-1">₹{selectedOrder.totalAmount}</div>
                                </div>
                            </div>

                            {/* Detailed Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <span className="text-gray-500">Customer Name</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{selectedOrder.customerName || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <span className="text-gray-500">Customer Phone</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{selectedOrder.customerPhone || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <span className="text-gray-500">Table No</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{selectedOrder.tableId || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <span className="text-gray-500">Date</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <span className="text-gray-500">Time</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-orange-600 rounded-full"></span>
                                    Order Items
                                </h4>
                                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium uppercase text-xs">
                                            <tr>
                                                <th className="p-3 text-left">Item</th>
                                                <th className="p-3 text-center">Qty</th>
                                                <th className="p-3 text-right">Price</th>
                                                <th className="p-3 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                            {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="p-3">
                                                        <div className="font-medium text-gray-900 dark:text-gray-200">{item.itemName}</div>
                                                        {item.variantName && <div className="text-xs text-orange-500">[{item.variantName}]</div>}
                                                        {item.addons && item.addons.length > 0 && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                + {item.addons.map(a => a.name).join(', ')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center text-gray-600 dark:text-gray-300">x{item.quantity}</td>
                                                    <td className="p-3 text-right text-gray-600 dark:text-gray-300">{item.price}</td>
                                                    <td className="p-3 text-right font-medium text-gray-900 dark:text-gray-200">{(item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <td colSpan="4" className="p-4">
                                                    <div className="w-full max-w-xs ml-auto space-y-2">
                                                        <div className="flex justify-between text-sm text-gray-500">
                                                            <span>Subtotal</span>
                                                            <span>₹ {(selectedOrder.totalAmount - (selectedOrder.taxAmount || 0)).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm text-gray-500">
                                                            <span>Tax</span>
                                                            <span>₹ {selectedOrder.taxAmount?.toFixed(2) || '0.00'}</span>
                                                        </div>
                                                        <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <span>Grand Total</span>
                                                            <span>₹ {selectedOrder.totalAmount}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
