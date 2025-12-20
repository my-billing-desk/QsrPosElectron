import React, { useState, useEffect, useRef } from 'react';
import { menuService, orderService, settingsService } from '../services/api';
import { Search, Plus, Minus, Trash2, ShoppingBag, Bike, Utensils, Printer, ChefHat, Edit2 } from 'lucide-react';
import { SpecialNoteModal } from './SpecialNoteModal';

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

    // Customization State
    const [customizingItem, setCustomizingItem] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedAddons, setSelectedAddons] = useState({}); // { groupId: [addonId, addonId] }
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [incomingOrders, setIncomingOrders] = useState([]);
    const processedIdsRef = useRef(new Set());

    // Special Note State
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [noteTargetIndex, setNoteTargetIndex] = useState(null);

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
        if (resetSignal > 0) {
            setCart([]);
            setOrderType('dine-in');
            setCustomizingItem(null);
            // Optionally reset category too
            setActiveCategory('All');
        }
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
        try {
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
            setItems(itemData.map(i => {
                // Merge Item-specific variants with Group Master variants
                // Logic: Item variants override Group variants if they share the same name
                const groupVariants = i.variationGroups ? i.variationGroups.flatMap(g => g.Variants || []) : [];
                const itemVariants = i.Variants || [];

                const variantMap = new Map();
                // 1. Add group variants first (defaults)
                groupVariants.forEach(v => variantMap.set(v.name, v));
                // 2. Add item variants (overrides)
                itemVariants.forEach(v => variantMap.set(v.name, v));

                const allVariants = Array.from(variantMap.values());

                return {
                    ...i,
                    Variants: allVariants,
                    type: i.isVeg ? 'Veg' : 'Non-Veg',
                    color: 'bg-white'
                };
            }));
        } catch (error) {
            console.error("Failed to load data", error);
            showNotification("Failed to load menu data", "error");
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

        addToCart(customizingItem, selectedVariant, addonsList);
        setCustomizingItem(null);
        setSelectedVariant(null);
        setSelectedAddons({});
    };

    const addToCart = (item, variant, addons = []) => {
        setCart(prev => {
            // Generate unique signature for "same item" check
            const signature = `${item.id}-${variant ? variant.id : 'base'}-${addons.map(a => a.id).sort().join(',')}`;

            const existingIndex = prev.findIndex(i => i.signature === signature);
            if (existingIndex >= 0) {
                const newCart = [...prev];
                newCart[existingIndex].qty += 1;
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
                qty: 1,
                variant: variant,
                selectedAddons: addons,
                displayPrice: finalPrice, // Store the unit price for this configuration
                price: finalPrice, // Override base price for calculation
                specialNote: '' // Initialize special note
            }];
        });
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
    const rawTotal = finalTotal;

    if (settings.accept_decimal !== 'true') {
        const roundedTotal = Math.round(finalTotal);
        roundOffValue = roundedTotal - finalTotal; // can be + or -
        finalTotal = roundedTotal;
    } else {
        // Keep 2 decimal places fixed for UI consistency, but value is float
        // Actually, let's keep it as float
    }

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
            {/* Customization Modal */}
            {customizingItem && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden transform transition-all scale-100">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{customizingItem.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize your order</p>
                            </div>
                            <button
                                onClick={() => setCustomizingItem(null)}
                                className="p-2 hover:bg-gray-200 rounded-full dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <Trash2 className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Variants Section */}
                            {customizingItem.Variants && customizingItem.Variants.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">Choose Variation</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {customizingItem.Variants.filter(v => {
                                            if (orderType === 'delivery') return v.isDelivery !== false;
                                            if (orderType === 'takeaway') return v.isTakeaway !== false;
                                            return v.isDineIn !== false; // default dine-in
                                        }).map(v => {
                                            const isSelected = selectedVariant?.id === v.id;
                                            return (
                                                <div
                                                    key={v.id}
                                                    onClick={() => setSelectedVariant(v)}
                                                    className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${isSelected
                                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md'
                                                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-sm'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-orange-500' : 'border-gray-300 dark:border-gray-600 group-hover:border-orange-400'}`}>
                                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                                                        </div>
                                                        <span className={`font-semibold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{v.name}</span>
                                                    </div>
                                                    <span className={`font-bold ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>₹{v.price}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Addons Section */}
                            {customizingItem.addonGroups && customizingItem.addonGroups.map(group => (
                                <div key={group.id} className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">{group.name}</h4>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full uppercase tracking-wider">
                                            {group.maxSelection > 1 ? `Select up to ${group.maxSelection}` : 'Select 1'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {group.Addons.map(addon => {
                                            const isSelected = (selectedAddons[group.id] || []).includes(addon.id);
                                            return (
                                                <label key={addon.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-sm' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex items-center justify-center w-5 h-5 rounded ${group.maxSelection > 1 ? 'border-2' : 'border-2 rounded-full'} ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                                            {group.maxSelection > 1
                                                                ? (isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>)
                                                                : (isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />)
                                                            }
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleAddonToggle(group, addon)}
                                                            className="hidden"
                                                        />
                                                        <span className={`font-medium flex items-center gap-2 ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                            <span className="text-[10px]">{addon.type === 'veg' ? '🟢' : '🔴'}</span> {addon.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">+₹{addon.price}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer (Total & Action) */}
                        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Amount</p>
                                <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    ₹{((selectedVariant ? selectedVariant.price : customizingItem.price) +
                                        (
                                            customizingItem.addonGroups?.reduce((acc, g) => {
                                                const selectedIds = selectedAddons[g.id] || [];
                                                const groupTotal = selectedIds.reduce((sum, id) => {
                                                    const a = g.Addons.find(x => x.id === id);
                                                    return sum + (a ? a.price : 0);
                                                }, 0);
                                                return acc + groupTotal;
                                            }, 0) || 0
                                        )
                                    ).toFixed(2)}
                                </div>
                            </div>
                            <button
                                onClick={confirmCustomization}
                                className="px-8 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-600/30 transition-all transform active:scale-95 flex items-center gap-2"
                            >
                                <span>Add Item</span>
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}


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

            {/* Cart Area */}
            <div className="w-80 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">Current Order</h3>
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold shadow-sm border border-blue-200 uppercase">
                        {orderType}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <ShoppingBag className="w-12 h-12 mb-2 opacity-20" />
                            <p>Cart is empty</p>
                            <p className="text-sm">Select items to start ordering</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={item.signature} className="flex flex-col p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h4
                                            className="font-medium text-gray-900 dark:text-white text-sm cursor-pointer hover:text-orange-600 transition-colors"
                                            onClick={() => openSpecialNoteModal(idx)}
                                            title="Click to add note"
                                        >
                                            {item.name} <Edit2 size={10} className="inline ml-1 opacity-50" />
                                        </h4>
                                        {/* Variation Tag */}
                                        {item.variant && <span className="text-[10px] bg-orange-100 text-orange-800 px-1 rounded block w-fit mt-0.5">{item.variant.name}</span>}
                                        {/* Addons List */}
                                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                                            <div className="text-[10px] text-gray-500 mt-1">
                                                {item.selectedAddons.map(a => (
                                                    <span key={a.id} className="block">+ {a.name} (₹{a.price})</span>
                                                ))}
                                            </div>
                                        )}
                                        {/* Special Note */}
                                        {item.specialNote && (
                                            <div className="text-[10px] text-blue-600 font-medium mt-1 italic">
                                                Note: {item.specialNote}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right pl-2">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">₹{(item.price * item.qty).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">@ ₹{item.price.toFixed(2)}/ea</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateQty(item.signature, -1)} className="p-1 rounded bg-white dark:bg-gray-600 shadow-sm hover:bg-gray-100 text-gray-600 dark:text-gray-200">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-6 text-center font-medium text-sm">{item.qty}</span>
                                        <button onClick={() => updateQty(item.signature, 1)} className="p-1 rounded bg-white dark:bg-gray-600 shadow-sm hover:bg-gray-100 text-gray-600 dark:text-gray-200">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                        <div className="w-4"></div>
                                        <button onClick={() => removeItem(item.signature)} className="text-red-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>
                                {isInclusive ? 'Included GST' : 'GST'} ({gstPercent}%)
                            </span>
                            <span>₹{taxAmount.toFixed(2)}</span>
                        </div>
                        {Math.abs(roundOffValue) > 0.001 && (
                            <div className="flex justify-between text-gray-400 dark:text-gray-500 text-xs">
                                <span>Round Off</span>
                                <span>{roundOffValue > 0 ? '+' : ''}{roundOffValue.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span>Total</span>
                            <span>₹{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleKOT}
                            className="py-3 rounded-xl font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> KOT
                        </button>
                        <button
                            onClick={handleCheckout}
                            className="py-3 rounded-xl font-bold bg-orange-600 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-700 hover:shadow-orange-600/50 transition-all transform active:scale-95"
                        >
                            Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
