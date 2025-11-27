# Monitoring Setup Guide

## Overview
This document outlines how to set up monitoring for error tracking, webhook monitoring, and database performance.

## 1. Error Tracking

### Vercel Logs
**Location**: Vercel Dashboard → Project → Logs

**What to Monitor**:
- API route errors (500, 502, 503, 504)
- Function timeouts
- Memory usage spikes
- Cold start times

**Alerts**:
- Set up alerts for error rate > 5%
- Alert on function timeout > 60s
- Alert on memory usage > 80%

### Application Logging
**File**: `lib/logger.ts`

**Current Implementation**:
- Uses structured logging
- Logs to console (development) and Vercel (production)
- Includes context (sessionId, userId, etc.)

**Enhancements Needed**:
1. Add error tracking service (Sentry, LogRocket, etc.)
2. Add performance monitoring (Vercel Analytics already enabled)
3. Add user session replay for debugging

### Recommended: Sentry Integration

```typescript
// Add to app/layout.tsx or middleware
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    return event
  }
})
```

---

## 2. Webhook Monitoring

### Stripe Webhooks
**Location**: Stripe Dashboard → Developers → Webhooks

**What to Monitor**:
- Webhook delivery rate (should be 100%)
- Failed webhook deliveries
- Response times
- Event processing errors

**Key Events**:
- `checkout.session.completed` - Credit granting
- `customer.subscription.created` - Subscription setup
- `customer.subscription.updated` - Status changes
- `invoice.payment_succeeded` - Payment processing
- `invoice.payment_failed` - Payment failures

**Monitoring Checklist**:
- [ ] Check webhook delivery rate daily
- [ ] Review failed webhooks weekly
- [ ] Verify all events are processed correctly
- [ ] Monitor response times (< 2s target)

### ElevenLabs Webhooks
**Location**: ElevenLabs Dashboard → Webhooks

**What to Monitor**:
- `conversation.completed` - Conversation storage
- `conversation.analyzed` - Analysis updates
- Webhook signature verification failures

**Monitoring Checklist**:
- [ ] Verify conversations are stored correctly
- [ ] Check session correlation rate
- [ ] Monitor speech analysis completion
- [ ] Review webhook errors

---

## 3. Database Performance

### Supabase Dashboard
**Location**: Supabase Dashboard → Database → Performance

**What to Monitor**:
- Query execution times
- Slow queries (> 1s)
- Connection pool usage
- Index usage
- Table sizes

### Key Queries to Monitor

#### Session Retrieval
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM live_sessions 
WHERE user_id = 'USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;
```

#### Grading Status Updates
```sql
-- Check trigger performance
EXPLAIN ANALYZE
UPDATE live_sessions 
SET grading_status = 'completed' 
WHERE id = 'SESSION_ID';
```

#### Leaderboard Queries
```sql
-- Check leaderboard performance
EXPLAIN ANALYZE
SELECT user_id, SUM(virtual_earnings) as total_earnings
FROM live_sessions
WHERE team_id = 'TEAM_ID'
GROUP BY user_id
ORDER BY total_earnings DESC
LIMIT 10;
```

### Recommended Indexes

```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_live_sessions_user_created 
ON live_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_sessions_grading_status 
ON live_sessions(grading_status) 
WHERE grading_status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_live_sessions_team_earnings 
ON live_sessions(team_id, virtual_earnings DESC) 
WHERE team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer 
ON users(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;
```

---

## 4. API Performance Monitoring

### Vercel Analytics
**Already Enabled**: ✅ Speed Insights & Analytics

**Metrics Tracked**:
- Real Experience Score
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)

**Targets**:
- Real Experience Score: > 90
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- TTFB: < 800ms

### Custom API Monitoring

**Endpoints to Monitor**:
- `/api/grade/orchestrate` - Grading orchestration
- `/api/upload/audio` - File uploads
- `/api/session` - Session retrieval
- `/api/stripe/webhook` - Payment processing

**Metrics**:
- Response time (p50, p95, p99)
- Error rate
- Success rate
- Throughput (requests/second)

---

## 5. User Activity Monitoring

### Key Metrics to Track

1. **Session Completion Rate**
   - Sessions started vs. completed
   - Target: > 80% completion rate

2. **Grading Success Rate**
   - Sessions graded successfully vs. failed
   - Target: > 95% success rate

3. **Upload Success Rate**
   - Files uploaded successfully vs. failed
   - Target: > 90% success rate

4. **User Engagement**
   - Daily active users
   - Sessions per user per week
   - Average session duration

---

## 6. Alerting Setup

### Critical Alerts (Immediate Action)

1. **Webhook Delivery Failure**
   - Condition: Delivery rate < 95%
   - Action: Check endpoint status, review logs

2. **High Error Rate**
   - Condition: Error rate > 5% for 5 minutes
   - Action: Review error logs, check for issues

3. **Database Performance**
   - Condition: Query time > 5s
   - Action: Check for slow queries, add indexes

4. **Payment Processing Failure**
   - Condition: Payment webhook failures
   - Action: Check Stripe dashboard, verify webhook

### Warning Alerts (Monitor)

1. **Grading Timeout**
   - Condition: Grading takes > 60s
   - Action: Check OpenAI API status

2. **High Memory Usage**
   - Condition: Memory > 80%
   - Action: Review function code, optimize

3. **Slow Page Load**
   - Condition: LCP > 3s
   - Action: Optimize page performance

---

## 7. Monitoring Tools Setup

### Recommended Stack

1. **Error Tracking**: Sentry (free tier available)
2. **Performance**: Vercel Analytics (already enabled)
3. **Logs**: Vercel Logs + Supabase Logs
4. **Uptime**: UptimeRobot or Pingdom (free tier)
5. **Database**: Supabase Dashboard + pg_stat_statements

### Setup Steps

1. **Sentry**:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

2. **Uptime Monitoring**:
   - Set up checks for:
     - Main site: `https://yourdomain.com`
     - API health: `https://yourdomain.com/api/health`
     - Webhook endpoint: `https://yourdomain.com/api/stripe/webhook`

3. **Database Monitoring**:
   - Enable `pg_stat_statements` in Supabase
   - Set up slow query log
   - Create dashboard for key metrics

---

## 8. Daily/Weekly Reviews

### Daily Checks (5 minutes)
- [ ] Review error logs for new issues
- [ ] Check webhook delivery rates
- [ ] Verify critical flows working
- [ ] Review performance metrics

### Weekly Reviews (30 minutes)
- [ ] Analyze error trends
- [ ] Review slow queries
- [ ] Check user activity metrics
- [ ] Review performance improvements
- [ ] Update monitoring dashboards

---

## 9. Incident Response

### When Issues Occur

1. **Check Error Logs**
   - Vercel logs for API errors
   - Supabase logs for database errors
   - Browser console for client errors

2. **Verify Webhooks**
   - Check Stripe webhook logs
   - Verify ElevenLabs webhooks
   - Review failed deliveries

3. **Check Database**
   - Verify connection pool
   - Check for slow queries
   - Review table sizes

4. **Test Critical Flows**
   - Upload flow
   - Live session flow
   - Payment flow

5. **Document Issue**
   - Record error details
   - Note resolution steps
   - Update monitoring if needed

---

## Notes

- Set up monitoring before going to production
- Test alerting to ensure it works
- Review metrics regularly to catch issues early
- Update monitoring as new features are added

