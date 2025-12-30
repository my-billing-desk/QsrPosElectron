import React from 'react';
import { ShoppingCart, FileText, Package, ClipboardCheck, ArrowRightLeft, Trash2, Factory, BarChart2, PieChart } from 'lucide-react';

// Shared Layout Component
const ModuleLayout = ({ title, icon: Icon, children }) => (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 font-sans">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    {Icon && <Icon className="w-8 h-8 text-blue-600" />}
                    {title}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Inventory Management Module</p>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 min-h-[400px]">
            {children || <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Icon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Module Under Development</p>
            </div>}
        </div>
    </div>
);

export const StockPurchase = () => <ModuleLayout title="Stock Purchase" icon={ShoppingCart} />;
export const PurchaseOrder = () => <ModuleLayout title="Purchase Order" icon={FileText} />;
export const AvailableStock = () => <ModuleLayout title="Available Stock" icon={Package} />;
export const ClosingStock = () => <ModuleLayout title="Closing Stock" icon={ClipboardCheck} />;
export const StockTransfer = () => <ModuleLayout title="Stock Transfer" icon={ArrowRightLeft} />;
export const Wastage = () => <ModuleLayout title="Wastage Entry" icon={Trash2} />;
export const Production = () => <ModuleLayout title="Production" icon={Factory} />;
export const InventoryReports = () => <ModuleLayout title="Inventory Reports" icon={BarChart2} />;
export const StockSummary = () => <ModuleLayout title="Stock Summary" icon={PieChart} />;
