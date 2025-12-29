import { useEffect, useState } from 'react';
import { authService, menuService, settingsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useSync() {
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(localStorage.getItem('pos_last_sync'));

    const syncData = async () => {
        if (!user || isSyncing) return;

        setIsSyncing(true);
        console.log('--- Starting Data Sync from Server ---');

        try {
            // 1. Sync Users (for offline login)
            const usersRes = await authService.syncUsers();
            if (window.electronAPI) {
                await window.electronAPI.syncUsers(usersRes.data);
            }
            console.log('[SYNC] Users synced:', usersRes.data?.length || 0);

            // 2. Sync Menu (pulls from API and saves to local DB)
            const menuResult = await menuService.syncFromServer();
            console.log('[SYNC] Menu synced:', menuResult.categories.length, 'cats,', menuResult.items.length, 'items');

            // 3. Sync Settings
            await settingsService.syncFromServer();
            console.log('[SYNC] Settings synced');

            const now = new Date().toISOString();
            localStorage.setItem('pos_last_sync', now);
            setLastSync(now);
            console.log('--- Sync Completed Successfully ---');

            return { success: true };
        } catch (error) {
            console.error('Sync failed:', error);
            throw error; // Re-throw so caller can handle
        } finally {
            setIsSyncing(false);
        }
    };

    // NOTE: Auto-sync disabled for local-first approach
    // Data is only synced when user explicitly clicks Sync button
    // Uncomment below to enable periodic sync
    /*
    useEffect(() => {
        if (user) {
            const interval = setInterval(syncData, 15 * 60 * 1000); // 15 mins
            return () => clearInterval(interval);
        }
    }, [user?.id]);
    */

    return { isSyncing, lastSync, syncData };
}
