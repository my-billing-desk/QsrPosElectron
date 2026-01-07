import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus, FileSpreadsheet, FileText, RotateCcw, Eye, Edit, Trash2, X, Calendar, Download, List } from 'lucide-react';

import { inventoryService } from '../../services/api';

export default function StockPurchase() {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newPurchase, setNewPurchase] = useState({
        supplierId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        items: []
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadPurchases();
        loadInitialData();
    }, []);

    const loadPurchases = async () => {
        try {
            const res = await inventoryService.getPurchases();
            setPurchases(res.data);
        } catch (error) {
            console.error('Error loading purchases:', error);
        }
    };

    const loadInitialData = async () => {
        try {
            const [suppliersRes, materialsRes] = async () => Promise.all([
                inventoryService.getSuppliers(),
                inventoryService.getRawMaterials()
            ]);
            // Retry logic or safe await? The admin code had Promise.all directly
            const [sRes, mRes] = await Promise.all([
                inventoryService.getSuppliers(),
                inventoryService.getRawMaterials()
            ]);
            setSuppliers(sRes.data);
            setRawMaterials(mRes.data);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 font-sans p-6 gap-6 overflow-hidden w-full relative">
            {/* 1. Header Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Stock Purchase</h1>
                    <div className="text-sm text-gray-500">Manage your purchases</div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-50 text-red-500 shadow-sm"><FileText className="w-4 h-4" /></button>
                    <button className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-50 text-green-600 shadow-sm"><FileSpreadsheet className="w-4 h-4" /></button>
                    <button className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-50 text-gray-600 shadow-sm"><RotateCcw className="w-4 h-4" /></button>
                    <button className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-50 text-gray-600 shadow-sm"><ChevronDown className="w-4 h-4" /></button>
                    <button className="px-4 py-2 bg-gray-800 text-white rounded font-bold shadow-sm hover:bg-gray-900 flex items-center gap-2 ml-2">
                        <Download className="w-4 h-4" /> Import Purchase
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-orange-500 text-white rounded font-bold shadow-sm hover:bg-orange-600 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Purchase
                    </button>
                </div>
            </div>

            {/* 2. Main Content Card */}
            <div className="bg-white border rounded-lg shadow-sm flex flex-col flex-1 overflow-hidden">
                <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <input type="text" placeholder="Search" className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative">
                            <button className="px-3 py-2 border rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-50 min-w-[120px] justify-between">
                                Payment Status <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white text-xs font-bold text-gray-800 border-b">
                            <tr>
                                <th className="p-4 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
                                <th className="p-4">Supplier Name</th>
                                <th className="p-4">Reference</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Grand Total</th>
                                <th className="p-4">Paid</th>
                                <th className="p-4">Due</th>
                                <th className="p-4">Payment Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y">
                            {purchases.map((p) => {
                                const paid = p.paidAmount || 0;
                                const due = parseFloat(p.totalAmount || 0) - parseFloat(paid);
                                const payStatus = due <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

                                return (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-center"><input type="checkbox" className="rounded border-gray-300" /></td>
                                        <td className="p-4 font-bold text-gray-800">{p.Supplier?.name || 'Unknown'}</td>
                                        <td className="p-4 text-gray-600">{p.invoiceNumber}</td>
                                        <td className="p-4 text-gray-600">{new Date(p.invoiceDate).toLocaleDateString()}</td>
                                        <td className="p-4"><span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold">{p.status}</span></td>
                                        <td className="p-4 text-gray-800">₹{parseFloat(p.totalAmount || 0).toLocaleString()}</td>
                                        <td className="p-4 text-green-600">₹{parseFloat(paid).toLocaleString()}</td>
                                        <td className="p-4 text-red-500">₹{due.toLocaleString()}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold text-white ${payStatus === 'Paid' ? 'bg-green-500' : payStatus === 'Unpaid' ? 'bg-red-500' : 'bg-orange-400'}`}>{payStatus}</span></td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button className="p-1.5 border rounded hover:bg-gray-50 text-gray-500"><Eye className="w-3 h-3" /></button>
                                                <button className="p-1.5 border rounded hover:bg-gray-50 text-green-600"><Edit className="w-3 h-3" /></button>
                                                <button className="p-1.5 border rounded hover:bg-gray-50 text-red-500"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. Add Purchase Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
                    <div className="bg-white rounded-lg w-full max-w-6xl shadow-2xl animate-in fade-in zoom-in duration-200 h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">Add Purchase</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <span className="bg-white rounded-full p-1 border border-transparent hover:border-red-500 flex items-center justify-center">
                                    <div className="bg-red-500 text-white rounded-full p-0.5">
                                        <X className="w-4 h-4" />
                                    </div>
                                </span>
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="space-y-8">
                                {/* Top Form Section */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Supplier Name <span className="text-red-500">*</span></label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <select
                                                    value={newPurchase.supplierId}
                                                    onChange={(e) => setNewPurchase({ ...newPurchase, supplierId: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600"
                                                >
                                                    <option value="">Select Supplier</option>
                                                    {suppliers.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                            </div>
                                            <button className="bg-orange-500 text-white rounded-md w-10 flex items-center justify-center hover:bg-orange-600 transition-colors"><Plus className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 relative">
                                        <label className="text-sm font-semibold text-gray-700">Purchase Date <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={newPurchase.invoiceDate}
                                                onChange={(e) => setNewPurchase({ ...newPurchase, invoiceDate: e.target.value })}
                                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Reference No.</label>
                                        <input
                                            type="text"
                                            value={newPurchase.invoiceNumber}
                                            onChange={(e) => setNewPurchase({ ...newPurchase, invoiceNumber: e.target.value })}
                                            placeholder="REF-001"
                                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600"
                                        />
                                    </div>
                                </div>

                                {/* Product Search */}
                                <div className="space-y-1.5 relative">
                                    <label className="text-sm font-semibold text-gray-700">Product Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search raw material to add..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full border border-gray-300 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 bg-gray-50"
                                        />
                                        <Search className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
                                    </div>

                                    {searchTerm && (
                                        <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                                            {rawMaterials.filter(rm => rm.name.toLowerCase().includes(searchTerm.toLowerCase())).map(rm => (
                                                <button
                                                    key={rm.id}
                                                    onClick={() => {
                                                        const exists = newPurchase.items.find(i => i.rawMaterialId === rm.id);
                                                        if (exists) {
                                                            alert('Item already added');
                                                        } else {
                                                            setNewPurchase({
                                                                ...newPurchase,
                                                                items: [...newPurchase.items, {
                                                                    rawMaterialId: rm.id,
                                                                    name: rm.name,
                                                                    quantity: 1,
                                                                    price: rm.purchasePrice || 0,
                                                                    unit: rm.unit
                                                                }]
                                                            });
                                                        }
                                                        setSearchTerm('');
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                                >
                                                    {rm.name} ({rm.unit}) - Stock: {rm.currentStock}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Product Table */}
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                                            <tr>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Product</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Qty</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Unit</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Purchase Price</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Total Cost</th>
                                                <th className="p-3 w-10 text-center"><Trash2 className="w-4 h-4 mx-auto text-gray-500" /></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y text-gray-600 bg-white">
                                            {newPurchase.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-gray-100 border flex items-center justify-center text-xs text-gray-500 font-bold">{item.name[0]}</div>
                                                            <span className="font-medium text-gray-800">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center justify-center border rounded-md w-24 mx-auto">
                                                            <button
                                                                onClick={() => {
                                                                    const updated = [...newPurchase.items];
                                                                    updated[idx].quantity = Math.max(1, updated[idx].quantity - 1);
                                                                    setNewPurchase({ ...newPurchase, items: updated });
                                                                }}
                                                                className="px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-orange-500 font-bold"
                                                            >-</button>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const updated = [...newPurchase.items];
                                                                    updated[idx].quantity = parseFloat(e.target.value) || 0;
                                                                    setNewPurchase({ ...newPurchase, items: updated });
                                                                }}
                                                                className="w-full text-center text-sm focus:outline-none font-medium"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const updated = [...newPurchase.items];
                                                                    updated[idx].quantity += 1;
                                                                    setNewPurchase({ ...newPurchase, items: updated });
                                                                }}
                                                                className="px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-orange-500 font-bold"
                                                            >+</button>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center text-gray-500 font-bold">{item.unit}</td>
                                                    <td className="p-3">
                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => {
                                                                const updated = [...newPurchase.items];
                                                                updated[idx].price = parseFloat(e.target.value) || 0;
                                                                setNewPurchase({ ...newPurchase, items: updated });
                                                            }}
                                                            className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-gray-800 font-semibold">₹{(item.quantity * item.price).toLocaleString()}</td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={() => {
                                                                const updated = newPurchase.items.filter((_, i) => i !== idx);
                                                                setNewPurchase({ ...newPurchase, items: updated });
                                                            }}
                                                            className="text-gray-400 hover:text-red-500"
                                                        ><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {newPurchase.items.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="p-10 text-center text-gray-400 italic">No items added yet. Search products above to add to this purchase.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Summary Section */}
                                <div className="flex justify-end">
                                    <div className="w-full md:w-1/3">
                                        <div className="border rounded-md divide-y text-sm">
                                            <div className="flex justify-between p-3 bg-gray-50 font-bold">
                                                <span className="text-orange-600">Grand Total</span>
                                                <span className="text-gray-900">₹{newPurchase.items.reduce((sum, i) => sum + (i.quantity * i.price), 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Form Section */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Order Tax</label>
                                        <input type="text" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Discount</label>
                                        <input type="text" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Shipping</label>
                                        <input type="text" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Status</label>
                                        <div className="relative">
                                            <select className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600">
                                                <option>Received</option>
                                                <option>Pending</option>
                                                <option>Ordered</option>
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Description with Toolbar */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Description</label>
                                    <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-orange-500">
                                        <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-3 text-gray-500 text-sm">
                                            <button className="hover:text-gray-800 font-bold">B</button>
                                            <button className="hover:text-gray-800 italic">I</button>
                                            <button className="hover:text-gray-800 underline">U</button>
                                            <div className="w-px bg-gray-300 h-4 my-auto"></div>
                                            <button className="hover:text-gray-800"><List className="w-4 h-4" /></button>
                                        </div>
                                        <textarea rows="3" className="w-full p-3 text-sm focus:outline-none resize-none" placeholder="Enter notes..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t shrink-0 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                            <button
                                onClick={async () => {
                                    if (!newPurchase.supplierId || newPurchase.items.length === 0) {
                                        alert('Please select a supplier and add at least one item');
                                        return;
                                    }
                                    try {
                                        const payload = {
                                            supplierId: newPurchase.supplierId,
                                            invoiceNumber: newPurchase.invoiceNumber,
                                            invoiceDate: newPurchase.invoiceDate,
                                            totalAmount: newPurchase.items.reduce((sum, i) => sum + (i.quantity * i.price), 0),
                                            status: 'Completed',
                                            items: newPurchase.items.map(i => ({
                                                rawMaterialId: i.rawMaterialId,
                                                quantity: i.quantity,
                                                price: i.price,
                                                unit: i.unit
                                            }))
                                        };
                                        await inventoryService.createPurchase(payload);
                                        setIsAddModalOpen(false);
                                        setNewPurchase({ supplierId: '', invoiceDate: new Date().toISOString().split('T')[0], invoiceNumber: '', items: [] });
                                        loadPurchases();
                                    } catch (error) {
                                        console.error('Error saving purchase:', error);
                                        alert('Failed to save purchase');
                                    }
                                }}
                                className="px-6 py-2 bg-orange-500 text-white rounded-md font-bold hover:bg-orange-600 shadow-md transition-colors"
                            >Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
