import StockPurchase from './inventory_modules/StockPurchase';
import PurchaseOrder from './inventory_modules/PurchaseOrder';
import AvailableStock from './inventory_modules/AvailableStock';
import ClosingStock from './inventory_modules/ClosingStock';
import StockTransfer from './inventory_modules/StockTransfer';
import Wastage from './inventory_modules/Wastage';
import InventoryReports from './inventory_modules/InventoryReports';
import StockSummary from './inventory_modules/StockSummary';

import PurchaseReturn from './inventory_modules/PurchaseReturn';

// Re-export components for use in App.jsx
export {
    StockPurchase,
    PurchaseOrder,
    PurchaseReturn,
    AvailableStock,
    ClosingStock,
    StockTransfer,
    Wastage,
    InventoryReports,
    StockSummary
};
