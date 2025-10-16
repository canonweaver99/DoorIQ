# 🔧 Implementation Guide: Adding Paywalls to Your App

This guide shows you how to integrate the subscription system into your existing pages.

## Quick Start: 3 Steps to Add a Paywall

### 1. Protect a Trainer Session

Add session limit checking to your trainer page:

```tsx
// app/trainer/page.tsx
'use client'

import SessionGuard from '@/components/trainer/SessionGuard'
import { useSessionGuard } from '@/components/trainer/SessionGuard'

export default function TrainerPage() {
  const { checkAndStartSession, showPaywall, setShowPaywall, sessionLimit } = useSessionGuard()

  const handleStartConversation = async () => {
    const canStart = await checkAndStartSession()
    if (!canStart) {
      // Paywall will show automatically
      return
    }
    
    // Start your ElevenLabs conversation here
    startConversation()
  }

  return (
    <div>
      {/* Show session limit warning if needed */}
      {!sessionLimit.isUnlimited && sessionLimit.sessionsRemaining <= 5 && (
        <SessionLimitBanner {...sessionLimit} />
      )}

      <button onClick={handleStartConversation}>
        Start Practice
      </button>
    </div>
  )
}
```

### 2. Lock a Premium Feature

Use `<FeatureLock>` to restrict access:

```tsx
'use client'

import { useState } from 'react'
import { useFeatureAccess } from '@/hooks/useSubscription'
import { FeatureLock, PaywallModal } from '@/components/subscription'
import { FEATURES } from '@/lib/subscription/feature-access'

export default function ExportReports() {
  const { hasAccess } = useFeatureAccess(FEATURES.EXPORT_REPORTS)
  const [showPaywall, setShowPaywall] = useState(false)

  return (
    <>
      <FeatureLock 
        isLocked={!hasAccess}
        onClick={() => setShowPaywall(true)}
      >
        <button>Export to PDF</button>
      </FeatureLock>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Export Reports"
      />
    </>
  )
}
```

### 3. Add Subscription Banner to Dashboard

Show subscription status:

```tsx
// app/dashboard/page.tsx
import SubscriptionStatusCard from '@/components/dashboard/SubscriptionStatusCard'

export default function Dashboard() {
  return (
    <div>
      {/* Add subscription status card */}
      <SubscriptionStatusCard />
      
      {/* Your existing dashboard content */}
    </div>
  )
}
```

---

## Feature Access Patterns

### Pattern 1: Client-Side Feature Lock

For UI elements that should be hidden/locked:

```tsx
import { useFeatureAccess } from '@/hooks/useSubscription'
import { PremiumBadge } from '@/components/subscription'
import { FEATURES } from '@/lib/subscription/feature-access'

export default function FeatureButton() {
  const { hasAccess, loading } = useFeatureAccess(FEATURES.CUSTOM_SCENARIOS)

  return (
    <button disabled={!hasAccess}>
      Custom Scenarios
      {!hasAccess && <PremiumBadge />}
    </button>
  )
}
```

### Pattern 2: Server-Side Protection

For API routes and server components:

```tsx
// app/api/export/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkFeatureAccess, FEATURES } from '@/lib/subscription/feature-access'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const hasAccess = await checkFeatureAccess(user.id, FEATURES.EXPORT_REPORTS)
  
  if (!hasAccess) {
    return new Response('Premium feature', { status: 403 })
  }

  // Generate and return export
}
```

### Pattern 3: Conditional Rendering

Show different content based on subscription:

```tsx
'use client'

import { useSubscription } from '@/hooks/useSubscription'

export default function AgentSelector() {
  const subscription = useSubscription()

  const availableAgents = subscription.hasActiveSubscription
    ? ALL_AGENTS // 12 agents
    : BASIC_AGENTS // 3 agents

  return (
    <div>
      {availableAgents.map(agent => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
      
      {!subscription.hasActiveSubscription && (
        <UpgradeCard>
          Unlock 9 more agents with Premium!
        </UpgradeCard>
      )}
    </div>
  )
}
```

---

## Component Reference

### `<PaywallModal />`

Full-screen modal to prompt upgrade:

```tsx
<PaywallModal
  isOpen={showPaywall}
  onClose={() => setShowPaywall(false)}
  reason="feature_locked" // or "session_limit" or "trial_ended"
  featureName="Advanced Analytics" // optional
  sessionsRemaining={5} // optional, for session_limit reason
/>
```

### `<TrialBanner />`

Shows trial countdown:

```tsx
<TrialBanner
  daysRemaining={5}
  trialEndsAt="2025-10-23T00:00:00Z"
  onDismiss={() => console.log('Dismissed')}
/>
```

### `<SessionLimitBanner />`

Warns about approaching session limit:

```tsx
<SessionLimitBanner
  sessionsRemaining={3}
  sessionsLimit={10}
  sessionsUsed={7}
/>
```

### `<FeatureLock />`

Wraps and locks premium content:

```tsx
<FeatureLock 
  isLocked={!hasAccess}
  blurContent={true}
  showBadge={true}
  onClick={() => setShowPaywall(true)}
>
  <PremiumContent />
</FeatureLock>
```

### `<SubscriptionStatusCard />`

Dashboard widget showing subscription info:

```tsx
<SubscriptionStatusCard />
```

---

## Hooks Reference

### `useSubscription()`

Get current user's subscription status:

```tsx
const subscription = useSubscription()

// Available properties:
subscription.status // 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
subscription.hasActiveSubscription // boolean
subscription.isTrialing // boolean
subscription.isPastDue // boolean
subscription.daysRemainingInTrial // number | null
subscription.trialEndsAt // string | null
subscription.currentPeriodEnd // string | null
subscription.cancelAtPeriodEnd // boolean
subscription.loading // boolean
```

