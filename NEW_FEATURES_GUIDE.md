# DoorIQ New Features Guide

This guide covers the major features that have been added to the DoorIQ platform.

## 🎯 Features Overview

1. **Audio Recording & Storage** - Sessions are now recorded and saved to Supabase
2. **Virtual Earnings System** - Reps earn virtual cash based on performance
3. **Manager Admin Panel** - Managers can monitor reps and provide feedback
4. **Rep Leaderboard** - Competitive ranking based on virtual earnings
5. **Enhanced Navigation** - New header with easy access to all features
6. **Sessions History** - Detailed past session review with insights
7. **Settings Page** - User profile management
8. **Manager Notifications** - Automatic alerts when reps complete sessions

## 📊 Database Setup

Run the following migration to add the new features to your database:

```bash
# From your project root
psql $DATABASE_URL < lib/supabase/migrations/003_add_features.sql
```

For Supabase Storage (audio recordings):
```bash
psql $DATABASE_URL < lib/supabase/setup-storage.sql
```

## 💰 Virtual Earnings System

### How It Works

Reps earn virtual cash based on their performance in training sessions:

- **Base Commission**: $50 for closing a deal
- **Performance Multipliers**:
  - 90%+ score: 2x multiplier
  - 80-89% score: 1.5x multiplier
  - 70-79% score: 1.2x multiplier
- **Bonuses**:
  - $25 for smooth close (no major objections)
  - $15 for comprehensive presentation
- **Participation Rewards**: Even without closing, good attempts earn $1-5

### AI Agent Deal Detection

The system automatically detects when the AI homeowner agrees to schedule service by looking for phrases like:
- "Yes", "Okay", "Sounds good"
- "Let's do it", "Schedule", "Appointment"
- "Sign me up", "When can you come"

## 👥 Manager Features

### Manager Admin Panel (`/manager`)

Managers and admins can:
- View all assigned reps' performance
- See real-time statistics (avg score, total earnings)
- Access detailed session history for each rep
- Send feedback messages about specific sessions
- Track performance trends

### Rep Detail View (`/manager/rep/[repId]`)

For each rep, managers can see:
- Complete session history with scores
- Score breakdowns by category
- Virtual earnings tracking
- Two-way messaging system
- Performance trends over time

### Manager-Rep Assignments

To assign a manager to reps, insert records into `manager_rep_assignments`:

```sql
INSERT INTO manager_rep_assignments (manager_id, rep_id)
VALUES ('manager-user-id', 'rep-user-id');
```

## 🏆 Leaderboard System

The leaderboard (`/leaderboard`) shows:
- Top 3 reps in podium view
- Full ranking table with earnings
- Time-based filtering (week/month/all-time)
- Performance indicators and trends
- Visual highlighting of current user

## 🎙️ Audio Recording

Sessions are automatically recorded and stored in Supabase Storage:
- Recordings start when the door opens
- Stop when the session ends
- Saved as `.webm` format
- Accessible through session history

### Storage Bucket Setup

The `audio-recordings` bucket is created with:
- 50MB file size limit
- Public read access for playback
- User-based write permissions

## 📱 Navigation Header

The new header includes:
- **Home** - Landing page
- **Practice** - Training simulator
- **Sessions** - Past session history
- **Leaderboard** - Team rankings
- **Settings** - Profile management
- **Manager Panel** - (visible to managers/admins only)

## 📧 Notification System

When a rep completes a session:
1. Managers receive a system message
2. Message includes score and earnings
3. Managers can review and respond
4. Future: Email/push notifications

## 🔧 Settings Page

Users can manage:
- Profile information (name, email, rep ID)
- View account details (role, earnings, join date)
- Notification preferences
- Log out functionality

## 🚀 Getting Started

1. **Run Database Migrations**:
   ```bash
   psql $DATABASE_URL < lib/supabase/migrations/003_add_features.sql
   psql $DATABASE_URL < lib/supabase/setup-storage.sql
   ```

2. **Create Manager Assignments** (if needed):
   ```sql
   -- Assign managers to reps
   INSERT INTO manager_rep_assignments (manager_id, rep_id)
   SELECT m.id, r.id 
   FROM users m, users r 
   WHERE m.role = 'manager' 
   AND r.role = 'rep';
   ```

3. **Update User Roles** (if needed):
   ```sql
   -- Make specific users managers
   UPDATE users 
   SET role = 'manager' 
   WHERE email IN ('manager1@example.com', 'manager2@example.com');
   ```

4. **Test Features**:
   - Complete a training session to see virtual earnings
   - Check the leaderboard for rankings
   - Managers: Review the admin panel
   - Check session history for recordings

## 📝 Notes

- Virtual earnings are calculated automatically based on conversation analysis
- Audio recordings require microphone permissions
- Manager notifications happen in real-time
- All features respect row-level security policies

## 🐛 Troubleshooting

**Audio not recording?**
- Check browser microphone permissions
- Ensure Supabase storage bucket exists
- Verify storage policies are applied

**Not seeing manager panel?**
- Confirm user role is 'manager' or 'admin'
- Check manager_rep_assignments table

**Virtual earnings not updating?**
- Ensure session completes properly
- Check conversation analyzer is detecting closes
- Verify database trigger is active

For additional help, check the console logs or contact support.
