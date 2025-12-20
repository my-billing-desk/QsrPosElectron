import React from 'react';
import {
    LayoutDashboard, PlayCircle, FolderOpen, Clock, Printer, FileText, ChefHat, ChevronRight, ChevronLeft, LogOut, RotateCcw
} from 'lucide-react';

export function Sidebar({ activeTab, onTabChange, isCollapsed, toggleSidebar }) {
    // State lifted to App.jsx

    // Desktop POS Menu Structure
    const menuGroups = [
        {
            title: 'POS Operations',
            items: [
                { id: 'operations', label: 'Operations', icon: LayoutDashboard },
                { id: 'order_history', label: 'Order History', icon: FileText },
                { id: 'running_orders', label: 'Running Orders', icon: PlayCircle },
                { id: 'running_summary', label: 'Order Summary', icon: FolderOpen },
                { id: 'kitchen_view', label: 'Kitchen View (KDS)', icon: ChefHat },
                { id: 'day_shift', label: 'Day Shift', icon: Clock },
            ]
        },
        {
            title: 'Configuration',
            items: [
                { id: 'print_config', label: 'Print Configuration', icon: Printer },
                { id: 'kot_print_setup', label: 'KOT Print Setup', icon: FileText },
            ]
        }
    ];

    return (
        <div className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-all duration-300 shadow-xl z-20`}>
            {/* Header */}
            <div onClick={toggleSidebar} className={`h-16 shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all cursor-pointer`}>
                <div className={`${isCollapsed ? 'w-10 h-10' : 'w-auto px-3 py-2'} bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold transition-all`}>
                    {isCollapsed ? 'Q' : 'QSR POS'}
                </div>
            </div>

            {/* Scrollable Nav */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                {menuGroups.map((group, idx) => (
                    <div key={idx} className="space-y-1">
                        {!isCollapsed && (
                            <div className="px-3 mb-2 flex items-center justify-between group cursor-pointer">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-orange-600 transition-colors">
                                    {group.title}
                                </h3>
                            </div>
                        )}

                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onTabChange(item.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive
                                            ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 shadow-sm font-semibold'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        <div className="flex items-center min-w-0">
                                            <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                            {!isCollapsed && <span className="ml-3 truncate text-sm leading-none pt-0.5">{item.label}</span>}
                                        </div>

                                        {/* Active Indicator Bar */}
                                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-orange-600 rounded-r-full" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-1">
                <button className="w-full flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Reset Cache">
                    <RotateCcw className="w-5 h-5" />
                    {!isCollapsed && <span className="ml-3 font-medium text-sm">Reset Cache</span>}
                </button>
                <button className="w-full flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors" title="Logout">
                    <LogOut className="w-5 h-5" />
                    {!isCollapsed && <span className="ml-3 font-medium text-sm">Logout</span>}
                </button>
            </div>
        </div>
    );
}
