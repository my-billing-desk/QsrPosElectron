import React, { useState } from 'react';
import { Smartphone, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';

export function TenantMapping({ onMap }) {
    const [tenantId, setTenantId] = useState('');
    const [isTouchMode, setIsTouchMode] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Multi-step Flow
    const [step, setStep] = useState('input_id'); // input_id | otp_entry
    const [tenantInfo, setTenantInfo] = useState(null);
    const [maskedEmail, setMaskedEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        if (!tenantId) {
            setError('Please enter a Tenant ID');
            return;
        }

        const cleanId = tenantId.trim();
        setLoading(true);
        setError('');

        try {
            const response = await authService.initTerminal(cleanId);
            const { tenant, ownerEmail, requiresOTP } = response.data;

            if (requiresOTP) {
                setTenantInfo(tenant);
                setMaskedEmail(ownerEmail);
                setStep('otp_entry');
                // Auto trigger first OTP send
                await handleResendOTP(tenant.id);
            } else {
                // Legacy flow if backend doesn't require OTP (unlikely now)
                await completeLinking(response.data);
            }
        } catch (apiErr) {
            console.error('Terminal init failed:', apiErr);
            const msg = apiErr.response?.data?.error
                ? `[Server] ${apiErr.response.data.error}`
                : apiErr.message?.includes('Local DB Error')
                    ? apiErr.message
                    : `[Network/Connection] ${apiErr.message || 'Invalid Restaurant ID or Subdomain'}`;
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async (tid) => {
        try {
            const targetId = tid || tenantInfo?.id;
            await authService.sendOTP(targetId);
            setResendCooldown(60);
            const timer = setInterval(() => {
                setResendCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
        }
    };

    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await authService.verifyOTP(tenantInfo.id, otp);
            await completeLinking(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP. Please check and try again.');
        } finally {
            setLoading(false);
        }
    };

    const completeLinking = async (data) => {
        const { tenant, users, menu } = data;

        try {
            // STEP 2: Sync to Local DB
            if (window.electronAPI) {
                // Sync Users
                await window.electronAPI.syncUsers(users);
                // Sync Menu
                await window.electronAPI.syncMenu({
                    categories: menu.categories || [],
                    items: menu.items || [],
                    tenantId: tenant.id
                });

                // Sync Settings
                if (data.settings && window.electronAPI.syncSettings) {
                    await window.electronAPI.syncSettings(data.settings);
                } else if (data.settings) {
                    localStorage.setItem('cached_settings', JSON.stringify(data.settings));
                }
            }

            // 3. Store mapping and UI preference
            localStorage.setItem('pos_tenant_id', tenant.id);
            localStorage.setItem('pos_tenant_name', tenant.name);
            localStorage.setItem('pos_touch_mode', isTouchMode ? 'true' : 'false');

            onMap(tenant.id, isTouchMode);
        } catch (dbErr) {
            console.error('Local database sync failed:', dbErr);
            throw new Error(`[Local DB Error] Failed to save data locally. ${dbErr.message}`);
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



                {step === 'input_id' ? (
                    <form onSubmit={handleInitialSubmit} className="space-y-6">
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
                                    Verify Restaurant <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOTPSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="text-center mb-2">
                            <p className="text-gray-400 text-sm">A 6-digit security code has been sent to:</p>
                            <p className="text-white font-bold">{maskedEmail}</p>
                        </div>

                        <div className="space-y-2 text-center">
                            <input
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                autoFocus
                                className="w-full px-4 py-4 rounded-xl border border-gray-600 bg-gray-700 text-white text-3xl font-bold tracking-[0.5em] text-center focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                placeholder="000000"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Validating...' : 'Complete Linking'}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                disabled={resendCooldown > 0}
                                onClick={() => handleResendOTP()}
                                className="text-gray-400 hover:text-white text-sm disabled:opacity-50 underline underline-offset-4"
                            >
                                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend Code'}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setStep('input_id')}
                            className="w-full text-gray-500 hover:text-gray-400 text-xs font-bold uppercase tracking-widest mt-4"
                        >
                            Enter Different ID
                        </button>
                    </form>
                )}

                <p className="text-center text-gray-500 text-xs mt-8 uppercase tracking-widest">
                    QSR Engine v1.0.0
                </p>
            </div>
        </div>
    );
}
