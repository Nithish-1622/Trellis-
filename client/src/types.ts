export type ThemeMode = 'light' | 'dark';

export interface SkillScores {
  systems: number;
  data: number;
  logic: number;
  ux: number;
  agile: number;
  programming?: number;
  dataMath?: number;
  design?: number;
  communication?: number;
  leadership?: number;
  research?: number;
  [key: string]: number | undefined;
}

export interface UserLearningPreferences {
  pace?: 'relaxed' | 'moderate' | 'intensive';
  weeklyHours?: number;
  hoursPerWeek?: number;
  primaryFormat?: 'reading' | 'interactive' | 'projects' | 'video';
  notifyWeekly?: boolean;
  focusDomains?: string[];
  learningStyle?: string;
  difficulty?: string;
  [key: string]: any;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  avatar?: string;
  onboarded: boolean;
  role: string;
  targetRole: string;
  domainInterests: string[];
  skills: {
    programming: number;
    dataMath: number;
    design: number;
    communication: number;
    leadership: number;
    research: number;
    [key: string]: number;
  };
  targetSkills: {
    programming: number;
    dataMath: number;
    design: number;
    communication: number;
    leadership: number;
    research: number;
    [key: string]: number;
  };
  learningHistory: string[];
  learningGoal: string;
  weeklyHourBudget: number;
  learningStyle: 'hands-on' | 'conceptual' | 'balanced' | string;
  difficultyPreference: 'moderate' | 'accelerated' | 'mastery' | string;
  learningPreferences?: UserLearningPreferences;
  resumeUploaded?: boolean;
  resumeFileName?: string;
  [key: string]: any;
}

export type NodeType = 'course' | 'project' | 'checkpoint';
export type NodeStatus = 'locked' | 'available' | 'in-progress' | 'done' | 'current' | 'upcoming' | 'mastered';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ConceptItem {
  title: string;
  explanation: string;
  codeSnippet?: string;
  badge?: string;
}

export interface InteractiveDemoConfig {
  type: 'event-broker' | 'circuit-breaker' | 'service-mesh' | 'caching' | 'rate-limiter';
  title: string;
  description: string;
}

export interface ResourceLink {
  title: string;
  type: 'article' | 'kata' | 'diagram' | 'video' | 'cheatsheet' | 'doc' | 'course';
  estMinutes: number;
  linkText?: string;
}

export interface LearningModule {
  overview: string;
  keyConcepts: ConceptItem[];
  interactiveDemo?: InteractiveDemoConfig;
  quiz: QuizQuestion[];
  resources: ResourceLink[];
}

export interface WhyThisDetail {
  scoreGap: string;
  rationale: string;
  targetImpact: string;
  keySkill: string;
  predictedSpeedup: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  type?: NodeType;
  status: NodeStatus;
  progress: number; // 0 to 100
  domain?: 'programming' | 'dataMath' | 'design' | 'communication' | 'leadership' | 'research' | 'systems' | 'data' | 'logic' | 'ux' | 'agile' | string;
  whyThis: string;
  whyThisDetail: WhyThisDetail;
  feedback?: 'up' | 'down' | 'regen' | null;
  prerequisites?: string[] | string;
  requires?: string[] | string;
  estHours?: number;
  badgeLabel?: string;
  weekIndex?: number; // 1 = This Week, 2+ = later
  branchId?: string; // e.g., 'core', 'branch-a', 'branch-b'
  isForkPoint?: boolean;
  forkOptions?: { id: string; name: string; tag: string }[];
  selectedFork?: string;
  learningModule: LearningModule;
  [key: string]: any;
}

// Alias for TrackNode for backward compatibility
export type TrackNode = RoadmapNode;

export interface LearningTrack {
  id: string;
  name: string;
  description: string;
  tagline?: string;
  category?: string;
  nodes: TrackNode[];
  [key: string]: any;
}

export interface DiagnosticQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: 'systems' | 'data' | 'logic' | 'ux' | 'agile';
  explanation?: string;
  [key: string]: any;
}

export interface ResourceItem {
  id: string;
  title: string;
  provider?: string;
  type: 'Course' | 'Project' | 'Video' | 'Deep Dive Guide' | 'Architecture Kata' | 'Interactive Diagram' | 'Cheat Sheet' | string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  matchScore?: number; // 0-100%
  description?: string;
  summary?: string;
  whyThis?: string;
  tags: string[];
  feedback?: 'up' | 'down' | 'regen' | null;
  bookmarked: boolean;
  completed?: boolean;
  read?: boolean;
  relatedNodeId?: string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
  suggestedPrompt?: string;
  relatedNodeId?: string;
  [key: string]: any;
}

export interface SkillCheckQuestion {
  id: string;
  domain: string;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  scenario: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SkillCheckReport {
  domain: string;
  proficiencyClaim: string;
  score: number;
  total: number;
  percentage: number;
  bloomStage: 'Budding Sprout' | 'Thriving Shoot' | 'Full Canopy Bloom' | 'Master Arborist';
  strengths: string[];
  growthAreas: string[];
  recommendedNodeTitle: string;
  recommendedNodeId: string;
}
