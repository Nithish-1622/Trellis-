import { createContext } from 'react'
import type { Models } from 'appwrite'

export interface LearnerPreferences extends Models.Preferences {
    target_role?: string
}

export interface AuthContextValue {
    user: Models.User<LearnerPreferences> | null
    loading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, name: string) => Promise<void>
    logout: () => Promise<void>
    loginWithGoogle: () => Promise<void>
    loginWithGithub: () => Promise<void>
    loginWithLinkedin: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
