import React, { useState, useEffect } from 'react';
import { orderService } from '../services/api';
import { ShoppingBag, Clock, Check, X, RefreshCw, Printer } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function OnlineOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await orderService.getOrders({});
            // Filter for non-POS orders
            const online = res.data.filter(o => o.source && o.source !== 'POS');
            setOrders(online);
        } catch (error) {
            console.error("Failed to fetch online orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'placed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'preparing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'served': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getSourceIcon = (source) => {
        // Simple text fallback or specific icons if available
        if (source === 'Zomato') return <span className="text-red-600 font-extrabold text-lg">Z</span>;
        if (source === 'Swiggy') return <span className="text-orange-500 font-extrabold text-lg">S</span>;
        if (source === 'ONDC') return <span className="text-blue-800 font-extrabold text-lg">ONDC</span>;
        return <span className="text-blue-500 font-bold text-lg">O</span>;
    };

    return (
        <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <ShoppingBag className="w-8 h-8 text-blue-600" />
                        Online Orders
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage orders from Zomato, Swiggy, ONDC, and others</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            try {
                                const sources = ['Swiggy', 'Zomato', 'ONDC'];
                                const source = sources[Math.floor(Math.random() * sources.length)];

                                if (source === 'ONDC') {
                                    // Simulate ONDC Payload
                                    await fetch(`http://localhost:5001/api/aggregators/ondc/confirm`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            context: {
                                                domain: "nic2004:52110",
                                                action: "confirm",
                                                core_version: "1.1.0",
                                                message_id: "MSG-" + Date.now(),
                                                transaction_id: "TXN-" + Date.now()
                                            },
                                            message: {
                                                order: {
                                                    id: "ONDC-" + Math.floor(Math.random() * 10000),
                                                    state: "Created",
                                                    billing: {
                                                        name: 'ONDC Customer ' + Math.floor(Math.random() * 100),
                                                        phone: '9876543210'
                                                    },
                                                    quote: {
                                                        price: { value: "650", currency: "INR" }
                                                    },
                                                    payment: { status: "PAID" },
                                                    provider: { id: "sunburst_store_01" } // Matches nothing in seed usually, but controller handles fallback
                                                }
                                            }
                                        })
                                    });
                                } else {
                                    // Standard Webhook
                                    await fetch(`http://localhost:5001/api/aggregators/webhook`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            source: source,
                                            customer: { name: 'Test Customer ' + Math.floor(Math.random() * 100) },
                                            totalAmount: 450,
                                            items: [],
                                            tenantId: user?.tenantId
                                        })
                                    });
                                }

                                toast.success(`Simulated ${source} order sent!`);
                                fetchOrders();
                            } catch (e) {
                                toast.error("Simulation failed: " + e.message);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold text-sm shadow-lg shadow-blue-500/30"
                    >
                        Simulate Order
                    </button>
                    <button
                        onClick={fetchOrders}
                        className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                    <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg">No active online orders</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-lg shadow-sm flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                        {getSourceIcon(order.source)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 dark:text-gray-100">#{order.orderNumber}</h3>
                                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>

                            {/* Items */}
                            <div className="p-4 flex-1 space-y-3">
                                {order.items && order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{item.itemName}</span>
                                            {item.variantName && <span className="text-gray-500 text-xs ml-1">({item.variantName})</span>}
                                            <div className="text-gray-400 text-xs">x{item.quantity}</div>
                                        </div>
                                        <div className="font-medium text-gray-700 dark:text-gray-300">
                                            ₹{Math.round(item.total)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total & Customer */}
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-sm border-t border-b border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-500">Customer:</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{order.customerName || 'Guest'}</span>
                                </div>
                                <div className="flex justify-between font-bold text-base">
                                    <span className="text-gray-700 dark:text-gray-300">Total:</span>
                                    <span className="text-gray-900 dark:text-white">₹{Math.round(order.totalAmount)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 flex gap-2">
                                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition">
                                    Accept
                                </button>
                                <button className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300">
                                    <Printer size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
