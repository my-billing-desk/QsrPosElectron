import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingBag, Calendar, DollarSign, Package } from 'lucide-react';

export function CustomerDetailsSection({ customer }) {
    const [showOrderHistory, setShowOrderHistory] = useState(true);
    const [showMembership, setShowMembership] = useState(true);

    if (!customer || customer.isNew) {
        return null;
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount).toFixed(2)}`;
    };

    return (
        <div className="space-y-3">
            {/* More Details - Order History */}
            <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                    onClick={() => setShowOrderHistory(!showOrderHistory)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-gray-900 dark:text-white">More Details</span>
                        <span className="text-sm text-gray-500">
                            (Order History)
                        </span>
                    </div>
                    {showOrderHistory ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                </button>

                {showOrderHistory && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        {customer.recentOrders && customer.recentOrders.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
                                    Last {customer.recentOrders.length} Orders
                                </p>
                                {customer.recentOrders.map((order, index) => (
                                    <div
                                        key={order.id}
                                        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                                    >
                                        {/* Order Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-bold">
                                                    #{order.orderNumber}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {order.type}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                                    {formatCurrency(order.totalAmount)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(order.createdAt)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        {order.items && order.items.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Items:</p>
                                                {order.items.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700 rounded px-3 py-2"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Package className="w-4 h-4 text-gray-400" />
                                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                                {item.itemName}
                                                            </span>
                                                            <span className="text-gray-500">
                                                                x{item.quantity}
                                                            </span>
                                                        </div>
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            {formatCurrency(item.total)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Order Status */}
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'completed'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : order.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                }`}>
                                                {order.status?.toUpperCase()}
                                            </span>
                                            {order.paymentMode && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    💳 {order.paymentMode}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No order history available</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Membership Section */}
            <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                    onClick={() => setShowMembership(!showMembership)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <span className="font-bold text-gray-900 dark:text-white">Membership</span>
                    </div>
                    {showMembership ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                </button>

                {showMembership && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Lifetime Spending */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                                    Total Spent
                                </p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(customer.customer.totalSpent || 0)}
                                </p>
                            </div>

                            {/* Average Order Value */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                                    Avg. Order
                                </p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(customer.customer.averageOrderValue || 0)}
                                </p>
                            </div>

                            {/* Last Order Date */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 col-span-2">
                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                                    Last Order
                                </p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatDate(customer.customer.lastOrderDate)}
                                </p>
                            </div>

                            {/* Loyalty Progress */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700 col-span-2">
                                <p className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase mb-2">
                                    Loyalty Tier Progress
                                </p>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {customer.customer.customerTier.toUpperCase()}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {customer.customer.loyaltyPoints} points
                                    </span>
                                </div>
                                {/* Progress bar could go here */}
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                    {customer.customer.customerTier === 'regular' && 'Spend ₹10,000 to reach Silver'}
                                    {customer.customer.customerTier === 'silver' && 'Spend ₹25,000 to reach Gold'}
                                    {customer.customer.customerTier === 'gold' && 'Spend ₹50,000 to reach Platinum'}
                                    {customer.customer.customerTier === 'platinum' && '🎉 You\'re at the highest tier!'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
