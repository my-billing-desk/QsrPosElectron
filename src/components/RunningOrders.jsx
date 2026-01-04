import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Clock, ChefHat, PlayCircle } from 'lucide-react';
import { orderService } from '../services/api';
import { formatDateLocal } from '../utils/dateUtils';

export function RunningOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        loadRunningOrders();
        // Poll every 30 seconds
        const interval = setInterval(loadRunningOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadRunningOrders = async () => {
        setLoading(true);
        try {
            // Fetch today's orders (and maybe yesterday's to be safe for overlap)
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const params = {
                startDate: formatDateLocal(yesterday) + ' 00:00:00',
                endDate: formatDateLocal(today) + ' 23:59:59'
            };

            const res = await orderService.getOrders(params);

            if (res.data) {
                // Filter for active statuses
                const running = res.data.filter(o =>
                    ['placed', 'preparing', 'served', 'ready'].includes(o.status)
                );
                setOrders(running);
            }
        } catch (error) {
            console.error("Failed to load running orders:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 space-y-4 relative">
            {/* Header / Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <PlayCircle className="w-6 h-6 text-orange-600" />
                        Running Orders
                    </h2>
                    <p className="text-sm text-gray-500">Orders currently in progress (Kitchen or Service)</p>
                </div>
                <button
                    onClick={loadRunningOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 font-medium transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Orders Grid */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Clock className="w-12 h-12 mb-2 opacity-50" />
                        <p>No active running orders.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {orders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-lg text-gray-900 dark:text-white">#{order.orderNumber}</div>
                                        <div className="text-xs text-gray-500 font-medium capitalize flex items-center gap-1">
                                            {order.type} • {order.tableId ? `Table ${order.tableId}` : 'No Table'}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${order.status === 'placed' ? 'bg-blue-100 text-blue-700' :
                                        order.status === 'preparing' ? 'bg-orange-100 text-orange-700' :
                                            order.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                'bg-purple-100 text-purple-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Customer</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-200 truncate max-w-[120px]">{order.customerName || 'Walk-in'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Items</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-200">{order.items?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Time</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-200">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 -mx-4 -mb-4 px-4 py-3 dark:bg-gray-800/50">
                                    <span className="font-bold text-lg text-gray-800 dark:text-white">₹{order.totalAmount}</span>
                                    <span className="text-xs text-blue-600 font-medium group-hover:underline">View Details →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Order Details Modal (Reused from OrderHistory logic) */}
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
                                <span className="text-xl">×</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Content similar to OrderHistory modal */}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <span className="text-gray-500">Customer Name</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{selectedOrder.customerName || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <span className="text-gray-500">Table No</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{selectedOrder.tableId || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <span className="text-gray-500">Time</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
                                </div>
                            </div>

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
                                                        {item.addons && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                + {Array.isArray(item.addons) ? item.addons.map(a => a.name).join(', ') : ''}
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
