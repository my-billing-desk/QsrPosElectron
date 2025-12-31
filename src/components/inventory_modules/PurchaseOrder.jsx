import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, MoreHorizontal, Clock, ShoppingCart, Truck, ChevronDown, Search, X, Calendar, CornerDownLeft, Download, List } from 'lucide-react';
import { inventoryService } from '../../services/api';
import toast from 'react-hot-toast';

export default function PurchaseOrder() {
    const [view, setView] = useState('list');
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);

    const [formData, setFormData] = useState(initialFormState());

    // Supplier Search State
    const [supplierSearch, setSupplierSearch] = useState('');
    const [isSupplierOpen, setIsSupplierOpen] = useState(false);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);

    useEffect(() => {
        if (!supplierSearch) {
            setFilteredSuppliers(suppliers);
        } else {
            setFilteredSuppliers(suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())));
        }
    }, [supplierSearch, suppliers]);

    const handleCreateSupplier = (name) => {
        const newSupplier = { id: Date.now().toString(), name }; // Temporary ID
        setSuppliers([...suppliers, newSupplier]);
        setFormData({ ...formData, supplierId: newSupplier.id });
        setSupplierSearch('');
        setIsSupplierOpen(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [matRes, supRes, ordRes] = await Promise.all([
                inventoryService.getRawMaterials(),
                inventoryService.getSuppliers(),
                inventoryService.getPurchaseOrders()
            ]);
            setRawMaterials(matRes.data || []);
            setSuppliers(supRes.data || []);
            setOrders(ordRes.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { rawMaterialId: '', quantity: '', unit: '', price: '', amount: 0 }]
        });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'quantity' || field === 'price') {
            const qty = parseFloat(newItems[index].quantity) || 0;
            const price = parseFloat(newItems[index].price) || 0;
            newItems[index].amount = (qty * price).toFixed(2);
        }

        if (field === 'rawMaterialId') {
            const mat = rawMaterials.find(m => m.id == value);
            if (mat) newItems[index].unit = mat.purchaseUnit;
        }

        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateSubTotal = () => {
        return formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    };

    const calculateGrandTotal = () => {
        const subTotal = calculateSubTotal();
        const tax = parseFloat(formData.orderTax) || 0;
        const discount = parseFloat(formData.discount) || 0;
        const shipping = parseFloat(formData.shipping) || 0;
        return (subTotal + tax + shipping - discount).toFixed(2);
    };

    const handleSave = async () => {
        try {
            await inventoryService.createPurchaseOrder({
                ...formData,
                grandTotal: calculateGrandTotal()
            });
            toast.success('Purchase Order Created!');
            setView('list');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error creating PO: ' + error.message);
        }
    };

    const handleReturn = async (orderId) => {
        if (!confirm("Are you sure you want to mark this order as Returned?")) return;
        try {
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'Returned' } : o));
            toast.success("Order marked as Returned.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to return order");
        }
    };

    return (
        <div className="p-6 bg-gray-50 h-full flex flex-col relative font-sans">
            <div className="flex justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
                    <div className="text-sm text-gray-500">Manage your purchase orders</div>
                </div>
                <button onClick={() => { setFormData(initialFormState()); setView('add'); }} className="px-4 py-2 bg-orange-500 text-white rounded font-bold shadow-sm hover:bg-orange-600 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Purchase Order
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-bold text-gray-700 text-sm">Delivery Date</th>
                            <th className="p-4 font-bold text-gray-700 text-sm">Supplier</th>
                            <th className="p-4 font-bold text-gray-700 text-sm">Status</th>
                            <th className="p-4 font-bold text-gray-700 text-sm text-right">Amount</th>
                            <th className="p-4 font-bold text-gray-700 text-sm text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {orders.map(o => (
                            <tr key={o.id} className="hover:bg-gray-50">
                                <td className="p-4 text-gray-600">{new Date(o.deliveryDate).toLocaleDateString()}</td>
                                <td className="p-4 font-medium text-gray-800">{o.Supplier?.name}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${o.status === 'Returned' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                        {o.status || 'Received'}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-bold text-gray-800">₹ {o.grandTotal}</td>
                                <td className="p-4 text-center">
                                    <div className="relative group inline-block">
                                        <button className="p-1 hover:bg-gray-100 rounded text-gray-500">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block z-20">
                                            <button
                                                onClick={() => handleReturn(o.id)}
                                                className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 text-red-600 font-medium flex items-center gap-2"
                                            >
                                                <CornerDownLeft className="w-3 h-3" /> Return
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No orders found.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal Overlay */}
            {view === 'add' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
                    <div className="bg-white rounded-lg w-full max-w-6xl shadow-2xl animate-in fade-in zoom-in duration-200 h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">Add Purchase Order</h2>
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Supplier Name <span className="text-red-500">*</span></label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600"
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
                                                            <div
                                                                key={s.id}
                                                                className="p-2 hover:bg-gray-50 cursor-pointer text-sm"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, supplierId: s.id });
                                                                    setSupplierSearch(s.name);
                                                                    setIsSupplierOpen(false);
                                                                }}
                                                            >
                                                                {s.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                            </div>
                                            <button onClick={() => handleCreateSupplier(supplierSearch)} className="bg-orange-500 text-white rounded-md w-10 flex items-center justify-center hover:bg-orange-600 transition-colors"><Plus className="w-4 h-4" /></button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 relative">
                                        <label className="text-sm font-semibold text-gray-700">Delivery Date <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={formData.deliveryDate}
                                                onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600"
                                            />
                                            <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">PO No.</label>
                                        <input
                                            type="text"
                                            value={formData.poNumber}
                                            onChange={e => setFormData({ ...formData, poNumber: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600"
                                            placeholder="PO-001"
                                        />
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                                            <tr>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Raw Material</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider w-32">Qty</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider w-32">Unit</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider w-32">Price($)</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider w-40">Amount($)</th>
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
                                                            onChange={e => updateItem(idx, 'unit', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-200 rounded outline-none"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={e => updateItem(idx, 'price', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-200 rounded outline-none"
                                                        />
                                                    </td>
                                                    <td className="p-3 font-semibold text-gray-800">
                                                        {item.amount}
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
                                            <div className="flex justify-between p-3">
                                                <span className="text-gray-600">Order Tax</span>
                                                <span className="font-medium text-gray-800">₹ {parseFloat(formData.orderTax || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between p-3">
                                                <span className="text-gray-600">Discount</span>
                                                <span className="font-medium text-gray-800">₹ {parseFloat(formData.discount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between p-3">
                                                <span className="text-gray-600">Shipping</span>
                                                <span className="font-medium text-gray-800">₹ {parseFloat(formData.shipping || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between p-3 bg-gray-50 font-bold">
                                                <span className="text-orange-600">Grand Total</span>
                                                <span className="text-gray-900">₹ {calculateGrandTotal()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Form Section */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Order Tax</label>
                                        <input
                                            type="number"
                                            value={formData.orderTax}
                                            onChange={e => setFormData({ ...formData, orderTax: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Discount</label>
                                        <input
                                            type="number"
                                            value={formData.discount}
                                            onChange={e => setFormData({ ...formData, discount: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Shipping</label>
                                        <input
                                            type="number"
                                            value={formData.shipping}
                                            onChange={e => setFormData({ ...formData, shipping: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Status</label>
                                        <div className="relative">
                                            <select
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600"
                                            >
                                                <option value="Received">Received</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Ordered">Ordered</option>
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
                                        <textarea
                                            rows="3"
                                            className="w-full p-3 text-sm focus:outline-none resize-none"
                                            placeholder="Enter notes..."
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t shrink-0 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                            <button onClick={() => setView('list')} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-orange-500 text-white rounded-md font-bold hover:bg-orange-600 shadow-md transition-colors">Submit</button>
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
        deliveryDate: new Date().toISOString().split('T')[0],
        deliveryTime: '12:00',
        poNumber: '1',
        orderTax: 0,
        discount: 0,
        shipping: 0,
        status: 'Ordered',
        description: '',
        items: [{ rawMaterialId: '', quantity: '', unit: '', price: '', amount: 0 }]
    };
}
