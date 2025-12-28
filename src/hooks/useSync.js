import { useEffect, useState } from 'react';
import { authService, menuService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useSync() {
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(localStorage.getItem('pos_last_sync'));

    const syncData = async () => {
        if (!user || isSyncing) return;

        setIsSyncing(true);
        console.log('--- Starting Background Sync ---');

        try {
            // 1. Sync Users
            const usersRes = await authService.syncUsers();
            if (window.electronAPI) {
                await window.electronAPI.syncUsers(usersRes.data);
            }

            // 2. Sync Menu
            const catsRes = await menuService.getCategories();
            const itemsRes = await menuService.getItems();

            if (window.electronAPI) {
                await window.electronAPI.syncMenu({
                    categories: catsRes.data,
                    items: itemsRes.data,
                    tenantId: user.tenantId
                });
            }

            const now = new Date().toISOString();
            localStorage.setItem('pos_last_sync', now);
            setLastSync(now);
            console.log('--- Sync Completed Successfully ---');
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Auto sync on login or every 15 minutes
    useEffect(() => {
        if (user) {
            syncData(); // Initial sync on load/login

            const interval = setInterval(syncData, 15 * 60 * 1000); // 15 mins
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    return { isSyncing, lastSync, syncData };
}
