-- Create user profiles for the 5 sales rep AI agents
-- These will appear on the leaderboard and earn virtual money as they complete sessions
-- Their earnings update automatically via the existing trigger

-- Insert the 5 sales rep agent profiles
-- Note: These are demo/training accounts, not actual auth users
-- They have unique rep_ids and emails for identification

INSERT INTO users (full_name, email, rep_id, role, virtual_earnings, created_at) VALUES
  (
    'Jake "College Hustle" Thompson',
    'jake@dooriq-agent.ai',
    'REP-JAKE-AI',
    'rep',
    2450.00,  -- 70% win rate - solid performer
    NOW()
  ),
  (
    'Marcus "Smooth Talker" Williams',
    'marcus@dooriq-agent.ai',
    'REP-MARCUS-AI',
    'rep',
    2125.00,  -- 62.5% win rate - good but not great
    NOW()
  ),
  (
    'Tyler "Tech Bro" Chen',
    'tyler@dooriq-agent.ai',
    'REP-TYLER-AI',
    'rep',
    1890.00,  -- 57% win rate - struggles with connection
    NOW()
  ),
  (
    'Ethan "Earnest" Rodriguez',
    'ethan@dooriq-agent.ai',
    'REP-ETHAN-AI',
    'rep',
    2650.00,  -- 75% win rate - HIGHEST, authentic approach wins
    NOW()
  ),
  (
    'Chase "Competitive" Miller',
    'chase@dooriq-agent.ai',
    'REP-CHASE-AI',
    'rep',
    1575.00,  -- 50% win rate - LOWEST, too competitive, alienates customers
    NOW()
  )
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  rep_id = EXCLUDED.rep_id,
  virtual_earnings = EXCLUDED.virtual_earnings;

-- Create a helpful view to identify AI agents vs real users
COMMENT ON COLUMN users.email IS 'Email address - AI agents use @dooriq-agent.ai domain';
COMMENT ON COLUMN users.rep_id IS 'Rep identifier - AI agents use REP-{NAME}-AI format';
