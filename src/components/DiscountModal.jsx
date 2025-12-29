import React, { useState, useEffect } from 'react';
import { X, Tag, AlertCircle, CheckCircle, ChevronDown, Trash2, ShoppingCart } from 'lucide-react';

export function DiscountModal({ isOpen, onClose, orderTotal, taxAmount, orderType, settings, onApplyCoupon, appliedCoupon }) {
    const [coupons, setCoupons] = useState([]);
    const [selectedSource, setSelectedSource] = useState('Xeno');
    const [manualCode, setManualCode] = useState('');
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState('');
    const [showSources, setShowSources] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCoupons();
            setError('');
        }
    }, [isOpen]);

    const fetchCoupons = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/coupons/active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (Array.isArray(data)) {
                setCoupons(data);
                // Set default source to Xeno if available, else first source, else Xeno anyway
                const sourcesList = [...new Set(data.filter(c => c && c.source).map(c => c.source))];
                if (sourcesList.includes('Xeno')) setSelectedSource('Xeno');
                else if (sourcesList.length > 0) setSelectedSource(sourcesList[0]);
            } else {
                console.error('Coupons API did not return an array:', data);
                setCoupons([]);
            }
        } catch (err) {
            console.error('Failed to fetch coupons:', err);
            setCoupons([]);
        }
    };

    const handleApplyCoupon = async (couponCode) => {
        if (!couponCode) return;
        setApplying(true);
        setError('');

        try {
            const token = localStorage.getItem('pos_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/coupons/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: couponCode,
                    orderTotal
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Polite error message as per request
                setError(data.error || 'REST_COUPON_INVALID');
                return;
            }

            // Success
            onApplyCoupon(data.coupon, data.discountAmount);
        } catch (err) {
            setError('REST_COUPON_NETWORK_ERROR');
        } finally {
            setApplying(false);
        }
    };

    const removeCoupon = () => {
        onApplyCoupon(null, 0);
    };

    // Grouping
    const sources = ['Subway', 'Xeno', 'CRM', ...new Set((Array.isArray(coupons) ? coupons : []).filter(c => c && c.source).map(c => c.source))].filter((v, i, a) => a.indexOf(v) === i && v);
    const filteredCoupons = (Array.isArray(coupons) ? coupons : []).filter(c => c && c.source === selectedSource);

    // Summary calculations
    const billTotal = orderTotal + taxAmount;
    const finalTotal = billTotal - (appliedCoupon?.discountAmount || 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header (Matching Rista Style) */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        Discounts & Deals
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Instruction Banner (Requested Green Banner) */}
                <div className="bg-emerald-600 text-white px-6 py-4 flex flex-col items-center text-center shrink-0">
                    <p className="font-black text-lg uppercase tracking-wide">Enter the coupon code</p>
                    <p className="text-emerald-100 font-bold opacity-90">
                        <span className="text-yellow-400">Correctly!!</span> And click on <span className="text-yellow-400">Apply</span>
                    </p>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Coupons List */}
                    <div className="flex-1 flex flex-col p-6 border-r border-gray-100 dark:border-gray-700 overflow-hidden">

                        {/* Provider & Input Section */}
                        <div className="mb-8">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Coupons</label>
                            <div className="flex gap-3">
                                <div className="relative w-40">
                                    <button
                                        onClick={() => setShowSources(!showSources)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-bold text-sm"
                                    >
                                        <span>{selectedSource}</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showSources ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showSources && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden">
                                            {sources.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => { setSelectedSource(s); setShowSources(false); }}
                                                    className="w-full text-left px-4 py-3 font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Enter Code"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        className="flex-1 px-5 py-3 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-black text-sm uppercase placeholder:text-gray-300 focus:border-blue-500/50 outline-none transition-all"
                                    />
                                    <button
                                        onClick={() => handleApplyCoupon(manualCode)}
                                        disabled={!manualCode || applying}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        {applying ? '...' : 'Apply'}
                                    </button>
                                </div>
                            </div>

                            {/* Polite Error Message (Toast Style as per image) */}
                            {error && (
                                <div className="mt-4 animate-in slide-in-from-top-2 flex items-center gap-3 p-4 bg-gray-900 text-white rounded-xl shadow-2xl relative">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <span className="font-bold text-xs tracking-wide">{error}</span>
                                    <button onClick={() => setError('')} className="ml-auto opacity-50 hover:opacity-100">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Open Offers Label */}
                        <div className="mb-4">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                Open offers <span className="text-[10px] text-gray-400 font-medium lowercase">applicable only on selected stores</span>
                            </h3>
                        </div>

                        {/* Searchable/Scrollable Offers List */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {filteredCoupons.map(coupon => (
                                <div key={coupon.id} className="p-5 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between group hover:border-blue-500/20 transition-all">
                                    <div className="flex-1">
                                        <h4 className="font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tight">{coupon.name}</h4>
                                        <p className="text-xs text-gray-400 font-bold italic">
                                            Valid from {new Date(coupon.validFrom).toLocaleDateString()} to {new Date(coupon.validUntil).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleApplyCoupon(coupon.code)}
                                        disabled={appliedCoupon?.id === coupon.id}
                                        className={`px-6 py-2 rounded-lg font-black text-xs uppercase transition-all ${appliedCoupon?.id === coupon.id ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                                    >
                                        {appliedCoupon?.id === coupon.id ? 'Applied' : 'Apply'}
                                    </button>
                                </div>
                            ))}
                            {filteredCoupons.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                                    <Tag className="w-12 h-12 mb-4" />
                                    <p className="font-black uppercase text-xs tracking-widest">No offers found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Order Summary (Requested Design) */}
                    <div className="w-80 bg-gray-50/50 dark:bg-gray-900/50 p-6 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{orderType}</span>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">#NEW-ORDER</span>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-400">
                                <span>Sub Total</span>
                                <span>₹{orderTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-400 pb-4 border-b border-gray-200 dark:border-gray-700">
                                <span>Tax</span>
                                <span>₹{taxAmount.toFixed(2)}</span>
                            </div>

                            {/* Applied Discounts List */}
                            {appliedCoupon && (
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-100 dark:border-blue-900 relative animate-in slide-in-from-right-2">
                                    <button
                                        onClick={removeCoupon}
                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg transition-transform hover:scale-110 active:scale-90"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                                            <span className="font-black text-xs text-blue-600 uppercase tracking-tight">{appliedCoupon.name}</span>
                                        </div>
                                        <span className="font-black text-xs text-blue-600">-₹{appliedCoupon.discountAmount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
                                <span className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tighter">Bill Total</span>
                                <span className="font-black text-2xl text-blue-600 tracking-tighter">₹{finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-8 space-y-3">
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl font-black text-sm uppercase text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95"
                            >
                                Save to Cart
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 text-sm uppercase transition-all active:scale-95"
                            >
                                Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
