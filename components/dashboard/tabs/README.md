# Dashboard Tabs Components

This directory contains the tab content components for the dashboard's tabbed interface.

## Structure

```
tabs/
├── types.ts            # Shared TypeScript interfaces
├── OverviewTab.tsx     # Tab 1: Overview
├── PerformanceTab.tsx  # Tab 2: Performance Analytics
├── LearningTab.tsx     # Tab 3: Learning & Skills
└── TeamTab.tsx         # Tab 4: Team & Social
```

## Component Overview

### types.ts
Shared TypeScript interfaces used across all tab components:
- `Session` - Session data structure
- `Insight` - AI insight data structure
- `LeaderboardEntry` - Leaderboard entry structure
- `PerformanceData` - Performance chart data structure

### OverviewTab.tsx
**Purpose**: At-a-glance dashboard view  
**Props**: `metrics`, `recentSessions`, `insights`  
**Features**:
- 4 key metric cards
- Recent sessions (top 3)
- Critical actions/alerts

### PerformanceTab.tsx
**Purpose**: Deep performance analytics  
**Props**: `performanceData`, `insights`, `sessions`  
**Features**:
- Date range filter
- Performance trend chart
- Average scores breakdown
- AI insights panel
- Full sessions table

### LearningTab.tsx
**Purpose**: Training and skill development  
**Props**: `skillsMastered`  
**Features**:
- Skills progress (12 skills)
- Playbooks section
- Daily challenges
- Recommended training

### TeamTab.tsx
**Purpose**: Competition and collaboration  
**Props**: `leaderboard`, `userRank`, `teamStats`  
**Features**:
- Team statistics
- Your ranking details
- Full leaderboard (10+)
- Recent achievements

## Usage

Import and use in parent component:

```tsx
import OverviewTab from '@/components/dashboard/tabs/OverviewTab'
import PerformanceTab from '@/components/dashboard/tabs/PerformanceTab'
import LearningTab from '@/components/dashboard/tabs/LearningTab'
import TeamTab from '@/components/dashboard/tabs/TeamTab'

// In render
{activeTab === 'overview' && <OverviewTab {...props} />}
{activeTab === 'performance' && <PerformanceTab {...props} />}
{activeTab === 'learning' && <LearningTab {...props} />}
{activeTab === 'team' && <TeamTab {...props} />}
```

## Common Patterns

### Animation Wrapper
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.1 }}
>
  <Component />
</motion.div>
```

### Card Container
```tsx
<div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
  {/* Content */}
</div>
```

## Dependencies

Each tab component uses:
- `framer-motion` - For animations
- `lucide-react` - For icons
- Parent dashboard components (MetricCard, PerformanceChart, etc.)
- Shared types from `./types.ts`

## Modification Guide

### Adding a new section to a tab:
1. Import required components
2. Wrap in motion.div with appropriate delay
3. Follow existing spacing patterns (space-y-8)
4. Use consistent animation timings

### Creating a new tab:
1. Create `NewTab.tsx` in this directory
2. Import shared types from `./types.ts`
3. Follow existing component structure
4. Add to parent's tab configuration
5. Add conditional render in parent

## Performance Notes

- Each tab only renders when active (conditional rendering)
- Components use Framer Motion for smooth transitions
- Staggered animations prevent visual jank
- LocalStorage caches last viewed tab

## Accessibility

All tabs include:
- Semantic HTML structure
- Proper heading hierarchy
- Keyboard navigation support
- Screen reader friendly content
- High contrast colors

## Related Files

- **Parent**: `/app/dashboard/page.tsx`
- **Tab Navigation**: `/components/dashboard/TabNavigation.tsx`
- **Shared Components**: `/components/dashboard/*.tsx`

## Documentation

- Full docs: `/DASHBOARD_TABBED_REDESIGN.md`
- Quick reference: `/DASHBOARD_QUICK_REFERENCE.md`
- Summary: `/DASHBOARD_REDESIGN_SUMMARY.md`

