# Implementation Plan: NeuroForge Cinematic AI Command Center

## 1. Architectural Strategy

### Application State Flow
The application will transition through three primary states managed at the root (`App.tsx`):
- **Landing State**: Cinematic hero section with the "Intelligence Core" animation and the Upload Portal.
- **Processing State**: A high-tension "Analyzing" overlay with telemetry-style progress indicators.
- **Dashboard State**: The full Cinematic Command Center populated with real API data.

### State Management
- **Global State**: Use a simple `useState` or `useReducer` at the `App` level to track:
    - `appState`: `'landing' | 'processing' | 'dashboard'`
    - `analysisData`: `AnalysisResponse | null`
    - `askAIResponse`: `AskAIResponse | null`
    - `currentFile`: `File | null`
    - `isThinking`: `boolean` (for AI query state)

### Layout Structure
A single-page scrollable dashboard with a fixed top bar and bottom status strip.
- **Fixed Overlays**: Top Bar (Workspace), Bottom Status Strip (Telemetry).
- **Main Content**: 
    - Hero (Neural Core + Upload)
    - Metrics Grid (Stats + Sentiment)
    - Signal Map (Topic Visuals)
    - Insights Lab (Recommendations)
    - Intelligence Feed (Recent Reviews)
    - Ask AI (Conversational Interface)

## 2. Component Breakdown

### New Components (`src/components/`)
- `Layout/`:
    - `TopBar.tsx`: Cinematic workspace header.
    - `StatusStrip.tsx`: Bottom telemetry bar with system status.
    - `GlassCard.tsx`: Reusable glassmorphism container with technical border accents.
- `Core/`:
    - `NeuralCore.tsx`: The animated neural visualization (Hero).
    - `UploadPortal.tsx`: Drag & drop CSV interface.
- `Intelligence/`:
    - `MetricsGrid.tsx`: High-impact stat tiles (Total reviews, avg length).
    - `SentimentChart.tsx`: Visual representation of sentiment (using Recharts).
    - `SignalMap.tsx`: Visualization of positive/negative topics.
    - `InsightsLab.tsx`: Styled presentation of `common_praise`, `common_complaints`, and `recommendations`.
    - `IntelligenceFeed.tsx`: The scrollable feed of `reviews`.
- `AI/`:
    - `AskAIInterface.tsx`: Conversational prompt and response display.
    - `CommandPalette.tsx`: Ctrl+K navigation and action menu.

## 3. Integration Map

| UI Section | API Data Source | Mapping |
| :--- | :--- | :--- |
| **Workspace (Top Bar)** | `currentFile.name` | Display as current active workspace. |
| **Metrics Grid** | `AnalysisResponse.stats` | `total_reviews`, `average_length`. |
| **Sentiment Intelligence** | `AnalysisResponse.sentiment` | Positive/Neutral/Negative percentages $\rightarrow$ Chart. |
| **Customer Signal Map** | `AnalysisResponse.positive_topics`, `negative_topics` | Topic names and percentages $\rightarrow$ Signal markers. |
| **AI Insights Lab** | `AnalysisResponse.common_praise`, `common_complaints`, `recommendations`, `summary` | List items $\rightarrow$ "Intelligence Findings". |
| **Intelligence Feed** | `AnalysisResponse.reviews` | Review object $\rightarrow$ Feed card. |
| **Ask AI** | `AskAIResponse` | `answer` $\rightarrow$ AI response bubble. |

## 4. Motion System (framer-motion)

### Ambient Motion
- **Neural Core**: Continuous, slow-pulsing nodes and connecting lines using `animate={{ scale: [1, 1.05, 1] }}`.
- **Background**: Subtle gradient shifts in the `#070910` background.
- **Telemetry**: Rapidly changing "dummy" hex values in the Status Strip to simulate live data.

### Interaction Motion
- **Entrance**: Staggered fade-in and slide-up for dashboard sections (`variants` with `staggerChildren`).
- **State Transition**: "Glitch" effect or smooth slide-out when moving from Landing $\rightarrow$ Dashboard.
- **Query Response**: Typing effect for AI answers to simulate real-time intelligence synthesis.

## 5. Phased Implementation Path

### Phase 1: Design Tokens & Layout (The Foundation)
1. Update `globals.css` with the Obsidian palette (`#070910`), violet accents, and grid backgrounds.
2. Implement `TopBar`, `StatusStrip`, and `GlassCard`.
3. Setup basic `App.tsx` state machine (`landing` $\rightarrow$ `processing` $\rightarrow$ `dashboard`).

### Phase 2: The Hero & Portal (Landing State)
1. Create `NeuralCore.tsx` with ambient animation.
2. Build `UploadPortal.tsx` and integrate with `apiService.analyzeFile`.
3. Implement the "Processing" state overlay with cinematic loading animations.

### Phase 3: Intelligence Dashboard (Dashboard State)
1. Implement `MetricsGrid` and `SentimentChart` using `analysisData`.
2. Build `SignalMap` and `InsightsLab`.
3. Implement `IntelligenceFeed` with `AnimatePresence` for smooth review loading.

### Phase 4: AI Command Center (The Interaction)
1. Build `AskAIInterface.tsx` and integrate with `apiService.askAI`.
2. Implement `CommandPalette.tsx` (Ctrl+K) for navigation.
3. Add typing effects and response animations.

### Phase 5: Polish & Cinematic Pass
1. Add staggered entrance animations to all dashboard sections.
2. Refine glassmorphism (blur, border-opacity).
3. Final pass on colors (Cyan highlights, Ultraviolet accents).

## 6. Verification Plan
- **End-to-End Flow**: Upload CSV $\rightarrow$ Observe Loading State $\rightarrow$ Verify Dashboard displays data matching the uploaded file.
- **API Connectivity**: 
    - Check Network tab to ensure `/analyze` is called with `multipart/form-data`.
    - Check `/ask` is called with correct `question` and `reviews` array.
- **Responsive Integrity**: Verify the cinematic layout holds on different screen sizes.
- **Motion Performance**: Ensure `framer-motion` animations don't cause layout thrashing or lag.
