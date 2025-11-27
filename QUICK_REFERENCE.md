# Quick Reference Guide

## 🚀 Quick Links

### API Endpoints
- **Health Check**: `GET /api/health`
- **Detailed Health**: `GET /api/health/detailed`
- **Session**: `GET /api/session?id={sessionId}`
- **Grading**: `POST /api/grade/orchestrate`
- **Upload**: `POST /api/upload/audio`

### Database Tables (Key)
- `live_sessions` - Training sessions
- `users` - User accounts
- `user_session_limits` - Credits and limits
- `subscription_events` - Stripe events
- `organizations` - Company/team data
- `messages` - User messages
- `speech_analysis` - Voice metrics

### Environment Variables (Required)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# ElevenLabs
ELEVEN_LABS_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

---

## 🔧 Common Tasks

### Run Database Migration
```bash
# Apply migration in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy migration file content
# 3. Run SQL
```

### Check System Health
```bash
# Basic health check
curl https://yourdomain.com/api/health

# Detailed health check
curl https://yourdomain.com/api/health/detailed
```

### Test Grading Endpoint
```bash
curl -X POST https://yourdomain.com/api/grade/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "SESSION_ID"}'
```

### Check Webhook Status
- **Stripe**: Dashboard → Developers → Webhooks
- **ElevenLabs**: Dashboard → Webhooks

---

## 🐛 Troubleshooting

### Grading Not Completing
1. Check `/api/health/detailed` - verify database connectivity
2. Check session exists: `GET /api/session?id={sessionId}`
3. Verify transcript exists in session
4. Check OpenAI API key is set
5. Review error logs in Vercel

### Webhooks Not Working
1. Verify webhook URL is correct
2. Check webhook secret matches env var
3. Review webhook delivery logs
4. Verify endpoint is accessible (HTTPS required)

### Performance Issues
1. Check Vercel Analytics for Core Web Vitals
2. Review database query performance
3. Check for slow API endpoints
4. Verify indexes are created (migration 095)

### Database Errors
1. Check Supabase dashboard for connection issues
2. Verify RLS policies are correct
3. Check migration status
4. Review query logs for slow queries

---

## 📊 Monitoring

### Key Metrics to Watch
- **Error Rate**: Should be < 1%
- **Webhook Delivery**: Should be 100%
- **Grading Success**: Should be > 95%
- **Page Load Time**: LCP < 2.5s
- **API Response**: < 500ms (p95)

### Daily Checks
- [ ] Review error logs
- [ ] Check webhook delivery rates
- [ ] Verify critical flows working
- [ ] Review performance metrics

---

## 🔐 Security

### RLS Policies
- All tables have RLS enabled
- Users can only access their own data
- Managers can access team data
- Admins have full access

### API Security
- All API routes require authentication (except health check)
- Webhook signatures verified
- Service role key only used server-side
- No sensitive data in client-side code

---

## 📝 Code Structure

### Key Directories
```
app/
  api/          # API routes
  dashboard/    # Dashboard pages
  trainer/      # Training interface
  analytics/    # Analytics pages

components/
  trainer/      # Training components
  dashboard/    # Dashboard components
  ui/           # Shared UI components

lib/
  supabase/     # Database client & migrations
  queue/        # Job queue system
  speech-analysis/ # Speech analysis utilities
```

### Important Files
- `app/layout.tsx` - Root layout with fonts & providers
- `middleware.ts` - Request middleware & security headers
- `next.config.ts` - Next.js configuration
- `lib/logger.ts` - Logging utility

---

## 🚨 Emergency Procedures

### Site Down
1. Check Vercel deployment status
2. Check Supabase status page
3. Review recent deployments
4. Check error logs
5. Rollback if needed

### Payment Issues
1. Check Stripe dashboard
2. Verify webhook deliveries
3. Check subscription status in database
4. Review credit granting logic

### Database Issues
1. Check Supabase dashboard
2. Verify connection pool
3. Check for slow queries
4. Review migration status

---

## 📚 Documentation Files

- `WORK_COMPLETED_SUMMARY.md` - Summary of recent work
- `MIGRATION_CLEANUP.md` - Migration conflict resolution
- `scripts/test-critical-flows.md` - Testing procedures
- `scripts/monitoring-setup.md` - Monitoring guide
- `PRODUCTION_LAUNCH_CHECKLIST.md` - Pre-launch checklist

---

## 🎯 Performance Targets

- **Real Experience Score**: > 90
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTFB**: < 800ms
- **API Response**: < 500ms (p95)

---

## 💡 Tips

- Always test in staging before production
- Monitor error logs daily
- Keep dependencies updated
- Review performance metrics weekly
- Document any custom configurations

