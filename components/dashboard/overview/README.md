# Overview Tab Components

This directory contains the enhanced components for the redesigned Overview tab.

## Components

### EnhancedMetricCard
**Purpose**: Enhanced metric card with sparklines, trend indicators, and hover tooltips  
**Features**:
- 7-day sparkline chart
- Animated number counting
- Hover tooltip with historical data (7-day, 30-day, all-time)
- Semantic color coding for trends
- Standardized 140px height

### SparklineChart
**Purpose**: Tiny inline chart showing 7-day trend  
**Props**: `data` (number[]), `color`, `width`, `height`  
**Features**:
- Smooth SVG polyline animation
- Auto-scales to data range
- Configurable dimensions

### RadarMiniChart
**Purpose**: 40x40px radar chart showing 4 skill scores  
**Props**: `data` (rapport, discovery, objections, closing), `size`  
**Features**:
- Compact visual representation
- Background grid circles
- Purple accent colors

### CriticalActionCard
**Purpose**: Enhanced alert system with glass morphism  
**Features**:
- Colored left border (red/amber/green by severity)
- Inline action buttons: Review, Dismiss, Snooze 24h
- Timestamp display
- Auto-collapse to badge after viewing
- localStorage persistence for dismissals/snoozes

### SessionCard
**Purpose**: Horizontal scrollable session card (120px height)  
**Features**:
- Session name and time
- 40x40px mini radar chart
- Large score display with color coding
- AI-generated insight (truncated)
- Hover lift effect

### DailyFocusWidget
**Purpose**: Circular progress widget for daily goals  
**Features**:
- Animated circular progress ring
- Center text showing progress (2/3 Sessions)
- Motivational messages based on progress
- Celebration animation on goal achievement
- 140px height (matches metric cards)

### QuickActionsFAB
**Purpose**: Floating Action Button with expandable menu  
**Features**:
- Bottom-right fixed position
- 4 quick actions: Start Training, View Feedback, Quick Practice, Today's Challenge
- Smooth expand/collapse animation
- Gradient backgrounds per action

### SkeletonLoader
**Purpose**: Loading states and empty states  
**Components**:
- `MetricCardSkeleton` - Metric card placeholder
- `SessionCardSkeleton` - Session card placeholder
- `EmptyState` - No data message with helpful prompt

## Design System

### Colors
- **Success**: `#10B981` (green)
- **Warning**: `#F59E0B` (amber)
- **Error**: `#EF4444` (red)
- **Primary**: `#8B5CF6` (purple)
- **Background**: `#1e1e30`
- **Border**: `rgba(255,255,255,0.1)`

### Spacing
- Grid gap: `gap-4` (16px, 20% less than before)
- Card padding: `p-4` or `p-5`
- Section spacing: `space-y-5`

### Heights
- Metric cards: `140px` (standardized)
- Session cards: `120px`
- Daily focus widget: `140px`

### Animations
- Fade in: `opacity: 0 → 1` in `0.3-0.4s`
- Slide up: `y: 20 → 0`
- Hover lift: `y: -4`, `scale: 1.02`
- Stagger delay: `0.05s` between items

## Usage Example

```tsx
import EnhancedMetricCard from '@/components/dashboard/overview/EnhancedMetricCard'
import { Target } from 'lucide-react'

<EnhancedMetricCard
  title="Sessions Today"
  value={3}
  trend={15}
  trendUp={true}
  icon={Target}
  sparklineData={[2, 3, 2, 4, 3, 3, 3]}
  historicalData={{
    sevenDay: 5,
    thirtyDay: 18,
    allTime: 130
  }}
  delay={0}
/>
```

## Responsive Behavior

### Desktop (1024px+)
- 4-column grid for metrics
- Horizontal session scroll
- FAB in bottom-right

### Tablet (640-1024px)
- 2x2 grid for metrics
- Horizontal session scroll
- FAB in bottom-right

### Mobile (<640px)
- Single column metrics
- Vertical session cards (via horizontal scroll)
- FAB in bottom-right (smaller)

## localStorage Keys

- `dismissedActions` - Array of dismissed action IDs
- `snoozedActions` - Array of snoozed action IDs  
- `criticalActionsViewed` - Boolean flag for viewed state

## Performance

- Skeleton loaders show for 800ms
- Number animations: 1000ms duration
- Sparkline animation: 800ms
- Circular progress: 1000ms
- All animations: 60fps target

## Accessibility

- Semantic HTML structure
- Hover tooltips appear on mouse enter
- Color + icons for trends (not color alone)
- Large click targets (min 44x44px)
- Focus indicators on interactive elements

