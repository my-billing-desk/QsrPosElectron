import { ChefHat, Clock, Check, AlertCircle, Printer } from 'lucide-react';

export function KotManagement() {
    const [kots, setKots] = useState([
        {
            id: 'KOT-1001',
            table: 'T4',
            time: '12:45 PM',
            waiter: 'John Doe',
            status: 'cooking', // cooking, ready, served
            items: [
                { name: 'Chicken Burger', qty: 2, notes: 'No onion' },
                { name: 'French Fries', qty: 1, notes: 'Extra crispy' }
            ]
        },
        {
            id: 'KOT-1002',
            table: 'T2',
            time: '12:48 PM',
            waiter: 'Alice',
            status: 'ready',
            items: [
                { name: 'Veg Pizza', qty: 1, notes: '' },
                { name: 'Coke', qty: 2, notes: 'With Ice' }
            ]
        },
        {
            id: 'KOT-1003',
            table: 'Takeaway/1',
            time: '12:50 PM',
            waiter: 'Counter',
            status: 'cooking',
            items: [
                { name: 'Pasta Alfreddo', qty: 1, notes: '' }
            ]
        }
    ]);

    const handleStatusChange = (kotId, newStatus) => {
        setKots(prev => prev.map(kot => kot.id === kotId ? { ...kot, status: newStatus } : kot));
    };

    return (
        <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <ChefHat className="w-8 h-8 text-orange-500" /> Kitchen Display System (KDS)
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage active kitchen orders</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">Cooking: {kots.filter(k => k.status === 'cooking').length}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                        <Check className="w-4 h-4" />
                        <span className="font-semibold">Ready: {kots.filter(k => k.status === 'ready').length}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {kots.map(kot => (
                    <div key={kot.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 overflow-hidden flex flex-col ${kot.status === 'ready' ? 'border-green-500' : 'border-transparent'
                        }`}>
                        {/* Header */}
                        <div className={`p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start ${kot.status === 'ready' ? 'bg-green-50 dark:bg-green-900/10' : 'bg-gray-50 dark:bg-gray-800'
                            }`}>
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{kot.table}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">#{kot.id} • {kot.waiter}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-mono text-sm font-semibold text-gray-600 dark:text-gray-300">{kot.time}</span>
                                <div className="mt-1 flex items-center text-xs font-medium text-orange-600">
                                    <Clock className="w-3 h-3 mr-1" /> 12m ago
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="p-4 flex-1 space-y-3">
                            {kot.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between mb-1">
                                            <span className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</span>
                                            <span className="font-bold text-gray-900 dark:text-gray-100 ml-2">x{item.qty}</span>
                                        </div>
                                        {item.notes && <p className="text-xs text-red-500 italic">Note: {item.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                            {kot.status === 'cooking' && (
                                <button
                                    onClick={() => handleStatusChange(kot.id, 'ready')}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Mark Ready
                                </button>
                            )}
                            {kot.status === 'ready' && (
                                <button
                                    onClick={() => handleStatusChange(kot.id, 'served')}
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Mark Served
                                </button>
                            )}
                            <button className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <Printer className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
