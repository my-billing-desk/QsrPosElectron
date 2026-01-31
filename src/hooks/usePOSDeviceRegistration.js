import { useEffect } from 'react';

// Generate a unique device ID based on system information
const getDeviceId = () => {
    // Try to get a stored device ID first
    let deviceId = localStorage.getItem('pos_device_id');

    if (!deviceId) {
        // Generate a new one based on available info
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        const language = navigator.language;

        // Create a simple hash
        const info = `${userAgent}-${platform}-${language}-${Date.now()}`;
        deviceId = btoa(info).substring(0, 32);

        localStorage.setItem('pos_device_id', deviceId);
    }

    return deviceId;
};

const getDeviceName = () => {
    const hostname = window.location.hostname;
    const platform = navigator.platform;
    return `${platform} - ${hostname} - ${new Date().toLocaleDateString()}`;
};

const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let platform = 'Unknown';
    let deviceType = 'desktop';

    if (ua.includes('Windows')) platform = 'Windows';
    else if (ua.includes('Mac')) platform = 'macOS';
    else if (ua.includes('Linux')) platform = 'Linux';
    else if (ua.includes('Android')) { platform = 'Android'; deviceType = 'tablet'; }
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) { platform = 'iOS'; deviceType = 'mobile'; }

    return { platform, deviceType };
};

export const usePOSDeviceRegistration = () => {
    useEffect(() => {
        const registerDevice = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return; // Not logged in yet

                const deviceId = getDeviceId();
                const deviceName = getDeviceName();
                const { platform, deviceType } = getDeviceInfo();

                const deviceInfo = {
                    deviceId,
                    deviceName,
                    deviceType,
                    platform,
                    appVersion: '1.0.0', // You can get this from package.json
                    metadata: {
                        userAgent: navigator.userAgent,
                        screenResolution: `${window.screen.width}x${window.screen.height}`,
                        language: navigator.language
                    }
                };

                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const response = await fetch(`${API_URL}/pos-devices/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(deviceInfo)
                });

                if (response.ok) {
                    console.log('POS Device registered successfully');

                    // Start heartbeat
                    startHeartbeat(deviceId, token);
                }
            } catch (error) {
                console.error('Failed to register POS device:', error);
            }
        };

        const startHeartbeat = (deviceId, token) => {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            // Send heartbeat every 2 minutes
            const heartbeatInterval = setInterval(async () => {
                try {
                    await fetch(`${API_URL}/pos-devices/heartbeat`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ code: deviceId }) // Backend expects 'code'
                    });
                } catch (error) {
                    console.error('Heartbeat failed:', error);
                }
            }, 2 * 60 * 1000); // 2 minutes

            // Cleanup on unmount
            return () => clearInterval(heartbeatInterval);
        };

        registerDevice();
    }, []); // Run once on mount when user is logged in
};
