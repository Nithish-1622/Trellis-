import React from 'react';
import type { ReactNode } from 'react';
import { useTheme as useThemeHook } from '../hooks/useTheme';
import { ThemeContext } from './theme-context';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { darkMode, toggleTheme } = useThemeHook();

    return (
        <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
