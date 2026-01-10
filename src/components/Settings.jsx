import React, { useState, useEffect } from 'react';
import { Save, Printer, RefreshCw, ChefHat, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function Settings() {
    const [printers, setPrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    // const [kotPrinter, setKotPrinter] = useState(''); // Deprecated
    const [stationMapping, setStationMapping] = useState({}); // {'Tandoor': 'Printer1', 'Bar': 'Printer2'}
    const [enableKitchenRouting, setEnableKitchenRouting] = useState(false);
    const [newStation, setNewStation] = useState('');
    const [newStationPrinter, setNewStationPrinter] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPrinters();
        const saved = localStorage.getItem('pos_printer_name');
        if (saved) setSelectedPrinter(saved);

        const savedMapping = localStorage.getItem('pos_station_mapping');
        if (savedMapping) {
            try {
                setStationMapping(JSON.parse(savedMapping));
            } catch (e) { console.error('Error parsing station mapping', e); }
        }

        const savedRoutingEnabled = localStorage.getItem('pos_kitchen_routing_enabled');
        if (savedRoutingEnabled === 'true') setEnableKitchenRouting(true);
    }, []);

    const addStation = () => {
        if (!newStation || !newStationPrinter) return;
        setStationMapping(prev => ({ ...prev, [newStation]: newStationPrinter }));
        setNewStation('');
        setNewStationPrinter('');
    };

    const removeStation = (station) => {
        const newMap = { ...stationMapping };
        delete newMap[station];
        setStationMapping(newMap);
    };

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
        localStorage.setItem('pos_station_mapping', JSON.stringify(stationMapping));
        localStorage.setItem('pos_kitchen_routing_enabled', enableKitchenRouting);
        toast.success('Printer Configuration Saved!');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Settings className="w-6 h-6 text-orange-600" />
                    Outlet Configuration
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

                    {/* Kitchen Routing - Replaces simple KOT Printer */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <ChefHat size={20} className="text-orange-500" />
                                Kitchen Routing
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${enableKitchenRouting ? 'text-green-600' : 'text-gray-500'}`}>
                                    {enableKitchenRouting ? 'Enabled' : 'Disabled'}
                                </span>
                                <button
                                    onClick={() => setEnableKitchenRouting(!enableKitchenRouting)}
                                    className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${enableKitchenRouting ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${enableKitchenRouting ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        {enableKitchenRouting && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Station Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Tandoor, Bar"
                                            value={newStation}
                                            onChange={(e) => setNewStation(e.target.value)}
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Assign Printer</label>
                                        <select
                                            value={newStationPrinter}
                                            onChange={(e) => setNewStationPrinter(e.target.value)}
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">Select Printer</option>
                                            {printers.map(p => (
                                                <option key={p.name} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={addStation}
                                        className="p-2 bg-green-600 text-white rounded hover:bg-green-700 mb-[1px]"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                {/* List of Configured Stations */}
                                <div className="space-y-2 mt-2">
                                    {Object.entries(stationMapping).map(([station, printer]) => (
                                        <div key={station} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded border dark:border-gray-600">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-800 dark:text-gray-200">{station}</span>
                                                <span className="text-xs text-gray-500">→</span>
                                                <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{printer}</span>
                                            </div>
                                            <button
                                                onClick={() => removeStation(station)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {Object.keys(stationMapping).length === 0 && (
                                        <div className="text-sm text-gray-400 italic text-center py-2">No stations configured. Default KOT printer will be used.</div>
                                    )}
                                </div>
                            </div>
                        )}
                        {!enableKitchenRouting && (
                            <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700">
                                Kitchen routing is disabled. All KOTs will print to the Default Printer.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                        <button
                            onClick={async () => {
                                if (!selectedPrinter) return toast.error('Please select a printer first');
                                try {
                                    const testHtml = `
                                        <html><body>
                                            <h3 style="text-align:center">Test Print</h3>
                                            <p style="text-align:center">${new Date() ? new Date().toLocaleString() : ''}</p>
                                            <hr/>
                                            <p style="text-align:center">Printer: ${selectedPrinter}</p>
                                            <p style="text-align:center">If you can read this, printing is working!</p>
                                        </body></html>
                                    `;
                                    await window.electronAPI.printBill({ printerName: selectedPrinter, htmlContent: testHtml });
                                    toast.success('Test print sent!');
                                } catch (e) {
                                    toast.error('Test print failed: ' + e.message);
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
