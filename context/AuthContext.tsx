import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi, migrateLocalStorageToApi } from '../services/api';
import { User } from '../types';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    isNewUser: boolean;
    completeOnboarding: () => void;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, nickname: string, email: string, phone: string, password: string, passwordConfirmation: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    requireAuth: (callback: () => void) => void;
    authError: string | null;
    clearAuthError: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewUser, setIsNewUser] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

    const isAuthenticated = !!user;

    const refreshUser = useCallback(async () => {
        if (authApi.isAuthenticated()) {
            try {
                const userData = await authApi.getUser();
                setUser(userData);
            } catch (error: any) {
                console.error('Auth verification failed:', error);
                // Only clear token if it's an authentication error (401)
                if (error.message && (error.message.includes('Unauthenticated') || error.message.includes('401'))) {
                    localStorage.removeItem('auth_token');
                }
            }
        }
        setIsLoading(false);
    }, []);

    // Check auth on mount
    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    // Execute pending callback after loading completes if authenticated
    useEffect(() => {
        if (!isLoading && pendingCallback) {
            if (isAuthenticated) {
                pendingCallback();
                setPendingCallback(null);
            } else if (!isAuthModalOpen) {
                // Not authenticated and modal not open - open it
                setIsAuthModalOpen(true);
            }
        }
    }, [isLoading, isAuthenticated, pendingCallback, isAuthModalOpen]);

    const login = useCallback(async (email: string, password: string) => {
        setAuthError(null);
        try {
            const { user: userData } = await authApi.login(email, password);
            setUser(userData);
            setIsAuthModalOpen(false);

            // Migrate localStorage data after login
            await migrateLocalStorageToApi();

            // Execute pending callback if any
            if (pendingCallback) {
                pendingCallback();
                setPendingCallback(null);
            }
        } catch (error: any) {
            setAuthError(error.message || 'Ошибка входа');
            throw error;
        }
    }, [pendingCallback]);

    const register = useCallback(async (name: string, nickname: string, email: string, phone: string, password: string, passwordConfirmation: string) => {
        setAuthError(null);
        try {
            const { user: userData } = await authApi.register(name, nickname, email, phone, password, passwordConfirmation);
            setUser(userData);
            setIsNewUser(true);
            setIsAuthModalOpen(false);

            // Execute pending callback if any
            if (pendingCallback) {
                pendingCallback();
                setPendingCallback(null);
            }
        } catch (error: any) {
            setAuthError(error.message || 'Ошибка регистрации');
            throw error;
        }
    }, [pendingCallback]);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } finally {
            setUser(null);
        }
    }, []);

    const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
    const closeAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
        setAuthError(null);
        setPendingCallback(null);
    }, []);
    const clearAuthError = useCallback(() => setAuthError(null), []);

    const requireAuth = useCallback((callback: () => void) => {
        // Если загружается - сохраняем callback и ждём
        if (isLoading) {
            setPendingCallback(() => callback);
            return;
        }

        if (isAuthenticated) {
            callback();
        } else {
            setPendingCallback(() => callback);
            openAuthModal();
        }
    }, [isAuthenticated, isLoading, openAuthModal]);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            isLoading,
            isNewUser,
            completeOnboarding: () => setIsNewUser(false),
            login,
            register,
            logout,
            isAuthModalOpen,
            openAuthModal,
            closeAuthModal,
            requireAuth,
            authError,
            clearAuthError,
            refreshUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
