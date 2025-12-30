import React, { useState } from 'react';
import { ArrowRightLeft, Store, X, Plus, Trash2, Search, ChevronDown, Calendar } from 'lucide-react';

export default function StockTransfer() {
    const [transfers, setTransfers] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        sourceOutlet: '',
        destinationOutlet: '',
        items: [{ itemId: '', quantity: '', unit: '' }]
    });

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { itemId: '', quantity: '', unit: '' }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    return (
        <div className="p-6 bg-gray-50 h-full flex flex-col font-sans">
            <div className="flex justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Stock Transfers</h1>
                    <div className="text-sm text-gray-500">Manage stock movement between locations</div>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-bold shadow-sm flex items-center gap-2 transition-colors">
                    <ArrowRightLeft className="w-4 h-4" /> New Transfer
                </button>
            </div>

            <div className="bg-white rounded-lg p-12 text-center border border-gray-200 flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Store className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700">No Stock Transfers Yet</h3>
                <p className="text-gray-500 text-sm mt-2">Transfer stock between outlets or kitchen.</p>
            </div>

            {/* Add Transfer Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
                    <div className="bg-white rounded-lg w-full max-w-5xl shadow-2xl animate-in fade-in zoom-in duration-200 h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">New Stock Transfer</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
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
                                    <div className="space-y-1.5 relative">
                                        <label className="text-sm font-semibold text-gray-700">Date <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600" />
                                            <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Source Location <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600">
                                                <option>Main Kitchen</option>
                                                <option>Outlet A</option>
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Destination Location <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-600">
                                                <option>Outlet A</option>
                                                <option>Outlet B</option>
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                                            <tr>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Item / Raw Material</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider w-32">Transfer Qty</th>
                                                <th className="p-3 font-semibold text-xs uppercase tracking-wider w-32">Unit</th>
                                                <th className="p-3 w-10 text-center"><Trash2 className="w-4 h-4 mx-auto text-gray-500" /></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y text-gray-600 bg-white">
                                            {formData.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="p-3">
                                                        <input className="w-full p-2 border border-transparent hover:border-gray-200 focus:border-orange-500 rounded outline-none" placeholder="Search item..." />
                                                    </td>
                                                    <td className="p-3">
                                                        <input className="w-full p-2 border border-gray-200 rounded outline-none focus:border-orange-500 text-center" placeholder="0" />
                                                    </td>
                                                    <td className="p-3">
                                                        <select className="w-full p-2 border-none bg-transparent outline-none text-gray-500">
                                                            <option>Kg</option>
                                                            <option>Pcs</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <td colSpan="4" className="p-2 text-center">
                                                    <button onClick={addItem} className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center justify-center gap-1 w-full dashed-border">
                                                        <Plus className="w-3 h-3" /> Add Item
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Notes / Remarks</label>
                                    <textarea rows="3" className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none" placeholder="Enter transfer details..."></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t shrink-0 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 bg-orange-500 text-white rounded-md font-bold hover:bg-orange-600 shadow-md transition-colors">Transfer Stock</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
