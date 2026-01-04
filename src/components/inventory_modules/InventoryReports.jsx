import React, { useState, useEffect } from 'react';
import { Search, Calendar, Download, FileText, ChevronRight } from 'lucide-react';
import { inventoryService } from '../../services/api';
import { getTodayLocal } from '../../utils/dateUtils';

export default function InventoryReports() {
    const [activeReport, setActiveReport] = useState('All');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // List of reports
    const reports = [
        { id: 'current-stock', name: 'Current Stock Report', category: 'Stock' },
        { id: 'stock-summary', name: 'Stock Summary Report', category: 'Stock' },
        { id: 'order-consumption', name: 'Orderwise Consumption Report', category: 'Consumption' },
        { id: 'consumption-summary', name: 'Consumption Summary', category: 'Consumption' },
        { id: 'material-purchase', name: 'Material Purchase Report', category: 'Purchase' },
        { id: 'opening-closing', name: 'Opening - Closing Stock Report', category: 'Stock' },
        // Others can be added as API supports them
    ];

    const fetchReport = async (reportId) => {
        setLoading(true);
        setError(null);
        setReportData([]);

        try {
            if (reportId === 'order-consumption') {
                const res = await inventoryService.getOrderWiseConsumptionReport();
                setReportData(res.data);
            } else if (reportId === 'current-stock') {
                try {
                    const res = await inventoryService.getRawMaterials();
                    // Map raw material list to report format
                    setReportData(res.data.map(item => ({
                        id: item.id,
                        name: item.name,
                        category: item.Category?.name || 'Uncategorized',
                        currentStock: item.currentStock,
                        unit: item.consumptionUnit,
                        avgPrice: item.avgPrice || 0,
                        totalValue: ((item.currentStock || 0) * (item.avgPrice || 0)).toFixed(3)
                    })));
                } catch (e) {
                    console.error("Failed to fetch current stock", e);
                    setReportData([]);
                }
            } else if (reportId === 'stock-summary') {
                const res = await inventoryService.getStockSummaryReport();
                setReportData(res.data);
            } else if (reportId === 'consumption-summary') {
                const res = await inventoryService.getConsumptionSummaryReport();
                setReportData(res.data);
            } else if (reportId === 'opening-closing') {
                const res = await inventoryService.getClosingStockReport();
                setReportData(res.data);
            } else if (reportId === 'material-purchase') {
                const res = await inventoryService.getPurchases();
                const flattedData = res.data.flatMap(purchase =>
                    purchase.PurchaseItems.map(item => ({
                        date: purchase.invoiceDate,
                        supplier: purchase.Supplier?.name || 'Unknown',
                        itemName: item.RawMaterial?.name || 'Unknown',
                        quantity: item.quantity,
                        unit: item.unit,
                        rate: item.price,
                        amount: item.amount,
                        invoiceNo: purchase.invoiceNumber
                    }))
                );
                setReportData(flattedData);
            } else {
                await new Promise(r => setTimeout(r, 600));
                setReportData([]);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch report data.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (activeReport) {
            fetchReport(activeReport);
        }
    };

    const renderReportFilters = (reportId) => {
        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1 min-w-[200px]">
                    <label className="text-xs font-bold text-gray-600">Raw Material</label>
                    <input type="text" className="p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-red-500" placeholder="Search Item..." />
                </div>

                <div className="flex flex-col gap-1 min-w-[150px]">
                    <label className="text-xs font-bold text-gray-600">Category</label>
                    <select className="p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-red-500"><option>All</option></select>
                </div>

                {reportId === 'stock-summary' && (
                    <div className="flex flex-col gap-1 min-w-[150px]">
                        <label className="text-xs font-bold text-gray-600">Unit Type</label>
                        <select className="p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-red-500"><option>Purchase Unit</option></select>
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600">From Date</label>
                    <input type="date" className="p-2 border border-gray-300 rounded text-sm bg-white" defaultValue={getTodayLocal()} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600">To Date</label>
                    <input type="date" className="p-2 border border-gray-300 rounded text-sm bg-white" defaultValue={getTodayLocal()} />
                </div>

                <button onClick={handleSearch} className="px-6 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 mb-0.5 text-sm">Search</button>
                <button className="px-6 py-2 bg-white border border-gray-300 text-gray-600 rounded font-medium hover:bg-gray-50 mb-0.5 text-sm">Clear</button>
            </div>
        );
    };

    const renderTable = () => {
        if (loading) return <div className="text-center p-12 text-gray-500">Loading Report...</div>;
        if (error) return <div className="text-center p-12 text-red-500">{error}</div>;

        if (reportData.length === 0) {
            return (
                <div className="bg-white rounded-lg border border-gray-200 min-h-[400px] flex flex-col items-center justify-center p-8">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-10 h-10 text-red-200" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">No Record Found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your filters.</p>
                </div>
            )
        }

        if (activeReport === 'current-stock') {
            return (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-blue-50/50 p-4 border-b border-gray-200 flex justify-between text-sm font-bold text-gray-700">
                        <div className="w-1/4">Category</div>
                        <div className="w-1/4">Raw Material</div>
                        <div className="w-1/6">Current Stock</div>
                        <div className="w-1/6">Average Purchase Price (₹)</div>
                        <div className="w-1/6 text-right">Total <br /><span className="text-gray-900">₹ {reportData.reduce((sum, item) => sum + parseFloat(item.totalValue || 0), 0).toFixed(3)}</span></div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {reportData.map((row, idx) => (
                            <div key={idx} className="p-4 flex justify-between items-center hover:bg-gray-50 text-sm">
                                <div className="w-1/4 text-gray-500 font-bold">{row.category === 'Uncategorized' ? '⭐' : ''} {row.category}</div>
                                <div className="w-1/4 font-medium text-gray-800">{row.name}</div>
                                <div className="w-1/6 font-medium text-gray-600">{row.currentStock} {row.unit}</div>
                                <div className="w-1/6">
                                    <div className="bg-gray-100 rounded px-2 py-1 text-gray-600 inline-block w-24 text-center border border-gray-200">
                                        {row.avgPrice} / {row.unit}
                                    </div>
                                </div>
                                <div className="w-1/6 text-right font-bold text-gray-800">{row.totalValue}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // --- ORDERWISE CONSUMPTION REPORT ---
        if (activeReport === 'order-consumption') {
            const { summary, orders } = reportData;
            if (!summary) return null;

            return (
                <div className="space-y-6">
                    {/* Profit/Loss Formula Section */}
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">Profit/Loss of the day</h3>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm overflow-x-auto">
                            <div className="border border-gray-200 rounded p-2 text-center w-64 bg-gray-50">
                                <div className="font-bold text-gray-700 border-b border-gray-300 pb-1">Total Sales - Total Cost</div>
                                <div className="font-medium text-gray-600 pt-1">Total Sales</div>
                            </div>
                            <div className="bg-gray-400 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold">X</div>
                            <div className="font-bold text-gray-800 text-lg">100</div>
                            <div className="bg-black rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">=</div>
                            <div className="border border-gray-200 rounded p-2 text-center w-64 bg-gray-50">
                                <div className="font-bold text-gray-700 border-b border-gray-300 pb-1">
                                    {summary.totalSales.toFixed(3)} - {summary.totalCost.toFixed(3)}
                                </div>
                                <div className="font-medium text-gray-600 pt-1">{summary.totalSales.toFixed(3)}</div>
                            </div>
                            <div className="bg-gray-400 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold">X</div>
                            <div className="font-bold text-gray-800 text-lg">100</div>
                            <div className="bg-black rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">=</div>
                            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-center">
                                <span className="text-3xl font-bold text-gray-900">{summary.profitPercent.toFixed(3)} %</span>
                            </div>
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4">
                        {orders && orders.map((order, idx) => (
                            <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                {/* Order Header */}
                                <div className="bg-purple-50 p-3 flex justify-between items-center text-sm border-b border-purple-100">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-700">Order No - {order.orderNo}</span>
                                        <span className="text-gray-400 text-xs">ⓘ {order.date} ⓘ</span>
                                    </div>
                                    <div className="font-bold text-gray-800">Total Order Price (₹) = {order.totalPrice.toFixed(3)}</div>
                                    <div className="font-bold text-green-600">Profit/Loss(%) = {order.profitPercent}</div>
                                    <div className="font-bold text-gray-800">Cost of Good Sold = ₹ {order.cogs.toFixed(3)}</div>
                                </div>
                                {/* Order Details Table - Split View */}
                                <div className="flex divide-x divide-gray-200">
                                    {/* Left: Sales Items */}
                                    <div className="w-1/2 p-0">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50/50 text-xs text-gray-700 font-bold border-b border-gray-100">
                                                <tr>
                                                    <th className="p-3 text-left">Item Name</th>
                                                    <th className="p-3 text-center">Qty</th>
                                                    <th className="p-3 text-right">Total Selling Price (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {order.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="p-3 font-medium text-gray-800 flex items-center gap-2">
                                                            <div className="w-4 h-4 border border-green-500 rounded flex items-center justify-center text-green-600 text-[10px]">✔</div>
                                                            {item.name}
                                                        </td>
                                                        <td className="p-3 text-center">{item.qty}</td>
                                                        <td className="p-3 text-right font-medium">{item.price.toFixed(3)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Right: Consumption Items */}
                                    <div className="w-1/2 p-0 bg-gray-50/10">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50/50 text-xs text-gray-700 font-bold border-b border-gray-100">
                                                <tr>
                                                    <th className="p-3 text-left">Raw Material</th>
                                                    <th className="p-3 text-left">Qty</th>
                                                    <th className="p-3 text-left">Total Amount ⓘ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {order.items.map((item) =>
                                                    item.ingredients.map((ing, j) => (
                                                        <tr key={`${j}`}>
                                                            <td className="p-3 text-gray-600">{ing.name}</td>
                                                            <td className="p-3 text-gray-500">{ing.qty}</td>
                                                            <td className="p-3 text-gray-500">{ing.cost.toFixed(3)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // --- STOCK SUMMARY REPORT (Daily Report) ---
        if (activeReport === 'stock-summary') {
            return (
                <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                    <table className="w-full text-xs text-left whitespace-nowrap">
                        <thead className="bg-blue-50 text-gray-700 font-bold border-b border-gray-200">
                            <tr>
                                <th className="p-3 sticky left-0 bg-blue-50 z-10">Raw Material</th>
                                <th className="p-3 text-right">Opening<br /><span className="text-gray-400 text-[10px]">(A)</span></th>
                                <th className="p-3 text-right">Purchase<br /><span className="text-gray-400 text-[10px]">(B) ①</span></th>
                                <th className="p-3 text-right">Excess<br /><span className="text-gray-400 text-[10px]">(C)</span></th>
                                <th className="p-3 text-right bg-blue-100/50">Total<br /><span className="text-gray-400 text-[10px]">①</span></th>
                                <th className="p-3 text-right text-green-700">Consumed<br /><span className="text-gray-400 text-[10px]">(D)</span></th>
                                <th className="p-3 text-right text-red-600">Wastage<br /><span className="text-gray-400 text-[10px]">(E)</span></th>
                                <th className="p-3 text-right text-orange-600">Normal Loss<br /><span className="text-gray-400 text-[10px]">(F)</span></th>
                                <th className="p-3 text-right">Transfer<br /><span className="text-gray-400 text-[10px]">(G) ①</span></th>
                                <th className="p-3 text-right">Shortage<br /><span className="text-gray-400 text-[10px]">(H)</span></th>
                                <th className="p-3 text-right">Conversion<br /><span className="text-gray-400 text-[10px]">(I)</span></th>
                                <th className="p-3 text-right bg-blue-100/50">Total<br /><span className="text-gray-400 text-[10px]">①</span></th>
                                <th className="p-3 text-right font-bold">Closing Stock<br /><span className="text-gray-400 text-[10px]">①</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reportData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-3 sticky left-0 bg-white font-medium text-gray-800 border-r border-gray-50">
                                        {row.name} <span className="text-gray-400 font-normal">[{row.unit}]</span>
                                    </td>
                                    <td className="p-3 text-right text-gray-600">{row.opening.toFixed(3)}</td>
                                    <td className="p-3 text-right text-gray-600">{row.purchase.toFixed(3)}</td>
                                    <td className="p-3 text-right text-gray-600">{row.excess.toFixed(3)}</td>
                                    <td className="p-3 text-right font-bold text-blue-800 bg-blue-50/30">{row.total_in.toFixed(3)}</td>
                                    <td className="p-3 text-right text-green-600 font-medium">{row.consumed.toFixed(3)}</td>
                                    <td className="p-3 text-right text-red-500">{row.wastage.toFixed(3)}</td>
                                    <td className="p-3 text-right text-orange-500">{row.loss.toFixed(3)}</td>
                                    <td className="p-3 text-right text-gray-600">{row.transfer.toFixed(3)}</td>
                                    <td className="p-3 text-right text-gray-600">{row.shortage.toFixed(3)}</td>
                                    <td className="p-3 text-right text-gray-600">{row.conversion.toFixed(3)}</td>
                                    <td className="p-3 text-right font-bold text-blue-800 bg-blue-50/30">{row.total_out.toFixed(3)}</td>
                                    <td className="p-3 text-right font-bold text-gray-900">{row.closing.toFixed(3)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        // --- CONSUMPTION SUMMARY REPORT ---
        if (activeReport === 'consumption-summary') {
            return (
                <div className="space-y-4">
                    {/* Legend */}
                    <div className="flex justify-end gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-100 rounded"></div> <span>Consumption</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-100 rounded"></div> <span>Avg Purchase Price (₹)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-100 rounded"></div> <span>Consumption Cost (₹)</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-blue-50/50 text-gray-700 font-bold border-b border-gray-200">
                                <tr>
                                    <th className="p-4">Raw Material</th>
                                    <th className="p-4 text-center">
                                        <div className="text-xs text-gray-500">Total</div>
                                    </th>
                                    <th className="p-4 text-right">Total Consumption Qty</th>
                                    <th className="p-4 text-right">Total Consumption Cost (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reportData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="p-4 font-medium text-gray-800 align-top pt-6">
                                            {row.name}
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-2 max-w-[200px] mx-auto">
                                                <div className="bg-purple-100/50 p-2 rounded text-center text-purple-700 font-medium text-xs">
                                                    {row.consumption}
                                                </div>
                                                <div className="bg-blue-100/50 p-2 rounded text-center text-blue-700 font-medium text-xs">
                                                    {row.consumption} / {row.unit}
                                                </div>
                                                <div className="bg-green-100/50 p-2 rounded text-center text-green-700 font-medium text-xs">
                                                    {row.price}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right align-top pt-6 font-medium">
                                            {row.consumption}
                                        </td>
                                        <td className="p-4 text-right align-top pt-6 font-bold text-gray-800">
                                            {row.cost}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        if (activeReport === 'opening-closing') {
            return (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                            <tr>
                                <th className="p-4">Item Name</th>
                                <th className="p-4">Unit</th>
                                <th className="p-4 text-right">Closing Quantity</th>
                                <th className="p-4 text-right">Avg Price</th>
                                <th className="p-4 text-right">Total Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reportData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{row.name}</td>
                                    <td className="p-4 text-gray-500">{row.unit}</td>
                                    <td className="p-4 text-right font-medium">{row.closingStock}</td>
                                    <td className="p-4 text-right text-gray-500">{row.price}</td>
                                    <td className="p-4 text-right font-bold text-gray-700">{row.value}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold text-gray-800 border-t border-gray-200">
                            <tr>
                                <td colSpan="4" className="p-4 text-right">Total Value</td>
                                <td className="p-4 text-right">
                                    {reportData.reduce((sum, r) => sum + parseFloat(r.value || 0), 0).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            );
        }


        if (activeReport === 'material-purchase') {
            return (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Invoice No</th>
                                <th className="p-4">Supplier</th>
                                <th className="p-4">Item Name</th>
                                <th className="p-4 text-right">Qty</th>
                                <th className="p-4 text-right">Rate</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reportData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-4 text-gray-500">{new Date(row.date).toLocaleDateString()}</td>
                                    <td className="p-4 text-gray-800">{row.invoiceNo}</td>
                                    <td className="p-4 text-gray-600">{row.supplier}</td>
                                    <td className="p-4 font-medium text-gray-800">{row.itemName}</td>
                                    <td className="p-4 text-right">{row.quantity} {row.unit}</td>
                                    <td className="p-4 text-right text-gray-500">{row.rate}</td>
                                    <td className="p-4 text-right font-bold text-gray-700">{row.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold text-gray-800 border-t border-gray-200">
                            <tr>
                                <td colSpan="6" className="p-4 text-right">Total Purchase Value</td>
                                <td className="p-4 text-right">
                                    {reportData.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            );
        }

        return <div className="p-8">Table format for {activeReport} coming soon.</div>;
    };

    if (activeReport === 'All') {
        return (
            <div className="p-8 h-full overflow-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Inventory Reports</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map(report => (
                        <div key={report.id}
                            onClick={() => { setActiveReport(report.id); setReportData([]); }}
                            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                    <FileText className="w-6 h-6 text-red-600" />
                                </div>
                                <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-600 uppercase">{report.category}</span>
                            </div>
                            <h3 className="font-bold text-lg mt-4 text-gray-800 group-hover:text-red-600 transition-colors">{report.name}</h3>
                            <div className="mt-4 flex items-center text-sm text-gray-500 font-medium">
                                View Report <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const currentReport = reports.find(r => r.id === activeReport);

    return (
        <div className="flex flex-col h-full bg-gray-50 font-sans">
            <div className="bg-white p-6 shadow-sm border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={() => setActiveReport('All')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                        Inventory Reports
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                    <h2 className="text-lg font-bold text-gray-800">{currentReport?.name || 'Report'}</h2>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                        <Download className="w-4 h-4 mr-2" /> Download
                    </button>
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                        <Calendar className="w-4 h-4 mr-2" /> Date Range
                    </button>
                </div>
            </div>
            <div className="flex-1 p-6 overflow-auto">
                {renderReportFilters(activeReport)}
                {renderTable()}
            </div>
        </div>
    );
}
