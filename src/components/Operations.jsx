import React from 'react';
import {
    FileText, Monitor, ChefHat, Users,
    TrendingUp, Wallet, ArrowDownCircle, PlusCircle,
    Package, Bell, LayoutGrid, RefreshCw,
    HelpCircle, Radio, CreditCard, Languages,
    User, MessageSquare, Truck, Tv, AppWindow,
    Printer, Percent, Settings, ToggleRight, RotateCcw,
    GitCommit, ScrollText, List, Sliders
} from 'lucide-react';

export function Operations({ onNavigate }) {
    const modules = [
        { id: 'orders', title: 'Orders', icon: FileText, color: 'text-gray-700' },
        { id: 'online_orders', title: 'Online Orders', icon: Monitor, color: 'text-gray-700' },
        { id: 'kots', title: 'KOTs', icon: ChefHat, color: 'text-gray-700' },
        { id: 'customers', title: 'Customers', icon: Users, color: 'text-gray-700' },

        { id: 'cash_flow', title: 'Cash Flow', icon: TrendingUp, color: 'text-gray-700' },
        { id: 'expense', title: 'Expense', icon: Wallet, color: 'text-gray-700' },
        { id: 'withdrawal', title: 'Withdrawal', icon: ArrowDownCircle, color: 'text-gray-700' },
        { id: 'cash_topup', title: 'Cash Top-Up', icon: PlusCircle, color: 'text-gray-700' },

        { id: 'inventory', title: 'Inventory', icon: Package, color: 'text-gray-700' },
        { id: 'alerts', title: 'Alerts', icon: Bell, color: 'text-gray-700' },
        { id: 'table', title: 'Table', icon: LayoutGrid, color: 'text-gray-700' },
        { id: 'manual_sync', title: 'Manual Sync', icon: RefreshCw, color: 'text-gray-700' },

        { id: 'help', title: 'Help', icon: HelpCircle, color: 'text-gray-700' },
        { id: 'live_view', title: 'Live View', icon: Radio, color: 'text-gray-700' },
        { id: 'due_payment', title: 'Due Payment', icon: CreditCard, color: 'text-gray-700' },
        { id: 'language_profiles', title: 'Language Profiles', icon: Languages, color: 'text-gray-700' },

        { id: 'billing_profile', title: 'Billing User Profile', icon: User, color: 'text-gray-700' },
        { id: 'currency_conversion', title: 'Currency Conversion', icon: RefreshCw, color: 'text-gray-700' },
        { id: 'feedback', title: 'Feedback', icon: MessageSquare, color: 'text-gray-700' },
        { id: 'delivery_boys', title: 'Delivery Boys', icon: Truck, color: 'text-gray-700' },

        { id: 'led_display', title: 'LED Display', icon: Tv, color: 'text-gray-700' },
        { id: 'dual_screen', title: 'Dual Screen', icon: AppWindow, color: 'text-gray-700' },
    ];

    const configModules = [
        { id: 'menu_manage', title: 'Menu', icon: FileText, color: 'text-gray-700' },
        { id: 'print_setup', title: 'Bill / KOT Print', icon: Printer, color: 'text-gray-700' },
        { id: 'tax_setup', title: 'Tax', icon: ScrollText, color: 'text-gray-700' },
        { id: 'discount_setup', title: 'Discount', icon: Percent, color: 'text-gray-700' },
        { id: 'billing_screen_setup', title: 'Billing Screen', icon: List, color: 'text-gray-700' },
        { id: 'settings_setup', title: 'Settings', icon: Settings, color: 'text-gray-700' },
        { id: 'item_on_off', title: 'Menu Item On Off', icon: ToggleRight, color: 'text-red-500', isHightlighted: true },
        { id: 'service_renewal', title: 'Service Renewal', icon: RotateCcw, color: 'text-gray-700' },
        { id: 'custom_status', title: 'Custom Order Status', icon: GitCommit, color: 'text-gray-700' },
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
                        <a href="mailto:support@petpooja.com" className="hover:text-blue-600 flex items-center gap-2">
                            Send a Mail: support@petpooja.com
                        </a>
                    </div>
                </div>

                {/* Main Operations Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
                    {modules.map((module) => (
                        <button
                            key={module.id}
                            onClick={() => onNavigate && onNavigate(module.id)}
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
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
        </div>
    );
}
