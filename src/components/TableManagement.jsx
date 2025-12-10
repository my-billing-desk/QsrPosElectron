import React, { useState } from 'react';
import { Users, Clock, RotateCcw } from 'lucide-react';

export function TableManagement({ onTableSelect }) {
    // Mock Data
    const [tables, setTables] = useState([
        { id: 1, name: 'T1', status: 'empty', capacity: 4, area: 'Ground Floor' },
        { id: 2, name: 'T2', status: 'occupied', capacity: 2, area: 'Ground Floor', time: '12m', amount: 45.00 },
        { id: 3, name: 'T3', status: 'empty', capacity: 4, area: 'Ground Floor' },
        { id: 4, name: 'T4', status: 'billed', capacity: 6, area: 'Ground Floor', time: '45m', amount: 120.50 },
        { id: 5, name: 'T5', status: 'empty', capacity: 2, area: 'Terrace' },
        { id: 6, name: 'T6', status: 'occupied', capacity: 8, area: 'Terrace', time: '5m', amount: 85.00 },
    ]);

    const [activeArea, setActiveArea] = useState('All');
    const areas = ['All', 'Ground Floor', 'Terrace', 'Private'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'empty': return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-500';
            case 'occupied': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'billed': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
            default: return 'bg-white';
        }
    };

    const filteredTables = activeArea === 'All'
        ? tables
        : tables.filter(t => t.area === activeArea);

    return (
        <div className="p-6 h-full flex flex-col">
            {/* Filters */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                {areas.map(area => (
                    <button
                        key={area}
                        onClick={() => setActiveArea(area)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${activeArea === area
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        {area}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 overflow-y-auto p-1">
                {filteredTables.map(table => (
                    <button
                        key={table.id}
                        onClick={() => onTableSelect(table)}
                        className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all hover:shadow-lg ${getStatusColor(table.status)}`}
                    >
                        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold text-gray-400">
                            <Users className="w-3 h-3" />
                            <span>{table.capacity}</span>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{table.name}</h3>

                        {table.status === 'empty' ? (
                            <span className="text-green-600 dark:text-green-400 text-sm font-medium bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                Available
                            </span>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                {table.status === 'occupied' && (
                                    <span className="text-red-600 dark:text-red-400 text-sm font-bold animate-pulse">Running</span>
                                )}
                                {table.status === 'billed' && (
                                    <span className="text-yellow-700 dark:text-yellow-400 text-sm font-bold">Bill Printed</span>
                                )}
                                <span className="font-mono text-gray-600 dark:text-gray-300 font-bold">${table.amount}</span>
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{table.time}</span>
                                </div>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
