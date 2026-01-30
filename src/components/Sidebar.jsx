import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, PlayCircle, FolderOpen, Clock, Printer, FileText, ChefHat, ChevronRight, ChevronLeft, LogOut, RotateCcw, ShoppingBag,
    ShoppingCart, BarChart2, PieChart, ArrowRightLeft, Trash2, Package, ClipboardCheck, ChevronDown, Layers, Settings
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
        'purchase_return': [17],
        'inventory': [14, 15],
        'available_stock': [14],
        'closing_stock': [18],
        'stock_transfer': [19],
        'wastage': [18],
        'inventory_reports': [10],
        'inventory_reports': [10],
        'stock_summary': [10],
        'print_config': [30, 140],
        'menu_management': [30, 140] // Assuming admin permissions for now
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
                { id: 'operations', label: 'Operations', icon: LayoutDashboard },
                { id: 'print_config', label: 'Outlet Configuration', icon: Printer },
                { id: 'menu_management', label: 'Menu Management', icon: ChefHat }
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
                        onClick={() => {
                            if (isCollapsed) toggleSidebar();
                            toggleGroup(item.id)
                        }}
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
                onClick={() => {
                    if (isCollapsed) toggleSidebar();
                    onTabChange(item.id);
                }}
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
            <div className={`h-16 shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all relative`}>
                <div
                    className={`${isCollapsed ? 'w-10 h-10' : 'w-auto px-3 py-2'} rounded-lg flex items-center justify-center text-white font-bold transition-all shadow-md`}
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    {isCollapsed ? 'Q' : 'QSR POS'}
                </div>

                {/* Collapse Toggle Arrow */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center shadow-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all z-50"
                >
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* Scrollable Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                {menuGroups.map((group, idx) => (
                    <div key={group.id} className="space-y-1">
                        {!isCollapsed && (
                            <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                                {group.title}
                            </h4>
                        )}

                        <div className="space-y-1">
                            {group.items.map(item => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onTabChange(item.id)}
                                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${isActive
                                            ? 'bg-blue-50 text-[#444ce7] font-bold'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <div className="flex items-center min-w-0 flex-1">
                                            {Icon && <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#444ce7]' : 'text-gray-400 group-hover:text-gray-600'}`} />}
                                            {!isCollapsed && <span className="ml-3 text-sm truncate">{item.label}</span>}
                                        </div>
                                        {isActive && !isCollapsed && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#444ce7]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Profile Section */}
            <div className="px-3 py-4 border-t border-gray-50 bg-gray-50/30">
                {!isCollapsed ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white shadow-sm border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#444ce7] font-bold text-sm shrink-0">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
                                <p className="text-[10px] text-gray-500 truncate capitalize">{user?.role?.replace(/_/g, ' ') || 'Staff'}</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all group"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-xs font-bold">Logout</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#444ce7] font-bold">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
