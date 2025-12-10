import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Billing } from './components/Billing';
import { TableManagement } from './components/TableManagement';
import { KotManagement } from './components/KotManagement';
import { OrderHistory } from './components/OrderHistory';

function App() {
    const [activeTab, setActiveTab] = useState('billing'); // Default to Billing
    const [selectedTable, setSelectedTable] = useState(null);
    const [billingKey, setBillingKey] = useState(0);

    const handleTableSelect = (table) => {
        setSelectedTable(table);
        setActiveTab('billing');
        setBillingKey(prev => prev + 1); // Reset when selecting table
    };

    // Reset table when switching away from billing or explicitly to billing via sidebar
    const handleTabChange = (tab) => {
        if (tab === 'billing') {
            // If already billing, or switching to billing, trigger reset
            setBillingKey(prev => prev + 1);
            setSelectedTable(null); // Explicit reset request implies clearing context
        }
        setActiveTab(tab);
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title={activeTab === 'billing' && selectedTable ? `Billing - ${selectedTable.name}` : activeTab === 'billing' ? 'Quick Bill' : activeTab.replace(/_/g, ' ')}
                    onDesktopClick={() => setActiveTab('billing')}
                />

                <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
                    {activeTab === 'dashboard' && <Dashboard />}
                    {activeTab === 'billing' && <Billing resetSignal={billingKey} />}
                    {activeTab === 'kitchen_view' && <KotManagement />}
                    {activeTab === 'order_history' && <OrderHistory />}

                    {/* Placeholder for future POS modules */}
                    {!['dashboard', 'billing', 'tables', 'kitchen_view', 'order_history'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-4xl">
                                🚧
                            </div>
                            <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">
                                {activeTab.replace(/_/g, ' ').toUpperCase()}
                            </h2>
                            <p>Module Under Development</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
