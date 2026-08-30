import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { INITIAL_ROADMAP_NODES, INITIAL_RESOURCE_ITEMS } from './data/roadmapData';
import { DEFAULT_SKILL_SCORES, TARGET_SKILL_SCORES } from './data/tracks';
import { loadGeneratedRoadmap } from './services/learningPathEngine';
import { RoadmapNode, ResourceItem, SkillScores } from './types';
import { Header, ActiveTab } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { RoadmapLatticeView } from './components/RoadmapLatticeView';
import { ResourcesView } from './components/ResourcesView';
import { PracticeSkillCheck } from './components/PracticeSkillCheck';
import { ChatPage } from './components/ChatPage';
import { ProfileView } from './components/ProfileView';
import { AuthPage } from './components/AuthPage';
import { OnboardingWizard } from './components/OnboardingWizard';
import { LearningModal } from './components/LearningModal';
import { WhyThisModal } from './components/WhyThisModal';
import { DiagnosticModal } from './components/DiagnosticModal';
import { TrellisGrowthBackground } from './components/TrellisGrowthBackground';
import { AIGuideBot } from './components/AIGuideBot';
import Dock, { DockItemConfig } from './components/Dock';
import Navigation4, { Nav4ItemConfig } from './components/Navigation4';
import { Layers, BookOpen, CheckSquare, Bot, User, Sun, Moon, LogOut } from 'lucide-react';

// Protected tabs: require authentication to view
const PROTECTED_TABS: ActiveTab[] = ['roadmap', 'resources', 'practice', 'chat', 'profile', 'onboarding'];

