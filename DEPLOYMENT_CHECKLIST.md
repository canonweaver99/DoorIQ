# DoorIQ Deployment Checklist

## ✅ Code Updates (COMPLETED)
- [x] Homeowner selector created
- [x] Navigation updated to use selector
- [x] Dynamic agent loading implemented
- [x] Database types updated
- [x] Pre-session page Austin reference removed
- [x] All changes pushed to main branch

## ⚠️ Database Migrations (REQUIRED)

### Migration 1: Add agent_id to training_sessions
**Status**: ⚠️ NOT RUN YET

**SQL to run in Supabase**:
```sql
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_training_sessions_agent_id ON training_sessions(agent_id);

COMMENT ON COLUMN training_sessions.agent_id IS 'Reference to the ElevenLabs agent used for this training session';
```

**How to run**:
1. Go to: https://supabase.com/dashboard/project/fzhtqmbaxznikmxdglyl/sql/new
2. Paste the SQL above
3. Click "Run"

---

### Migration 2: Add AI Sales Rep Users
**Status**: ⚠️ NOT RUN YET

**SQL to run in Supabase**:
```sql
INSERT INTO users (full_name, email, rep_id, role, virtual_earnings, created_at) VALUES
  ('Jake "College Hustle" Thompson', 'jake@dooriq-agent.ai', 'REP-JAKE-AI', 'rep', 2450.00, NOW()),
  ('Marcus "Smooth Talker" Williams', 'marcus@dooriq-agent.ai', 'REP-MARCUS-AI', 'rep', 2125.00, NOW()),
  ('Tyler "Tech Bro" Chen', 'tyler@dooriq-agent.ai', 'REP-TYLER-AI', 'rep', 1890.00, NOW()),
  ('Ethan "Earnest" Rodriguez', 'ethan@dooriq-agent.ai', 'REP-ETHAN-AI', 'rep', 2650.00, NOW()),
  ('Chase "Competitive" Miller', 'chase@dooriq-agent.ai', 'REP-CHASE-AI', 'rep', 1575.00, NOW())
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  rep_id = EXCLUDED.rep_id,
  virtual_earnings = EXCLUDED.virtual_earnings;
```

**How to run**:
1. Go to: https://supabase.com/dashboard/project/fzhtqmbaxznikmxdglyl/sql/new
2. Paste the SQL above
3. Click "Run"

---

## 🌐 Environment Variables (CHECK PRODUCTION)

### Required in Production (Vercel/deployment platform):
- [?] `NEXT_PUBLIC_SUPABASE_URL`
- [?] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [?] `SUPABASE_SERVICE_ROLE_KEY`
- [?] `OPENAI_API_KEY` ← **CRITICAL for session grading**
- [?] `ELEVENLABS_API_KEY`

**How to check**:
1. Go to your Vercel dashboard (or deployment platform)
2. Project Settings → Environment Variables
3. Ensure ALL variables from .env.local are also in production

**Why this matters**:
- Without OPENAI_API_KEY in production, sessions won't get graded
- This is why your 28 sessions show "Not graded"

---

## 🧪 Testing Checklist

After running migrations:

### Test 1: Homeowner Selector
- [ ] Visit dooriq.ai
- [ ] Click "Start Training Now" or "Practice"
- [ ] Should see homeowner selector with 5 cards
- [ ] Cards should be color-coded (Green/Yellow/Orange/Red)
- [ ] Click any homeowner → goes to /trainer with that agent

### Test 2: Training Session
- [ ] Select a homeowner (try Skeptical Sarah for a challenge!)
- [ ] Verify door shows correct homeowner name
- [ ] Complete a full conversation
- [ ] End session
- [ ] Check if you earn virtual money (if you got a close)

### Test 3: Leaderboard
- [ ] Visit /leaderboard
- [ ] Should see 5 AI agents + you
- [ ] Ranked by virtual earnings:
  - #1 Ethan Rodriguez ($2,650)
  - #2 Jake Thompson ($2,450)
  - #3 Marcus Williams ($2,125)
  - #4 Tyler Chen ($1,890)
  - #5 Chase Miller ($1,575)
  - Your position based on earnings

### Test 4: Session Grading
- [ ] Complete a NEW session
- [ ] Go to analytics page
- [ ] Verify scores appear (not "--% Not graded")
- [ ] Check for AI feedback and coaching tips

---

## 📊 Expected Results After Deployment

### Leaderboard Should Show:
```
🥇 #1 Ethan "Earnest" Rodriguez    $2,650.00
🥈 #2 Jake "College Hustle"        $2,450.00  
🥉 #3 Marcus "Smooth Talker"       $2,125.00
   #4 Tyler "Tech Bro" Chen        $1,890.00
   #5 Chase "Competitive" Miller   $1,575.00
   #6 Your Name                    $XXX.XX
```

### User Flow Should Be:
```
Landing Page 
    ↓ (Click "Start Training Now")
Homeowner Selector (choose from 5)
    ↓ (Select homeowner)
Trainer Page (with selected agent)
    ↓ (Complete conversation)
Analytics (with scores and AI feedback)
```

---

## 🚨 Known Issues (Historical Data)

- **28 old sessions** show "Not graded"
  - These were created before grading system
  - Can be ignored or manually deleted
  - Won't affect new sessions

- **$0.00 earnings** despite 28 sessions
  - Old data from before earnings system
  - New sessions will earn properly

---

## 📞 Support Resources

- Migration files: `/lib/supabase/migrations/`
- Agent documentation: `/SALES_REP_AGENTS.md`
- Supabase dashboard: https://supabase.com/dashboard/project/fzhtqmbaxznikmxdglyl

