import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Billing } from './components/Billing';
import { TableManagement } from './components/TableManagement';
import { KotManagement } from './components/KotManagement';
import { OrderHistory } from './components/OrderHistory';
import { Settings } from './components/Settings';
import { Operations } from './components/Operations';
import { RunningOrders } from './components/RunningOrders';
import { OnlineOrders } from './components/OnlineOrders';
import { useOnlineOrders } from './hooks/useOnlineOrders';
import { Login } from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
function AppContent() {
    useOnlineOrders();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('billing');
    const [selectedTable, setSelectedTable] = useState(null);
    const [billingKey, setBillingKey] = useState(0);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    // Auto-collapse logic based on active tab
    React.useEffect(() => {
        if (activeTab === 'billing') {
            setIsSidebarCollapsed(true);
        } else {
            setIsSidebarCollapsed(false);
        }
    }, [activeTab]);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => !prev);
    };

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

    if (!user) {
        return <Login />;
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
            <Sidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
                onLogout={() => {
                    if (window.confirm("Are you sure you want to logout?")) {
                        logout();
                    }
                }}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Global Header */}
                <Header
                    onToggleSidebar={toggleSidebar}
                    onNavigate={handleTabChange}
                    onLogout={() => {
                        if (window.confirm("Are you sure you want to logout?")) {
                            logout();
                        }
                    }}
                />

                <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex flex-col">
                    {activeTab === 'operations' && <Operations onNavigate={handleTabChange} />}
                    {activeTab === 'dashboard' && <Dashboard />}
                    {activeTab === 'billing' && <Billing resetSignal={billingKey} />}
                    {activeTab === 'kitchen_view' && <KotManagement />}
                    {activeTab === 'online_orders' && <OnlineOrders />}
                    {activeTab === 'running_orders' && <RunningOrders />}
                    {activeTab === 'order_history' && <OrderHistory />}
                    {activeTab === 'print_config' && <Settings />}

                    {/* Placeholder for future POS modules */}
                    {!['operations', 'dashboard', 'billing', 'tables', 'kitchen_view', 'online_orders', 'order_history', 'print_config'].includes(activeTab) && (
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

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
