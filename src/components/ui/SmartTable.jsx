import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, Download, Plus } from 'lucide-react';

/**
 * SmartTable Component
 * 
 * A reusable table component styled to match the "SmartHR" reference.
 * 
 * Props:
 * - data: Array of objects to display.
 * - columns: Array of column definitions:
 *   - key: string (field name in data)
 *   - header: string (header label)
 *   - render: (item) => ReactNode (optional custom renderer)
 *   - sortable: boolean (optional)
 *   - align: 'left' | 'center' | 'right' (optional, default left)
 * - title: string (Table title)
 * - actionButtons: ReactNode (Buttons to show in header, e.g., "Add Estimate")
 * - headerControls: ReactNode (Controls to show in header right side, e.g., Date Picker, Filter Dropdown)
 * - searchPlaceholder: string
 * - onSearch: (term) => void (optional external search handler)
 * - onRowClick: (item) => void
 * - isLoading: boolean
 */
export function SmartTable({
    data = [],
    columns = [],
    title = "List",
    filters,
    actionButtons,
    headerControls,
    searchPlaceholder = "Search...",
    onRowClick,
    isLoading = false,
    selectedRows = [],
    onSelectionChange,
    onViewDataChange
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Reset pagination when data or search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [data, searchTerm]);

    // --- Filtering & Sorting ---
    const filteredData = useMemo(() => {
        let processed = [...data];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            processed = processed.filter(item =>
                Object.values(item).some(val =>
                    val && String(val).toLowerCase().includes(lowerTerm)
                )
            );
        }

        if (sortConfig.key) {
            processed.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processed;
    }, [data, searchTerm, sortConfig]);

    // --- Pagination ---
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = useMemo(() => {
        return filteredData.slice(
            (currentPage - 1) * rowsPerPage,
            currentPage * rowsPerPage
        );
    }, [filteredData, currentPage, rowsPerPage]);

    // Notify parent of data changes for external actions (like Export)
    React.useEffect(() => {
        if (onViewDataChange) {
            onViewDataChange({
                filteredData,
                paginatedData,
                currentPage,
                rowsPerPage,
                total: filteredData.length
            });
        }
    }, [filteredData, paginatedData, currentPage, rowsPerPage, onViewDataChange]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleSelectAll = () => {
        if (selectedRows.length === paginatedData.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(paginatedData.map(item => item.id)); // Assuming 'id' exists
        }
    };

    const toggleSelectRow = (id, e) => {
        e.stopPropagation();
        if (selectedRows.includes(id)) {
            onSelectionChange(selectedRows.filter(rowId => rowId !== id));
        } else {
            onSelectionChange([...selectedRows, id]);
        }
    };

    return (
        <div className="flex flex-col bg-gray-50 p-1 gap-1">

            {/* Table Container (Card) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col">

                {/* 1. Header Section */}
                {(title || headerControls || actionButtons) && (
                    <div className="p-2.5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {title && (
                            <h2 className="text-sm text-gray-800">{title}</h2>
                        )}
                        <div className="flex flex-wrap items-center gap-2 ml-auto sm:ml-0">
                            {headerControls}
                            {actionButtons}
                        </div>
                    </div>
                )}

                {/* 2. Filters Section */}
                {filters && (
                    <div className="p-2.5 border-b border-gray-200 bg-gray-50/50">
                        {filters}
                    </div>
                )}

                {/* 3. Table Content */}
                <div className="overflow-x-auto">
                    <table className="table-standard">
                        <thead className="table-header sticky top-0 z-10 border-y border-gray-200">
                            <tr>
                                <th className="table-th w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-[#444ce7] focus:ring-[#444ce7] cursor-pointer w-4 h-4"
                                        checked={paginatedData.length > 0 && selectedRows.length === paginatedData.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className={`table-th cursor-pointer hover:bg-black/5 transition-colors ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                        onClick={() => col.sortable && handleSort(col.key)}
                                    >
                                        <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                                            {col.header}
                                            {col.sortable && (
                                                <div className="flex flex-col">
                                                    {sortConfig.key === col.key && sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> :
                                                        sortConfig.key === col.key && sortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3" /> :
                                                            <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className="p-8 text-center text-gray-500">Loading data...</td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className="h-48 text-center text-gray-500 align-middle">No records found</td>
                                </tr>
                            ) : (
                                paginatedData.map((item, rowIdx) => (
                                    <tr
                                        key={item.id || rowIdx}
                                        className="table-row cursor-pointer group"
                                        onClick={() => onRowClick && onRowClick(item)}
                                    >
                                        <td className="table-td w-10" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-[#444ce7] focus:ring-[#444ce7] cursor-pointer w-4 h-4"
                                                checked={selectedRows.includes(item.id)}
                                                onChange={(e) => toggleSelectRow(item.id, e)}
                                            />
                                        </td>
                                        {columns.map((col, colIdx) => (
                                            <td
                                                key={colIdx}
                                                className={`table-td ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                            >
                                                {col.render ? col.render(item) : item[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-1.5 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500 font-medium bg-white">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Rows:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                className="border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#444ce7] cursor-pointer text-xs"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <span>
                            Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white text-gray-700"
                        >
                            Previous
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${currentPage === i + 1
                                    ? 'bg-[#444ce7] text-white border-[#444ce7]'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white text-gray-700"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