### `useSessionLimit()`

Get session limit info for current user:

```tsx
const sessionLimit = useSessionLimit()

// Available properties:
sessionLimit.canStartSession // boolean
sessionLimit.sessionsRemaining // number
sessionLimit.sessionsUsed // number
sessionLimit.sessionsLimit // number
sessionLimit.isUnlimited // boolean
sessionLimit.loading // boolean
sessionLimit.refresh() // function to refresh data
```

### `useFeatureAccess(featureKey)`

Check if user has access to a feature:

```tsx
const { hasAccess, loading } = useFeatureAccess(FEATURES.ADVANCED_ANALYTICS)
```

### `useSessionGuard()`

Comprehensive hook for trainer sessions:

```tsx
const { 
  checkAndStartSession, 
  showPaywall, 
  setShowPaywall,
  subscription,
  sessionLimit 
} = useSessionGuard()

// Call before starting a session
const canStart = await checkAndStartSession()
```

---

## Available Features

Import from `@/lib/subscription/feature-access`:

```tsx
import { FEATURES } from '@/lib/subscription/feature-access'

FEATURES.ALL_AGENTS // Access to all 12 AI agents
FEATURES.UNLIMITED_SESSIONS // Unlimited practice sessions
FEATURES.ADVANCED_ANALYTICS // Advanced analytics dashboard
FEATURES.CALL_RECORDING // Call recording & playback
FEATURES.EXPORT_REPORTS // Export reports (CSV/PDF)
FEATURES.CUSTOM_SCENARIOS // Custom training scenarios
FEATURES.TEAM_FEATURES // Team collaboration
FEATURES.PRIORITY_SUPPORT // Priority support
FEATURES.BASIC_AGENTS // 3 basic agents (free)
FEATURES.BASIC_SESSIONS // 10 sessions/month (free)
```

---

## Examples by Page

### Trainer Page

```tsx
'use client'

import { useSessionGuard } from '@/components/trainer/SessionGuard'
import { SessionLimitBanner, PaywallModal } from '@/components/subscription'

export default function TrainerPage() {
  const { 
    checkAndStartSession, 
    showPaywall, 
    setShowPaywall,
    subscription,
    sessionLimit 
  } = useSessionGuard()

  const handleStart = async () => {
    const canStart = await checkAndStartSession()
    if (canStart) {
      // Start your conversation
    }
  }

  return (
    <>
      {/* Show trial banner if in trial */}
      {subscription.isTrialing && (
        <TrialBanner
          daysRemaining={subscription.daysRemainingInTrial!}
          trialEndsAt={subscription.trialEndsAt!}
        />
      )}

      {/* Show session limit warning */}
      {!sessionLimit.isUnlimited && (
        <SessionLimitBanner
          sessionsRemaining={sessionLimit.sessionsRemaining}
          sessionsLimit={sessionLimit.sessionsLimit}
          sessionsUsed={sessionLimit.sessionsUsed}
        />
      )}

      <button onClick={handleStart}>Start Practice</button>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="session_limit"
        sessionsRemaining={sessionLimit.sessionsRemaining}
      />
    </>
  )
}
```

### Analytics Page

```tsx
'use client'

import { useState } from 'react'
import { useFeatureAccess } from '@/hooks/useSubscription'
import { FeatureLock, PaywallModal } from '@/components/subscription'
import { FEATURES } from '@/lib/subscription/feature-access'

export default function AnalyticsPage() {
  const { hasAccess } = useFeatureAccess(FEATURES.ADVANCED_ANALYTICS)
  const [showPaywall, setShowPaywall] = useState(false)

  return (
    <>
      <FeatureLock 
        isLocked={!hasAccess}
        onClick={() => setShowPaywall(true)}
      >
        <AdvancedAnalyticsDashboard />
      </FeatureLock>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Advanced Analytics"
      />
    </>
  )
}
```

### Dashboard Page

```tsx
'use client'

import { useSubscription } from '@/hooks/useSubscription'
import SubscriptionStatusCard from '@/components/dashboard/SubscriptionStatusCard'
import { TrialBanner } from '@/components/subscription'

export default function Dashboard() {
  const subscription = useSubscription()

  return (
    <div>
      {/* Trial banner at top */}
      {subscription.isTrialing && subscription.trialEndsAt && (
        <TrialBanner
          daysRemaining={subscription.daysRemainingInTrial!}
          trialEndsAt={subscription.trialEndsAt}
        />
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Subscription status in sidebar */}
        <div className="col-span-1">
          <SubscriptionStatusCard />
        </div>

        {/* Main dashboard content */}
        <div className="col-span-2">
          {/* Your dashboard widgets */}
        </div>
      </div>
    </div>
  )
}
```

---

## Testing Checklist

- [ ] Free user sees session limit banner
- [ ] Free user hits session limit and sees paywall
- [ ] Premium features show lock icon for free users
- [ ] Trial users see countdown banner
- [ ] Trial users have full access to features
- [ ] Active subscribers don't see any limitations
- [ ] Past due users see payment warning
- [ ] Upgrade flow works from all paywall triggers
- [ ] Session count increments correctly
- [ ] Session count resets monthly

---

## Pro Tips

1. **Always check features server-side** for API routes
2. **Use client-side checks** for UI/UX only
3. **Show upgrade prompts** before blocking actions
4. **Be transparent** about trial period and charges
5. **Test with real Stripe test cards**

---

You're ready to implement paywalls throughout your app! 🎉

