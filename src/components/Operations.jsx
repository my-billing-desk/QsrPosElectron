import React, { useState } from 'react';
import {
    FileText, Monitor, ChefHat, Users,
    TrendingUp, Wallet, ArrowDownCircle, PlusCircle,
    Package, Bell, LayoutGrid, RefreshCw,
    HelpCircle, Radio, CreditCard, Languages,
    User, MessageSquare, Truck, Tv, AppWindow,
    Printer, Percent, Settings, ToggleRight, RotateCcw,
    GitCommit, ScrollText, List, Sliders, ArrowUpCircle
} from 'lucide-react';
import { CashMovementModal } from './CashMovementModal';

export function Operations({ onNavigate }) {
    const [cashMovementModal, setCashMovementModal] = useState({ isOpen: false, type: null });

    const handleCashMovementSuccess = (movement) => {
        console.log('Cash movement recorded:', movement);
        // Could show a toast notification here
    };

    const modules = [
        // Operations are empty for now, to be added one by one
    ];

    const configModules = [
        { id: 'print_config', title: 'Outlet Configuration', icon: Settings, color: 'text-gray-700' },
    ];

    return (
        <div className="flex-1 bg-white dark:bg-gray-900 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto pb-10">
                {/* Header Information matching screenshot style */}
                <div className="flex justify-between items-start mb-8 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Operations</h1>
                        <p>Version: 119.0.2</p>
                    </div>
                    <div className="text-center">
                        <p className="font-medium text-lg text-gray-800 dark:text-gray-200">Main Server</p>
                        <p>Master Billing Station</p>
                    </div>
                    <div className="text-right">
                        <a href="mailto:support@mybill.com" className="hover:text-blue-600 flex items-center gap-2">
                            Send a Mail: support@gmail.com
                        </a>
                    </div>
                </div>

                {/* Main Operations Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
                    {modules.map((module) => (
                        <button
                            key={module.id}
                            onClick={() => module.action ? module.action() : (onNavigate && onNavigate(module.id))}
                            className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 group h-32"
                        >
                            <module.icon
                                size={32}
                                className={`mb-3 ${module.color} dark:text-gray-300 group-hover:scale-110 transition-transform`}
                                strokeWidth={1.5}
                            />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                                {module.title}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Configuration Section */}
                <div className="mb-6">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                        Set the configuration for your restaurant
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {configModules.map((module) => {
                            const isHighlighted = module.isHightlighted;
                            return (
                                <button
                                    key={module.id}
                                    onClick={() => onNavigate && onNavigate(module.id)}
                                    className={`flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border ${isHighlighted ? 'border-red-100 bg-red-50/50 dark:bg-red-900/10' : 'border-transparent'} hover:border-gray-200 dark:hover:border-gray-600 group h-32 shadow-sm`}
                                >
                                    <module.icon
                                        size={32}
                                        className={`mb-3 ${module.color} ${!isHighlighted && 'dark:text-gray-300'} group-hover:scale-110 transition-transform`}
                                        strokeWidth={1.5}
                                    />
                                    <span className={`text-xs font-medium text-center leading-tight ${isHighlighted ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {module.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Cash Movement Modal */}
            <CashMovementModal
                isOpen={cashMovementModal.isOpen}
                type={cashMovementModal.type}
                onClose={() => setCashMovementModal({ isOpen: false, type: null })}
                onSuccess={handleCashMovementSuccess}
            />
        </div>
    );
}
