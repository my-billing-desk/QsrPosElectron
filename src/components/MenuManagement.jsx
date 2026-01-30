import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { MenuChannelDashboard } from './MenuChannelDashboard';
import { ItemsView } from './menu/ItemsView';
import { CategoriesView } from './menu/CategoriesView';
import { VariationsView } from './menu/VariationsView';
import { AddonsView } from './menu/AddonsView';
import { TablesView } from './menu/TablesView';
import { TaxesView } from './menu/TaxesView';
import { DiscountsView } from './menu/DiscountsView';
import { SpecialNote } from './menu/SpecialNote';
import { StockHistory } from './reports/StockHistory';

export function MenuManagement() {
    const [activeTab, setActiveTab] = useState('Items');

    const topTabs = [
        'Availability', 'Items', 'Categories', 'Variations', 'Addons', 'Tables/Areas', 'Taxes', 'Stock History', 'Discounts', 'Special Note'
    ];

    // Helper to normalize tab name (removed)
    // const denormalizeTab = (u) => { ... } 

    const [dashboardProps, setDashboardProps] = useState({ initialTab: 'online', initialChannel: 'all' });

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'Availability') {
            setDashboardProps({ initialTab: 'online', initialChannel: 'all' });
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 font-sans text-sm min-h-screen">
            {/* Header Breadcrumb Area */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-gray-400">Menu</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{activeTab}</span>
                </div>
            </div>

            {/* Top Navigation Tabs */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <div className="flex px-4 gap-8 min-w-max">
                    {topTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative overflow-y-auto w-full">
                {activeTab === 'Availability' && (
                    <MenuChannelDashboard
                        key={`${dashboardProps.initialTab}-${dashboardProps.initialChannel}`}
                        initialTab={dashboardProps.initialTab}
                        initialChannel={dashboardProps.initialChannel}
                    />
                )}
                {activeTab === 'Items' && <ItemsView />}
                {activeTab === 'Categories' && <CategoriesView />}
                {activeTab === 'Variations' && <VariationsView />}
                {activeTab === 'Addons' && <AddonsView />}
                {activeTab === 'Tables/Areas' && <TablesView />}
                {activeTab === 'Taxes' && <TaxesView />}
                {activeTab === 'Stock History' && <StockHistory />}
                {activeTab === 'Discounts' && <DiscountsView />}
                {activeTab === 'Special Note' && <SpecialNote />}
            </div>
        </div>
    );
}
