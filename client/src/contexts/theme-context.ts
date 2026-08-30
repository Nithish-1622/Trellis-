import { createContext } from 'react'

export interface ThemeContextValue {
    darkMode: boolean
    toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
