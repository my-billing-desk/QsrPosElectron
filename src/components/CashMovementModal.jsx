import React, { useState } from 'react';
import { X, DollarSign, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export function CashMovementModal({ isOpen, onClose, type, onSuccess }) {
    const [formData, setFormData] = useState({
        amount: '',
        reason: '',
        notes: '',
        referenceNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isCashIn = type === 'cash_in';

    const reasons = isCashIn ? [
        { value: 'opening_float', label: 'Opening Float/Bank' },
        { value: 'adding_change', label: 'Adding Change' },
        { value: 'correction', label: 'Correction/Adjustment' },
        { value: 'other', label: 'Other' }
    ] : [
        { value: 'petty_cash', label: 'Petty Cash Expense' },
        { value: 'supplier_payment', label: 'Supplier Payment' },
        { value: 'cash_drop', label: 'Cash Drop (To Safe)' },
        { value: 'staff_tips', label: 'Staff Tips Payout' },
        { value: 'other', label: 'Other Payout' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const endpoint = isCashIn ? '/cash-in' : '/cash-out';

            const response = await fetch(`http://localhost:5001/api/cash-movements${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to record transaction');
            }

            // Reset form
            setFormData({
                amount: '',
                reason: '',
                notes: '',
                referenceNumber: ''
            });

            if (onSuccess) {
                onSuccess(data.movement);
            }

            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4">
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${isCashIn
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                    <div className="flex items-center gap-3">
                        {isCashIn ? (
                            <ArrowDownCircle className="w-6 h-6 text-green-600" />
                        ) : (
                            <ArrowUpCircle className="w-6 h-6 text-red-600" />
                        )}
                        <h2 className={`text-xl font-bold ${isCashIn ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                            }`}>
                            {isCashIn ? 'Cash In' : 'Cash Out'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Amount *
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-lg font-bold"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Reason *
                        </label>
                        <select
                            required
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        >
                            <option value="">Select a reason...</option>
                            {reasons.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Notes
                        </label>
                        <textarea
                            rows="3"
                            placeholder="Add any additional details..."
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {/* Reference Number */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Reference Number (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="Receipt #, Invoice #, etc."
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                            value={formData.referenceNumber}
                            onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 px-6 py-3 rounded-lg font-bold text-white ${isCashIn
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={loading}
                        >
                            {loading ? 'Recording...' : (isCashIn ? 'Add Cash In' : 'Record Cash Out')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
