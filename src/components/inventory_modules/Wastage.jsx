import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Download, Search, Filter, Calendar, X, ChevronDown, List } from 'lucide-react';
import { inventoryService } from '../../services/api';
import toast from 'react-hot-toast';

export default function Wastage() {
    const [view, setView] = useState('list');
    const [wastages, setWastages] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [formData, setFormData] = useState(initialFormState());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [matRes, wastRes] = await Promise.all([
                inventoryService.getRawMaterials(),
                inventoryService.getWastages()
            ]);
            setRawMaterials(matRes.data || []);
            setWastages(wastRes.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { rawMaterialId: '', quantity: '', unit: '', avgPrice: 0, amount: 0, description: '' }]
        });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'rawMaterialId') {
            const mat = rawMaterials.find(m => m.id == value);
            if (mat) {
                newItems[index].unit = mat.consumptionUnit;
                newItems[index].avgPrice = mat.purchasePrice || 0; // Assuming purchasePrice as avg for now
            }
        }

        // Calculations
        if (field === 'quantity' || field === 'rawMaterialId') {
            const qty = parseFloat(newItems[index].quantity) || 0;
            const price = parseFloat(newItems[index].avgPrice) || 0;
            newItems[index].amount = (qty * price).toFixed(2);
        }

        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSave = async () => {
        try {
            const total = formData.items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
            await inventoryService.createWastage({ ...formData, totalAmount: total });
            toast.success('Wastage record saved!');
            setView('list');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error saving wastage: ' + error.message);
        }
    };

    const calculateTotal = () => {
        return formData.items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0).toFixed(2);
    };

    return (
        <div className="flex flex-col h-full p-6 bg-gray-50 font-sans relative">
            {/* List View */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Wastage List</h1>
                    <div className="text-sm text-gray-500">Track and manage inventory wastage</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setFormData(initialFormState()); setView('add'); }} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 font-medium shadow-sm">
                        <Plus className="w-4 h-4" /> Record Wastage
                    </button>
                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 font-medium shadow-sm">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Start Date</label>
                    <div className="relative">
                        <input type="date" className="p-2 pl-9 border rounded text-sm bg-gray-50 text-gray-600" />
                        <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">End Date</label>
                    <div className="relative">
                        <input type="date" className="p-2 pl-9 border rounded text-sm bg-gray-50 text-gray-600" />
                        <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                </div>
                <div className="flex flex-col gap-1 min-w-[150px]">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Type</label>
                    <select className="p-2 border rounded text-sm bg-gray-50 text-gray-600"><option>All</option></select>
                </div>

                <div className="flex gap-2 ml-auto">
                    <button className="px-6 py-2 bg-red-50 border border-red-200 text-red-600 rounded font-bold hover:bg-red-100 transition-colors">Search</button>
                    <button className="px-6 py-2 bg-white border border-gray-300 text-gray-600 rounded font-bold hover:bg-gray-50 transition-colors">Clear</button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase text-gray-700">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Items</th>
                            <th className="p-4 text-right">Total Amount</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {wastages.map(w => (
                            <tr key={w.id} className="hover:bg-gray-50">
                                <td className="p-4 text-gray-600 font-medium">{new Date(w.date).toLocaleDateString()}</td>
                                <td className="p-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold border border-gray-200">{w.type}</span></td>
                                <td className="p-4 text-gray-500">{w.WastageItems?.length} items</td>
                                <td className="p-4 text-right font-bold text-gray-800">₹ {w.totalAmount}</td>
                                <td className="p-4 text-center"><span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Recorded</span></td>
                            </tr>
                        ))}
                        {wastages.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <div className="bg-gray-50 p-4 rounded-full mb-3"><Search className="w-6 h-6 text-gray-300" /></div>
                                        <span className="font-bold text-gray-400">No Wastage Records Found</span>
                                        <p className="text-xs mt-1 text-gray-400">Add a new record to get started.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Wastage Modal Overlay */}
            {view === 'add' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
                    <div className="bg-white rounded-lg w-full max-w-6xl shadow-2xl animate-in fade-in zoom-in duration-200 h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">Record Wastage</h2>
                            <button onClick={() => setView('list')} className="text-gray-400 hover:text-red-500 transition-colors">
                                <span className="bg-white rounded-full p-1 border border-transparent hover:border-red-500 flex items-center justify-center">
                                    <div className="bg-red-500 text-white rounded-full p-0.5">
                                        <X className="w-4 h-4" />
                                    </div>
                                </span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="space-y-8">
                                {/* Top Form */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Wastage Type <span className="text-red-500">*</span></label>
                                        <div className="flex gap-4 p-3 bg-gray-50 rounded border border-gray-200">
                                            <label className="flex items-center gap-2 cursor-pointer hover:text-orange-600 transition-colors">
                                                <input type="radio" checked={formData.type === 'Raw Material'} onChange={() => setFormData({ ...formData, type: 'Raw Material', items: [] })} className="accent-orange-500 w-4 h-4" />
                                                <span className="text-sm font-bold text-gray-700">Raw Material</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer hover:text-orange-600 transition-colors">
                                                <input type="radio" checked={formData.type === 'Item'} onChange={() => setFormData({ ...formData, type: 'Item', items: [] })} className="accent-orange-500 w-4 h-4" />
                                                <span className="text-sm font-bold text-gray-700">Processed Item</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 relative">
                                        <label className="text-sm font-semibold text-gray-700">Wastage Date <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600"
                                            />
                                            <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                                            <tr>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider">
                                                    {formData.type === 'Raw Material' ? 'Raw Material' : 'Item'}
                                                </th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider w-32">Quantity</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider w-24">Unit</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider w-32">Avg Price</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider w-32">Amount</th>
                                                <th className="p-3 w-10 text-center"><Trash2 className="w-4 h-4 mx-auto text-gray-500" /></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y text-gray-600 bg-white">
                                            {formData.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="p-3">
                                                        <select
                                                            value={item.rawMaterialId}
                                                            onChange={e => updateItem(idx, 'rawMaterialId', e.target.value)}
                                                            className="w-full p-2 border border-blue-100 rounded focus:border-orange-500 outline-none bg-transparent"
                                                        >
                                                            <option value="">Select Material</option>
                                                            {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center border rounded-md overflow-hidden">
                                                            <button onClick={() => updateItem(idx, 'quantity', Math.max(0, (parseFloat(item.quantity) || 0) - 1))} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border-r">-</button>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                                className="w-full text-center outline-none py-1"
                                                            />
                                                            <button onClick={() => updateItem(idx, 'quantity', (parseFloat(item.quantity) || 0) + 1)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border-l">+</button>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            value={item.unit}
                                                            readOnly
                                                            className="w-full p-1.5 border-none bg-transparent text-gray-500"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="text-gray-500">₹ {item.avgPrice || 0}</span>
                                                    </td>
                                                    <td className="p-3 font-semibold text-gray-800">
                                                        ₹ {item.amount || 0}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <td colSpan="6" className="p-2 text-center">
                                                    <button onClick={addItem} className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center justify-center gap-1 w-full dashed-border">
                                                        <Plus className="w-3 h-3" /> Add Item
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Summary */}
                                <div className="flex justify-end">
                                    <div className="w-full md:w-1/3">
                                        <div className="border rounded-md divide-y text-sm">
                                            <div className="flex justify-between p-3 bg-gray-50 font-bold">
                                                <span className="text-gray-700">Total Wastage Value</span>
                                                <span className="text-red-600">₹ {calculateTotal()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t shrink-0 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                            <button onClick={() => setView('list')} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 shadow-md transition-colors">Save Details</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function initialFormState() {
    return {
        date: new Date().toISOString().split('T')[0],
        type: 'Raw Material',
        items: [{ rawMaterialId: '', quantity: '', unit: '', avgPrice: 0, amount: 0, description: '' }]
    };
}
