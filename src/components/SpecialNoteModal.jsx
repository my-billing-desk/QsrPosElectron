import React, { useState, useEffect } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { specialNoteService } from '../services/api';

export const SpecialNoteModal = ({ isOpen, onClose, onSelect }) => {
    const [notes, setNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadNotes();
            setSearchQuery('');
        }
    }, [isOpen]);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const res = await specialNoteService.getAll();
            setNotes(res.data || []);
        } catch (error) {
            console.error("Failed to load special notes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!searchQuery.trim()) return;

        try {
            const res = await specialNoteService.create({ name: searchQuery, isAvailable: true });
            onSelect(res.data.name);
            onClose();
        } catch (error) {
            console.error("Failed to create special note", error);
        }
    };

    const filteredNotes = notes.filter(n =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) && n.isAvailable
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add Special Note</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search or Create Note..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {loading ? (
                            <div className="text-center py-4 text-gray-400">Loading...</div>
                        ) : filteredNotes.length > 0 ? (
                            filteredNotes.map(note => (
                                <button
                                    key={note.id}
                                    onClick={() => { onSelect(note.name); onClose(); }}
                                    className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-700 font-medium transition-colors"
                                >
                                    {note.name}
                                </button>
                            ))
                        ) : searchQuery.trim() && (
                            <div className="text-center py-4">
                                <p className="text-gray-500 text-sm mb-2">Note not found</p>
                                <button
                                    onClick={handleCreate}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-orange-700 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <Plus size={16} /> Create "{searchQuery}"
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
