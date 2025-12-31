import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, PlayCircle, FolderOpen, Clock, Printer, FileText, ChefHat, ChevronRight, ChevronLeft, LogOut, RotateCcw, ShoppingBag,
    ShoppingCart, BarChart2, PieChart, ArrowRightLeft, Trash2, Package, ClipboardCheck, ChevronDown, Layers
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

    const hasPermission = (item) => {
        if (!user) return false;
        if (user.role === 'super_admin' || user.role === 'admin') return true;

        // If it's a sub-menu, check if any of its children are allowed
        if (item.items) {
            return item.items.some(subItem => hasPermission(subItem));
        }

        const requiredIds = permissionMapping[item.id];
        if (!requiredIds) return true;

        return requiredIds.some(reqId =>
            user.permissions?.some(p => p.id === reqId && (p.value === true || p.read === true || p.write === true))
        );
    };

    // Deep Menu Structure
    const allMenuGroups = [
        {
            id: 'pos_main',
            title: 'POS Operations',
            items: [
                {
                    id: 'sales_orders',
                    label: 'Sales & Orders',
                    icon: LayoutDashboard,
                    items: [
                        { id: 'operations', label: 'Dashboard' },
                        { id: 'online_orders', label: 'Online Orders' },
                        { id: 'order_history', label: 'Order History' },
                    ]
                },
                {
                    id: 'active_tracking',
                    label: 'Active Tracking',
                    icon: PlayCircle,
                    items: [
                        { id: 'running_orders', label: 'Running Orders' },
                        { id: 'running_summary', label: 'Order Summary' },
                    ]
                },
                { id: 'day_shift', label: 'Day Shift', icon: Clock },
            ]
        },
        {
            id: 'inventory_main',
            title: 'Inventory & Stock',
            items: [
                {
                    id: 'stock_mgmt',
                    label: 'Stock Management',
                    icon: Package,
                    items: [
                        { id: 'inventory', label: 'Overview' },
                        { id: 'available_stock', label: 'Available Stock' },
                        { id: 'closing_stock', label: 'Closing Stock' },
                    ]
                },
                {
                    id: 'procurement',
                    label: 'Procurement',
                    icon: ShoppingCart,
                    items: [
                        { id: 'stock_purchase', label: 'Stock Purchase' },
                        { id: 'purchase_order', label: 'Purchase Order' },
                    ]
                },
                {
                    id: 'consumption',
                    label: 'Consumption',
                    icon: Trash2,
                    items: [
                        { id: 'stock_transfer', label: 'Transfer' },
                        { id: 'wastage', label: 'Wastage' },
                    ]
                },
            ]
        },
        {
            id: 'reports_main',
            title: 'Reports',
            items: [
                { id: 'inventory_reports', label: 'Inventory Reports', icon: BarChart2 },
                { id: 'stock_summary', label: 'Stock Summary', icon: PieChart },
            ]
        }
    ];

    // Filtered Groups
    const menuGroups = allMenuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => hasPermission(item))
    })).filter(group => group.items.length > 0);

    // Auto-expand logic
    useEffect(() => {
        const newExpanded = { ...expandedGroups };
        menuGroups.forEach((group, gIdx) => {
            group.items.forEach(item => {
                if (item.items && item.items.some(sub => sub.id === activeTab)) {
                    newExpanded[`group-${gIdx}`] = true;
                    newExpanded[item.id] = true;
                } else if (item.id === activeTab) {
                    newExpanded[`group-${gIdx}`] = true;
                }
            });
        });
        setExpandedGroups(newExpanded);
    }, [activeTab]);

    const toggleGroup = (id) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderMenuItem = (item, depth = 0) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isSubActive = item.items && item.items.some(sub => sub.id === activeTab);
        const isOpen = expandedGroups[item.id];
        const isChild = depth > 0;

        if (item.items) {
            // Sub-menu Header
            return (
                <div key={item.id} className="space-y-1">
                    <button
                        onClick={() => toggleGroup(item.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group ${isOpen ? 'bg-gray-50/80 dark:bg-gray-700/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                    >
                        <div className="flex items-center min-w-0">
                            {Icon && <Icon className={`w-4.5 h-4.5 shrink-0 ${isOpen || isSubActive ? '' : 'text-gray-400 opacity-60'}`} style={(isOpen || isSubActive) ? { color: themeColor } : {}} />}
                            {!isCollapsed && <span className={`ml-3 text-[13px] font-semibold tracking-wide ${isOpen || isSubActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>{item.label}</span>}
                        </div>
                        {!isCollapsed && (
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''} ${isOpen || isSubActive ? 'text-gray-900' : 'text-gray-400'}`} />
                        )}
                    </button>

                    <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
                        {!isCollapsed && (
                            <div className="ml-4 pl-3 border-l-2 border-gray-100 dark:border-gray-700 space-y-1 py-1">
                                {item.items.map(subItem => renderMenuItem(subItem, depth + 1))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Action Item
        return (
            <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 group relative ${isActive
                    ? 'shadow-lg shadow-orange-500/5 bg-white dark:bg-gray-700 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                style={isActive ? { color: themeColor } : {}}
            >
                {Icon ? (
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${!isActive ? 'opacity-60' : ''}`} />
                ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ml-1.5 mr-3 ${isActive ? '' : 'bg-gray-300'}`} style={isActive ? { backgroundColor: themeColor } : {}} />
                )}
                {!isCollapsed && <span className={`ml-3 text-[13px] tracking-wide ${isActive ? 'translate-x-0.5' : ''} transition-transform`}>{item.label}</span>}

                {isActive && !isChild && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full" style={{ backgroundColor: themeColor }} />
                )}
            </button>
        );
    };

    return (
        <div className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-all duration-300 shadow-xl z-20`}>
            {/* Header */}
            <div onClick={toggleSidebar} className={`h-16 shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all cursor-pointer`}>
                <div
                    className={`${isCollapsed ? 'w-10 h-10' : 'w-auto px-3 py-2'} rounded-lg flex items-center justify-center text-white font-bold transition-all shadow-md active:scale-95`}
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    {isCollapsed ? 'Q' : 'QSR POS'}
                </div>
            </div>

            {/* Scrollable Nav */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 font-sans">
                {menuGroups.map((group, idx) => {
                    const groupId = `group-${idx}`;
                    const isExpanded = expandedGroups[groupId] !== false; // Default expanded for main groups

                    return (
                        <div key={group.id} className="space-y-2">
                            {!isCollapsed && (
                                <div
                                    onClick={() => toggleGroup(groupId)}
                                    className="px-3 py-1 flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 rounded-lg transition-all"
                                >
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-500 transition-colors">
                                        {group.title}
                                    </h4>
                                    <ChevronDown className={`w-3 h-3 text-gray-300 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
                                </div>
                            )}

                            <div className={`space-y-1 transition-all duration-300 overflow-hidden ${(!isCollapsed && !isExpanded) ? 'max-h-0' : 'max-h-[1000px]'}`}>
                                {group.items.map(item => renderMenuItem(item))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className={`px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all ${isCollapsed ? 'flex justify-center' : ''}`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg"
                        style={{ backgroundColor: themeColor }}
                    >
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-gray-900 dark:text-white truncate capitalize">{user?.name || 'User'}</p>
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
                    {!isCollapsed && <span className="ml-3 font-bold text-xs tracking-wide">Reset Cache</span>}
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center p-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all group"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    {!isCollapsed && <span className="ml-3 font-bold text-xs tracking-wide">Logout Account</span>}
                </button>
            </div>
        </div>
    );
}
