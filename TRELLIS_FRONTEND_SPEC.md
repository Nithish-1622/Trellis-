# Trellis Frontend — Complete Master Component Specification & Prompt Handbook

> **Target Project**: `Trellis-` (`feat/ui` branch)  
> **Source Workspace**: `hcl-frontend`  
> **Theme**: Botanical-Cyber Emerald Glassmorphism (`#10b981`, `#059669`, `#022c22`, `#020617`)  
> **Coverage**: 100% of all 39 UI components, 2 Contexts, 2 Engine Services, 2 Data Stores, and App Shell.

---

## Table of Contents
1. [Master Component Index (All 39 Components)](#1-master-component-index)
2. [Global Shell, Brand & Living Background Components](#2-global-shell-brand--living-background-components)
   - [1. App.tsx](#1-apptsx)
   - [2. Header.tsx](#2-headertsx)
   - [3. Footer.tsx](#3-footertsx)
   - [4. TrellisLogo.tsx](#4-trellislogotsx)
   - [5. TrellisGrowthBackground.tsx](#5-trellisgrowthbackgroundtsx)
   - [6. TrellisVine.tsx](#6-trellisvinetsx)
   - [7. ShaderBackground.tsx](#7-shaderbackgroundtsx)
   - [8. SproutLoader.tsx](#8-sproutloadertsx)
   - [9. StemProgressBar.tsx](#9-stemprogressbartsx)
3. [Navigation & Dock Suite](#3-navigation--dock-suite)
   - [10. Navigation4.tsx & Navigation4.css](#10-navigation4tsx--navigation4css)
   - [11. Dock.tsx & Dock.css](#11-docktsx--dockcss)
   - [12. GlassIcons.tsx & GlassIcons.css](#12-glassiconstsx--glassiconscss)
   - [13. GooeyNav.tsx & GooeyNav.css](#13-gooeynavtsx--gooeynavcss)
4. [Landing Page Suite](#4-landing-page-suite)
   - [14. LandingPage.tsx](#14-landingpagetsx)
   - [15. Hero21.tsx & Hero21.css](#15-hero21tsx--hero21css)
   - [16. Features4.tsx & Features4.css](#16-features4tsx--features4css)
   - [17. SocialProof15.tsx & SocialProof15.css](#17-socialproof15tsx--socialproof15css)
5. [Authentication Suite](#5-authentication-suite)
   - [18. AuthPage.tsx](#18-authpagetsx)
   - [19. Auth2.tsx & Auth2.css](#19-auth2tsx--auth2css)
   - [20. Auth5.tsx & Auth5.css](#20-auth5tsx--auth5css)
6. [Onboarding & Resume Parser Suite](#6-onboarding--resume-parser-suite)
   - [21. OnboardingWizard.tsx](#21-onboardingwizardtsx)
   - [22. Stepper.tsx & Stepper.css](#22-steppertsx--steppercss)
   - [23. ResumeDropper.tsx & ResumeDropper.css](#23-resumedroppertsx--resumedroppercss)
7. [Roadmap Lattice & Learning Modals Suite](#7-roadmap-lattice--learning-modals-suite)
   - [24. RoadmapLatticeView.tsx](#24-roadmaplatticeviewtsx)
   - [25. LearningModal.tsx](#25-learningmodaltsx)
   - [26. WhyThisModal.tsx](#26-whythismodaltsx)
   - [27. DiagnosticModal.tsx](#27-diagnosticmodaltsx)
8. [Curated Resources Hub Suite](#8-curated-resources-hub-suite)
   - [28. ResourcesView.tsx](#28-resourcesviewtsx)
   - [29. ModalCards.tsx & ModalCards.css](#29-modalcardstsx--modalcardscss)
   - [30. CreditCard.tsx & CreditCard.css](#30-creditcardtsx--creditcardcss)
9. [Practice & Skill-Check Arena Suite](#9-practice--skill-check-arena-suite)
   - [31. PracticeSkillCheck.tsx](#31-practiceskillchecktsx)
10. [AI Mentor & Floating Guide Bot Suite](#10-ai-mentor--floating-guide-bot-suite)
    - [32. ChatPage.tsx](#32-chatpagetsx)
    - [33. AIChat7.tsx & AIChat7.css](#33-aichat7tsx--aichat7css)
    - [34. AIGuideBot.tsx](#34-aiguidebottsx)
11. [Profile, Radar & Telemetry Suite](#11-profile-radar--telemetry-suite)
    - [35. ProfileView.tsx](#35-profileviewtsx)
    - [36. Profile1.tsx & Profile1.css](#36-profile1tsx--profile1css)
    - [37. SkillRadar.tsx](#37-skillradartsx)
    - [38. SkillRadarSvg.tsx](#38-skillradarsvgtsx)
    - [39. Analytics9.tsx & Analytics9.css](#39-analytics9tsx--analytics9css)
    - [40. Scheduling1.tsx & Scheduling1.css](#40-scheduling1tsx--scheduling1css)
12. [Contexts, Services & Data Stores](#12-contexts-services--data-stores)
13. [Complete Step-by-Step Rebuild Instructions](#13-complete-step-by-step-rebuild-instructions)

---

## 1. Master Component Index

| # | Component Name | File Path | Category | Description |
|---|----------------|-----------|----------|-------------|
| 1 | `App.tsx` | `src/App.tsx` | Shell | Main router, tab state & auth guardian |
| 2 | `Header.tsx` | `src/components/Header.tsx` | Shell | Sticky glass top bar with nav pills & theme toggle |
| 3 | `Footer.tsx` | `src/components/Footer.tsx` | Shell | Footer links & diagnostic quick-trigger |
| 4 | `TrellisLogo.tsx` | `src/components/TrellisLogo.tsx` | Brand | Vector SVG cyber-lattice & green shoot |
| 5 | `TrellisGrowthBackground.tsx` | `src/components/TrellisGrowthBackground.tsx` | Background | Procedural canvas vine lattice animation |
| 6 | `TrellisVine.tsx` | `src/components/TrellisVine.tsx` | Background | SVG climbing vines for roadmap connection nodes |
| 7 | `ShaderBackground.tsx` | `src/components/ShaderBackground.tsx` | Background | Ambient glowing mesh shader effect |
| 8 | `SproutLoader.tsx` | `src/components/SproutLoader.tsx` | Feedback | Botanical leaf budding loading spinner |
| 9 | `StemProgressBar.tsx` | `src/components/StemProgressBar.tsx` | Feedback | Growing green vine progress indicator |
| 10 | `Navigation4.tsx` | `src/components/Navigation4.tsx` | Navigation | Vertical floating dock rail with magnification |
| 11 | `Dock.tsx` | `src/components/Dock.tsx` | Navigation | macOS spring-physics interactive icon dock |
| 12 | `GlassIcons.tsx` | `src/components/GlassIcons.tsx` | Navigation | 3D layered glassmorphic glowing icons |
| 13 | `GooeyNav.tsx` | `src/components/GooeyNav.tsx` | Navigation | Liquid gooey spring tab switcher |
| 14 | `LandingPage.tsx` | `src/components/LandingPage.tsx` | Landing | Public marketing page with live previews |
| 15 | `Hero21.tsx` | `src/components/Hero21.tsx` | Landing | Hero banner with live interactive score preview |
| 16 | `Features4.tsx` | `src/components/Features4.tsx` | Landing | 4-card Bento feature grid with micro-widgets |
| 17 | `SocialProof15.tsx` | `src/components/SocialProof15.tsx` | Landing | Live stats counters, company strip & reviews |
| 18 | `AuthPage.tsx` | `src/components/AuthPage.tsx` | Auth | Dual mode Sign In / Sign Up container |
| 19 | `Auth2.tsx` | `src/components/Auth2.tsx` | Auth | Split card authentication with ambient glow |
| 20 | `Auth5.tsx` | `src/components/Auth5.tsx` | Auth | Minimal modern floating glass auth card |
| 21 | `OnboardingWizard.tsx` | `src/components/OnboardingWizard.tsx` | Onboarding | 5-step personalized lattice synthesizer |
| 22 | `Stepper.tsx` | `src/components/Stepper.tsx` | Onboarding | Multi-step progress bar with checkmarks |
| 23 | `ResumeDropper.tsx` | `src/components/ResumeDropper.tsx` | Onboarding | Drag-and-drop resume scanner & parser |
| 24 | `RoadmapLatticeView.tsx` | `src/components/RoadmapLatticeView.tsx` | Roadmap | Interactive adaptive vine node graph |
| 25 | `LearningModal.tsx` | `src/components/LearningModal.tsx` | Learning | Deep dive study modal, sandbox demo & quiz |
| 26 | `WhyThisModal.tsx` | `src/components/WhyThisModal.tsx` | Learning | Explainable AI rationale & skill gap dialog |
| 27 | `DiagnosticModal.tsx` | `src/components/DiagnosticModal.tsx` | Assessment | 5-category rapid diagnostic assessment |
| 28 | `ResourcesView.tsx` | `src/components/ResourcesView.tsx` | Resources | Searchable & filterable curated resources hub |
| 29 | `ModalCards.tsx` | `src/components/ModalCards.tsx` | Resources | Expandable resource cards with match score |
| 30 | `CreditCard.tsx` | `src/components/CreditCard.tsx` | Resources | 3D glassmorphic credential & certificate card |
| 31 | `PracticeSkillCheck.tsx` | `src/components/PracticeSkillCheck.tsx` | Assessment | Real-time coding/concept arena with Bloom report |
| 32 | `ChatPage.tsx` | `src/components/ChatPage.tsx` | AI Mentor | Full-page conversational AI engineering mentor |
| 33 | `AIChat7.tsx` | `src/components/AIChat7.tsx` | AI Mentor | Chat message stream with markdown & code copy |
| 34 | `AIGuideBot.tsx` | `src/components/AIGuideBot.tsx` | AI Mentor | Floating intelligent contextual assistant |
| 35 | `ProfileView.tsx` | `src/components/ProfileView.tsx` | Profile | Master dashboard (Radar, Milestones, Schedule) |
| 36 | `Profile1.tsx` | `src/components/Profile1.tsx` | Profile | User profile header card with XP & level badges |
| 37 | `SkillRadar.tsx` | `src/components/SkillRadar.tsx` | Profile | Radar chart canvas wrapper |
| 38 | `SkillRadarSvg.tsx` | `src/components/SkillRadarSvg.tsx` | Profile | Multi-axis SVG radar polygon overlay chart |
| 39 | `Analytics9.tsx` | `src/components/Analytics9.tsx` | Analytics | Velocity, hours spent & streak charts |
| 40 | `Scheduling1.tsx` | `src/components/Scheduling1.tsx` | Analytics | Study planner calendar & mock interview booking |

---

## 2. Global Shell, Brand & Living Background Components

### 1. `App.tsx`
* **File**: `src/App.tsx`
* **Prompt**:
> "Create the root `App.tsx` in React 19 + TypeScript. Wrap with `ThemeProvider` and `AuthProvider`. Manage active tab state (`landing`, `roadmap`, `resources`, `practice`, `chat`, `profile`, `auth`, `onboarding`). Guard protected tabs so unauthenticated users are redirected to `auth`. When on `landing`, render `TrellisGrowthBackground`. Render `Header`, `Navigation4` (vertical side dock rail for platform sessions), floating `AIGuideBot`, `Footer`, and all modals (`LearningModal`, `WhyThisModal`, `DiagnosticModal`). Support `handleMasterNode` which advances progress, increases skill scores, and fires confetti."

### 2. `Header.tsx`
* **File**: `src/components/Header.tsx`
* **Prompt**:
> "Create a glassmorphic sticky top navbar `Header.tsx`. Display the `TrellisLogo`, tab navigation items with active emerald indicators, theme switch button (Sun/Moon with smooth rotational toggle), and an Auth status pill showing avatar/logout or 'Sign In'."

### 3. `Footer.tsx`
* **File**: `src/components/Footer.tsx`
* **Prompt**:
> "Build a responsive dark-themed footer `Footer.tsx` with columns for Platform links, Learning Tracks, Company, and Legal. Include a 'Recalibrate Skills' button that launches `DiagnosticModal`."

### 4. `TrellisLogo.tsx`
* **File**: `src/components/TrellisLogo.tsx`
* **Prompt**:
> "Create an SVG brand icon `TrellisLogo.tsx` combining an emerald green climbing shoot intersecting with a geometric translucent cyber-lattice."

### 5. `TrellisGrowthBackground.tsx`
* **File**: `src/components/TrellisGrowthBackground.tsx`
* **Prompt**:
> "Create a full-screen procedural canvas animation `TrellisGrowthBackground.tsx` simulating a botanical trellis with climbing vines, blooming leaf nodes, and subtle dust particles using `requestAnimationFrame`."

### 6. `TrellisVine.tsx`
* **File**: `src/components/TrellisVine.tsx`
* **Prompt**:
> "Create an SVG connection component `TrellisVine.tsx` that renders organic curved branch paths between roadmap nodes with glowing pulse animations along active branches."

### 7. `ShaderBackground.tsx`
* **File**: `src/components/ShaderBackground.tsx`
* **Prompt**:
> "Build an ambient glowing background gradient component `ShaderBackground.tsx` with moving emerald, cyan, and deep slate color orbs."

### 8. `SproutLoader.tsx`
* **File**: `src/components/SproutLoader.tsx`
* **Prompt**:
> "Create an animated loading spinner `SproutLoader.tsx` shaped like a budding seed sprouting green leaves with a gentle rhythmic pulse."

### 9. `StemProgressBar.tsx`
* **File**: `src/components/StemProgressBar.tsx`
* **Prompt**:
> "Build a botanical progress bar `StemProgressBar.tsx` that grows as a green stem with leaf nodes popping up at 25%, 50%, 75%, and 100% milestone marks."

---

## 3. Navigation & Dock Suite

### 10. `Navigation4.tsx` & `Navigation4.css`
* **File**: `src/components/Navigation4.tsx`
* **Prompt**:
> "Create a vertical floating dock navigation rail `Navigation4.tsx` with Framer Motion. Smoothly magnify hovered and neighbor icons using mouse position distance calculation (`baseItemSize=42`, `magnification=58`, `distance=120`) and display glassmorphic tooltip labels."

### 11. `Dock.tsx` & `Dock.css`
* **File**: `src/components/Dock.tsx`
* **Prompt**:
> "Create a reusable horizontal/vertical magnetic dock component `Dock.tsx` using spring physics."

### 12. `GlassIcons.tsx` & `GlassIcons.css`
* **File**: `src/components/GlassIcons.tsx`
* **Prompt**:
> "Create 3D layered glassmorphic glowing icons `GlassIcons.tsx` with subtle refractive highlights and neon emerald hover glows."

### 13. `GooeyNav.tsx` & `GooeyNav.css`
* **File**: `src/components/GooeyNav.tsx`
* **Prompt**:
> "Build an interactive liquid gooey tab switcher `GooeyNav.tsx` using SVG Gaussian blur and color matrix filters for a fluid morphing indicator."

---

## 4. Landing Page Suite

### 14. `LandingPage.tsx`
* **File**: `src/components/LandingPage.tsx`
* **Prompt**:
> "Assemble the landing page `LandingPage.tsx` combining `Hero21`, `Features4`, and `SocialProof15`. Include an interactive live preview section of the Trellis node tree."

### 15. `Hero21.tsx` & `Hero21.css`
* **File**: `src/components/Hero21.tsx`
* **Prompt**:
> "Create a high-impact hero section `Hero21.tsx` with a glowing badge pill ('⚡ AI-Powered Skill Lattice v2.4'), headline, dual CTAs, and a floating glass card with an animated score counter jumping from 45% to 88%."

### 16. `Features4.tsx` & `Features4.css`
* **File**: `src/components/Features4.tsx`
* **Prompt**:
> "Build a 4-card Bento grid `Features4.tsx` highlighting Adaptive Lattice, Real-time Diagnostic, Explainable AI, and 24/7 AI Mentor with interactive micro-widgets on each card."

### 17. `SocialProof15.tsx` & `SocialProof15.css`
* **File**: `src/components/SocialProof15.tsx`
* **Prompt**:
> "Build a social proof section `SocialProof15.tsx` with live animated stats counters, company logos strip, and 3 learner review cards with star ratings and career transitions."

---

## 5. Authentication Suite

### 18. `AuthPage.tsx`
* **File**: `src/components/AuthPage.tsx`
* **Prompt**:
> "Create a dual-mode authentication page `AuthPage.tsx` housing `Auth2` and `Auth5`, switching between Login and Signup with automatic redirect to Onboarding for new users."

### 19. `Auth2.tsx` & `Auth2.css`
* **File**: `src/components/Auth2.tsx`
* **Prompt**:
> "Create a split-card glassmorphic login component `Auth2.tsx` with animated gradient borders, email/password validation, and social login triggers."

### 20. `Auth5.tsx` & `Auth5.css`
* **File**: `src/components/Auth5.tsx`
* **Prompt**:
> "Create a modern minimalist registration card `Auth5.tsx` with password strength evaluation and role selection."

---

## 6. Onboarding & Resume Parser Suite

### 21. `OnboardingWizard.tsx`
* **File**: `src/components/OnboardingWizard.tsx`
* **Prompt**:
> "Build a 5-step onboarding wizard `OnboardingWizard.tsx` (Goal, Role, Resume Drop, Diagnostic Quiz, Lattice Synthesis). On completion, generate personalized roadmap and save profile."

### 22. `Stepper.tsx` & `Stepper.css`
* **File**: `src/components/Stepper.tsx`
* **Prompt**:
> "Build a 5-step progress indicator `Stepper.tsx` with completed checkmarks, glowing active ring, and connecting lines."

### 23. `ResumeDropper.tsx` & `ResumeDropper.css`
* **File**: `src/components/ResumeDropper.tsx`
* **Prompt**:
> "Create a drag-and-drop resume upload zone `ResumeDropper.tsx` with laser scanning animation, keyword extraction chips, and skill score auto-fill."

---

## 7. Roadmap Lattice & Learning Modals Suite

### 24. `RoadmapLatticeView.tsx`
* **File**: `src/components/RoadmapLatticeView.tsx`
* **Prompt**:
> "Build the main learning roadmap `RoadmapLatticeView.tsx`. Render nodes with statuses (`done`, `in-progress`, `available`, `locked`), Thumbs Up/Down/Regenerate buttons, 'Why This' trigger, and click-to-learn modal opener."

### 25. `LearningModal.tsx`
* **File**: `src/components/LearningModal.tsx`
* **Prompt**:
> "Build a deep dive learning modal `LearningModal.tsx` with 4 tabs: Key Concepts (code snippets), Interactive Demo (Circuit Breaker / Event Broker sandbox), Knowledge Check Quiz, and External Resources, plus 'Mark as Mastered' with confetti."

### 26. `WhyThisModal.tsx`
* **File**: `src/components/WhyThisModal.tsx`
* **Prompt**:
> "Create an explainability dialog `WhyThisModal.tsx` explaining why a node was chosen, score gap, career velocity multiplier, and prerequisites."

### 27. `DiagnosticModal.tsx`
* **File**: `src/components/DiagnosticModal.tsx`
* **Prompt**:
> "Build a 5-question multi-domain diagnostic modal `DiagnosticModal.tsx` to recalculate skill radar scores."

---

## 8. Curated Resources Hub Suite

### 28. `ResourcesView.tsx`
* **File**: `src/components/ResourcesView.tsx`
* **Prompt**:
> "Create a filterable resources hub `ResourcesView.tsx` with search, type tabs (Courses, Projects, Videos, Katas), difficulty filter, and bookmark management."

### 29. `ModalCards.tsx` & `ModalCards.css`
* **File**: `src/components/ModalCards.tsx`
* **Prompt**:
> "Create glassmorphic resource cards `ModalCards.tsx` with AI match score rings (e.g. 98%), tags, and bookmark buttons."

### 30. `CreditCard.tsx` & `CreditCard.css`
* **File**: `src/components/CreditCard.tsx`
* **Prompt**:
> "Create 3D glassmorphic certification cards `CreditCard.tsx` displaying mastered skills and completion dates."

---

## 9. Practice & Skill-Check Arena Suite

### 31. `PracticeSkillCheck.tsx`
* **File**: `src/components/PracticeSkillCheck.tsx`
* **Prompt**:
> "Build a timed skill-check arena `PracticeSkillCheck.tsx` with difficulty tiers (Junior to Lead), syntax-highlighted code questions, instant explanations, and Bloom Taxonomy growth reports."

---

## 10. AI Mentor & Floating Guide Bot Suite

### 32. `ChatPage.tsx`
* **File**: `src/components/ChatPage.tsx`
* **Prompt**:
> "Create a full-page AI mentor chat `ChatPage.tsx` with prompt suggestion pills, conversation history, and node contextualization."

### 33. `AIChat7.tsx` & `AIChat7.css`
* **File**: `src/components/AIChat7.tsx`
* **Prompt**:
> "Build the chat message feed `AIChat7.tsx` with markdown rendering (`react-markdown`), code block copy buttons, and animated typing indicators."

### 34. `AIGuideBot.tsx`
* **File**: `src/components/AIGuideBot.tsx`
* **Prompt**:
> "Create a collapsible floating assistant `AIGuideBot.tsx` in the bottom-right corner with proactive milestone tips and quick-ask input."

---

## 11. Profile, Radar & Telemetry Suite

### 35. `ProfileView.tsx`
* **File**: `src/components/ProfileView.tsx`
* **Prompt**:
> "Build a master dashboard `ProfileView.tsx` integrating `Profile1`, `SkillRadarSvg`, `Analytics9`, bookmarked resources, and `Scheduling1`."

### 36. `Profile1.tsx` & `Profile1.css`
* **File**: `src/components/Profile1.tsx`
* **Prompt**:
> "Build a profile header card `Profile1.tsx` with avatar, XP level, target role, and editable bio."

### 37. `SkillRadar.tsx` & 38. `SkillRadarSvg.tsx`
* **File**: `src/components/SkillRadarSvg.tsx`
* **Prompt**:
> "Build an interactive multi-axis SVG radar chart `SkillRadarSvg.tsx` overlaying current scores vs target role benchmarks with hover tooltip values."

### 39. `Analytics9.tsx` & `Analytics9.css`
* **File**: `src/components/Analytics9.tsx`
* **Prompt**:
> "Create learning velocity bar charts `Analytics9.tsx` showing weekly study hours, streak count, and completed milestones."

### 40. `Scheduling1.tsx` & `Scheduling1.css`
* **File**: `src/components/Scheduling1.tsx`
* **Prompt**:
> "Build an interactive calendar `Scheduling1.tsx` for scheduling study hours and booking 1-on-1 AI mock interviews."

---

## 12. Contexts, Services & Data Stores

### Contexts
- `src/context/AuthContext.tsx`: User session state, login/register/logout, profile updates in `localStorage`.
- `src/context/ThemeContext.tsx`: Dark/light mode theme management.

### Services
- `src/services/agentService.ts`: Gemini API client for chat streaming, why-this explanations, and diagnostic grading.
- `src/services/learningPathEngine.ts`: Algorithmic roadmap synthesis based on user goals and resume scores.

### Data
- `src/data/roadmapData.ts`: Default roadmap nodes, curated resource items, diagnostic question banks.
- `src/data/tracks.ts`: Fullstack, Systems, AI/ML, DevOps track configurations and benchmark scores.
- `src/types.ts`: Comprehensive TypeScript interface library.

---

## 13. Complete Step-by-Step Rebuild Instructions

### Step 1: Install Dependencies in `Trellis-/client`
```bash
npm install lucide-react motion canvas-confetti react-markdown remark-gfm
npm install -D @types/canvas-confetti
```

### Step 2: Copy All Source Files
Copy the following folders from `hcl-frontend/src` to `Trellis-/client/src`:
- `components/` (all 39 component `.tsx` and `.css` files)
- `context/` (`AuthContext.tsx`, `ThemeContext.tsx`)
- `data/` (`roadmapData.ts`, `tracks.ts`)
- `services/` (`agentService.ts`, `learningPathEngine.ts`)
- `types.ts`
- `App.tsx`
- `index.css`

### Step 3: Run Dev Server
```bash
npm run dev
```

---
*Generated for Trellis Engineering Team — 2026*
