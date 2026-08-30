import React, { useState, useEffect } from 'react';
import { account } from '../lib/appwrite';
import { ID, OAuthProvider } from 'appwrite';
import type { Models } from 'appwrite';
import { AuthContext } from './auth-context';
import type { LearnerPreferences } from './auth-context';
import { getErrorCode, getErrorMessage } from '../utils/errors';

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
            const errorCode = getErrorCode(error)
            const errorMessage = getErrorMessage(error, 'Login failed')
            // If a session is already active, we should logout the previous user and try logging in again
            if (errorMessage.includes('prohibited when a session is active') || errorCode === 401) {
                try {
                    await account.deleteSession('current');
                    // Retry login
                    await account.createEmailPasswordSession(email, password);
                    const accountDetails = await account.get<LearnerPreferences>();
                    setUser(accountDetails);
                    return;
                } catch (retryError: unknown) {
                    setError(getErrorMessage(retryError, 'Login failed after retry'));
                    throw retryError;
                }
            }

            setError(errorMessage);
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
            setError(getErrorMessage(error, 'Registration failed'));
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
            setError(getErrorMessage(error, 'Logout failed'));
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
