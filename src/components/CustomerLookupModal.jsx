import React, { useState } from 'react';
import { X, User, Phone, Search, Star, TrendingUp, Award } from 'lucide-react';
import { CustomerDetailsSection } from './CustomerDetailsSection';

export function CustomerLookupModal({ isOpen, onClose, onCustomerSelected }) {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [customer, setCustomer] = useState(null);
    const [error, setError] = useState('');

    const handleLookup = async () => {
        if (phone.length < 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/customers/lookup/${phone}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to lookup customer');
            }

            setCustomer(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        if (customer) {
            onCustomerSelected(customer);
            onClose();
        }
    };

    const getTierColor = (tier) => {
        const colors = {
            regular: 'bg-gray-500',
            silver: 'bg-gray-400',
            gold: 'bg-yellow-500',
            platinum: 'bg-purple-600',
            vip: 'bg-red-600'
        };
        return colors[tier] || 'bg-gray-500';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-500 to-emerald-600">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Let's Start!!</h2>
                        <p className="text-white/90">Start with <span className="text-yellow-300 font-bold">Customer's Mobile Number</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-full p-2"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Phone Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Mobile Number *
                        </label>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    maxLength="10"
                                    pattern="[0-9]{10}"
                                    placeholder="Enter 10-digit mobile number"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white text-lg"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleLookup}
                                disabled={loading || phone.length < 10}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Search className="w-5 h-5" />
                                Search
                            </button>
                        </div>
                        {error && (
                            <p className="mt-2 text-red-600 text-sm">{error}</p>
                        )}
                    </div>

                    {/* Customer Info */}
                    {customer && (
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                            {/* Welcome Message */}
                            <div className="mb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <User className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {customer.isNew ? '✨ New Customer!' : `👋 ${customer.suggestions.message}`}
                                    </h3>
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Name</label>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {customer.customer.name || 'Not Provided'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Phone</label>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {customer.customer.phone}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            {!customer.isNew && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Award className={`w-4 h-4 ${getTierColor(customer.customer.customerTier)}`} />
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Tier</span>
                                        </div>
                                        <p className={`text-sm font-bold ${getTierColor(customer.customer.customerTier)} text-white px-2 py-1 rounded uppercase inline-block`}>
                                            {customer.customer.customerTier}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Points</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {customer.customer.loyaltyPoints || 0}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp className="w-4 h-4 text-green-500" />
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Orders</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {customer.customer.totalOrders || 0}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Favorite Items */}
                            {customer.favoriteItems && customer.favoriteItems.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2 uppercase">⭐ Favorite Items:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {customer.favoriteItems.map((item) => (
                                            <span
                                                key={item.itemId}
                                                className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-bold"
                                            >
                                                {item.itemName} ({item.count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* More Details & Membership Sections */}
                    {customer && (
                        <div className="mt-4">
                            <CustomerDetailsSection customer={customer} />
                        </div>
                    )}

                    {/* Actions */}
                    {customer && (
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleContinue}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold shadow-lg"
                            >
                                Start Taking Order! →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
