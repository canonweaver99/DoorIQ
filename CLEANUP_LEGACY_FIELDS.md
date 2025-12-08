# Legacy Fields Cleanup Summary

This document summarizes the cleanup of legacy fields: `safety_score`, `commission_rate`, `commission_earned`, and `bonus_modifiers`.

## SQL Migration

**File:** `lib/supabase/migrations/120_remove_legacy_fields.sql`

### Changes:
1. **Removed `safety_score` column** from `live_sessions` table
2. **Updated `calculate_overall_score()` trigger function** to remove safety_score from calculation
3. **Updated `earnings_data` column comment** to remove commission_rate, commission_earned, bonus_modifiers
4. **Updated `session_earnings_breakdown` view** to remove commission and bonus columns
5. **Cleaned up existing JSONB data** by removing legacy fields from existing records

### To Apply:
Run the migration in your Supabase dashboard or via CLI:
```bash
psql $DATABASE_URL -f lib/supabase/migrations/120_remove_legacy_fields.sql
```

## Code Changes

### API Routes
- ✅ `app/api/grade/deep-analysis/route.ts` - Removed fields from GPT prompt and response parsing
- ✅ `app/api/grade/instant/route.ts` - Removed safety_score calculation
- ✅ `app/api/grade/orchestrate/route.ts` - Removed safety_score from default values
- ✅ `app/api/grade/session/route.ts` - Updated schema validation to remove legacy fields

### Components
- ✅ `components/analytics/EarningsBreakdown.tsx` - Removed commission/bonus display
- ✅ `components/analytics/ScoresViewV2.tsx` - Removed bonus_modifiers references
- ✅ `components/analytics/HeroSection.tsx` - Removed commission/bonus display
- ✅ `components/admin/SessionMobileCard.tsx` - Removed safety_score type
- ✅ `app/admin/sessions/page.tsx` - Removed safety_score type

### Type Definitions
- ✅ `lib/trainer/types.ts` - Removed safetyScore from SessionAnalytics
- ✅ `lib/supabase/database.types.ts` - Removed safety_score (Note: May regenerate from Supabase)

### Scripts
- ✅ `scripts/fix-session-close.js` - Updated to use new earnings_data structure
- ✅ `scripts/re-grade-session.js` - Updated to display total_earned instead of commission_earned
- ✅ `scripts/diagnose-grading-failure.js` - Updated to display total_earned
- ✅ `scripts/create-team-alpha-sessions.js` - Removed safety_score from test data

## New Structure

### earnings_data (JSONB)
```typescript
{
  base_amount?: number
  closed_amount?: number
  total_earned?: number  // Same as virtual_earnings
}
```

### finalScores
```typescript
{
  overall: number
  rapport: number
  discovery: number
  objectionHandling: number
  closing: number
  // safety removed
}
```

## Notes

- Database types (`database.types.ts`) may regenerate from Supabase schema. After running the migration, regenerate types if needed.
- Existing records with legacy fields in `earnings_data` JSONB will be cleaned up by the migration.
- The `safety_score` column will be completely removed from the database.
- All bonus calculations and commission logic have been removed - earnings are now simply the full deal value.
