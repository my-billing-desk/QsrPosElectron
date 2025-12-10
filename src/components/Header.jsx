import React from 'react';
import { Search, Bell, User, Monitor } from 'lucide-react';

export function Header({ title, onDesktopClick }) {
    return (
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 transition-colors duration-300">
            <h2 className="text-xl font-bold capitalize text-gray-800 dark:text-gray-100">{title}</h2>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-orange-500/20 w-64 text-sm"
                    />
                </div>

                <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                </button>

                <button
                    onClick={onDesktopClick}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden md:block"
                    title="Open Desktop App"
                >
                    <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Admin User</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Manager</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                        <User className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </header>
    );
}
