import React, { useState } from 'react';
import { Smartphone, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';

export function TenantMapping({ onMap }) {
    const [tenantId, setTenantId] = useState('');
    const [isTouchMode, setIsTouchMode] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tenantId) {
            setError('Please enter a Tenant ID');
            return;
        }

        const cleanId = tenantId.trim();
        setLoading(true);
        setError('');

        try {
            // STEP 1: Verify with Backend
            let data;
            try {
                const response = await authService.initTerminal(cleanId);
                data = response.data;
            } catch (apiErr) {
                console.error('Backend verification failed:', apiErr);
                const msg = apiErr.response?.data?.error ||
                    (apiErr.code === 'ERR_NETWORK' ? 'Cannot connect to server. Please ensure the backend is running.' : apiErr.message);
                throw new Error(`[Server Error] ${msg}`);
            }

            const { tenant, users, menu } = data;

            // STEP 2: Sync to Local DB
            if (window.electronAPI) {
                try {
                    // Sync Users
                    await window.electronAPI.syncUsers(users);
                    // Sync Menu
                    await window.electronAPI.syncMenu({
                        categories: menu.categories || [],
                        items: menu.items || [],
                        tenantId: tenant.id
                    });

                    // Sync Settings (if available from response)
                    if (data.settings && window.electronAPI.syncSettings) {
                        await window.electronAPI.syncSettings(data.settings);
                    } else if (data.settings) {
                        // Fallback to localStorage
                        localStorage.setItem('cached_settings', JSON.stringify(data.settings));
                    }
                    console.log('Initial sync completed for Tenant:', tenant.name);
                } catch (dbErr) {
                    console.error('Local database sync failed:', dbErr);
                    throw new Error(`[Local DB Error] Failed to save data locally. ${dbErr.message}`);
                }
            }

            // 3. Store mapping and UI preference
            localStorage.setItem('pos_tenant_id', tenant.id);
            localStorage.setItem('pos_tenant_name', tenant.name);
            localStorage.setItem('pos_touch_mode', isTouchMode ? 'true' : 'false');

            onMap(tenant.id, isTouchMode);
        } catch (err) {
            console.error('Mapping failed:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl"></div>

                <div className="text-center mb-8 relative">
                    <div className="w-16 h-16 bg-orange-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-600/30">
                        <Smartphone className="w-8 h-8 text-orange-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">POS Setup</h1>
                    <p className="text-gray-400 mt-2">Connect this terminal to your restaurant</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 text-red-400 rounded-xl text-sm border border-red-900/50 flex gap-3 animate-shake">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}



                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Restaurant ID</label>
                        <input
                            type="text"
                            value={tenantId}
                            onChange={e => setTenantId(e.target.value)}
                            autoFocus
                            className="w-full px-4 py-4 rounded-xl border border-gray-600 bg-gray-700 text-white text-xl font-mono tracking-wider focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-gray-500"
                            placeholder="Enter ID here..."
                        />
                    </div>

                    {/* Touch Mode Selection */}
                    <div
                        onClick={() => setIsTouchMode(!isTouchMode)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isTouchMode ? 'bg-orange-600/10 border-orange-600' : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'}`}
                    >
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">Optimise for Touch Screen</span>
                            <span className="text-xs text-gray-400 mt-1">Enable large buttons and on-screen keyboard</span>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isTouchMode ? 'bg-orange-600' : 'bg-gray-600'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full transition-transform ${isTouchMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Verifying...' : (
                            <>
                                Link Terminal <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-gray-500 text-xs mt-8 uppercase tracking-widest">
                    QSR Engine v1.0.0
                </p>
            </div>
        </div>
    );
}
