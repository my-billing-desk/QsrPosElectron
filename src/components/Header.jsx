import React from 'react';
import {
    Search, Menu, Power, Wifi, FileText, Clock,
    PauseCircle, Bell, Headphones, LogOut,
    Home, ToggleLeft, ToggleRight
} from 'lucide-react';

export function Header({ title, onToggleSidebar, onNavigate }) {
    return (
        <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-2 shadow-sm shrink-0 z-30 font-sans">
            {/* Left Section */}
            <div className="flex items-center gap-2">
                {/* Hamburger with Green Dot */}
                <button
                    onClick={onToggleSidebar}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md relative group"
                >
                    <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800"></span>
                </button>

                {/* Logo Area */}
                <div className="flex items-center gap-1 mr-2 select-none">
                    <div className="bg-red-600 text-white p-1 rounded-sm">
                        <Home size={16} fill="currentColor" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-bold text-gray-500">PETPOOJA</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">POSS</span>
                    </div>
                </div>

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
                {/* Icons Group */}
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
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

                    <div className="flex flex-col items-center cursor-pointer hover:text-gray-900 group">
                        <Wifi className="w-6 h-6 mb-0.5 group-hover:text-green-600" />
                        <span className="text-[10px]">Live View</span>
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
                        <PauseCircle className="w-6 h-6 mb-0.5 text-gray-400" />
                        <span className="text-[10px]">Hold</span>
                    </div>

                    <div className="flex flex-col items-center cursor-pointer hover:text-gray-900 group">
                        <Bell className="w-6 h-6 mb-0.5" />
                        <span className="text-[10px]">Alerts</span>
                    </div>

                    <div className="flex flex-col items-center cursor-pointer hover:text-gray-900 group">
                        <Headphones className="w-6 h-6 mb-0.5" />
                        <span className="text-[10px]">Zomato Help</span>
                    </div>

                    <div className="flex flex-col items-center cursor-pointer hover:text-red-600 group text-red-500">
                        <LogOut className="w-6 h-6 mb-0.5" />
                        <span className="text-[10px]">Logout</span>
                    </div>
                </div>

                {/* Support Info */}
                <div className="bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-l-md border-l-4 border-red-500 hidden xl:block">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400 leading-none">07969 223344</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 text-right flex items-center justify-end gap-1 cursor-pointer hover:underline">
                        Request Support <span>&gt;</span>
                    </p>
                </div>
            </div>
        </header>
    );
}
