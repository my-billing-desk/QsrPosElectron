import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Smartphone, Server, Wallet } from 'lucide-react';

export function PaymentModal({ isOpen, onClose, onConfirm, totalAmount, subTotal, taxAmount, discount, roundOff, orderId, orderType, orderDate }) {
    const [receivedAmount, setReceivedAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('Pine labs');
    const [paymentType, setPaymentType] = useState('full'); // full, non_chargeable, partial, split
    const [splits, setSplits] = useState([]);
    const [showConfirmSwitch, setShowConfirmSwitch] = useState(false);
    const [pendingMode, setPendingMode] = useState(null);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setReceivedAmount(Math.round(totalAmount).toString());
            setSelectedMethod('Pine labs');
            setPaymentType('full');
            setSplits([]);
            setShowConfirmSwitch(false);
            setPendingMode(null);
        }
    }, [isOpen, totalAmount]);

    // Handle Mode Switching with Confirmation
    const handleModeRequest = (newMode) => {
        if (newMode === paymentType) return;

        // If currently in split mode with data, or switching TO split mode from something else and we want to be safe?
        // Requirement: "Switching Payment Category... All the added payments will be erased."
        // This implies if we have entered data (like splits) we should warn.

        const hasData = (paymentType === 'split' && splits.length > 0);

        if (hasData) {
            setPendingMode(newMode);
            setShowConfirmSwitch(true);
        } else {
            setPaymentType(newMode);
            // Reset logic based on new mode
            if (newMode === 'split') {
                setSplits([]);
                setReceivedAmount(''); // Start empty for first split or total? Usually split starts empty to let user type.
            } else {
                setReceivedAmount(Math.round(totalAmount).toString());
                setSplits([]);
            }
        }
    };

    const confirmSwitch = () => {
        setPaymentType(pendingMode);
        setSplits([]);
        if (pendingMode === 'split') {
            setReceivedAmount('');
        } else {
            setReceivedAmount(Math.round(totalAmount).toString());
        }
        setShowConfirmSwitch(false);
        setPendingMode(null);
    };

    const cancelSwitch = () => {
        setShowConfirmSwitch(false);
        setPendingMode(null);
    };


    const handleNumPad = (val) => {
        if (val === 'AC') {
            setReceivedAmount('');
        } else if (val === 'C') {
            setReceivedAmount(prev => prev.slice(0, -1));
        } else if (val === '.') {
            if (!receivedAmount.includes('.')) setReceivedAmount(prev => prev + '.');
        } else {
            if (receivedAmount === '0') setReceivedAmount(val);
            else setReceivedAmount(prev => prev + val);
        }
    };

    const handleQuickAmount = (amt) => {
        setReceivedAmount(amt.toString());
    };

    // Calculation Logic
    const parsedReceived = parseFloat(receivedAmount) || 0;

    // Split Logic
    const totalCollectedSplits = splits.reduce((sum, s) => sum + s.amount, 0);

    // Effective Collected Amount based on mode
    let effectiveCollected = 0;
    if (paymentType === 'split') {
        effectiveCollected = totalCollectedSplits;
    } else {
        effectiveCollected = parsedReceived;
    }

    const due = Math.max(0, totalAmount - effectiveCollected);
    const change = Math.max(0, effectiveCollected - totalAmount);

    // Add Split
    const handleAddSplit = () => {
        if (parsedReceived <= 0) return;
        if (parsedReceived > (totalAmount - totalCollectedSplits) + 0.1) {
            // Optional: Preventing over-payment in split mode? Or allow change on last split?
            // Usually split sums up significantly close to total.
        }

        const newSplit = {
            id: Date.now(),
            method: selectedMethod,
            amount: parsedReceived
        };

        setSplits([...splits, newSplit]);
        // Auto-set next amount to remaining due
        const remaining = totalAmount - (totalCollectedSplits + parsedReceived);
        if (remaining > 0) {
            setReceivedAmount(Math.round(remaining).toString());
        } else {
            setReceivedAmount('');
        }
    };

    const handleRemoveSplit = (index) => {
        const newSplits = [...splits];
        newSplits.splice(index, 1);
        setSplits(newSplits);
    };

    const formatCurrency = (val) => Number(val).toFixed(2);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[650px] relative">

                {/* Confirmation Overlay */}
                {showConfirmSwitch && (
                    <div className="absolute inset-0 z-[210] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Switching Payment Category</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                                All the added payments will be erased. Are you sure you want to continue?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={cancelSwitch}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                >
                                    NO
                                </button>
                                <button
                                    onClick={confirmSwitch}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                                >
                                    YES
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Section */}
                <div className="flex bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700 items-center justify-between shrink-0">
                    <div className="flex gap-4 ml-4">
                        <ModeRadio label="Full Payment" mode="full" current={paymentType} onSelect={handleModeRequest} />
                        <ModeRadio label="Non chargeable" mode="non_chargeable" current={paymentType} onSelect={handleModeRequest} />
                        <ModeRadio label="Partial Payment" mode="partial" current={paymentType} onSelect={handleModeRequest} />
                        <ModeRadio label="Split Payment" mode="split" current={paymentType} onSelect={handleModeRequest} />
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex flex-1">

                    {/* Left & Middle Container */}
                    <div className="flex-1 flex p-6 gap-6 bg-gray-50 dark:bg-gray-900/50">

                        {/* Left: Received Amount & Numpad */}
                        <div className="w-1/2 flex flex-col gap-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-gray-500">Received Amount</label>
                                    {paymentType === 'split' && <div className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-black uppercase">Enter Split Amount</div>}
                                </div>
                                <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-900 rounded-xl p-4 flex items-center shadow-lg">
                                    <span className="text-3xl font-black text-gray-900 dark:text-white flex-1 outline-none">{receivedAmount}</span>
                                </div>
                            </div>

                            {/* Numpad */}
                            <div className="grid grid-cols-3 gap-3 flex-1">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '00'].map(key => (
                                    <button
                                        key={key}
                                        onClick={() => handleNumPad(key)}
                                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xl font-bold text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3 h-16">
                                <button onClick={() => handleNumPad('C')} className="flex-1 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200">C</button>
                                <button onClick={() => handleNumPad('AC')} className="flex-1 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600">AC</button>
                            </div>

                            {/* Quick Denominations */}
                            <div className="grid grid-cols-4 gap-2">
                                {[Math.round(totalAmount), 100, 200, 500, 2000].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => handleQuickAmount(amt)}
                                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2 font-bold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        ₹{amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Middle: Payment Methods */}
                        <div className="w-1/2 flex flex-col">
                            {paymentType === 'split' && (
                                <div className="mb-4">
                                    <button
                                        onClick={handleAddSplit}
                                        disabled={!parsedReceived || parsedReceived <= 0}
                                        className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-black rounded-xl shadow-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Add Payment
                                    </button>
                                </div>
                            )}

                            <label className="block text-xs font-bold text-gray-500 mb-2">Payment Methods</label>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[
                                    { id: 'Card', icon: <CreditCard size={20} /> },
                                    { id: 'UPI', icon: <Smartphone size={20} /> },
                                    { id: 'Cash', icon: <Banknote size={20} /> },
                                    { id: 'Pine labs', icon: <Server size={20} />, preferred: true },
                                    { id: 'Online', icon: <Wallet size={20} /> },
                                ].map(method => (
                                    <button
                                        key={method.id}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all active:scale-95 relative overflow-hidden ${selectedMethod === method.id
                                                ? 'bg-gray-800 text-white border-gray-800 shadow-xl'
                                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        {method.icon}
                                        <span className="font-bold text-sm">{method.id}</span>
                                        {method.preferred && selectedMethod !== method.id && (
                                            <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full m-2 animate-pulse"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {selectedMethod === 'Pine labs' && (
                                <div className="bg-green-600 text-white p-4 rounded-xl text-center shadow-lg">
                                    Preferred payment options is <span className="font-black text-yellow-300">"Pine Labs"</span>.
                                    <br />
                                    <span className="text-xs opacity-90 mt-1 block">
                                        In case pine labs integration is not working then use "Card" or "UPI"
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Bill Summary */}
                    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">{orderId || 'NEW ORDER'}</h3>
                            <div className="text-xs text-gray-500 font-medium">
                                {orderDate ? new Date(orderDate).toLocaleString() : new Date().toLocaleString()}
                            </div>

                            <div className="mt-4 flex justify-between items-end">
                                <span className="text-xs font-bold text-gray-500">Bill Total</span>
                                <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">₹{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>

                        {/* Split List or Standard Summary details */}
                        <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
                            {paymentType === 'split' ? (
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 border-b border-gray-100 pb-1">Combined Payments</div>
                                    {splits.length === 0 ? (
                                        <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-xs text-center italic">
                                            No payments added yet
                                        </div>
                                    ) : (
                                        splits.map((split, idx) => (
                                            <div key={split.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 group">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleRemoveSplit(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs text-gray-700 dark:text-gray-200">Split {idx + 1} | {split.method}</span>
                                                    </div>
                                                </div>
                                                <span className="font-black text-sm text-gray-900 dark:text-white">₹{formatCurrency(split.amount)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Standard breakdown for non-split modes (Tax, Charges, etc.) */}
                                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <span>Sub Total</span>
                                        <span>₹{formatCurrency(subTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <span>Charges</span>
                                        <span>₹{formatCurrency(totalAmount - subTotal - taxAmount + (discount || 0))}</span>
                                        {/* Rough calc for container charge/roundoff difference if passed combined */}
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <span>Tax</span>
                                        <span>₹{formatCurrency(taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <span>Discount</span>
                                        <span>₹{formatCurrency(discount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <span>Round Off</span>
                                        <span>{roundOff > 0 ? '+' : ''}₹{formatCurrency(roundOff || 0)}</span>
                                    </div>

                                    <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-dashed border-gray-300">
                                        <span>Bill Total</span>
                                        <span>₹{formatCurrency(totalAmount)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Totals Footer */}
                        <div className="mt-2 space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Amount Collected</span>
                                <span className="font-black text-gray-900 dark:text-white">₹{formatCurrency(effectiveCollected)}</span>
                            </div>
                            <div className="flex justify-between bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900">
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">{due > 0.01 ? 'Amount Due' : 'Change'}</span>
                                <span className={`font-black ${due > 0.01 ? 'text-red-500' : 'text-emerald-600'}`}>
                                    ₹{formatCurrency(due > 0.01 ? due : change)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <button onClick={onClose} className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 shadow-sm">
                        Save
                    </button>
                    <button
                        onClick={() => onConfirm({
                            method: selectedMethod,
                            receivedAmount: effectiveCollected,
                            paymentType: paymentType,
                            splits: paymentType === 'split' ? splits : []
                        })}
                        disabled={paymentType === 'split' ? due > 0.5 : false}
                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm Payment
                    </button>
                </div>

            </div>
        </div>
    );
}

function ModeRadio({ label, mode, current, onSelect }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input
                type="radio"
                name="paymentType"
                checked={current === mode}
                onChange={() => onSelect(mode)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{label}</span>
        </label>
    );
}

// Payment Methods Config
const PAYMENT_METHODS = [
    { id: 'Card', label: 'Card' },
    { id: 'UPI', label: 'UPI' },
    { id: 'Cash', label: 'Cash' },
    { id: 'Pine Labs', label: 'Pine Labs' },
    { id: 'Qwikcilver', label: 'Qwikcilver' },
];
