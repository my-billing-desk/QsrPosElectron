import React, { useState, useEffect } from 'react';
import {
    Search, Menu, Power, Wifi, FileText, Clock,
    PauseCircle, Bell, Headphones, LogOut,
    Home, ToggleLeft, ToggleRight, CloudUpload, WifiOff
} from 'lucide-react';
import { authService, menuService, orderService } from '../services/api';
import { useSync } from '../hooks/useSync';

export function Header({ title, onToggleSidebar, onNavigate, onLogout, user }) {
    const [pendingOrders, setPendingOrders] = useState(0);
    const { isSyncing: isDataSyncing, syncData } = useSync();
    const [isInternalSyncing, setIsInternalSyncing] = useState(false);
    const isSyncing = isDataSyncing || isInternalSyncing;
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        // Update online status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check pending orders every 5 seconds
        const updateQueueStatus = async () => {
            const length = await orderService.getQueueLength();
            setPendingOrders(length);
        };

        const interval = setInterval(updateQueueStatus, 5000);
        updateQueueStatus();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const handleSync = async () => {
        if (isSyncing) return;
        setIsInternalSyncing(true);
        try {
            console.log('--- Manual Sync Triggered ---');

            // 1. Sync Menu, Users & Settings from Server to Local DB
            await syncData();

            // 2. Sync Pending Orders to Server
            const result = await orderService.processQueue();

            let message = '✅ Sync Complete!\n\n';
            message += '• Menu & Settings updated from server\n';
            message += `• Orders synced: ${result.count}\n`;
            if (result.failed > 0) {
                message += `• Failed to sync: ${result.failed} orders`;
            }

            alert(message);

            // Reload to ensure fresh data from local DB is displayed
            // window.location.reload(); // Removed to prevent logout effect
            console.log('Sync UI refresh complete (no reload)');

        } catch (error) {
            console.error('Manual sync failed:', error);
            alert('❌ Sync failed!\n\nPlease check your internet connection and try again.');
        } finally {
            setIsInternalSyncing(false);
        }
    };
    return (
        <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-2 shadow-sm shrink-0 z-30 font-sans">
            {/* Left Section */}
            <div className="flex items-center gap-2">
                {/* Search Inputs removed for brevity if they weren't used, but they were in original. Keeping them. */}
                {/* New Order Button */}
                <button
                    onClick={() => onNavigate && onNavigate('billing')}
                    className="bg-red-700 hover:bg-red-800 text-white font-bold py-1.5 px-4 rounded-md text-sm shadow-sm transition-colors mx-2"
                >
                    New Order
                </button>

                {/* Search Inputs */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Bill No"
                            className="pl-8 pr-2 py-1.5 w-28 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                        />
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="KOT No"
                            className="pl-8 pr-2 py-1.5 w-28 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                        />
                    </div>
                </div>
            </div>

            {/* Right Section - Icon Bar */}
            <div className="flex items-center gap-1 md:gap-4">

                {/* Trial/Status Badge */}
                {user?.daysLeft !== undefined && user.daysLeft !== null && user?.tenantStatus === 'trial' && (
                    <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 dark:border-orange-800 mr-2 animate-pulse">
                        {user.daysLeft} Trial Days Left
                    </div>
                )}

                {/* Icons Group */}
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                    {/* Network Status & Sync Button */}
                    <div
                        className={`flex flex-col items-center cursor-pointer hover:text-gray-900 group relative ${!isOnline ? 'text-orange-500' : ''}`}
                        onClick={handleSync}
                        title={isOnline ? `${pendingOrders} orders pending sync` : 'Offline Mode'}
                    >
                        {isOnline ? (
                            <CloudUpload className={`w-6 h-6 mb-0.5 ${isSyncing ? 'animate-bounce' : 'group-hover:text-green-600'}`} />
                        ) : (
                            <WifiOff className="w-6 h-6 mb-0.5" />
                        )}
                        <span className="text-[10px]">{isOnline ? 'Sync' : 'Offline'}</span>
                        {pendingOrders > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {pendingOrders}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col items-center cursor-pointer hover:text-gray-900 group">
                        <ToggleLeft className="w-6 h-6 mb-0.5 group-hover:text-blue-600" />
                        <span className="text-[10px]">Item On/Off</span>
                    </div>

                    <div
                        className="flex flex-col items-center cursor-pointer hover:text-gray-900 group"
                        onClick={() => onNavigate && onNavigate('operations')}
                    >
                        <Home className="w-6 h-6 mb-0.5 group-hover:text-blue-600" />
                        <span className="text-[10px]">Store</span>
                    </div>

                    <div
                        className="flex flex-col items-center cursor-pointer hover:text-gray-900 group"
                        onClick={() => onNavigate && onNavigate('online_orders')}
                    >
                        <Wifi className="w-6 h-6 mb-0.5 group-hover:text-green-600" />
                        <span className="text-[10px]">Online</span>
                    </div>

                    <div
                        className="flex flex-col items-center cursor-pointer hover:text-gray-900 group"
                        onClick={() => onNavigate && onNavigate('order_history')}
                    >
                        <FileText className="w-6 h-6 mb-0.5 group-hover:text-blue-600" />
                        <span className="text-[10px]">Orders</span>
                    </div>

                    <div className="flex flex-col items-center cursor-pointer hover:text-gray-900 group">
                        <Clock className="w-6 h-6 mb-0.5" />
                        <span className="text-[10px]">Recent</span>
                    </div>

                    <div className="flex flex-col items-center cursor-pointer hover:text-gray-900 group">
                        <Bell className="w-6 h-6 mb-0.5" />
                        <span className="text-[10px]">Alerts</span>
                    </div>

                    <div
                        className="flex flex-col items-center cursor-pointer hover:text-red-600 group text-red-500"
                        onClick={onLogout}
                    >
                        <LogOut className="w-6 h-6 mb-0.5" />
                        <span className="text-[10px]">Logout</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
