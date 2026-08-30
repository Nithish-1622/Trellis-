import React, { createContext, useContext, useState, useEffect } from 'react';
import { account } from '../lib/appwrite';
import { ID, OAuthProvider } from 'appwrite';

interface AuthContextType {
    user: any;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithGithub: () => Promise<void>;
    loginWithLinkedin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        try {
            const accountDetails = await account.get();
            setUser(accountDetails);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            await account.createEmailPasswordSession(email, password);
            const accountDetails = await account.get();
            setUser(accountDetails);
        } catch (err: any) {
            // If a session is already active, we should logout the previous user and try logging in again
            if (err?.message?.includes('prohibited when a session is active') || err?.code === 401) {
                try {
                    await account.deleteSession('current');
                    // Retry login
                    await account.createEmailPasswordSession(email, password);
                    const accountDetails = await account.get();
                    setUser(accountDetails);
                    return;
                } catch (retryErr: any) {
                    setError(retryErr.message || 'Login failed after retry');
                    throw retryErr;
                }
            }

            setError(err.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string, name: string) => {
        setLoading(true);
        setError(null);
        try {
            await account.create(ID.unique(), email, password, name);
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await account.deleteSession('current');
            setUser(null);
        } catch (err: any) {
            setError(err.message || 'Logout failed');
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        try {
            account.createOAuth2Session(
                OAuthProvider.Google,
                window.location.origin + '/profile', // Success
                window.location.origin + '/login',   // Failure
            );
        } catch (error: any) {
            console.error(error);
            setError("Google login failed");
        }
    };

    const loginWithGithub = async () => {
        try {
            account.createOAuth2Session(
                OAuthProvider.Github,
                window.location.origin + '/profile',
                window.location.origin + '/login',
            );
        } catch (error: any) {
            console.error(error);
            setError("GitHub login failed");
        }
    };

    const loginWithLinkedin = async () => {
        try {
            account.createOAuth2Session(
                OAuthProvider.Linkedin,
                window.location.origin + '/profile',
                window.location.origin + '/login',
            );
        } catch (error: any) {
            console.error(error);
            setError("LinkedIn login failed");
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, loginWithGoogle, loginWithGithub, loginWithLinkedin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
