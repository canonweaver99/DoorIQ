# Migration Cleanup Summary

## Duplicate Migrations Fixed

The following duplicate migrations have been renamed to resolve conflicts:

### Fixed Duplicates:

1. **012_relax_score_constraints.sql** → **REMOVED** (kept `012_relax_score_constraints_safe.sql` which is safer)
   - The safe version checks for column existence before modifying constraints
   - Old file renamed to `.old` extension

2. **047_create_teams_table.sql** → **090_create_teams_table.sql**
   - Teams functionality may be legacy (organizations table exists)
   - Renamed to avoid conflict with `047_enhance_subscription_tracking.sql`

3. **050_add_video_recording_support.sql** → **091_add_video_recording_support.sql**
   - Video recording feature (may be temporarily disabled)
   - Renamed to avoid conflict with `050_add_3_more_agents_to_15.sql`

4. **050_daily_rewards.sql** → **092_daily_rewards.sql**
   - Daily rewards system
   - Renamed to avoid conflict with `050_add_3_more_agents_to_15.sql`

5. **029_fix_users_table_rls.sql** → **093_fix_users_table_rls.sql**
   - RLS policy fixes for users table
   - Renamed to avoid conflict with `029_add_dynamic_earnings_data.sql`

6. **069_ensure_admin_user.sql** → **094_ensure_admin_user.sql**
   - Admin user setup migration
   - Renamed to avoid conflict with `069_add_user_is_active.sql`

## Migration Order

Migrations should now run in this order without conflicts:
- 001-089: Original sequence
- 090-094: Renamed duplicates (run after 089)

## Notes

- The `.old` file (`012_relax_score_constraints.sql.old`) can be deleted if migrations are confirmed working
- All renamed migrations maintain their original functionality
- No database changes required - these are just file renames

## Verification

After applying migrations, verify:
1. All tables exist as expected
2. No migration conflicts occur
3. RLS policies are correctly applied
4. Teams/organizations structure is correct

