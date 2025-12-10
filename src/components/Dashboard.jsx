import React from 'react';
import { ChefHat, ShoppingBag, Utensils, AlertCircle, Clock } from 'lucide-react';

export function Dashboard() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Welcome, Cashier</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Ready for service. Shift started at 10:00 AM.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Quick Action Cards */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <Utensils className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dine In</h3>
                            <p className="text-sm text-gray-500">Table Service</p>
                        </div>
                    </div>
                    <button className="w-full py-2 bg-orange-50 text-orange-600 font-bold rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        New Order
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-green-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Takeaway</h3>
                            <p className="text-sm text-gray-500">Counter Service</p>
                        </div>
                    </div>
                    <button className="w-full py-2 bg-green-50 text-green-600 font-bold rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                        New Order
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-blue-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ChefHat className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Kitchen Display</h3>
                            <p className="text-sm text-gray-500">View Active KOTs</p>
                        </div>
                    </div>
                    <button className="w-full py-2 bg-blue-50 text-blue-600 font-bold rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        Open KDS
                    </button>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100">Shift Notice</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Please maximize the 'Burger Buns' stock check before peak hours.</p>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100">Shift Duration</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">4 Hours 30 Minutes</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold shadow-sm">
                        End Shift
                    </button>
                </div>
            </div>
        </div>
    );
}
