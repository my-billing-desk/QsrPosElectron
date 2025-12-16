import React, { useState, useEffect } from 'react';
import { Save, Printer, RefreshCw } from 'lucide-react';

export function Settings() {
    const [printers, setPrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    const [kotPrinter, setKotPrinter] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPrinters();
        const saved = localStorage.getItem('pos_printer_name');
        if (saved) setSelectedPrinter(saved);
        const savedKot = localStorage.getItem('pos_kot_printer_name');
        if (savedKot) setKotPrinter(savedKot);
    }, []);

    const loadPrinters = async () => {
        setLoading(true);
        try {
            if (window.electronAPI) {
                const list = await window.electronAPI.getPrinters();
                setPrinters(list);
            } else {
                console.warn("Electron API not available");
                // Mock for web dev if needed
                // setPrinters([{ name: 'Mock Printer', isDefault: true }]);
            }
        } catch (err) {
            console.error("Failed to load printers", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        localStorage.setItem('pos_printer_name', selectedPrinter);
        localStorage.setItem('pos_kot_printer_name', kotPrinter);
        alert('Printer Configuration Saved!');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Printer className="w-6 h-6 text-orange-600" />
                    Print Configuration
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Bill Printer</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedPrinter}
                                onChange={(e) => setSelectedPrinter(e.target.value)}
                                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option value="">-- Select Printer --</option>
                                {printers.map(p => (
                                    <option key={p.name} value={p.name}>
                                        {p.name} {p.isDefault ? '(Default)' : ''}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={loadPrinters}
                                className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                                title="Refresh Printers"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Select the printer you want to use for printing bills and receipts.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select KOT Printer (Kitchen)</label>
                        <div className="flex gap-2">
                            <select
                                value={kotPrinter}
                                onChange={(e) => setKotPrinter(e.target.value)}
                                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option value="">-- Select KOT Printer --</option>
                                {printers.map(p => (
                                    <option key={p.name} value={p.name}>
                                        {p.name} {p.isDefault ? '(Default)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Select the printer for Kitchen Order Tickets. Can be the same as Bill Printer.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                        <button
                            onClick={async () => {
                                if (!selectedPrinter) return alert('Please select a printer first');
                                try {
                                    const testHtml = `
                                        <html><body>
                                            <h3 style="text-align:center">Test Print</h3>
                                            <p style="text-align:center">${new Date().toLocaleString()}</p>
                                            <hr/>
                                            <p style="text-align:center">Printer: ${selectedPrinter}</p>
                                            <p style="text-align:center">If you can read this, printing is working!</p>
                                        </body></html>
                                    `;
                                    await window.electronAPI.printBill({ printerName: selectedPrinter, htmlContent: testHtml });
                                    alert('Test print sent!');
                                } catch (e) {
                                    alert('Test print failed: ' + e.message);
                                }
                            }}
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
                        >
                            <Printer className="w-5 h-5" />
                            Test Print
                        </button>

                        <button
                            onClick={handleSave}
                            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
