# Dashboard Quick Reference

## Tab Structure at a Glance

### 🏠 Overview Tab
```
├── Critical Actions (if warnings exist)
├── 4 Key Metric Cards
│   ├── Practice Sessions Today
│   ├── Average Score
│   ├── Skills Mastered
│   └── Team Ranking
└── Recent Sessions (Top 3)
```

### 📊 Performance Tab
```
├── Date Range Filter
├── Performance Trend Chart (Enhanced)
├── Average Scores by Category
├── AI Performance Insights (Full)
└── Session Analytics Table (All)
```

### 📚 Learning Tab
```
├── Skills Progress Dashboard (12 skills)
├── Playbooks Section
├── Daily Challenges
└── Recommended Training Modules
```

### 👥 Team Tab
```
├── Team Statistics (3 cards)
├── Your Ranking Details
├── Full Team Leaderboard (10+ members)
└── Recent Team Achievements
```

---

## File Locations

| Component | Path |
|-----------|------|
| Main Dashboard | `/app/dashboard/page.tsx` |
| Tab Navigation | `/components/dashboard/TabNavigation.tsx` |
| Overview Tab | `/components/dashboard/tabs/OverviewTab.tsx` |
| Performance Tab | `/components/dashboard/tabs/PerformanceTab.tsx` |
| Learning Tab | `/components/dashboard/tabs/LearningTab.tsx` |
| Team Tab | `/components/dashboard/tabs/TeamTab.tsx` |
| Shared Types | `/components/dashboard/tabs/types.ts` |

---

## Key Props by Tab

### OverviewTab
```typescript
{
  metrics: {
    sessionsToday: { value, trend, trendUp }
    avgScore: { value, trend, trendUp }
    skillsMastered: { value, total, percentage }
    teamRanking: { value, total, trend, trendUp }
  }
  recentSessions: Session[]
  insights: Insight[]
}
```

### PerformanceTab
```typescript
{
  performanceData: PerformanceData[]
  insights: Insight[]
  sessions: Session[]
}
```

### LearningTab
```typescript
{
  skillsMastered: { value, total, percentage }
}
```

### TeamTab
```typescript
{
  leaderboard: LeaderboardEntry[]
  userRank: number
  teamStats: {
    teamSize: number
    avgTeamScore: number
    yourScore: number
  }
}
```

---

## Common Tasks

### Switch Default Tab
```typescript
// In page.tsx
const [activeTab, setActiveTab] = useState('performance') // Change here
```

### Add New Tab
```typescript
// 1. Add to tabs array
const tabs = [
  // ...existing tabs
  { id: 'newTab', label: 'New Tab', icon: YourIcon }
]

// 2. Add conditional render
{activeTab === 'newTab' && (
  <NewTab key="newTab" {...props} />
)}
```

### Customize Animation
```typescript
// In any tab component
<motion.div
  initial={{ opacity: 0, y: 20 }}      // Start state
  animate={{ opacity: 1, y: 0 }}       // End state
  transition={{ duration: 0.4, delay: 0.2 }} // Timing
>
```

### Add Component to Tab
```typescript
// Import component
import NewComponent from '@/components/dashboard/NewComponent'

// Add to tab with animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.3 }}
>
  <NewComponent />
</motion.div>
```

---

## Animation Delays

### Overview Tab
- Alerts: `0.1s`
- Metric Cards: `0.1s - 0.25s` (staggered)
- Recent Sessions: `0.3s` + stagger

### Performance Tab
- Date Filter: `0.1s`
- Chart: `0.15s`
- Metrics: `0.2s`
- Insights: `0.3s`
- Sessions Table: `0.4s`

### Learning Tab
- Skills Progress: `0.1s`
- Individual Skills: `0.2s` + stagger
- Playbooks: `0.2s`
- Challenges: `0.2s`
- Recommended: `0.3s`

