import React, { useState, useEffect } from 'react';
import { X, Check, Clock, Calendar, UploadCloud } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AreaPriceUpdateModal({ item, onClose, onSave }) {
    const { user } = useAuth();
    const [basePrice, setBasePrice] = useState(item?.price || 0);
    const [isActive, setIsActive] = useState(true);
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    // Mock areas based on screenshot + typical setup
    // Ideally this comes from an API that combines Service Modes (DineIn/TakeAway) & Aggregators
    const [areas, setAreas] = useState([
        { id: '1', name: 'Home Delivery', price: item?.price || 0, status: true },
        { id: '2', name: 'Parcel', price: item?.price || 0, status: true },
        { id: '3', name: 'Dine in', price: item?.price || 0, status: true },
        { id: '4', name: 'Zomato', price: item?.price ? Math.round(item.price * 1.68) : 0, status: true }, // Hypothetical markup
        { id: '5', name: `Eksecond_${user?.tenantName || 'Store'}`, price: item?.price ? Math.round(item.price * 1.6) : 0, status: true },
        { id: '6', name: `Uengage (ONDC)_${user?.tenantName || 'Store'}`, price: item?.price || 0, status: false },
        { id: '7', name: `Magicpin_${user?.tenantName || 'Store'}`, price: item?.price ? item.price * 1.8 : 0, status: true },
    ]);

    useEffect(() => {
        if (item) {
            setBasePrice(item.price);

            if (item.areaPrices && Array.isArray(item.areaPrices)) {
                setAreas(item.areaPrices);
            } else {
                // Initial Default Areas
                setAreas([
                    { id: '1', name: 'Home Delivery', price: item.price || 0, status: true },
                    { id: '2', name: 'Parcel', price: item.price || 0, status: true },
                    { id: '3', name: 'Dine in', price: item.price || 0, status: true },
                    { id: '4', name: 'Zomato', price: item.price ? Math.round(item.price * 1.68) : 0, status: true },
                    { id: '5', name: `Eksecond_${user?.tenantName || 'Store'}`, price: item.price ? Math.round(item.price * 1.6) : 0, status: true },
                    { id: '6', name: `Uengage (ONDC)_${user?.tenantName || 'Store'}`, price: item.price || 0, status: false },
                    { id: '7', name: `Magicpin_${user?.tenantName || 'Store'}`, price: item.price ? item.price * 1.8 : 0, status: true },
                ]);
            }
        }
    }, [item, user]);

    const handleAreaChange = (id, field, value) => {
        setAreas(areas.map(area =>
            area.id === id ? { ...area, [field]: value } : area
        ));
    };

    const handleBasePriceChange = (e) => {
        const val = parseFloat(e.target.value) || 0;
        setBasePrice(val);

        // Sync logic: Update all area prices to match the new base price
        setAreas(areas.map(area => ({
            ...area,
            price: val
        })));
    };

    const confirmSchedule = () => {
        // Implement schedule logic or just toast
        console.log("Schedule:", scheduleDate, scheduleTime);
        setShowSchedule(false);
    };

    const handleSave = () => {
        onSave({
            itemId: item.id,
            basePrice,
            isActive,
            areaPrices: areas
        });
        onClose();
    };

    if (!item) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">Update Item</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 text-lg mb-4">{user?.tenantName || 'Store Name'}</h3>

                        {/* Base Item Row */}
                        <div className="grid grid-cols-12 gap-4 items-center mb-6">
                            <div className="col-span-8">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Item Name</label>
                                <div className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-700">{item.name}</div>
                            </div>
                            <div className="col-span-3">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Price *</label>
                                <input
                                    type="number"
                                    value={basePrice}
                                    onChange={handleBasePriceChange}
                                    className="w-full p-2 border border-gray-300 rounded focus:border-red-500 outline-none"
                                />
                            </div>
                            <div className="col-span-1 flex flex-col items-center">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Active</label>
                                <button
                                    onClick={() => setIsActive(!isActive)}
                                    className={`w-6 h-6 rounded border flex items-center justify-center ${isActive ? 'bg-green-50 border-green-500 text-green-600' : 'border-gray-300 text-transparent'}`}
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Note */}
                        <div className="flex items-start gap-2 text-xs text-gray-500 mb-6 font-medium">
                            <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] font-mono shrink-0">-</div>
                            <p>Area Details Note:- While update Item Price, It will also update Item area price.</p>
                        </div>

                        {/* Areas Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-700">
                                <div className="col-span-8">Area Name</div>
                                <div className="col-span-3">Price *</div>
                                <div className="col-span-1 text-center">Status</div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {areas.map(area => (
                                    <div key={area.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50">
                                        <div className="col-span-8 text-sm font-medium text-gray-800">
                                            {area.name}
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                value={area.price}
                                                onChange={(e) => handleAreaChange(area.id, 'price', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:border-red-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <button
                                                onClick={() => handleAreaChange(area.id, 'status', !area.status)}
                                                className={`w-6 h-6 rounded border flex items-center justify-center ${area.status ? 'bg-green-50 border-green-500 text-green-600' : 'border-gray-300 text-transparent'}`}
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex justify-between gap-3 bg-gray-50 rounded-b-lg items-center relative">
                    <div className="flex gap-2">
                        {item.lastPublishedAt && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Last published: {new Date(item.lastPublishedAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded font-bold text-gray-600 hover:bg-white bg-white text-sm"
                        >
                            Cancel
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowSchedule(!showSchedule)}
                                className="px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded font-bold hover:bg-blue-100 flex items-center gap-2 text-sm"
                            >
                                <Calendar className="w-4 h-4" /> Schedule
                            </button>

                            {showSchedule && (
                                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">Schedule Update</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Date</label>
                                            <input
                                                type="date"
                                                className="w-full text-sm border rounded p-1"
                                                value={scheduleDate}
                                                onChange={e => setScheduleDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Time</label>
                                            <input
                                                type="time"
                                                className="w-full text-sm border rounded p-1"
                                                value={scheduleTime}
                                                onChange={e => setScheduleTime(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={confirmSchedule}
                                            className="w-full bg-blue-600 text-white text-sm font-bold py-2 rounded hover:bg-blue-700"
                                        >
                                            Confirm Schedule
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => handleSave(false)}
                            className="px-4 py-2 border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-100 bg-white text-sm"
                        >
                            Save Draft
                        </button>

                        <button
                            onClick={() => handleSave(true)}
                            className="px-4 py-2 bg-red-800 text-white rounded font-bold hover:bg-red-900 flex items-center gap-2 text-sm"
                        >
                            <UploadCloud className="w-4 h-4" /> Publish Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
