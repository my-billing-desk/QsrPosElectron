import React, { useState } from 'react';
import { X, Plus, Minus, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

export function CartItem({ item, onUpdateQuantity, onRemove, onEdit }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasDetails = item.variantName || (item.addons && item.addons.length > 0) || item.cookingInstructions;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Main Row */}
            <div className="p-2">
                <div className="flex items-center gap-2">
                    {/* Quantity Controls - Compact */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded">
                        <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-l transition-colors"
                            disabled={item.quantity <= 1}
                        >
                            <Minus className="w-3 h-3 text-gray-500" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-white">
                            {item.quantity}
                        </span>
                        <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-r transition-colors"
                        >
                            <Plus className="w-3 h-3 text-gray-500" />
                        </button>
                    </div>

                    {/* Item Details - Click to Edit */}
                    <div
                        className="flex-1 min-w-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded p-1 -m-1 transition-colors"
                        onClick={() => onEdit && onEdit(item)}
                    >
                        <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                                        {item.itemName}
                                    </p>
                                    {onEdit && (
                                        <Edit2 className="w-3 h-3 text-blue-500 shrink-0" />
                                    )}
                                </div>
                                {/* Variant & Addons preview */}
                                {hasDetails && (
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                        <span className="truncate max-w-[150px]">
                                            {item.variantName && <span className="text-blue-500">{item.variantName}</span>}
                                            {item.variantName && item.addons?.length > 0 && ' • '}
                                            {item.addons?.map(a => a.name).join(', ')}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsExpanded(!isExpanded);
                                            }}
                                            className="hover:text-blue-500"
                                        >
                                            {isExpanded ? (
                                                <ChevronUp className="w-3 h-3 shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-3 h-3 shrink-0" />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Price & Remove */}
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="text-sm font-black text-gray-900 dark:text-white">
                                    ₹{item.total.toFixed(0)}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(item.id);
                                    }}
                                    className="p-0.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && hasDetails && (
                <div className="px-3 pb-2 pt-1 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 space-y-1">
                    {/* Variant */}
                    {item.variantName && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Variant:</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">{item.variantName}</span>
                        </div>
                    )}

                    {/* Addons */}
                    {item.addons && item.addons.length > 0 && (
                        <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Addons:</span>
                            {item.addons.map((addon, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs pl-2">
                                    <span className="text-green-600 dark:text-green-400">+ {addon.name}</span>
                                    <span className="text-gray-600 dark:text-gray-400">₹{addon.price || 0}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Cooking Instructions */}
                    {item.cookingInstructions && (
                        <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-[10px] text-orange-500 font-bold">📝 Note: </span>
                            <span className="text-xs text-orange-600 dark:text-orange-400">{item.cookingInstructions}</span>
                        </div>
                    )}

                    {/* Edit Button */}
                    {onEdit && (
                        <button
                            onClick={() => onEdit(item)}
                            className="w-full mt-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-1"
                        >
                            <Edit2 className="w-3 h-3" />
                            Edit Item
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
