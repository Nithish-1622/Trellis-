import React, { useState, useEffect } from 'react';
import { account } from '../lib/appwrite';
import { ID, OAuthProvider } from 'appwrite';
import type { Models } from 'appwrite';
import { AuthContext } from './auth-context';
import type { LearnerPreferences } from './auth-context';

interface AppwriteError {
    code?: number
    message?: string
}

const toAppwriteError = (error: unknown): AppwriteError => {
    if (typeof error === 'object' && error !== null) {
        const candidate = error as Record<string, unknown>
        return {
            code: typeof candidate.code === 'number' ? candidate.code : undefined,
            message: typeof candidate.message === 'string' ? candidate.message : undefined,
        }
    }

    return {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Models.User<LearnerPreferences> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        try {
            const accountDetails = await account.get<LearnerPreferences>();
            setUser(accountDetails);
        } catch {
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
            const accountDetails = await account.get<LearnerPreferences>();
            setUser(accountDetails);
        } catch (error: unknown) {
            const err = toAppwriteError(error)
            // If a session is already active, we should logout the previous user and try logging in again
            if (err?.message?.includes('prohibited when a session is active') || err?.code === 401) {
                try {
                    await account.deleteSession('current');
                    // Retry login
                    await account.createEmailPasswordSession(email, password);
                    const accountDetails = await account.get<LearnerPreferences>();
                    setUser(accountDetails);
                    return;
                } catch (retryError: unknown) {
                    const retryErr = toAppwriteError(retryError)
                    setError(retryErr.message || 'Login failed after retry');
                    throw retryError;
                }
            }

            setError(err.message || 'Login failed');
            throw error;
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
        } catch (error: unknown) {
            const err = toAppwriteError(error)
            setError(err.message || 'Registration failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await account.deleteSession('current');
            setUser(null);
        } catch (error: unknown) {
            const err = toAppwriteError(error)
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
        } catch (error: unknown) {
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
        } catch (error: unknown) {
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
        } catch (error: unknown) {
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
