import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useTheme as useThemeHook } from '../hooks/useTheme';

interface ThemeContextType {
    darkMode: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { darkMode, toggleTheme } = useThemeHook();

    return (
        <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeContext = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
};
