import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, PlayCircle, FolderOpen, Clock, Printer, FileText, ChefHat, ChevronRight, ChevronLeft, LogOut, RotateCcw, ShoppingBag,
    ShoppingCart, BarChart2, PieChart, ArrowRightLeft, Trash2, Package, ClipboardCheck, ChevronDown
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ activeTab, onTabChange, isCollapsed, toggleSidebar, onLogout }) {
    const { themeColor } = useTheme();
    const { user } = useAuth();
    const [expandedGroups, setExpandedGroups] = useState({});

    // Mapping of menu item IDs to Permission IDs
    const permissionMapping = {
        'operations': [30, 140],
        'online_orders': [9],
        'order_history': [144],
        'running_orders': [30, 140],
        'running_summary': [30, 140],
        'kitchen_view': [7],
        'day_shift': [27],
        'stock_purchase': [17],
        'purchase_order': [17],
        'inventory': [14, 15],
        'available_stock': [14],
        'closing_stock': [18],
        'stock_transfer': [19],
        'wastage': [18],
        'inventory_reports': [10],
        'stock_summary': [10]
    };

    const hasPermission = (itemId) => {
        if (!user) return false;
        if (user.role === 'super_admin' || user.role === 'admin') return true;

        const requiredIds = permissionMapping[itemId];
        if (!requiredIds) return true; // Default allow if not mapped

        return requiredIds.some(reqId =>
            user.permissions?.some(p => p.id === reqId && (p.value === true || p.read === true || p.write === true))
        );
    };

    // Desktop POS Menu Structure
    const allMenuGroups = [
        {
            title: 'POS Operations',
            items: [
                { id: 'operations', label: 'Operations', icon: LayoutDashboard },
                { id: 'online_orders', label: 'Online Orders', icon: ShoppingBag },
                { id: 'order_history', label: 'Order History', icon: FileText },
                { id: 'running_orders', label: 'Running Orders', icon: PlayCircle },
                { id: 'running_summary', label: 'Order Summary', icon: FolderOpen },
                { id: 'day_shift', label: 'Day Shift', icon: Clock },
            ]
        },
        {
            title: 'Purchase',
            items: [
                { id: 'stock_purchase', label: 'Stock Purchase', icon: ShoppingCart },
                { id: 'purchase_order', label: 'Purchase Order', icon: FileText },
            ]
        },
        {
            title: 'Manage Stock',
            items: [
                { id: 'inventory', label: 'Overview', icon: FolderOpen },
                { id: 'available_stock', label: 'Available Stock', icon: Package },
                { id: 'closing_stock', label: 'Closing Stock', icon: ClipboardCheck },
            ]
        },
        {
            title: 'Consumption',
            items: [
                { id: 'stock_transfer', label: 'Transfer', icon: ArrowRightLeft },
                { id: 'wastage', label: 'Wastage', icon: Trash2 },
            ]
        },
        {
            title: 'Reports',
            items: [
                { id: 'inventory_reports', label: 'Inventory Reports', icon: BarChart2 },
                { id: 'stock_summary', label: 'Stock Summary', icon: PieChart },
            ]
        }
    ];

    const menuGroups = allMenuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => hasPermission(item.id))
    })).filter(group => group.items.length > 0);

    // Auto-expand group containing active tab
    useEffect(() => {
        const groupIndex = menuGroups.findIndex(g => g.items.some(i => i.id === activeTab));
        if (groupIndex !== -1) {
            setExpandedGroups(prev => ({ ...prev, [groupIndex]: true }));
        }
    }, [activeTab]);

    const toggleGroup = (idx) => {
        setExpandedGroups(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    return (
        <div className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-all duration-300 shadow-xl z-20`}>
            {/* Header */}
            <div onClick={toggleSidebar} className={`h-16 shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all cursor-pointer`}>
                <div
                    className={`${isCollapsed ? 'w-10 h-10' : 'w-auto px-3 py-2'} rounded-lg flex items-center justify-center text-white font-bold transition-all`}
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    {isCollapsed ? 'Q' : 'QSR POS'}
                </div>
            </div>

            {/* Scrollable Nav */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 font-sans">
                {menuGroups.map((group, idx) => {
                    const isExpanded = expandedGroups[idx];
                    return (
                        <div key={idx} className="space-y-1">
                            {!isCollapsed && (
                                <div
                                    onClick={() => toggleGroup(idx)}
                                    className="px-3 py-2 mb-1 flex items-center justify-between group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all"
                                >
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-700 transition-colors">
                                        {group.title}
                                    </h4>
                                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" strokeWidth={3} /> : <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />}
                                    </div>
                                </div>
                            )}

                            <div className={`space-y-1 transition-all duration-300 overflow-hidden ${(!isCollapsed && !isExpanded) ? 'max-h-0' : 'max-h-[500px]'}`}>
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => onTabChange(item.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                                ? 'shadow-lg shadow-orange-500/10 font-bold'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                                                }`}
                                            style={isActive ? {
                                                backgroundColor: `${themeColor}15`,
                                                color: themeColor
                                            } : {}}
                                            title={isCollapsed ? item.label : ''}
                                        >
                                            <div className="flex items-center min-w-0">
                                                <Icon
                                                    className={`w-5 h-5 shrink-0 ${!isActive ? 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500' : ''}`}
                                                    style={isActive ? { color: themeColor } : {}}
                                                />
                                                {!isCollapsed && <span className="ml-3 truncate text-[13px] tracking-wide">{item.label}</span>}
                                            </div>

                                            {isActive && (
                                                <div
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full"
                                                    style={{ backgroundColor: themeColor }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className={`px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all ${isCollapsed ? 'flex justify-center' : ''}`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                        style={{ backgroundColor: themeColor }}
                    >
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate capitalize">{user?.name || 'User'}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{user?.role?.replace(/_/g, ' ') || 'Staff'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10 space-y-1">
                <button
                    className="w-full flex items-center p-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 transition-all group"
                    title="Reset Cache"
                >
                    <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    {!isCollapsed && <span className="ml-3 font-semibold text-xs tracking-wide">Reset Cache</span>}
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center p-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all group"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    {!isCollapsed && <span className="ml-3 font-semibold text-xs tracking-wide">Logout Account</span>}
                </button>
            </div>
        </div>
    );
}
