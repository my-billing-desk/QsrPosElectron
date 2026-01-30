import React, { useState, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Settings } from './components/Settings';
// Lazy Load Heavy Components
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Billing = React.lazy(() => import('./components/Billing'));
const TableManagement = React.lazy(() => import('./components/TableManagement'));
const KotManagement = React.lazy(() => import('./components/KotManagement'));
const OrderHistory = React.lazy(() => import('./components/OrderHistory').then(module => ({ default: module.OrderHistory })));
const Operations = React.lazy(() => import('./components/Operations').then(module => ({ default: module.Operations })));
const RunningOrders = React.lazy(() => import('./components/RunningOrders').then(module => ({ default: module.RunningOrders })));
const OnlineOrders = React.lazy(() => import('./components/OnlineOrders').then(module => ({ default: module.OnlineOrders })));
const Inventory = React.lazy(() => import('./components/Inventory'));
const MenuManagement = React.lazy(() => import('./components/MenuManagement').then(module => ({ default: module.MenuManagement })));
// Lazy load inventory sub-modules
const PosInventory = React.lazy(() => import('./components/PosInventoryModules').then(module => ({ default: () => null }))); // Dummy for preloading? No, let's just use direct imports inside the render or lazy load the container.
// Actually, since they are named exports, we can do:
const StockPurchase = React.lazy(() => import('./components/PosInventoryModules').then(module => ({ default: module.StockPurchase })));
const PurchaseOrder = React.lazy(() => import('./components/PosInventoryModules').then(module => ({ default: module.PurchaseOrder })));
const AvailableStock = React.lazy(() => import('./components/PosInventoryModules').then(module => ({ default: module.AvailableStock })));
const ClosingStock = React.lazy(() => import('./components/PosInventoryModules').then(module => ({ default: module.ClosingStock })));
const StockTransfer = React.lazy(() => import('./components/PosInventoryModules').then(module => ({ default: module.StockTransfer })));
const Wastage = React.lazy(() => import('./components/PosInventoryModules').then(module => ({ default: module.Wastage })));
const InventoryReports = React.lazy(() => import('./components/PosInventoryModules').then(module => ({ default: module.InventoryReports })));
// const StockSummary = React.lazy(() => import('./components/PosInventoryModules').then(module => ({ default: module.StockSummary })));
const PurchaseReturn = React.lazy(() => import('./components/PosInventoryModules').then(module => ({ default: module.PurchaseReturn })));

// import { useOnlineOrders } from './hooks/useOnlineOrders'; // Disabled auto-polling
import { useSync } from './hooks/useSync';
import { usePOSDeviceRegistration } from './hooks/usePOSDeviceRegistration';
import { Login } from './components/Login';
import { TenantMapping } from './components/TenantMapping';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { HoldOrdersSlider } from './components/HoldOrdersSlider';
import { Toaster } from 'react-hot-toast';

// Loading Component
const LoadingFallback = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-pulse">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Loading Module...</p>
    </div>
);

function AppContent() {
    const { user, logout } = useAuth();
    // useOnlineOrders(); // Disabled auto-polling of online orders
    useSync();
    usePOSDeviceRegistration(); // Register this POS device
    const [mappedTenantId, setMappedTenantId] = useState(localStorage.getItem('pos_tenant_id'));
    const [isTouchMode, setIsTouchMode] = useState(localStorage.getItem('pos_touch_mode') === 'true');
    const [activeTab, setActiveTab] = useState('billing');
    const [selectedTable, setSelectedTable] = useState(null);
    const [billingKey, setBillingKey] = useState(0);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);



    // HoldSlider State
    const [isHoldSliderOpen, setIsHoldSliderOpen] = useState(false);
    const [restoredOrder, setRestoredOrder] = useState(null);
    React.useEffect(() => {
        if (activeTab === 'billing') {
            setIsSidebarCollapsed(true);
        } else {
            setIsSidebarCollapsed(false);
        }
    }, [activeTab]);

    const handleTenantMap = (id, touchMode) => {
        setMappedTenantId(id);
        setIsTouchMode(touchMode);
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => !prev);
    };

    const handleRestoreOrder = (order) => {
        setRestoredOrder(order);
        setIsHoldSliderOpen(false);
        setActiveTab('billing');
        // Force refresh billing if already active
        if (activeTab === 'billing') {
            setBillingKey(prev => prev + 1);
        }
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

    if (!mappedTenantId) {
        return <TenantMapping onMap={handleTenantMap} />;
    }

    if (!user) {
        return <Login isTouchMode={isTouchMode} />;
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
                    user={user}
                    onToggleSidebar={toggleSidebar}
                    onNavigate={handleTabChange}
                    onLogout={() => {
                        if (window.confirm("Are you sure you want to logout?")) {
                            logout();
                        }
                    }}
                />

                <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex flex-col">
                    <Suspense fallback={<LoadingFallback />}>
                        {activeTab === 'operations' && <Operations onNavigate={handleTabChange} />}
                        {activeTab === 'dashboard' && <Dashboard />}
                        {activeTab === 'billing' && <Billing resetSignal={billingKey} restoredOrder={restoredOrder} onOrderRestored={() => setRestoredOrder(null)} />}
                        {activeTab === 'online_orders' && <OnlineOrders />}
                        {activeTab === 'running_orders' && <RunningOrders />}
                        {activeTab === 'order_history' && <OrderHistory />}
                        {activeTab === 'print_config' && <Settings />}
                        {activeTab === 'inventory' && <Inventory />}
                        {activeTab === 'stock_purchase' && <StockPurchase />}
                        {activeTab === 'purchase_order' && <PurchaseOrder />}
                        {activeTab === 'available_stock' && <AvailableStock />}
                        {activeTab === 'closing_stock' && <ClosingStock />}
                        {activeTab === 'stock_transfer' && <StockTransfer />}
                        {activeTab === 'wastage' && <Wastage />}
                        {activeTab === 'inventory_reports' && <InventoryReports />}
                        {/* {activeTab === 'stock_summary' && <StockSummary />} */}
                        {activeTab === 'purchase_return' && <PurchaseReturn />}
                        {activeTab === 'menu_management' && <MenuManagement />}
                    </Suspense>

                    {/* Placeholder for future POS modules */}
                    {!['operations', 'dashboard', 'billing', 'tables', 'kitchen_view', 'online_orders', 'order_history', 'print_config', 'inventory',
                        'stock_purchase', 'purchase_order', 'purchase_return', 'available_stock', 'closing_stock', 'stock_transfer', 'wastage', 'inventory_reports', 'stock_summary', 'menu_management'
                    ].includes(activeTab) && (
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

            <HoldOrdersSlider
                isOpen={isHoldSliderOpen}
                onClose={() => setIsHoldSliderOpen(false)}
                onRestore={handleRestoreOrder}
            />
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <Toaster position="top-right" />
                <AppContent />
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
