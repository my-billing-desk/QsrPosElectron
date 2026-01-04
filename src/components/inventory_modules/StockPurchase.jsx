import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus, FileSpreadsheet, FileText, RotateCcw, Eye, Edit, Trash2, X, Calendar, Download, List, Save, DollarSign } from 'lucide-react';
import { inventoryService } from '../../services/api';
import toast from 'react-hot-toast';
import { getTodayLocal } from '../../utils/dateUtils';

export default function StockPurchase() {
    const [view, setView] = useState('list');
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);

    // Form State
    const [formData, setFormData] = useState(initialFormState());
    const [supplierSearch, setSupplierSearch] = useState('');
    const [isSupplierOpen, setIsSupplierOpen] = useState(false);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!supplierSearch) {
            setFilteredSuppliers(suppliers);
        } else {
            setFilteredSuppliers(suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())));
        }
    }, [supplierSearch, suppliers]);

    const loadData = async () => {
        try {
            const [purRes, supRes, matRes] = await Promise.all([
                inventoryService.getPurchases(),
                inventoryService.getSuppliers(),
                inventoryService.getRawMaterials()
            ]);
            setPurchases(purRes.data || []);
            setSuppliers(supRes.data || []);
            setRawMaterials(matRes.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateSupplier = async (name) => {
        // In a real app, you might want to call an API to create the supplier first
        // For now, we simulate it for the UI state
        const newSupplier = { id: Date.now().toString(), name };
        setSuppliers([...suppliers, newSupplier]);
        setFormData({ ...formData, supplierId: newSupplier.id });
        setSupplierSearch(name);
        setIsSupplierOpen(false);
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { rawMaterialId: '', quantity: '1', unit: '', unitCost: '0', totalCost: '0' }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'rawMaterialId') {
            const mat = rawMaterials.find(m => m.id == value);
            if (mat) {
                newItems[index].unit = mat.purchaseUnit;
                // Pre-fill cost if available in material data? For now 0
            }
        }

        // Recalculate row total
        if (field === 'quantity' || field === 'unitCost') {
            const qty = parseFloat(newItems[index].quantity) || 0;
            const cost = parseFloat(newItems[index].unitCost) || 0;
            newItems[index].totalCost = (qty * cost).toFixed(2);
        }

        setFormData({ ...formData, items: newItems });
    };

    const calculateGrandTotal = () => {
        const subTotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.totalCost) || 0), 0);
        const tax = parseFloat(formData.orderTax) || 0;
        const discount = parseFloat(formData.discount) || 0;
        const shipping = parseFloat(formData.shipping) || 0;
        return (subTotal + tax + shipping - discount).toFixed(2);
    };

    const handleSave = async () => {
        if (!formData.supplierId || !formData.purchaseDate) {
            toast.error("Please fill required fields (Supplier, Date)");
            return;
        }
        try {
            await inventoryService.createPurchase({
                ...formData,
                totalAmount: calculateGrandTotal()
            });
            toast.success('Purchase Added Successfully!');
            setView('list');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error adding purchase: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 font-sans p-6 gap-6 overflow-hidden w-full relative">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Stock Purchase</h1>
                    <div className="text-sm text-gray-500">Manage your purchases</div>
                </div>
                {view === 'list' && (
                    <div className="flex items-center gap-2">
                        <button className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-50 text-red-500 shadow-sm"><FileText className="w-4 h-4" /></button>
                        <button className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-50 text-green-600 shadow-sm"><FileSpreadsheet className="w-4 h-4" /></button>
                        <button className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-50 text-gray-600 shadow-sm"><RotateCcw className="w-4 h-4" /></button>
                        <button className="px-4 py-2 bg-gray-800 text-white rounded font-bold shadow-sm hover:bg-gray-900 flex items-center gap-2 ml-2">
                            <Download className="w-4 h-4" /> Import
                        </button>
                        <button onClick={() => { setFormData(initialFormState()); setView('add'); }} className="px-4 py-2 bg-orange-500 text-white rounded font-bold shadow-sm hover:bg-orange-600 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Purchase
                        </button>
                    </div>
                )}
            </div>

            {/* List View */}
            {view === 'list' && (
                <div className="bg-white border rounded-lg shadow-sm flex flex-col flex-1 overflow-hidden">
                    <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <input type="text" placeholder="Search" className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
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
                                    <th className="p-4">Payment</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y">
                                {purchases.map((p) => {
                                    const paid = parseFloat(p.paidAmount || 0);
                                    const total = parseFloat(p.totalAmount || 0);
                                    const due = total - paid;
                                    const payStatus = due <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-center"><input type="checkbox" className="rounded border-gray-300" /></td>
                                            <td className="p-4 font-bold text-gray-800">{p.Supplier?.name || 'Unknown'}</td>
                                            <td className="p-4 text-gray-600">{p.invoiceNumber || '-'}</td>
                                            <td className="p-4 text-gray-600">{new Date(p.invoiceDate).toLocaleDateString()}</td>
                                            <td className="p-4"><span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold">{p.status}</span></td>
                                            <td className="p-4 text-gray-800">₹{total.toLocaleString()}</td>
                                            <td className="p-4 text-green-600">₹{paid.toLocaleString()}</td>
                                            <td className="p-4 text-red-500">₹{due.toLocaleString()}</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold text-white ${payStatus === 'Paid' ? 'bg-green-500' : payStatus === 'Unpaid' ? 'bg-red-500' : 'bg-orange-400'}`}>{payStatus}</span></td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button className="p-1.5 border rounded hover:bg-gray-50 text-gray-500"><Eye className="w-3 h-3" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {purchases.length === 0 && <tr><td colSpan="10" className="p-8 text-center text-gray-500">No purchases found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Purchase View */}
            {view === 'add' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
                    <div className="bg-white rounded-lg w-full max-w-6xl shadow-2xl animate-in fade-in zoom-in duration-200 h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">Add Purchase</h2>
                            <button onClick={() => setView('list')} className="text-gray-400 hover:text-red-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Supplier Name <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2 relative">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                                                placeholder="Search Supplier..."
                                                value={supplierSearch}
                                                onChange={e => {
                                                    setSupplierSearch(e.target.value);
                                                    setIsSupplierOpen(true);
                                                }}
                                                onFocus={() => setIsSupplierOpen(true)}
                                            />
                                            {isSupplierOpen && filteredSuppliers.length > 0 && (
                                                <div className="absolute top-full left-0 w-full bg-white border rounded shadow-lg z-10 max-h-40 overflow-y-auto mt-1">
                                                    {filteredSuppliers.map(s => (
                                                        <div key={s.id} className="p-2 hover:bg-gray-50 cursor-pointer text-sm"
                                                            onClick={() => {
                                                                setFormData({ ...formData, supplierId: s.id });
                                                                setSupplierSearch(s.name);
                                                                setIsSupplierOpen(false);
                                                            }}
                                                        >{s.name}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => handleCreateSupplier(supplierSearch)} className="bg-orange-500 text-white rounded w-10 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Purchase Date <span className="text-red-500">*</span></label>
                                    <input type="date" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Reference No.</label>
                                    <input type="text" value={formData.invoiceNumber} onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })} placeholder="REF-001" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm" />
                                </div>
                            </div>

                            <table className="w-full text-left text-sm border rounded-md mb-8">
                                <thead className="bg-gray-100 font-bold text-gray-700 border-b">
                                    <tr>
                                        <th className="p-3">Item Name</th>
                                        <th className="p-3 w-32">Qty</th>
                                        <th className="p-3 w-32">Unit</th>
                                        <th className="p-3 w-32">Unit Cost</th>
                                        <th className="p-3 w-40">Total Cost</th>
                                        <th className="p-3 w-10 text-center"><Trash2 className="w-4 h-4" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {formData.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="p-3">
                                                <select
                                                    value={item.rawMaterialId}
                                                    onChange={e => updateItem(idx, 'rawMaterialId', e.target.value)}
                                                    className="w-full p-2 border rounded outline-none"
                                                >
                                                    <option value="">Select Material</option>
                                                    {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full p-2 border rounded text-center" />
                                            </td>
                                            <td className="p-3"><input value={item.unit} readOnly className="w-full p-2 bg-gray-50 border rounded" /></td>
                                            <td className="p-3"><input type="number" value={item.unitCost} onChange={e => updateItem(idx, 'unitCost', e.target.value)} className="w-full p-2 border rounded" /></td>
                                            <td className="p-3 font-bold text-gray-800">{item.totalCost}</td>
                                            <td className="p-3 text-center"><button onClick={() => removeItem(idx)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan="6" className="p-2 text-center">
                                            <button onClick={addItem} className="text-orange-500 font-medium flex items-center justify-center gap-1 w-full"><Plus className="w-4 h-4" /> Add Item</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="flex justify-end gap-12 border-t pt-6">
                                <div className="space-y-4 w-1/3">
                                    <div className="flex justify-between items-center"><span className="font-semibold text-gray-600">Order Tax</span><input type="number" value={formData.orderTax} onChange={e => setFormData({ ...formData, orderTax: e.target.value })} className="border rounded p-1 w-24 text-right" /></div>
                                    <div className="flex justify-between items-center"><span className="font-semibold text-gray-600">Discount</span><input type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} className="border rounded p-1 w-24 text-right" /></div>
                                    <div className="flex justify-between items-center"><span className="font-semibold text-gray-600">Shipping</span><input type="number" value={formData.shipping} onChange={e => setFormData({ ...formData, shipping: e.target.value })} className="border rounded p-1 w-24 text-right" /></div>
                                    <div className="flex justify-between items-center pt-2 border-t"><span className="font-bold text-xl text-orange-600">Grand Total</span><span className="font-bold text-xl">₹ {calculateGrandTotal()}</span></div>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border rounded p-2">
                                        <option value="Received">Received</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Ordered">Ordered</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded p-2" rows="2"></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t shrink-0 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                            <button onClick={() => setView('list')} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-bold">Cancel</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-orange-500 text-white rounded-md font-bold hover:bg-orange-600 shadow-md">Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function initialFormState() {
    return {
        supplierId: '',
        purchaseDate: getTodayLocal(),
        invoiceNumber: '',
        orderTax: 0,
        discount: 0,
        shipping: 0,
        status: 'Received',
        description: '',
        items: [{ rawMaterialId: '', quantity: '1', unit: '', unitCost: '0', totalCost: '0' }]
    };
}