### Team Tab
- Stats Cards: `0.1s - 0.2s` (staggered)
- Ranking: `0.25s`
- Leaderboard: `0.3s` + stagger
- Achievements: `0.4s`

---

## Color Codes

### Status Colors
- **Success**: `text-green-400` / `bg-green-500/20`
- **Warning**: `text-amber-400` / `bg-amber-500/20`
- **Error**: `text-red-400` / `bg-red-500/20`
- **Info**: `text-blue-400` / `bg-blue-500/20`
- **Primary**: `text-purple-400` / `bg-purple-500/20`

### Score Colors
- **80+**: `text-green-400`
- **60-79**: `text-yellow-400`
- **<60**: `text-red-400`

---

## Responsive Classes

### Grid Layouts
```css
grid-cols-1 md:grid-cols-2 lg:grid-cols-4  /* Metric cards */
grid-cols-1 md:grid-cols-2                 /* Skills grid */
grid-cols-1 md:grid-cols-3                 /* Team stats */
```

### Text Sizes
```css
text-xs    /* Subtitle text */
text-sm    /* Body text */
text-lg    /* Section headers */
text-2xl   /* Metric values */
text-4xl   /* Page title */
```

---

## Testing URLs

```
Development: http://localhost:3000/dashboard
Production:  https://your-domain.com/dashboard

Direct tabs (future):
http://localhost:3000/dashboard?tab=overview
http://localhost:3000/dashboard?tab=performance
http://localhost:3000/dashboard?tab=learning
http://localhost:3000/dashboard?tab=team
```

---

## Quick Debug

### Tab not switching?
```javascript
console.log('Active tab:', activeTab)
```

### Component not rendering?
```javascript
console.log('Props:', { metrics, recentSessions, insights })
```

### Animation not working?
```javascript
// Check Framer Motion is imported
import { motion } from 'framer-motion'
```

### Data not displaying?
```javascript
// Check mockData is properly structured
console.log('Mock data:', mockData)
```

---

## Icon Reference

```typescript
import {
  Home,        // Overview tab
  TrendingUp,  // Performance tab
  BookOpen,    // Learning tab
  Users,       // Team tab
  Target,      // Sessions
  Award,       // Skills/Achievements
  Zap,         // Streak
  Calendar,    // Date
  Clock,       // Time
  Trophy,      // Leaderboard
  Crown,       // #1 rank
  Medal,       // #2-3 rank
} from 'lucide-react'
```

---

## Common Patterns

### Card Container
```typescript
<div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
  {/* Content */}
</div>
```

### Section Header
```typescript
<div className="flex items-center gap-3 mb-6">
  <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
    <Icon className="w-5 h-5 text-purple-400" />
  </div>
  <div>
    <h3 className="text-lg font-semibold text-white">Title</h3>
    <p className="text-xs text-slate-400">Subtitle</p>
  </div>
</div>
```

### Metric Display
```typescript
<div className="text-center">
  <p className="text-xs text-slate-400 mb-1">Label</p>
  <p className="text-2xl font-bold text-purple-400">Value</p>
</div>
```

---

## Performance Tips

1. **Use memo for expensive calculations**
2. **Lazy load tab components** (future)
3. **Virtualize long lists** (leaderboard)
4. **Debounce search inputs** (playbooks)
5. **Cache API responses**

---

## Accessibility Checklist

- ✅ Semantic HTML (`<button>`, `<nav>`, etc.)
- ✅ ARIA labels on icons
- ✅ Keyboard navigation support
- ✅ Focus indicators visible
- ✅ Color contrast ratios met
- ✅ Alt text on images
- ✅ Heading hierarchy maintained

---

## Related Documentation

- Full Documentation: `DASHBOARD_TABBED_REDESIGN.md`
- Component API: Check individual component files
- Framer Motion: https://www.framer.com/motion/
- Tailwind CSS: https://tailwindcss.com/docs

---

**Last Updated**: October 8, 2025

