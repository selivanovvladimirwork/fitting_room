import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthModal: React.FC = () => {
    const { isAuthModalOpen, closeAuthModal, login, register, authError, clearAuthError } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Login State
    const [loginForm, setLoginForm] = useState({
        email: '',
        password: ''
    });

    // Register State
    const [registerForm, setRegisterForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
    });

    if (!isAuthModalOpen) return null;

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(loginForm.email, loginForm.password);
        } catch {
            // Error handled in context
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (registerForm.password !== registerForm.password_confirmation) {
            return;
        }
        setIsLoading(true);
        try {
            await register(registerForm.name, registerForm.email, registerForm.password, registerForm.password_confirmation);
        } catch {
            // Error handled in context
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeSwitch = (newMode: 'login' | 'register') => {
        setMode(newMode);
        clearAuthError();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={closeAuthModal}
            />

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">

                    {/* Close Button */}
                    <button
                        onClick={closeAuthModal}
                        className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 hover:text-black transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    {/* Header Text */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold tracking-tight mb-2">Добро пожаловать</h2>
                        <p className="text-gray-500 text-sm">Войдите или создайте аккаунт для продолжения</p>
                    </div>

                    {/* Error Display */}
                    {authError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
                            {authError}
                        </div>
                    )}

                    {/* Header Switcher */}
                    <div className="flex justify-center mb-10">
                        <div className="bg-gray-100 p-1.5 rounded-full flex">
                            <button
                                onClick={() => handleModeSwitch('login')}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${mode === 'login' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Вход
                            </button>
                            <button
                                onClick={() => handleModeSwitch('register')}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${mode === 'register' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Регистрация
                            </button>
                        </div>
                    </div>

                    {mode === 'login' ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <input
                                        type="email"
                                        value={loginForm.email}
                                        onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white rounded-[24px] outline-none transition-all placeholder:text-gray-400 text-sm"
                                        placeholder="Email"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={loginForm.password}
                                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white rounded-[24px] outline-none transition-all placeholder:text-gray-400 text-sm"
                                        placeholder="Пароль"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-0 h-full flex items-center text-gray-400 hover:text-black transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-black text-white font-bold rounded-[24px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Вход...' : 'Войти'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar px-1">
                            <div className="grid grid-cols-1 gap-3">
                                <input
                                    type="text"
                                    placeholder="Имя"
                                    value={registerForm.name}
                                    onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-gray-50 rounded-[20px] outline-none focus:bg-white transition-all text-xs"
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={registerForm.email}
                                    onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-gray-50 rounded-[20px] outline-none focus:bg-white transition-all text-xs"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Пароль (мин. 8 символов)"
                                    value={registerForm.password}
                                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-gray-50 rounded-[20px] outline-none focus:bg-white transition-all text-xs"
                                    required
                                    minLength={8}
                                />
                                <input
                                    type="password"
                                    placeholder="Подтверждение пароля"
                                    value={registerForm.password_confirmation}
                                    onChange={e => setRegisterForm({ ...registerForm, password_confirmation: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-gray-50 rounded-[20px] outline-none focus:bg-white transition-all text-xs"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || registerForm.password !== registerForm.password_confirmation}
                                className="w-full py-4 bg-black text-white font-bold rounded-[24px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
