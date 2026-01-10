import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export function Login({ isTouchMode }) {
    const { login } = useAuth();
    const [loginMethod, setLoginMethod] = useState('passcode'); // 'passcode' or 'password'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');

        try {
            const tenantId = localStorage.getItem('pos_tenant_id');
            if (!tenantId) {
                setError('Terminal not linked to restaurant. Please restart app.');
                return;
            }

            const loginPayload = { tenantId };

            if (loginMethod === 'passcode') {
                if (!passcode) return setError('Please enter passcode');
                loginPayload.passcode = passcode;
            } else {
                if (!username || !password) return setError('Please enter credentials');
                loginPayload.username = username;
                loginPayload.password = password;
            }

            const { data } = await authService.login(loginPayload);
            localStorage.setItem('pos_token', data.token);
            if (data.daysLeft !== undefined) {
                data.user.daysLeft = data.daysLeft;
                data.user.trialDaysLeft = data.daysLeft; // Fallback
            }
            login(data.user);
        } catch (err) {
            console.error("Login failed", err);
            setError(err.response?.data?.error || 'Invalid credentials');
            setPasscode(''); // Clear passcode on error to allow retry
        }
    };

    // Auto-submit when 4 digits are entered
    React.useEffect(() => {
        if (loginMethod === 'passcode' && passcode.length === 4) {
            handleSubmit();
        }
    }, [passcode, loginMethod]);

    const handleKeypadPress = (val) => {
        if (passcode.length < 4) {
            setPasscode(prev => prev + val);
        }
    };

    const [isOffline, setIsOffline] = useState(false);

    const handleKeypadDelete = () => {
        setPasscode(prev => prev.slice(0, -1));
    };

    const toggleOfflineMode = () => {
        setIsOffline(!isOffline);
        localStorage.setItem('pos_mode', !isOffline ? 'offline' : 'online');
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className={`bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 transition-all ${isTouchMode && loginMethod === 'passcode' ? 'w-full max-w-lg' : 'w-full max-w-md'}`}>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Aksha POS</h1>
                    <p className="text-gray-400 mt-2 font-medium">
                        {localStorage.getItem('pos_tenant_name') || 'Restaurant'} Terminal
                    </p>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={toggleOfflineMode}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isOffline ? 'bg-gray-600 text-gray-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-gray-400' : 'bg-emerald-500 animate-pulse'}`}></div>
                            {isOffline ? 'Offline Mode' : 'Online Mode'}
                        </button>
                    </div>
                </div>

                <div className="flex bg-gray-700/50 p-1 rounded-2xl mb-8">
                    <button
                        onClick={() => { setLoginMethod('passcode'); setError(''); setPasscode(''); }}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${loginMethod === 'passcode' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Passcode
                    </button>
                    <button
                        onClick={() => { setLoginMethod('password'); setError(''); }}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${loginMethod === 'password' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Password
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 text-red-400 rounded-2xl text-sm border border-red-900/50 flex items-center gap-3">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {loginMethod === 'passcode' ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Secure Passcode</label>
                                <input
                                    type="password"
                                    value={passcode}
                                    onChange={e => !isTouchMode && setPasscode(e.target.value)}
                                    readOnly={isTouchMode}
                                    autoFocus={!isTouchMode}
                                    className="w-full px-4 py-6 rounded-2xl border border-gray-600 bg-gray-700 text-white text-center text-5xl font-mono tracking-[1.2em] focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-gray-600 shadow-inner"
                                    placeholder="••••"
                                    maxLength={4}
                                />
                                <p className="text-center text-xs text-gray-500 mt-2">Enter 4-digit pin</p>
                            </div>

                            {isTouchMode && (
                                <div className="grid grid-cols-3 gap-3 mt-8">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'C'].map((btn, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                if (btn === 'C') handleKeypadDelete();
                                                else if (btn !== '') handleKeypadPress(btn.toString());
                                            }}
                                            disabled={btn === ''}
                                            className={`h-20 rounded-2xl text-2xl font-bold transition-all active:scale-90 ${btn === '' ? 'bg-transparent border-transparent' :
                                                btn === 'C' ? 'bg-gray-700 hover:bg-gray-600 text-red-400' :
                                                    'bg-gray-700 hover:bg-gray-600 text-white'
                                                } border border-gray-600 shadow-sm`}
                                        >
                                            {btn}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300">Username</label>
                                <div className="relative">
                                    <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-gray-500"
                                        placeholder="Enter username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300">Password</label>
                                <div className="relative">
                                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-gray-500"
                                        placeholder="Enter password"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-xl shadow-orange-900/20 transition-all active:scale-95 mt-4 flex items-center justify-center gap-2 text-lg"
                            >
                                Sign In
                            </button>
                        </div>
                    )}
                </form>

                <div className="mt-8 pt-6 border-t border-gray-700/50 text-center">
                    <button
                        onClick={async () => {
                            if (window.confirm("Are you sure you want to logout from this restaurant?")) {
                                // Clear Tenant
                                localStorage.removeItem('pos_tenant_id');
                                localStorage.removeItem('pos_tenant_name');

                                // Clear Auth & Cache
                                localStorage.removeItem('pos_token');
                                localStorage.removeItem('cached_menu_items');
                                localStorage.removeItem('cached_menu_cats');
                                localStorage.removeItem('cached_settings');
                                localStorage.removeItem('pos_mode');
                                localStorage.removeItem('offline_orders');

                                // Clear Electron Local DB
                                if (window.electronAPI) {
                                    await window.electronAPI.clearLocalData();
                                }

                                window.location.reload();
                            }
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-red-500 uppercase tracking-widest transition-colors"
                    >
                        Logout Restaurant
                    </button>
                </div>
            </div>
        </div>
    );
}

