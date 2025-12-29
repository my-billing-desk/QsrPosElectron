import React, { useState, useEffect, useRef } from 'react';
import { menuService, orderService, settingsService } from '../services/api';
import { Search, Plus, Minus, Trash2, ShoppingBag, Bike, Utensils, Printer, ChefHat, Edit2, User, Tag, Save, CheckCircle, PauseCircle, ClipboardList } from 'lucide-react';
import { SpecialNoteModal } from './SpecialNoteModal';
import { ItemCustomizationModal } from './ItemCustomizationModal';
import { UpsellReminderBanner, DEFAULT_UPSELL_REMINDER } from './UpsellReminderBanner';
import { DiscountModal } from './DiscountModal';
import { CartItem } from './CartItem';
import { CustomerDetailsSection } from './CustomerDetailsSection';




const generateBillHtml = (order, settings) => {
    const formatCurrency = (amount) => Number(amount).toFixed(2);
    const taxableAmount = order.totalAmount - order.taxAmount - (order.roundOff || 0);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page { margin: 0; }
            body { 
                font-family: 'Arial', 'Helvetica', sans-serif; 
                width: auto;
                margin: 0; 
                padding: 0; 
                background: white; 
                color: black;
                font-size: 11px; /* Comparable to thermal default */
                line-height: 1.3;
            }
            .container { 
                width: 68mm; /* Reduced width to prevent cutoff */
                margin: 0; /* Fully left aligned */
                padding-right: 4mm; /* Increased padding to move text left */
                padding-bottom: 20px;
                box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            
            .header { margin-bottom: 5px; }
            .store-name { font-size: 16px; font-weight: 800; margin-bottom: 4px; }
            .store-info { font-size: 11px; margin-bottom: 2px; }
            
            .divider { border-top: 1px solid black; margin: 4px 0; }
            .divider-dashed { border-top: 1px dashed black; margin: 4px 0; }
            
            .metadata-grid { display: flex; flex-wrap: wrap; margin-bottom: 5px; }
            .meta-item { width: 50%; display: flex; margin-bottom: 2px; }
            .meta-label { font-weight: bold; margin-right: 5px; }
            
            .table-header { display: flex; font-weight: bold; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 0; margin: 5px 0; font-size: 11px; }
            .col-item { flex: 2; text-align: left; padding-right: 2px; }
            .col-qty { width: 15%; text-align: center; }
            .col-price { width: 20%; text-align: right; }
            .col-amt { width: 20%; text-align: right; }

            .item-row { display: flex; padding: 3px 0; }
            .item-name { flex: 2; text-align: left; padding-right: 2px; word-wrap: break-word; }
            
            .addon-row, .note-row { display: flex; font-size: 10px; color: #333; margin-top: -2px; padding-bottom: 2px; }
            .note-row { font-style: italic; color: #555; }
            
            .totals-section { margin-top: 5px; border-top: 1px solid black; padding-top: 5px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            
            .grand-total-row { 
                display: flex; 
                justify-content: space-between; 
                border-top: 1px solid black; 
                border-bottom: 1px solid black; 
                padding: 6px 0; 
                margin-top: 5px; 
                font-size: 14px; 
                font-weight: 800; 
            }
            
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header text-center">
                <!-- <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">LOGO</div> -->
                <div class="store-name uppercase">${settings.store_name || 'QSR STORE'}</div>
                <div class="store-info">${settings.store_address || ''}</div>
                <div class="store-info">${settings.store_phone ? 'Ph: ' + settings.store_phone : ''}</div>
                ${settings.gst_no ? `<div class="store-info bold">GSTIN: ${settings.gst_no}</div>` : ''}
            </div>

            <div class="divider"></div>

            <div class="metadata-grid">
                <div class="meta-item"><span class="meta-label">Date:</span> <span>${new Date().toLocaleDateString('en-GB')}</span></div>
                <div class="meta-item text-right" style="justify-content: flex-end;"><span class="meta-label">Time:</span> <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div class="meta-item"><span class="meta-label">Bill No:</span> <span>${order.orderNumber ? order.orderNumber.slice(-5) : '---'}</span></div>
                <div class="meta-item text-right" style="justify-content: flex-end;"><span class="meta-label">Type:</span> <span class="uppercase">${order.type}</span></div>
                ${settings.cashier_name ? `<div class="meta-item"><span class="meta-label">Cashier:</span> <span>${settings.cashier_name}</span></div>` : ''}
            </div>

            <div class="table-header">
                <div class="col-item">Item</div>
                <div class="col-qty">Qty</div>
                <div class="col-price">Price</div>
                <div class="col-amt">Amount</div>
            </div>

            <div class="items-body">
                ${order.items.map(item => `
                    <div class="item-row">
                        <div class="item-name">
                            ${item.itemName} 
                            ${item.variantName ? `<br><span style="font-size:10px; font-weight:normal;">(${item.variantName})</span>` : ''}
                        </div>
                        <div class="col-qty">${item.quantity}</div>
                        <div class="col-price">${formatCurrency(item.price)}</div>
                        <div class="col-amt">${formatCurrency(item.price * item.quantity)}</div>
                    </div>
                    ${(item.addons || []).map(a => `
                        <div class="addon-row">
                            <div class="item-name" style="padding-left: 10px;">+ ${a.name}</div>
                            <div class="col-qty">1</div>
                            <div class="col-price">${formatCurrency(a.price)}</div>
                            <div class="col-amt">${formatCurrency(a.price)}</div>
                        </div>
                    `).join('')}
                    ${item.specialNote ? `
                         <div class="note-row">
                            <div class="item-name" style="padding-left: 10px;">Note: ${item.specialNote}</div>
                        </div>
                    ` : ''}
                `).join('')}
            </div>

            <div class="totals-section">
                <div class="total-row">
                    <span>Total Qty: ${order.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                    <span class="bold">Sub Total: ${formatCurrency(order.subTotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
                </div>
                
                ${order.taxAmount > 0 ? `
                    <div class="total-row" style="font-size: 10px;">
                        <span>CGST @ ${(parseFloat(settings.gst_percentage || 5) / 2).toFixed(1)}%</span>
                        <span>${formatCurrency(order.taxAmount / 2)}</span>
                    </div>
                    <div class="total-row" style="font-size: 10px;">
                        <span>SGST @ ${(parseFloat(settings.gst_percentage || 5) / 2).toFixed(1)}%</span>
                        <span>${formatCurrency(order.taxAmount / 2)}</span>
                    </div>
                ` : ''}

                ${order.containerCharge > 0 ? `
                    <div class="total-row" style="font-size: 10px;">
                        <span>Packing Charges</span>
                        <span>${formatCurrency(order.containerCharge)}</span>
                    </div>
                ` : ''}

                ${Math.abs(order.roundOff) > 0.001 ? `
                    <div class="total-row" style="font-size: 10px;">
                        <span>Round Off</span>
                        <span>${order.roundOff > 0 ? '+' : ''}${formatCurrency(order.roundOff)}</span>
                    </div>
                ` : ''}

                <div class="grand-total-row">
                    <span>Grand Total</span>
                    <span>₹ ${formatCurrency(Math.round(order.totalAmount))}</span>
                </div>
                
                <!-- 
                <div class="total-row" style="font-size: 11px;">
                    <span>Paid via: Cash/UPI</span>
                </div>
                -->
            </div>

            <div class="footer">
                ${settings.fssai_no ? `<p>FSSAI Lic No. ${settings.fssai_no}</p>` : ''}
                <p>Thank You, Visit Again!!!</p>
                <p style="margin-top: 5px; font-size: 9px; color: #666;">Powered by QSR POS</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const generateKotHtml = (order) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page { margin: 0; }
            body { 
                font-family: 'Arial', 'Helvetica', sans-serif; 
                width: 66mm; /* Reduced to shift content left */
                margin: 0; 
                padding: 0;
                padding-right: 4mm;
                background: white; 
                color: black;
                font-size: 12px;
                line-height: 1.3;
            }
            .container { 
                width: 100%;
                margin: 0;
                padding: 10px 0;
                padding-bottom: 20px;
                box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .header { margin-bottom: 10px; border-bottom: 2px solid black; padding-bottom: 5px; }
            .meta-item { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 14px; font-weight: bold; }
            .item-row { display: flex; padding: 4px 0; border-bottom: 1px dashed #999; }
            .item-qty { width: 15%; font-weight: bold; font-size: 14px; }
            .item-name { flex: 1; font-weight: bold; font-size: 14px; }
            .addon-row, .note-row { margin-left: 15%; font-size: 11px; color: #333; }
            .note-row { font-weight: bold; font-style: italic; font-size: 12px; margin-top: 2px; border: 1px solid black; padding: 2px; display: inline-block;}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header text-center">
                <div style="font-size: 18px; font-weight: 900;">KITCHEN TICKET</div>
                <div class="uppercase bold">${order.type}</div>
            </div>

            <div class="meta-item">
                <span>Bill No: ${order.orderNumber ? order.orderNumber.slice(-5) : '---'}</span>
                <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="meta-item">
                <span>Date: ${new Date().toLocaleDateString('en-GB')}</span>
            </div>

            <div style="border-bottom: 2px solid black; margin: 5px 0;"></div>

            ${order.items.map(item => `
                <div class="item-row">
                    <div class="item-qty">${item.quantity}</div>
                    <div class="item-name">
                        ${item.itemName} 
                        ${item.variantName ? `<span style="font-size:12px; font-weight:normal;">(${item.variantName})</span>` : ''}
                    </div>
                </div>
                ${(item.addons || []).map(a => `
                    <div class="addon-row">+ ${a.name}</div>
                `).join('')}
                ${item.specialNote ? `
                    <div class="addon-row">
                        <span class="note-row">${item.specialNote}</span>
                    </div>
                ` : ''}
            `).join('')}

            <div style="border-top: 2px solid black; margin-top: 10px; padding-top: 10px; text-align: center; font-weight: bold;">
                Total Items: ${order.items.reduce((acc, i) => acc + i.quantity, 0)}
            </div>
        </div>
    </body>
    </html>
    `;
};

export function Billing({ resetSignal }) {
    const [cart, setCart] = useState([]);
    const [orderType, setOrderType] = useState('dine-in');
    const [activeCategory, setActiveCategory] = useState('All');

    // Data State
    const [categories, setCategories] = useState(['All']);
    const [items, setItems] = useState([]);
    const [settings, setSettings] = useState({ gst_mode: 'exclusive', gst_percentage: '5' });
    const [isLoading, setIsLoading] = useState(true);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    // Customization State
    const [customizingItem, setCustomizingItem] = useState(null);
    const [editingCartItem, setEditingCartItem] = useState(null); // Cart item being edited (null = new item)
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedAddons, setSelectedAddons] = useState({}); // { groupId: [addonId, addonId] }
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [incomingOrders, setIncomingOrders] = useState([]);
    const processedIdsRef = useRef(new Set());

    // Held Orders State
    const [heldOrdersModalOpen, setHeldOrdersModalOpen] = useState(false);
    const [heldOrders, setHeldOrders] = useState([]);

    // Special Note State
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [noteTargetIndex, setNoteTargetIndex] = useState(null);
    // Customer Lookup State
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);

    // Discount/Coupon State
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discount, setDiscount] = useState(0);

    // Order Workflow Step
    const [workflowStep, setWorkflowStep] = useState('cart'); // 'customer' or 'cart' - set to 'cart' to skip customer lookup during dev

    // Upsell Reminders
    const [upsellReminders, setUpsellReminders] = useState([DEFAULT_UPSELL_REMINDER]);


    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Handle Reset Signal
    useEffect(() => {
        setCart([]);
        setOrderType('dine-in');
        setCustomizingItem(null);
        setWorkflowStep('customer');
        setCurrentCustomer(null);
        setCustomerPhone('');
        setCustomerName('');
        setAppliedCoupon(null);
        setDiscount(0);
        // Optionally reset category too
        setActiveCategory('All');
    }, [resetSignal]);

    // Polling for Scan & Order Remote Printing
    const isPollingRef = useRef(false);

    // useEffect(() => {
    //     // Polling removed to prevent continuous fetch errors. 
    //     // Scan & Order printing should be triggered by specific events or manual refresh if needed.
    //     //     const pollOrders = async () => {
    //     //         if (isPollingRef.current) return;
    //     //         isPollingRef.current = true;
    //     //
    //     //         try {
    //     //             // Garbage collection logic...
    //     //             
    //     //             // 1. Check for Pending KOTs -> AUTO ACCEPT & PRINT
    //     //             // Logic commented out to stop auto-print loop errors.
    //     //             
    //     //             // 2. Check for Bill Print Requests
    //     //             // Logic commented out to stop auto-print loop errors.
    //     //             
    //     //         } catch (e) {
    //     //             // console.warn("Polling checking...", e.message);
    //     //         } finally {
    //     //             isPollingRef.current = false;
    //     //             // timeoutId = setTimeout(pollOrders, 5000); // 5s interval
    //     //         }
    //     //     };
    //     //
    //     //     // pollOrders();
    //     //     return () => clearTimeout(timeoutId);
    // }, [settings]);

    const handleAcceptOrder = async (order) => {
        if (!order || !order.id) return;
        processedIdsRef.current.add(order.id);

        // Skip UI Incoming Orders state, directly print (Auto-mode)
        try {
            await handleRemotePrint(order, 'KOT');
        } catch (err) {
            console.error("Auto-Accept failed", err);
        }
    };

    const handleRemotePrint = async (order, type) => {
        if (!window.electronAPI) return;

        try {
            if (type === 'KOT') {
                const stationMappingJson = localStorage.getItem('pos_station_mapping');
                const stationMapping = stationMappingJson ? JSON.parse(stationMappingJson) : {};
                const legacyKotPrinter = localStorage.getItem('pos_kot_printer_name') || localStorage.getItem('pos_printer_name');
                const isRoutingEnabled = localStorage.getItem('pos_kitchen_routing_enabled') === 'true';

                // Group items by station
                const itemsByStation = {};
                order.items.forEach(item => {
                    const station = item.Category?.station || 'Kitchen';
                    if (!itemsByStation[station]) itemsByStation[station] = [];
                    itemsByStation[station].push(item);
                });

                const stations = Object.keys(itemsByStation);

                if (isRoutingEnabled && Object.keys(stationMapping).length > 0 && stations.length > 0) {
                    // Multi-printer Routing
                    for (const station of stations) {
                        const printerName = stationMapping[station] || legacyKotPrinter; // Fallback to default if station not mapped
                        if (printerName) {
                            const stationItems = itemsByStation[station];
                            // Create partial order for print
                            const partialOrder = { ...order, items: stationItems };
                            const html = generateKotHtml(partialOrder); // Re-use existing generator
                            await window.electronAPI.printBill({ printerName, htmlContent: html });
                            console.log(`Printed KOT for Station: ${station} to ${printerName}`);
                        } else {
                            console.warn(`No printer found for station: ${station}`);
                        }
                    }
                } else {
                    // Legacy Mode (Single Printer)
                    if (legacyKotPrinter) {
                        const html = generateKotHtml(order);
                        await window.electronAPI.printBill({ printerName: legacyKotPrinter, htmlContent: html });
                    } else {
                        showNotification("No Printer Configured!", "error");
                        return; // Exit if no printer
                    }
                }

                await orderService.update(order.id, {
                    isKotPrinted: true,
                    status: 'preparing'
                });
                showNotification(`Auto-Printed KOT #${order.orderNumber.slice(-4)}`);

            } else if (type === 'BILL') {
                const billPrinter = localStorage.getItem('pos_printer_name');
                if (billPrinter) {
                    let finalOrder = order;
                    let relatedOrders = [order];

                    // Aggregation Logic (Final Bill with all KOTs)
                    if (order.tableNumber) {
                        const startOfDay = new Date();
                        startOfDay.setHours(0, 0, 0, 0);
                        try {
                            const res = await orderService.getAll({
                                tableNumber: order.tableNumber,
                                startDate: startOfDay.toISOString()
                            });

                            if (res.data && res.data.length > 1) {
                                // Filter orders that are NOT cancelled
                                const validOrders = res.data.filter(o => o.status !== 'cancelled');
                                relatedOrders = validOrders;

                                // Aggregate
                                const combinedItems = [];
                                let totalAmount = 0, taxAmount = 0, subTotal = 0, roundOff = 0;

                                validOrders.forEach(o => {
                                    totalAmount += Number(o.totalAmount || 0);
                                    taxAmount += Number(o.taxAmount || 0);
                                    subTotal += Number(o.subTotal || 0);
                                    roundOff += Number(o.roundOff || 0);

                                    (o.items || []).forEach(item => {
                                        // Simple merge by name + variant
                                        const existing = combinedItems.find(ci =>
                                            ci.itemName === item.itemName &&
                                            ci.variantName === item.variantName &&
                                            JSON.stringify(ci.addons) === JSON.stringify(item.addons)
                                        );
                                        if (existing) {
                                            existing.quantity += item.quantity;
                                        } else {
                                            combinedItems.push({ ...item });
                                        }
                                    });
                                });

                                finalOrder = {
                                    ...order,
                                    items: combinedItems,
                                    totalAmount,
                                    taxAmount,
                                    subTotal,
                                    roundOff,
                                    orderNumber: validOrders.map(o => o.orderNumber.slice(-4)).join(', ')
                                };
                            }
                        } catch (aggErr) {
                            console.error("Aggregation failed", aggErr);
                        }
                    }

                    const html = generateBillHtml(finalOrder, settings);
                    await window.electronAPI.printBill({ printerName: billPrinter, htmlContent: html });

                    // Clear flag for ALL related orders
                    for (const o of relatedOrders) {
                        if (o.printBillRequested) {
                            await orderService.update(o.id, { printBillRequested: false });
                        }
                    }
                    showNotification(`Final Bill Printed for Table ${order.tableNumber}`);
                }
            }
        } catch (err) {
            console.error(`Remote Print Error (${type}):`, err);
        }
    };

    const loadData = async () => {
        setIsLoading(true);

        try {
            // LOCAL-FIRST: These calls read from local SQLite DB first
            const [catRes, itemRes, settingsRes] = await Promise.all([
                menuService.getCategories(),
                menuService.getItems(),
                settingsService.getSettings()
            ]);

            // Transform categories
            const catData = Array.isArray(catRes.data) ? catRes.data : [];
            const catNames = ['All', ...catData.map(c => c.name)];
            setCategories(catNames);

            // Settings
            if (settingsRes.data) {
                setSettings(settingsRes.data);
            }

            const itemData = Array.isArray(itemRes.data) ? itemRes.data : [];

            // Check if we need to sync (no local data)
            if (itemData.length === 0 && catData.length === 0) {
                setIsOfflineMode(true); // Reuse this flag to show "needs sync" state
                showNotification("No menu data found. Please click Sync to download menu.", "error");
            } else {
                setIsOfflineMode(false);
                setItems(itemData.map(i => {
                    // Merge Item-specific variants with Group Master variants
                    const groupVariants = i.variationGroups ? i.variationGroups.flatMap(g => g.Variants || []) : [];
                    const itemVariants = i.Variants || [];

                    const variantMap = new Map();
                    groupVariants.forEach(v => variantMap.set(v.name, v));
                    itemVariants.forEach(v => variantMap.set(v.name, v));

                    const allVariants = Array.from(variantMap.values());

                    return {
                        ...i,
                        Variants: allVariants,
                        type: i.isVeg ? 'Veg' : 'Non-Veg',
                        color: 'bg-white'
                    };
                }));
                console.log('[LOCAL-FIRST] Loaded', itemData.length, 'items from local database');
            }
        } catch (error) {
            console.error("Failed to load data from local DB:", error);
            showNotification("Error loading menu. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const initiateAddToCart = (item) => {
        const hasVariants = item.Variants && item.Variants.length > 0;
        const hasAddons = item.addonGroups && item.addonGroups.length > 0;

        if (hasVariants || hasAddons) {
            setCustomizingItem(item);
            // Default variant selection
            if (hasVariants) setSelectedVariant(item.Variants[0]);
            else setSelectedVariant(null);
            setSelectedAddons({});
        } else {
            addToCart(item, null, []);
        }
    };

    const handleAddonToggle = (group, addon) => {
        setSelectedAddons(prev => {
            const current = prev[group.id] || [];
            const isMulti = group.maxSelection > 1;

            if (isMulti) {
                if (current.includes(addon.id)) {
                    return { ...prev, [group.id]: current.filter(id => id !== addon.id) };
                } else {
                    return { ...prev, [group.id]: [...current, addon.id] };
                }
            } else {
                // Single select
                return { ...prev, [group.id]: [addon.id] };
            }
        });
    };

    const confirmCustomization = () => {
        if (!customizingItem) return;

        // Flatten selected addons
        const addonsList = [];
        if (customizingItem.addonGroups) {
            customizingItem.addonGroups.forEach(g => {
                const selectedIds = selectedAddons[g.id] || [];
                selectedIds.forEach(id => {
                    const addon = g.Addons.find(a => a.id === id);
                    if (addon) addonsList.push(addon);
                });
            });
        }

        saveCartItem(customizingItem, selectedVariant, addonsList);
        setCustomizingItem(null);
        setSelectedVariant(null);
        setSelectedAddons({});
        setEditingCartItem(null);
    };

    const addToCart = (item, variant, addons = [], qty = 1, specialNote = '') => {
        setCart(prev => {
            // Generate unique signature for "same item" check
            // We include specialNote in signature if we want items with different notes to be separate? 
            // Usually notes make them separate items in KOT.
            const signature = `${item.id}-${variant ? variant.id : 'base'}-${addons.map(a => a.id).sort().join(',')}-${specialNote}`;

            const existingIndex = prev.findIndex(i => i.signature === signature);
            if (existingIndex >= 0) {
                const newCart = [...prev];
                newCart[existingIndex].qty += qty;
                return newCart;
            }

            // Calculate base price
            let finalPrice = variant ? variant.price : item.price;
            // Add addons price
            const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
            finalPrice += addonsTotal;

            return [...prev, {
                ...item,
                signature,
                qty: qty,
                variant: variant,
                selectedAddons: addons,
                displayPrice: finalPrice,
                price: finalPrice,
                specialNote: specialNote
            }];
        });
    };

    const handlePhoneChange = async (val) => {
        const phone = val.replace(/\D/g, '').slice(0, 10);
        setCustomerPhone(phone);

        if (phone.length === 10) {
            setLookupLoading(true);
            try {
                const token = localStorage.getItem('pos_token');
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/customers/lookup/${phone}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentCustomer(data);
                    setCustomerName(data.customer.name || '');
                    showNotification(`Welcome back, ${data.customer.name || 'Valued Customer'}!`);
                } else {
                    // New Customer
                    setCurrentCustomer({ isNew: true, customer: { mobileNumber: phone, name: '', customerTier: 'regular' } });
                }
            } catch (err) {
                console.error("Lookup failed:", err);
            } finally {
                setLookupLoading(false);
            }
        } else {
            setCurrentCustomer(null);
            setCustomerName('');
        }
    };

    const updateQty = (signature, delta) => {
        setCart(prev => prev.map(item => {
            if (item.signature === signature) {
                return { ...item, qty: Math.max(1, item.qty + delta) };
            }
            return item;
        }));
    };

    const removeItem = (signature) => {
        setCart(prev => prev.filter(i => i.signature !== signature));
    };

    // Edit Cart Item - Opens customization modal with current selections
    const editCartItem = (cartItemData) => {
        // Find the original item from items list
        const originalItem = items.find(i => i.id === cartItemData.itemId);
        if (!originalItem) {
            showNotification("Item not found for editing", "error");
            return;
        }

        // Store reference to the cart item being edited
        setEditingCartItem(cartItemData);

        // Pre-select the variant
        if (cartItemData.variantName && originalItem.Variants) {
            const variant = originalItem.Variants.find(v => v.name === cartItemData.variantName);
            setSelectedVariant(variant || null);
        } else {
            setSelectedVariant(null);
        }

        // Pre-select addons
        if (cartItemData.addons && cartItemData.addons.length > 0 && originalItem.addonGroups) {
            const preSelectedAddons = {};
            originalItem.addonGroups.forEach(group => {
                const selectedFromGroup = cartItemData.addons
                    .filter(a => group.Addons?.some(ga => ga.id === a.id))
                    .map(a => a.id);
                if (selectedFromGroup.length > 0) {
                    preSelectedAddons[group.id] = selectedFromGroup;
                }
            });
            setSelectedAddons(preSelectedAddons);
        } else {
            setSelectedAddons({});
        }

        // Open the customization modal
        setCustomizingItem(originalItem);
    };

    // Update addToCart to handle editing
    const saveCartItem = (item, variant, addons = [], qty = 1, specialNote = '') => {
        if (editingCartItem) {
            // Update existing item
            const newSignature = `${item.id}-${variant ? variant.id : 'base'}-${addons.map(a => a.id).sort().join(',')}-${specialNote}`;

            let finalPrice = variant ? variant.price : item.price;
            const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
            finalPrice += addonsTotal;

            setCart(prev => prev.map(cartItem => {
                if (cartItem.signature === editingCartItem.id) {
                    return {
                        ...item,
                        signature: newSignature,
                        qty: cartItem.qty, // Keep existing quantity
                        variant: variant,
                        selectedAddons: addons,
                        displayPrice: finalPrice,
                        price: finalPrice,
                        specialNote: specialNote
                    };
                }
                return cartItem;
            }));

            setEditingCartItem(null);
            showNotification("Item updated!");
        } else {
            // Add new item (existing logic)
            addToCart(item, variant, addons, qty, specialNote);
        }
    };

    // Special Note Handlers
    const openSpecialNoteModal = (index) => {
        setNoteTargetIndex(index);
        setNoteModalOpen(true);
    };

    const handleSpecialNoteSelect = (note) => {
        if (noteTargetIndex !== null) {
            setCart(prev => {
                const newCart = [...prev];
                newCart[noteTargetIndex] = { ...newCart[noteTargetIndex], specialNote: note };
                return newCart;
            });
        }
    };

    // Calculation Logic
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const gstPercent = parseFloat(settings.gst_percentage) || 0;
    const isInclusive = settings.gst_mode === 'inclusive';

    let taxAmount = 0;
    let finalTotal = 0;
    let containerCharge = 0;

    // Container Charge
    if (orderType === 'takeaway') {
        const chargePerItem = parseFloat(settings.container_charge || 0);
        // Count total qty
        const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
        containerCharge = totalItems * chargePerItem;
    }

    if (isInclusive) {
        finalTotal = subtotal + containerCharge;
        taxAmount = subtotal - (subtotal / (1 + (gstPercent / 100)));
    } else {
        taxAmount = subtotal * (gstPercent / 100);
        finalTotal = subtotal + taxAmount + containerCharge;
    }

    // Apply Rounding based on setting
    // default is 'false' (do round off) if not set to 'true' explicitly?
    // User requested: "Yes or No" for accepting decimal.
    // If accept_decimal == 'true' -> Keep decimal
    // If accept_decimal != 'true' -> Round Off

    let roundOffValue = 0;
    const billTotal = finalTotal; // Total before discount and rounding adjustments

    if (settings.accept_decimal !== 'true') {
        const roundedTotal = Math.round(finalTotal);
        roundOffValue = roundedTotal - finalTotal;
        finalTotal = roundedTotal;
    }

    // Apply discount
    finalTotal = Math.max(0, finalTotal - discount);

    // Held Orders Logic
    const loadHeldOrders = async () => {
        if (!window.electronAPI) return;
        try {
            const allOrders = await window.electronAPI.getAllLocalOrders();
            const held = allOrders.filter(o => o.status === 'hold');
            setHeldOrders(held);
        } catch (err) {
            console.error("Failed to load held orders:", err);
        }
    };

    useEffect(() => {
        loadHeldOrders();
    }, []);

    const handleHoldOrder = async () => {
        if (cart.length === 0) return;

        try {
            const tempId = `HOLD-${Date.now()}`;
            const heldOrder = {
                id: tempId,
                items: cart, // Store full cart items array to preserve editability
                totalAmount: finalTotal,
                taxAmount,
                subTotal: subtotal,
                type: orderType,
                orderNumber: tempId, // Temporary ID
                customer: currentCustomer,
                customerName: customerName || (currentCustomer?.customer?.name),
                customerPhone: customerPhone,
                createdAt: new Date().toISOString()
            };

            if (window.electronAPI) {
                await window.electronAPI.saveOrder(heldOrder, 'hold');
                showNotification("Order put on HOLD", "success");
                setCart([]);
                setCustomerName('');
                setCustomerPhone('');
                setCurrentCustomer(null);
                loadHeldOrders();
            } else {
                showNotification("Electron API not available", "error");
            }
        } catch (err) {
            console.error("Failed to hold order:", err);
            showNotification("Failed to hold order", "error");
        }
    };

    const resumeHeldOrder = async (order) => {
        setCart(order.items || []); // Restore items
        // Restore customer info
        if (order.customer) {
            setCurrentCustomer(order.customer);
            setCustomerName(order.customerName || '');
            setCustomerPhone(order.customerPhone || '');
        } else if (order.customerPhone) {
            setCustomerPhone(order.customerPhone);
            setCustomerName(order.customerName || '');
            handlePhoneChange(order.customerPhone); // Try to fetch fresh details
        }

        setOrderType(order.type || 'dine-in');

        // Remove from DB (consume it)
        if (window.electronAPI && order.id) {
            await window.electronAPI.deleteOrder(order.id);
            loadHeldOrders();
        }

        showNotification("Held order resumed!");
        setHeldOrdersModalOpen(false);
    };

    const handleDiscardHeldOrder = async (order) => {
        if (!window.confirm("Are you sure you want to discard this held order?")) return;

        if (window.electronAPI && order.id) {
            await window.electronAPI.deleteOrder(order.id);
            showNotification("Held order discarded");
            loadHeldOrders();
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        try {
            const orderData = {
                items: cart.map(i => ({
                    itemId: i.id,
                    itemName: i.name,
                    price: i.price,
                    quantity: i.qty,
                    variantId: i.variant?.id,
                    variantName: i.variant?.name,
                    addons: i.selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
                    specialNote: i.specialNote // Include special note
                })),
                totalAmount: finalTotal, // Already calculated with GST
                taxAmount: taxAmount,
                roundOff: roundOffValue,
                subTotal: subtotal, // Add subtotal
                containerCharge: containerCharge, // Add container charge
                type: orderType,
                orderNumber: `ORD-${Date.now()}`
            };

            const response = await orderService.createOrder(orderData);

            showNotification("Order Placed Successfully!");

            // Print Logic
            if (window.electronAPI) {
                // 1. Customer Bill
                const billPrinter = localStorage.getItem('pos_printer_name');
                if (billPrinter) {
                    try {
                        const billHtml = generateBillHtml({
                            ...orderData,
                            orderId: response.data?.id || orderData.orderNumber
                        }, settings);
                        console.log("Printing Bill to:", billPrinter);
                        await window.electronAPI.printBill({ printerName: billPrinter, htmlContent: billHtml });
                        showNotification("Bill sent to printer", "success");
                    } catch (printErr) {
                        console.error("Bill Printing failed:", printErr);
                        showNotification("Bill Print Failed", "error");
                    }
                }

                // 2. KOT Print
                // 2. KOT Print (Split by Station)
                const stationMappingJson = localStorage.getItem('pos_station_mapping');
                const stationMapping = stationMappingJson ? JSON.parse(stationMappingJson) : {};
                const legacyKotPrinter = localStorage.getItem('pos_kot_printer_name') || billPrinter; // Fallback to bill printer
                const isRoutingEnabled = localStorage.getItem('pos_kitchen_routing_enabled') === 'true';

                // Prepare items with Category info (Ensure cart items have Category attached)
                // In handleCheckout, 'orderData.items' are constructed. We need to look at 'cart' or ensure 'orderData.items' has category info.
                // 'cart' has full item objects including Category.
                // 'orderData.items' might be stripped down. Let's use 'cart' for grouping logic or re-map.
                // Actually, 'orderData' is constructed from 'cart' right before this.
                // Let's assume 'cart' is available in scope (it is).

                const itemsByStation = {};
                cart.forEach(item => {
                    const station = item.Category?.station || 'Kitchen';
                    if (!itemsByStation[station]) itemsByStation[station] = [];
                    itemsByStation[station].push(item);
                });

                const stations = Object.keys(itemsByStation);

                if (isRoutingEnabled && Object.keys(stationMapping).length > 0) {
                    // Multi-printer Logic
                    for (const station of stations) {
                        const printerName = stationMapping[station] || legacyKotPrinter;
                        if (printerName) {
                            // Small delay to prevent queue jams
                            await new Promise(r => setTimeout(r, 500));

                            const stationItems = itemsByStation[station];
                            const partialOrder = {
                                ...orderData,
                                orderId: response.data?.id || orderData.orderNumber,
                                items: stationItems
                            };

                            const kotHtml = generateKotHtml(partialOrder);
                            console.log(`Printing KOT for Station: ${station} to ${printerName}`);
                            await window.electronAPI.printBill({ printerName, htmlContent: kotHtml });
                        }
                    }
                    showNotification("KOTs sent to kitchens", "success");
                } else {
                    // Legacy Single Printer
                    if (legacyKotPrinter) {
                        try {
                            if (billPrinter === legacyKotPrinter) {
                                await new Promise(r => setTimeout(r, 1500));
                            }
                            const kotHtml = generateKotHtml({
                                ...orderData,
                                orderId: response.data?.id || orderData.orderNumber,
                                items: cart // Use cart to ensure full details if needed, or orderData.items
                            });
                            console.log("Printing KOT to:", legacyKotPrinter);
                            await window.electronAPI.printBill({ printerName: legacyKotPrinter, htmlContent: kotHtml });
                            showNotification("KOT sent to printer", "success");
                        } catch (kotErr) {
                            console.error("KOT Printing failed:", kotErr);
                            showNotification("KOT Print Failed", "error");
                        }
                    }
                }
            } else {
                console.warn("Electron API missing, cannot print.");
            }

            setCart([]);
        } catch (error) {
            console.error("Checkout failed", error);
            showNotification(`Failed to place order: ${error.response?.data?.error || error.message}`, "error");
        }
    };

    const handleKOT = () => {
        if (cart.length === 0) return;
        showNotification(`KOT Generated for ${orderType.toUpperCase()} Order!`, "success");
    };

    const filteredItems = activeCategory === 'All'
        ? items
        : items.filter(i => (i.Category?.name || 'Uncategorized') === activeCategory); // Updated filter logic

    return (
        <div className="flex h-full gap-6 p-6 overflow-hidden relative">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 bg-gray-900/50 z-[300] flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">Loading Menu...</p>
                    </div>
                </div>
            )}

            {/* Offline Mode Banner */}
            {isOfflineMode && !isLoading && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[250] bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    SYNC REQUIRED - Click Sync button to download menu
                </div>
            )}

            <SpecialNoteModal
                isOpen={noteModalOpen}
                onClose={() => setNoteModalOpen(false)}
                onSelect={handleSpecialNoteSelect}
            />

            {/* Incoming Orders Modal / Popup */}
            {incomingOrders.length > 0 && (
                <div className="absolute bottom-6 right-6 z-[200] space-y-3 flex flex-col items-end">
                    {incomingOrders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-l-4 border-orange-500 w-80 overflow-hidden animate-in slide-in-from-right-10">
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                            New Order #{order.orderNumber.slice(-4)}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{order.type} • {order.items.reduce((s, i) => s + i.quantity, 0)} Items</p>
                                    </div>
                                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                        Scan & Order
                                    </span>
                                </div>

                                <div className="max-h-32 overflow-y-auto mb-3 bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-xs space-y-1">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span>{item.quantity} x {item.itemName}</span>
                                            <span className="text-gray-500">
                                                {item.variantName ? `(${item.variantName})` : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAcceptOrder(order)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2"
                                    >
                                        <Printer size={16} /> Accept & Print
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Notification Toast */}
            {notification.show && (
                <div className={`absolute top-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
                    }`}>
                    {notification.type === 'error' ? (
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">!</div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                    )}
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">
                            {notification.type === 'error' ? 'Error' : 'Success'}
                        </span>
                        <span className="text-sm font-medium opacity-90">{notification.message}</span>
                    </div>
                </div>
            )}
            <ItemCustomizationModal
                isOpen={!!customizingItem}
                onClose={() => {
                    setCustomizingItem(null);
                    setEditingCartItem(null);
                    setSelectedVariant(null);
                    setSelectedAddons({});
                }}
                item={customizingItem}
                orderType={orderType}
                editMode={!!editingCartItem}
                initialVariant={selectedVariant}
                initialAddons={selectedAddons}
                onAddToCart={(item, variant, addons, quantity, note) => {
                    saveCartItem(item, variant, addons, quantity, note);
                    setCustomizingItem(null);
                    setEditingCartItem(null);
                }}
            />

            {/* Held Orders Modal */}
            {heldOrdersModalOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md h-full shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col animate-slide-in-right">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <PauseCircle className="w-6 h-6 text-yellow-500" />
                                Held Orders
                            </h3>
                            <button onClick={() => setHeldOrdersModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <Plus className="w-6 h-6 rotate-45 text-gray-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {heldOrders.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">No held orders found</div>
                            ) : (
                                heldOrders.map(order => (
                                    <div key={order.orderNumber} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-yellow-500/50 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {order.orderNumber}
                                                    <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full uppercase tracking-wide">Held</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(order.createdAt).toLocaleString()} • {order.type}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-lg text-gray-900 dark:text-white">₹{order.totalAmount}</div>
                                                {order.customerName && <div className="text-xs text-gray-500">{order.customerName}</div>}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <div className="text-xs text-gray-500">
                                                {order.items?.length} Items • {(order.items || []).map(i => i.name).join(', ').slice(0, 30)}...
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDiscardHeldOrder(order)}
                                                    className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide flex items-center gap-2"
                                                >
                                                    Discard
                                                </button>
                                                <button
                                                    onClick={() => resumeHeldOrder(order)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide flex items-center gap-2"
                                                >
                                                    Resume <ClipboardList className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <DiscountModal
                isOpen={showDiscountModal}
                orderTotal={subtotal}
                taxAmount={taxAmount}
                orderType={orderType}
                settings={settings}
                onClose={() => setShowDiscountModal(false)}
                onApplyCoupon={(coupon, amount) => {
                    if (coupon) {
                        const couponWithAmount = { ...coupon, discountAmount: amount };
                        setAppliedCoupon(couponWithAmount);
                        setDiscount(amount);
                        showNotification(`Coupon ${coupon.code} applied!`);
                    } else {
                        setAppliedCoupon(null);
                        setDiscount(0);
                    }
                }}
                appliedCoupon={appliedCoupon}
            />



            {/* Menu Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Order Type Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
                    {settings.store_dinein_enabled !== 'false' && (
                        <button
                            onClick={() => setOrderType('dine-in')}
                            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${orderType === 'dine-in' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Utensils className="w-4 h-4" /> Dine-in
                        </button>
                    )}
                    {settings.store_delivery_enabled !== 'false' && (
                        <button
                            onClick={() => setOrderType('delivery')}
                            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${orderType === 'delivery' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <ShoppingBag className="w-4 h-4" /> Delivery
                        </button>
                    )}
                    {settings.store_takeaway_enabled !== 'false' && (
                        <button
                            onClick={() => setOrderType('takeaway')}
                            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${orderType === 'takeaway' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <ChefHat className="w-4 h-4" /> Takeaway
                        </button>
                    )}
                </div>

                <div className="flex flex-1 overflow-hidden">

                    {/* Categories Sidebar */}
                    <div className="w-48 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 p-2 space-y-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat
                                    ? 'bg-orange-600 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-gray-800">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => initiateAddToCart(item)}
                                    className="group relative flex flex-col items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md transition-all bg-gray-50 dark:bg-gray-700/30"
                                >
                                    {item.showImage && (
                                        <>
                                            {item.image ? (
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${item.image}`}
                                                    alt={item.name}
                                                    className="w-20 h-20 rounded-full mb-3 object-cover shadow-sm group-hover:scale-105 transition-transform border border-gray-100"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        if (e.target.nextSibling) {
                                                            e.target.nextSibling.style.display = 'flex';
                                                            e.target.nextSibling.classList.remove('hidden');
                                                        }
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`w-20 h-20 rounded-full mb-3 ${item.color || 'bg-gray-100'} dark:bg-opacity-20 flex items-center justify-center text-3xl shadow-sm group-hover:scale-105 transition-transform ${item.image ? 'hidden' : ''}`}>
                                            </div>
                                        </>
                                    )}
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-center text-sm">{item.name}</h4>
                                    <p className="text-orange-600 font-bold mt-1 text-sm">₹{item.price}</p>
                                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-orange-600">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Area (Customer Info or Cart) */}
            <div className="w-80 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                {workflowStep === 'customer' ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col items-center text-center">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">Customer Information</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium italic">Enter customer information to proceed</p>
                            {customerPhone && (
                                <button
                                    onClick={() => {
                                        setCustomerPhone('');
                                        setCustomerName('');
                                        setCurrentCustomer(null);
                                    }}
                                    className="mt-3 text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full"
                                >
                                    Clear & Reset
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            {/* Mobile Info */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number *</label>
                                    {currentCustomer && !currentCustomer.isNew && <span className="bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">Existing Member</span>}
                                    {currentCustomer?.isNew && <span className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">New Customer</span>}
                                </div>
                                <div className={`flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border-2 rounded-2xl transition-all ${currentCustomer && !currentCustomer.isNew ? 'border-green-500/30' : 'border-gray-100 dark:border-gray-800 focus-within:border-blue-500/50'}`}>
                                    <Search className={`w-4 h-4 ${lookupLoading ? 'animate-spin text-blue-500' : currentCustomer && !currentCustomer.isNew ? 'text-green-500' : 'text-gray-400'}`} />
                                    <input
                                        type="tel"
                                        maxLength="10"
                                        placeholder="Enter customer number..."
                                        className="flex-1 bg-transparent border-none outline-none font-bold text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                        value={customerPhone}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Full Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                                <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl focus-within:border-blue-500/50 transition-all">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter full name..."
                                        className="flex-1 bg-transparent border-none outline-none font-bold text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Details & Membership */}
                            {currentCustomer && !currentCustomer.isNew && <CustomerDetailsSection customer={currentCustomer} />}
                        </div>

                        {/* Footer Action */}
                        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
                            <button
                                onClick={() => setWorkflowStep('cart')}
                                disabled={customerPhone.length < 10}
                                className={`w-full py-4 font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 group ${customerPhone.length === 10 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none'}`}
                            >
                                <span>{currentCustomer ? 'Confirm & Switch' : 'Proceed to Order'}</span>
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Simple Order Header */}
                        <div className="px-3 py-2 bg-gray-900 dark:bg-gray-950 border-b border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-sm">Current Order</span>
                                {heldOrders.length > 0 && (
                                    <button
                                        onClick={() => setHeldOrdersModalOpen(true)}
                                        className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-[10px] font-black uppercase hover:bg-yellow-500/30 transition-colors"
                                    >
                                        <PauseCircle className="w-3 h-3" />
                                        <span>{heldOrders.length} On Hold</span>
                                    </button>
                                )}
                            </div>
                            {/* Order Type Badge */}
                            <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">
                                {orderType}
                            </span>
                        </div>

                        {/* Cart Items - Takes most space */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900/50">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <ShoppingBag className="w-10 h-10 mb-2 opacity-20" />
                                    <p className="text-sm">Cart is empty</p>
                                    <p className="text-xs">Select items to start ordering</p>
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <CartItem
                                        key={item.signature}
                                        item={{
                                            id: item.signature,
                                            itemId: item.id, // Original item ID for editing
                                            itemName: item.name,
                                            price: item.displayPrice / item.qty,
                                            quantity: item.qty,
                                            total: item.price * item.qty,
                                            variantName: item.variant?.name,
                                            addons: item.selectedAddons,
                                            cookingInstructions: item.specialNote
                                        }}
                                        onUpdateQuantity={(id, delta) => updateQty(id, delta)}
                                        onRemove={(id) => removeItem(id)}
                                        onEdit={(itemData) => editCartItem(itemData)}
                                    />
                                ))
                            )}
                        </div>

                        {/* Summary Footer (Matching Design Image 1) */}
                        <div className="bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700">
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                    <span>Total number of items</span>
                                    <span>{cart.reduce((s, i) => s + i.qty, 0).toString().padStart(2, '0')}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                    <span>Bill Amount</span>
                                    <span>₹{billTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">Bill Amount (rounded)</span>
                                    <span className="text-lg font-black text-gray-900 dark:text-white">₹{finalTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Triple Action Buttons (Designed from Image 1) */}
                            <div className="flex h-16 w-full overflow-hidden">
                                <button
                                    onClick={() => setShowDiscountModal(true)}
                                    className="flex-1 bg-gray-900 dark:bg-black text-white flex flex-col items-center justify-center hover:bg-black transition-colors"
                                >
                                    <Tag className="w-5 h-5 mb-1 text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">Discount</span>
                                </button>

                                <button
                                    onClick={handleHoldOrder}
                                    className="flex-1 bg-yellow-500 dark:bg-yellow-600 text-white flex flex-col items-center justify-center hover:bg-yellow-600 transition-colors"
                                >
                                    <PauseCircle className="w-5 h-5 mb-1 text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">Hold</span>
                                </button>

                                <button
                                    onClick={handleCheckout}
                                    className="flex-[1.5] bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-95 group"
                                >
                                    <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-black uppercase tracking-widest">Checkout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const handleSaveOrder = () => {
    alert('Order saved successfully!');
};

export default Billing;
