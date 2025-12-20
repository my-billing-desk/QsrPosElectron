import { useState, useEffect, useRef } from 'react';
import { orderService } from '../services/api';
import { generateKotHtml } from '../utils/printTemplates';

export const useOnlineOrders = () => {
    const [lastChecked, setLastChecked] = useState(new Date());
    const isProcessing = useRef(false);

    useEffect(() => {
        const pollInterval = setInterval(async () => {
            if (isProcessing.current) return;
            isProcessing.current = true;

            try {
                // Fetch orders that are online placeholders (not POS local) and not printed
                // We assume source is not POS
                // getOrders supports filtering by isKotPrinted (string 'false')
                // We can't filter by source != POS easily unless backend supports Op.ne, 
                // but usually webhooks set source='Swiggy' etc.
                // We will filter client side if needed.
                const res = await orderService.getOrders({ isKotPrinted: 'false' });
                const orders = res.data;

                // Configure printer name if specific? For now default.
                // Or maybe fetch settings to know if auto-accept is on?
                // The user request says "Auto print KOT", implying always on for this setup.

                const onlineOrders = orders.filter(o => o.source && o.source !== 'POS');

                for (const order of onlineOrders) {
                    // Verify it's not effectively printed (double check)
                    if (order.isKotPrinted) continue;

                    console.log("Found new online order to print:", order.orderNumber);

                    const html = generateKotHtml(order);

                    // Send to printer
                    // Expecting window.electronAPI to be available
                    if (window.electronAPI) {
                        const printers = await window.electronAPI.getPrinters();
                        // Find KOT printer or Default
                        const kotPrinter = printers.find(p => p.name.toLowerCase().includes('kot')) || printers.find(p => p.isDefault);

                        if (kotPrinter) {
                            await window.electronAPI.printComponent(html, kotPrinter.name);

                            // Mark as printed
                            await orderService.markKotPrinted(order.id);
                            console.log("Printed and marked:", order.id);
                        } else {
                            console.warn("No KOT printer found");
                        }
                    }
                }

            } catch (error) {
                console.error("Error polling online orders:", error);
            } finally {
                isProcessing.current = false;
                setLastChecked(new Date());
            }
        }, 10000); // 10 seconds

        return () => clearInterval(pollInterval);
    }, []);

    return { lastChecked };
};
