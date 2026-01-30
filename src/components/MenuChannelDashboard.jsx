import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Filter, Smartphone, Upload, Download, FileText, Calendar } from 'lucide-react';
import Papa from 'papaparse';
import { menuService } from '../services/api';
import { getTodayLocal } from '../utils/dateUtils';

export function MenuChannelDashboard() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        category: 'All',
        status: 'All'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [itemRes, catRes] = await Promise.all([
                menuService.getItems(),
                menuService.getCategories()
            ]);
            setItems(itemRes.data || []);
            setCategories(['All', ...catRes.data.map(c => c.name)]);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (itemId, field, currentValue) => {
        try {
            // Optimistic update
            setItems(prev => prev.map(i =>
                i.id === itemId ? { ...i, [field]: !currentValue } : i
            ));

            await menuService.updateStatus(itemId, { [field]: !currentValue });
        } catch (error) {
            console.error("Failed to update status", error);
            loadData(); // Revert on error
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const updates = results.data.map(row => {
                    const sanitize = (val) => {
                        if (val === undefined || val === null || val === '') return undefined;
                        const v = val.toString().toLowerCase().trim();
                        return ['true', '1', 'yes', 'on'].includes(v);
                    };

                    const name = row['Name'] || row['Item Name'] || row['name'] || row['Item'];
                    if (!name) return null;

                    return {
                        name: name,
                        availableOffline: sanitize(row['Available_Offline'] ?? row['Offline'] ?? row['offline']),
                        // Swiggy/Zomato columns ignored for now
                    };
                }).filter(u => u !== null);

                if (updates.length > 0) {
                    try {
                        setLoading(true);
                        await menuService.updateBulkStatus(updates);
                        await loadData();
                        alert(`Successfully processed ${updates.length} items from CSV.`);
                    } catch (e) {
                        console.error(e);
                        alert("Error updating items: " + e.message);
                        setLoading(false);
                    }
                } else {
                    alert("No valid data found in CSV. Please check the headers.");
                }
            }
        });
        event.target.value = '';
    };

    const downloadTemplate = () => {
        // Reduced template focusing on Offline availability mainly, but keeping structure valid
        const sample = [
            `"Classic Burger","","","CB01",,"","","Burgers","Burgers","",150,"","","Pcs","TRUE",0,0,1,0,"TRUE","FALSE","FALSE","TRUE","","","","","","",0,0,0`,
            `"Cheese Pizza","","","CP01",,"","","Pizza","Pizza","",250,"","","Pcs","TRUE",0,0,1,0,"TRUE","TRUE","FALSE","TRUE","","","","","","",0,0,0`
        ].join("\n");
        const csvContent = `\uFEFF${CSV_HEADERS.join(",")}\n${sample}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "menu_availability_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredItems = items.filter(item => {
        if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filters.category !== 'All' && item.Category?.name !== filters.category) return false;
        if (filters.status === 'On') {
            if (!item.availableOffline) return false;
        }
        if (filters.status === 'Off') {
            if (item.availableOffline) return false;
        }
        return true;
    });

    const handleFullMenuUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                if (results.data.length > 0) {
                    try {
                        setLoading(true);
                        const res = await menuService.importFullMenu(results.data);
                        await loadData();
                        alert(`Full Menu Import: ${res.data.stats.created} Created, ${res.data.stats.updated} Updated.`);
                    } catch (e) {
                        console.error(e);
                        alert("Error importing menu: " + (e.response?.data?.error || e.message));
                    } finally {
                        setLoading(false);
                    }
                } else {
                    alert("No data found in CSV.");
                }
            }
        });
        event.target.value = '';
    };

    const CSV_HEADERS = [
        "Name", "Online_Name", "Description", "Short_Code", "Short_Code_2", "Sap_Code", "HSN_Code",
        "Parent_Category", "Category", "Category_online_display", "Price", "Attributes", "Goods_Services",
        "Unit", "is_Self_Item_Recipe", "minimum_stock_level", "at_par_stock_level", "Rank",
        "Packing_Charges", "Allow_Decimal_Qty", "Available_Offline", "Available_Swiggy", "Available_Zomato",
        "Variation_group_name", "Variation_Group_Department", "Variation", "Variation_Price", "Variation_Sap_Code", "Variation_Packing_Charges",
        "Addon_Group_Name", "Addon_Group_Selection", "Addon_Group_Min", "Addon_Group_Max",
        "Addon_Name", "Addon_Price", "Addon_Sap_Code", "Addon_Packing_Charges", "Addon_Item_Rank"
    ];

    const downloadFullMenu = async () => {
        try {
            setLoading(true);
            const response = await menuService.exportFullMenu();
            const csvData = Papa.unparse({
                fields: CSV_HEADERS,
                data: response.data
            }, { quotes: true });
            const csvContent = `\uFEFF${csvData}`;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `menu_export_${getTodayLocal()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error(error);
            alert("Failed to export menu: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadFullTemplate = () => {
        const sample = [
            `"Chicken Burger","Burger King","Juicy chicken patty","CB01",,"SAP123","HSN001","Fast Food","Burgers","Burgers Online",150,"Spicy","Goods","Pcs","TRUE",10,20,1,10,"FALSE","TRUE","TRUE","FALSE","Size","Food","Large",180,"SAP_LG",15,"Toppings","Multiple",0,3,"Cheese",20,"ADD_01",0,1`,
            `"Chicken Burger","Burger King","Juicy chicken patty","CB01",,"SAP123","HSN001","Fast Food","Burgers","Burgers Online",150,"Spicy","Goods","Pcs","TRUE",10,20,1,10,"FALSE","TRUE","FALSE","TRUE","Size","Food","Regular",150,"SAP_RG",10,"Toppings","Multiple",0,3,"Mushrooms",10,"ADD_02",0,2`
        ].join("\n");
        const csvContent = `\uFEFF${CSV_HEADERS.join(",")}\n${sample}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "full_menu_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const groupedItems = filteredItems.reduce((acc, item) => {
        const cat = item.Category?.name || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6 space-y-6">
            {/* Header / Tabs - Simplified to just Title */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-gray-100">
                    <Smartphone className="w-6 h-6 text-indigo-600-500" />
                    <span>Item Availability Manager</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Manage item availability for offline store.</p>
            </div>

            {/* CSV Actions Bar */}
            <div className="flex flex-col gap-4">
                {/* Availability CSV */}
                <div className="flex gap-4 items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Availability:</span>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="csv-upload"
                    />
                    <label
                        htmlFor="csv-upload"
                        className="cursor-pointer px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded text-xs font-medium hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Upload className="w-3 h-3" /> Import Status
                    </label>
                    <button
                        onClick={downloadTemplate}
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded text-xs font-medium hover:bg-gray-50 flex items-center gap-2"
                    >
                        <FileText className="w-3 h-3" /> Template
                    </button>
                </div>

                {/* Full Menu CSV */}
                <div className="flex gap-4 items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Full Menu:</span>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFullMenuUpload}
                        className="hidden"
                        id="full-menu-upload"
                    />
                    <label
                        htmlFor="full-menu-upload"
                        className="cursor-pointer px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 flex items-center gap-2"
                    >
                        <Upload className="w-3 h-3" /> Import
                    </label>
                    <button
                        onClick={downloadFullMenu}
                        className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded text-xs font-medium hover:bg-green-100 flex items-center gap-2"
                    >
                        <Download className="w-3 h-3" /> Export Menu
                    </button>
                    <button
                        onClick={downloadFullTemplate}
                        className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 flex items-center gap-2"
                    >
                        <FileText className="w-3 h-3" /> Blank Template
                    </button>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        placeholder="Search Item name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        value={filters.category}
                        onChange={e => setFilters({ ...filters, category: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 outline-none text-sm"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-32">
                    <select
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 outline-none text-sm"
                    >
                        <option value="All">All Status</option>
                        <option value="On">On</option>
                        <option value="Off">Off</option>
                    </select>
                </div>
                <button
                    onClick={() => { setSearchQuery(''); setFilters({ category: 'All', status: 'All' }) }}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
                >
                    Clear
                </button>
                <button onClick={loadData} className="px-4 py-2 border border-blue-200 text-blue-600 bg-blue-50 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200">{category}</h3>
                            <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">{items.length} items</span>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {items.map(item => (
                                <div key={item.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`w-3 h-3 rounded-full ${item.availableOffline ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">Available</span>
                                            <Toggle
                                                isOn={item.availableOffline}
                                                onToggle={() => handleToggle(item.id, 'availableOffline', item.availableOffline)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Toggle({ isOn, onToggle, color = 'bg-green-600' }) {
    return (
        <button
            onClick={onToggle}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${isOn ? color : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );
}
