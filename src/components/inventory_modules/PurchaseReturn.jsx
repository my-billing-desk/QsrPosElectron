import React, { useState, useEffect } from 'react';
import {
    Search, ChevronDown, Plus, FileText, RotateCcw, Eye, Trash2, X,
    Calendar, Download, ShoppingBag, Settings, MoreVertical, Edit2,
    Filter, ArrowUpDown, Upload, UserPlus, FileQuestion
} from 'lucide-react';
import { inventoryService } from '../../services/api';
import { getTodayLocal } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

export default function PurchaseReturn() {
    const [returns, setReturns] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('list');
    const [isSaving, setIsSaving] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterQuery, setFilterQuery] = useState('');

    const [formData, setFormData] = useState(initialFormState());
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [retRes, supRes, matRes, purRes, poRes] = await Promise.all([
                inventoryService.getPurchaseReturns(),
                inventoryService.getSuppliers(),
                inventoryService.getRawMaterials(),
                inventoryService.getPurchases(),
                inventoryService.getPurchaseOrders()
            ]);
            setReturns(retRes.data || []);
            setSuppliers(supRes.data || []);
            setRawMaterials(matRes.data || []);
            setPurchases(purRes.data || []);
            setPurchaseOrders(poRes.data || []);
        } catch (error) {
            console.error('Failed to load return data:', error);
            toast.error("Failed to load records");
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...initialItemState }]
        }));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];

        if (field === 'rawMaterialId') {
            const mat = rawMaterials.find(m => m.id == value);
            if (mat) {
                newItems[index].rawMaterialId = mat.id;
                newItems[index].name = mat.name;
                newItems[index].unit = mat.purchaseUnit || mat.consumptionUnit;
                newItems[index].price = mat.purchasePrice || 0;
            } else {
                newItems[index].rawMaterialId = '';
                newItems[index].name = '';
            }
        } else {
            newItems[index][field] = value;
        }

        const qty = parseFloat(newItems[index].quantity) || 0;
        const price = parseFloat(newItems[index].price) || 0;
        newItems[index].amount = (qty * price).toFixed(2);

        setFormData({ ...formData, items: newItems });
        if (field === 'rawMaterialId') setFocusedIndex(null);
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const calculateGrandTotal = () => {
        return formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2);
    };

    const applyPurchaseData = (purchase) => {
        if (!purchase) return;
        setFormData(prev => ({
            ...prev,
            supplierId: purchase.supplierId || purchase.Supplier?.id || prev.supplierId,
            purchaseId: purchase.id,
            items: purchase.PurchaseItems?.map(item => ({
                rawMaterialId: item.rawMaterialId,
                name: item.RawMaterial?.name || 'Item',
                quantity: item.quantity,
                unit: item.unit || item.RawMaterial?.purchaseUnit || '',
                price: item.price,
                amount: item.amount || (item.quantity * item.price).toFixed(2)
            })) || prev.items
        }));
    };

    const handleSave = async () => {
        if (!formData.supplierId) return toast.error('Please select a supplier');
        if (formData.items.length === 0) return toast.error('Please add at least one item');

        setIsSaving(true);
        try {
            await inventoryService.createPurchaseReturn({
                ...formData,
                grandTotal: calculateGrandTotal()
            });
            toast.success('Purchase Return Saved Successfully!');
            setView('list');
            loadData();
        } catch (error) {
            toast.error('Error saving return: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddQuickSupplier = async () => {
        if (!newSupplier.name) return toast.error("Supplier name is required");
        try {
            const res = await inventoryService.createSupplier(newSupplier);
            toast.success("Supplier added!");
            const added = res.data;
            setSuppliers(prev => [...prev, added]);
            setFormData(prev => ({ ...prev, supplierId: added.id }));
            setShowSupplierModal(false);
            setNewSupplier({ name: '', phone: '', email: '' });
        } catch (error) {
            console.error(error);
            toast.error("Failed to add supplier");
        }
    };

    const totals = {
        total: returns.reduce((sum, r) => sum + (parseFloat(r.grandTotal) || 0), 0).toFixed(2),
        count: returns.length,
        avg: returns.length ? (returns.reduce((sum, r) => sum + (parseFloat(r.grandTotal) || 0), 0) / returns.length).toFixed(2) : '0.00'
    };

    if (view === 'list') {
        return (
            <div className="flex flex-col h-full bg-[#f8f9fa] font-sans p-6 gap-6 overflow-x-hidden text-left">
                {/* Header Area */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-[#1a1a1a] uppercase tracking-tight">Purchase Returns</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Manage vendor returns & debit notes</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setFormData(initialFormState()); setView('add'); }}
                            className="px-6 py-3 bg-[#d92d20] text-white rounded-2xl font-black shadow-2xl shadow-red-500/20 hover:bg-[#b42318] flex items-center gap-2 transition-all transform hover:scale-105 uppercase tracking-widest text-xs"
                        >
                            <Plus className="w-4 h-4" /> New Return
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
                        <div className="flex items-center gap-2 text-gray-600 relative z-10">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Return Value</span>
                        </div>
                        <div className="text-3xl font-black text-gray-900 flex items-center gap-1 relative z-10 italic">
                            <span className="text-gray-400 font-medium">₹</span> {totals.total}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
                        <div className="flex items-center gap-2 text-gray-600 relative z-10">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Transactions</span>
                        </div>
                        <div className="text-3xl font-black text-gray-900 flex items-center gap-1 relative z-10 italic">
                            {totals.count} <span className="text-xs font-bold text-gray-400 ml-2">Units</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
                        <div className="flex items-center gap-2 text-gray-600 relative z-10">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Average Return</span>
                        </div>
                        <div className="text-3xl font-black text-gray-900 flex items-center gap-1 relative z-10 italic">
                            <span className="text-gray-400 font-medium">₹</span> {totals.avg}
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="p-6 border-b flex justify-between items-center gap-4 bg-gray-50/30">
                        <div className="flex gap-4 items-center">
                            <div className="relative w-80">
                                <input
                                    type="text"
                                    placeholder="Search returns or suppliers..."
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-red-500/5 focus:border-[#d92d20] outline-none transition-all shadow-sm"
                                    value={filterQuery}
                                    onChange={e => setFilterQuery(e.target.value)}
                                />
                                <Search className="w-5 h-5 text-gray-300 absolute left-4 top-3" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={loadData} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 transition-all shadow-sm"><RotateCcw className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#fcfcfc] text-[10px] uppercase font-black text-gray-400 border-b tracking-[0.15em]">
                                <tr>
                                    <th className="p-6">Supplier</th>
                                    <th className="p-6">Date</th>
                                    <th className="p-6">Debit Note #</th>
                                    <th className="p-6">Reason</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-right">Value (₹)</th>
                                    <th className="p-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {returns.filter(r =>
                                (r.debitNoteNumber.toLowerCase().includes(filterQuery.toLowerCase()) ||
                                    r.Supplier?.name.toLowerCase().includes(filterQuery.toLowerCase()))
                                ).map((r) => (
                                    <tr key={r.id} className="hover:bg-red-50/30 transition-colors group">
                                        <td className="p-6">
                                            <div className="font-black text-gray-900 tracking-tight">{r.Supplier?.name}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Vendor Account</div>
                                        </td>
                                        <td className="p-6 text-gray-600 font-bold">
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-black font-mono shadow-sm">
                                                {r.debitNoteNumber}
                                            </span>
                                        </td>
                                        <td className="p-6 max-w-xs">
                                            <div className="text-gray-500 italic truncate font-medium">{r.reason || 'No specific reason'}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${r.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                {r.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right font-black text-gray-900 italic tracking-tighter text-lg">
                                            ₹{parseFloat(r.grandTotal || 0).toFixed(2)}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-center gap-2">
                                                <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl text-gray-300 hover:text-blue-500 transition-all"><Eye className="w-4 h-4" /></button>
                                                <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl text-gray-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {returns.length === 0 && !loading && (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                                    <FileQuestion className="w-10 h-10 text-gray-200" />
                                </div>
                                <div className="text-gray-400 italic font-bold">No purchase returns records found.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Modal View
    return (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 overflow-hidden text-left">
            <div className="bg-white rounded-[2rem] w-full max-w-6xl shadow-2xl flex flex-col max-h-[96vh] border border-white/20 animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">New Purchase Return</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap">Generate debit note for supplier</p>
                    </div>
                    <button onClick={() => setView('list')} className="w-8 h-8 text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 bg-[#fcfcfc] custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Master Fields */}
                        <div className="grid grid-cols-5 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Invoice (Link)</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-500 appearance-none transition-all"
                                    value={formData.purchaseId}
                                    onChange={e => {
                                        const pur = purchases.find(p => p.id == e.target.value);
                                        if (pur) applyPurchaseData(pur);
                                    }}
                                >
                                    <option value="">Direct Return (No Link)</option>
                                    {purchases.map(p => (
                                        <option key={p.id} value={p.id}>{p.invoiceNumber} (₹{p.grandTotal})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PO Reference</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-500 appearance-none transition-all"
                                    value={formData.poId}
                                    onChange={e => setFormData({ ...formData, poId: e.target.value })}
                                >
                                    <option value="">No PO</option>
                                    {purchaseOrders.map(po => (
                                        <option key={po.id} value={po.id}>{po.poNumber}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier *</label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-500 transition-all appearance-none"
                                        value={formData.supplierId}
                                        onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <button
                                        onClick={() => setShowSupplierModal(true)}
                                        className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Return Date *</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
                                    value={formData.debitNoteDate}
                                    onChange={e => setFormData({ ...formData, debitNoteDate: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Debit Note # (Auto)</label>
                                <input
                                    type="text"
                                    readOnly
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-500 outline-none font-mono"
                                    value={formData.debitNoteNumber}
                                />
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex justify-start items-center gap-3 pt-4 border-t border-gray-50">
                            <button onClick={addItem} className="px-4 py-2 border border-blue-100 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 flex items-center gap-2 transition-all">
                                <Plus className="w-4 h-4" /> Add Item
                            </button>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-auto border border-gray-100 rounded-xl shadow-sm bg-white min-h-[400px]">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/80 border-b border-gray-100">
                                    <tr className="text-gray-600 text-[10px] font-black uppercase tracking-widest text-center">
                                        <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded" /></th>
                                        <th className="px-4 py-3 text-left w-80">Raw Material <span className="text-red-500">*</span></th>
                                        <th className="px-4 py-3 w-28">Qty <span className="text-red-500">*</span></th>
                                        <th className="px-4 py-3 w-28">Unit</th>
                                        <th className="px-4 py-3 text-right w-32">Original Price</th>
                                        <th className="px-4 py-3 text-right w-32">Return Amount</th>
                                        <th className="px-4 py-3 w-20">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {formData.items.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-blue-50/10 transition-colors">
                                            <td className="px-4 py-6 text-center"><input type="checkbox" className="rounded" /></td>
                                            <td className="px-4 py-6 relative">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
                                                        placeholder="Select Material"
                                                        value={focusedIndex === idx ? searchQuery : (item.name || '')}
                                                        onFocus={() => {
                                                            setFocusedIndex(idx);
                                                            setSearchQuery(item.name || '');
                                                        }}
                                                        onChange={e => setSearchQuery(e.target.value)}
                                                    />
                                                    {focusedIndex === idx && (
                                                        <>
                                                            <div className="fixed inset-0 z-[100]" onClick={() => setFocusedIndex(null)}></div>
                                                            <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-[110] mt-1 max-h-60 overflow-y-auto p-1">
                                                                {rawMaterials.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                                                                    rawMaterials
                                                                        .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                                        .map(m => (
                                                                            <button
                                                                                key={m.id}
                                                                                onClick={() => updateItem(idx, 'rawMaterialId', m.id)}
                                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700 rounded-md transition-colors flex justify-between items-center group"
                                                                            >
                                                                                <span className="font-medium">{m.name}</span>
                                                                                <span className="text-[10px] text-gray-400 group-hover:text-blue-500">Select</span>
                                                                            </button>
                                                                        ))
                                                                ) : (
                                                                    <div className="p-3 text-xs text-center text-gray-400 italic">No materials found</div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-6">
                                                <input
                                                    type="number"
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-center outline-none focus:border-blue-500 bg-orange-50/30 text-orange-700"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-4 py-6 text-center">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.unit || '---'}</span>
                                            </td>
                                            <td className="px-4 py-6">
                                                <input
                                                    type="number"
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-right outline-none focus:border-blue-500"
                                                    value={item.price}
                                                    onChange={e => updateItem(idx, 'price', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-4 py-6">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-bold text-right text-gray-600"
                                                    value={item.amount}
                                                />
                                            </td>
                                            <td className="px-4 py-6 text-center">
                                                <button onClick={() => removeItem(idx)} className="p-1.5 hover:text-red-500 text-gray-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary & Reasoning */}
                        <div className="flex justify-between items-start pt-8 pb-12">
                            <div className="w-1/2 space-y-6">
                                <div className="max-w-md">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Reason for Return *</label>
                                    <textarea
                                        placeholder="Damage, quality issue, mismatch, etc..."
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-blue-500 h-24 bg-white/50"
                                        value={formData.reason}
                                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="w-1/3 flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Return Value</span>
                                <div className="text-5xl font-black text-gray-900 tracking-tighter flex items-start gap-1">
                                    <span className="text-xl mt-2 text-gray-400">₹</span>
                                    {calculateGrandTotal()}
                                </div>
                                <div className="w-full h-px bg-gray-100 my-4"></div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Net amount to be debited</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-[#fff1f1] px-8 py-4 border-t border-red-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-red-100 shadow-sm">
                            <RotateCcw className="w-5 h-5 text-[#d92d20]" />
                        </div>
                        <div>
                            <span className="text-sm font-black text-gray-700">Account Adjustment</span>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">This will update supplier outstanding balance</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setView('list')} className="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-10 py-3 bg-[#d92d20] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b42318] transition-all shadow-xl shadow-red-500/20 disabled:opacity-50"
                        >
                            {isSaving ? 'Processing...' : 'Finalize Return'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Supplier Modal */}
            {showSupplierModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <UserPlus className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="font-black text-gray-900 uppercase tracking-tight">Quick Add Supplier</h3>
                            </div>
                            <button onClick={() => setShowSupplierModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Supplier Name *</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all font-sans"
                                    placeholder="e.g. Fresh Farms Ltd"
                                    value={newSupplier.name}
                                    onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none font-sans"
                                    placeholder="+91 00000 00000"
                                    value={newSupplier.phone}
                                    onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowSupplierModal(false)} className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                            <button onClick={handleAddQuickSupplier} className="flex-1 py-3 bg-[#d92d20] text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Add Supplier</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const initialItemState = {
    rawMaterialId: '',
    name: '',
    quantity: 1,
    unit: '',
    price: 0,
    amount: 0
};

function initialFormState() {
    return {
        supplierId: '',
        purchaseId: '',
        poId: '',
        debitNoteDate: getTodayLocal(),
        debitNoteNumber: `DN-${Date.now().toString().slice(-6)}`,
        items: [{ ...initialItemState }],
        reason: '',
        status: 'Completed'
    };
}