function AppContent() {
  const [currentTab, setCurrentTab] = useState<ActiveTab>('landing');
  const [nodes, setNodes] = useState<RoadmapNode[]>(loadGeneratedRoadmap() || INITIAL_ROADMAP_NODES);
  const [resources, setResources] = useState<ResourceItem[]>(INITIAL_RESOURCE_ITEMS);
  const [currentScores, setCurrentScores] = useState<SkillScores>(DEFAULT_SKILL_SCORES);

  // Modals state
  const [selectedNodeForLearn, setSelectedNodeForLearn] = useState<RoadmapNode | null>(null);
  const [selectedNodeForWhyThis, setSelectedNodeForWhyThis] = useState<RoadmapNode | null>(null);
  const [diagnosticOpen, setDiagnosticOpen] = useState<boolean>(false);

  const { user, isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const isPlatformSession = isAuthenticated && !!user?.onboarded && currentTab !== 'landing' && currentTab !== 'auth' && currentTab !== 'onboarding';

  // ── Auth-gated navigation ──────────────────────────────────────────────────
  const guardedNavigate = (tab: ActiveTab) => {
    if (PROTECTED_TABS.includes(tab) && !isAuthenticated) {
      setCurrentTab('auth');
    } else {
      setCurrentTab(tab);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNodeFeedback = (nodeId: string, action: 'up' | 'down' | 'regen') => {
    setNodes(prev =>
      prev.map(node => {
        if (node.id !== nodeId) return node;
        if (action === 'regen') {
          return {
            ...node,
            title: node.title.includes('(Regenerated)') ? node.title : `${node.title} (Regenerated)`,
            shortDescription: `Enhanced with adaptive focus to reinforce prerequisite competencies.`
          };
        }
        return { ...node, feedback: node.feedback === action ? null : action };
      })
    );
  };

  const handleResourceFeedback = (resId: string, action: 'up' | 'down' | 'regen') => {
    setResources(prev =>
      prev.map(res => {
        if (res.id !== resId) return res;
        if (action === 'regen') {
          return { ...res, title: `${res.title} (Tailored Edition)`, matchScore: Math.min(99, res.matchScore + 2) };
        }
        return { ...res, feedback: res.feedback === action ? null : action };
      })
    );
  };

  const handleToggleBookmark = (resId: string) => {
    setResources(prev => prev.map(res => (res.id === resId ? { ...res, bookmarked: !res.bookmarked } : res)));
  };

  const handleMasterNode = (nodeId: string) => {
    setNodes(prev => {
      const nodeIndex = prev.findIndex(n => n.id === nodeId);
      return prev.map((node, idx) => {
        if (node.id === nodeId) return { ...node, status: 'done' as const, progress: 100 };
        if (idx === nodeIndex + 1 && (node.status === 'locked' || node.status === 'available')) {
          return { ...node, status: 'in-progress' as const, progress: 25 };
        }
        return node;
      });
    });
    setCurrentScores(prev => ({
      ...prev,
      systems: Math.min(96, (prev.systems || 60) + 5),
      data: Math.min(96, (prev.data || 50) + 7),
      logic: Math.min(96, (prev.logic || 60) + 4),
      ux: prev.ux || 50,
      agile: Math.min(96, (prev.agile || 50) + 3)
    }));
  };

  const handleSelectNodeById = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      guardedNavigate('roadmap');
      setSelectedNodeForLearn(node);
    }
  };

  const currentNode = nodes.find(n => n.status === 'in-progress' || n.status === 'current') || nodes[0];

  // Navigation 4 rail items for authenticated platform users (strictly 5 core tabs)
  const navItems: Nav4ItemConfig[] = [
    {
      icon: <Layers className="w-5 h-5" />,
      label: 'Roadmap',
      onClick: () => guardedNavigate('roadmap'),
      isActive: currentTab === 'roadmap'
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Resources',
      onClick: () => guardedNavigate('resources'),
      isActive: currentTab === 'resources'
    },
    {
      icon: <CheckSquare className="w-5 h-5" />,
      label: 'Skill-Check',
      onClick: () => guardedNavigate('practice'),
      isActive: currentTab === 'practice'
    },
    {
      icon: <Bot className="w-5 h-5" />,
      label: 'AI Guide',
      onClick: () => guardedNavigate('chat'),
      isActive: currentTab === 'chat'
    },
    {
      icon: <User className="w-5 h-5" />,
      label: 'Profile',
      onClick: () => guardedNavigate('profile'),
      isActive: currentTab === 'profile'
    }
  ];

  return (
    <div className="min-h-screen relative flex flex-col justify-between font-sans selection:bg-emerald-600 selection:text-white dark:selection:bg-emerald-500 dark:selection:text-slate-950 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-20">

      {/* Living Trellis Canvas — ONLY on Landing page */}
      {currentTab === 'landing' && (
        <TrellisGrowthBackground opacity={0.75} />
      )}

      {/* Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={guardedNavigate}
      />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-24 md:pt-28 pb-16 relative z-10">

        {/* PUBLIC: Landing — overview only */}
        {currentTab === 'landing' && (
          <LandingPage
            onGetStarted={() => guardedNavigate('auth')}
            onExploreResources={() => guardedNavigate('resources')}
            onOpenOnboarding={() => guardedNavigate('onboarding')}
          />
        )}

        {/* PROTECTED: Roadmap */}
        {currentTab === 'roadmap' && isAuthenticated && (
          <RoadmapLatticeView
            nodes={nodes}
            onSelectNode={node => setSelectedNodeForLearn(node)}
            onOpenWhyThis={node => setSelectedNodeForWhyThis(node)}
            onNodeFeedback={handleNodeFeedback}
          />
        )}

        {/* PROTECTED: Resources */}
        {currentTab === 'resources' && isAuthenticated && (
          <ResourcesView
            resources={resources}
            onToggleBookmark={handleToggleBookmark}
            onResourceFeedback={handleResourceFeedback}
          />
        )}

        {/* PROTECTED: Skill-Check */}
        {currentTab === 'practice' && isAuthenticated && (
          <PracticeSkillCheck
            onNavigateRoadmap={() => guardedNavigate('roadmap')}
          />
        )}

        {/* PROTECTED: Trellis Guide Chat */}
        {currentTab === 'chat' && isAuthenticated && (
          <ChatPage />
        )}

        {/* PROTECTED: Profile */}
        {currentTab === 'profile' && isAuthenticated && (
          <ProfileView
            nodes={nodes}
            resources={resources}
            onSelectNode={node => {
              guardedNavigate('roadmap');
              setSelectedNodeForLearn(node);
            }}
            onOpenWhyThis={node => setSelectedNodeForWhyThis(node)}
            onNodeFeedback={handleNodeFeedback}
            onToggleBookmark={handleToggleBookmark}
            onResourceFeedback={handleResourceFeedback}
          />
        )}

        {/* PUBLIC: Auth (login / register) */}
        {currentTab === 'auth' && (
          <AuthPage
            onSuccess={target => {
              if (target === '/onboarding') {
                setCurrentTab('onboarding'); // New users → onboarding
              } else {
                setCurrentTab('profile');    // Returning users → profile
              }
            }}
            onNavigateHome={() => setCurrentTab('landing')}
          />
        )}

        {/* PROTECTED: Onboarding wizard (new users only) */}
        {currentTab === 'onboarding' && isAuthenticated && (
          <OnboardingWizard
            onComplete={() => setCurrentTab('profile')}
          />
        )}
      </main>

      {/* Floating AI Guide Bot — ONLY on platform pages when authenticated & profile setup */}
      {isPlatformSession && currentTab !== 'chat' && (
        <AIGuideBot
          currentNode={currentNode as any}
          currentScores={currentScores}
          onOpenNodeModal={handleSelectNodeById}
        />
      )}

      {/* Navigation 4: Vertical Side Navigation Rail with Dock-style Scaling & Tooltips */}
      {isPlatformSession && (
        <Navigation4 items={navItems} baseItemSize={42} magnification={58} distance={120} />
      )}

      {/* Footer — only on landing, roadmap, resources, practice, profile */}
      {currentTab !== 'auth' && currentTab !== 'onboarding' && currentTab !== 'chat' && (
        <Footer
          onSelectTab={tab => guardedNavigate(tab as ActiveTab)}
          onOpenDiagnostic={() => setDiagnosticOpen(true)}
        />
      )}

      {/* Modals */}
      {selectedNodeForLearn && (
        <LearningModal
          node={selectedNodeForLearn}
          onClose={() => setSelectedNodeForLearn(null)}
          onMasterNode={handleMasterNode}
        />
      )}
      {selectedNodeForWhyThis && (
        <WhyThisModal
          node={selectedNodeForWhyThis}
          onClose={() => setSelectedNodeForWhyThis(null)}
          onFeedback={(nodeId, fb) => handleNodeFeedback(nodeId, fb)}
        />
      )}
      {diagnosticOpen && (
        <DiagnosticModal
          onClose={() => setDiagnosticOpen(false)}
          onUpdateScores={newScores => setCurrentScores(newScores)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
