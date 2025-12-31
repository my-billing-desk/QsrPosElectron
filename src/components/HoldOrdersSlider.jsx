import React, { useEffect, useState } from 'react';
import { X, Clock, Trash2, RotateCcw, Search, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export function HoldOrdersSlider({ isOpen, onClose, onRestore }) {
    const [heldOrders, setHeldOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadHeldOrders();
        }
    }, [isOpen]);

    const loadHeldOrders = async () => {
        if (!window.electronAPI) return;
        try {
            const allOrders = await window.electronAPI.getAllLocalOrders();
            // Assuming local orders have a 'status' field or we filter by ID prefix if standardized
            const held = allOrders.filter(o => o.status === 'hold' || (o.paymentStatus === 'pending' && (!o.status || o.status === 'hold')));
            // Broadening filter just in case, but previously we saw 'hold' status used.
            setHeldOrders(held.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            console.error("Failed to load held orders:", err);
        }
    };

    const handleDelete = async (e, orderId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this held order?")) return;

        try {
            if (window.electronAPI && window.electronAPI.deleteOrder) {
                await window.electronAPI.deleteOrder(orderId);
                loadHeldOrders(); // Refresh list
            } else {
                console.error("Delete API not available");
            }
        } catch (err) {
            console.error("Failed to delete order:", err);
        }
    };

    const filteredOrders = heldOrders.filter(order =>
        (order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customerPhone?.includes(searchTerm))
    );

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Slider Panel */}
            <div className={`fixed top-0 right-0 h-full w-[400px] bg-white dark:bg-gray-900 shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            Held Orders
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">{heldOrders.length} orders on hold</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Name, Order ID or Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 ring-blue-500/50"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 opacity-50">
                            <ShoppingBag className="w-12 h-12 mb-3" />
                            <p className="font-bold text-sm">No held orders found</p>
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <div
                                key={order.id}
                                className="group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:border-blue-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                onClick={() => onRestore(order)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-black text-gray-900 dark:text-white text-sm">{order.customerName || 'Walk-in Customer'}</h4>
                                        <p className="text-[10px] text-gray-500 font-bold mt-0.5">{order.customerPhone || 'No Phone'}</p>
                                    </div>
                                    <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded uppercase">
                                        {order.type}
                                    </span>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {order.items?.length || 0} Items
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-gray-900 dark:text-white">₹{Math.round(order.totalAmount)}</p>
                                    </div>
                                </div>

                                {/* Hover Actions */}
                                <div className="absolute inset-0 bg-blue-600/90 rounded-2xl flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                    <button
                                        className="flex flex-col items-center text-white"
                                        onClick={() => onRestore(order)}
                                    >
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-1 hover:scale-110 transition-transform">
                                            <RotateCcw className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Restore</span>
                                    </button>
                                    <button
                                        className="flex flex-col items-center text-white text-red-200 hover:text-white"
                                        onClick={(e) => handleDelete(e, order.id)}
                                    >
                                        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mb-1 hover:bg-red-500 hover:scale-110 transition-all">
                                            <Trash2 className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Discard</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
