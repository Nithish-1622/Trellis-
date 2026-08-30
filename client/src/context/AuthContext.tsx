import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (data: Partial<UserProfile>) => void;
  loginDemoUser: () => void;
}

const DEFAULT_DEMO_USER: UserProfile = {
  id: 'usr_trellis_8829',
  name: 'Elena Rostova',
  email: 'elena.rostova@trellis.grow',
  avatarUrl: '/avatars/Artboards_Diversity_Avatars_by_Netguru-01.svg',
  avatar: '/avatars/Artboards_Diversity_Avatars_by_Netguru-01.svg',
  onboarded: true,
  role: 'Senior Staff Architect Path',
  targetRole: 'Principal Cloud Systems Architect',
  domainInterests: ['Distributed Systems', 'Software Architecture', 'Cloud & DevOps', 'AI/ML Engineering'],
  skills: {
    programming: 78,
    dataMath: 62,
    design: 70,
    communication: 84,
    leadership: 66,
    research: 58
  },
  targetSkills: {
    programming: 92,
    dataMath: 85,
    design: 88,
    communication: 90,
    leadership: 88,
    research: 80
  },
  learningHistory: ['AWS Certified Solutions Architect', 'Distributed Systems Patterns', 'Kubernetes CKAD', 'Domain-Driven Design Masterclass'],
  learningGoal: 'Design resilient multi-region event-driven distributed microservices with 99.999% uptime and low tail latency.',
  weeklyHourBudget: 6,
  learningStyle: 'hands-on',
  difficultyPreference: 'accelerated',
  resumeUploaded: true,
  resumeFileName: 'elena_rostova_staff_eng.pdf'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('trellis_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null; // Unauthenticated by default — require explicit login/register/demo action
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('trellis_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('trellis_auth_user');
    }
  }, [user]);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 450)); // Realistic network latency
    setIsLoading(false);

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const loggedUser: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
      onboarded: true, // Returning users skip onboarding and go to profile
      role: 'Growth Learner',
      targetRole: 'Solutions Architect',
      domainInterests: ['Distributed Systems', 'Software Architecture'],
      skills: {
        programming: 65,
        dataMath: 50,
        design: 60,
        communication: 70,
        leadership: 55,
        research: 50
      },
      targetSkills: {
        programming: 90,
        dataMath: 80,
        design: 85,
        communication: 85,
        leadership: 80,
        research: 75
      },
      learningHistory: ['Modern Web Architecture'],
      learningGoal: 'Master full-stack system architecture and distributed scaling.',
      weeklyHourBudget: 5,
      learningStyle: 'balanced',
      difficultyPreference: 'accelerated'
    };

    setUser(loggedUser);
    return { success: true };
  };

  const register = async (name: string, email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setIsLoading(false);

    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters long.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const newUser: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
      onboarded: false, // Must go through onboarding
      role: 'New Cultivator',
      targetRole: 'Aspiring Systems Architect',
      domainInterests: [],
      skills: {
        programming: 50,
        dataMath: 50,
        design: 50,
        communication: 50,
        leadership: 50,
        research: 50
      },
      targetSkills: {
        programming: 85,
        dataMath: 80,
        design: 80,
        communication: 85,
        leadership: 80,
        research: 75
      },
      learningHistory: [],
      learningGoal: '',
      weeklyHourBudget: 4,
      learningStyle: 'hands-on',
      difficultyPreference: 'moderate'
    };

    setUser(newUser);
    return { success: true };
  };

  const loginDemoUser = () => {
    setUser(DEFAULT_DEMO_USER);
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser(prev => (prev ? { ...prev, ...updates } : null));
  };

  const completeOnboarding = (data: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...data,
        onboarded: true
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        completeOnboarding,
        loginDemoUser
      }}
    >
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
