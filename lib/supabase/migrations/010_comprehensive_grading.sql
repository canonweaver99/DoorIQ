-- Comprehensive grading system tables
-- This migration adds support for detailed metrics, patterns, and progress tracking

-- Detailed metrics storage for each session
CREATE TABLE IF NOT EXISTS session_detailed_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_category TEXT NOT NULL,
  metric_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for faster queries
  CONSTRAINT unique_session_metric UNIQUE(session_id, metric_category)
);

-- User patterns tracking (strengths, weaknesses, recurring behaviors)
CREATE TABLE IF NOT EXISTS user_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pattern_type TEXT CHECK (pattern_type IN ('strength', 'weakness', 'improvement', 'regression')),
  category TEXT NOT NULL,
  description TEXT,
  frequency INTEGER DEFAULT 1,
  last_occurrence TIMESTAMPTZ DEFAULT NOW(),
  first_occurrence TIMESTAMPTZ DEFAULT NOW(),
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
  suggested_intervention TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique patterns per user
  CONSTRAINT unique_user_pattern UNIQUE(user_id, category, pattern_type)
);

-- ============================================================
-- ARCHIVED GAMIFICATION FEATURES (for future implementation)
-- ============================================================
-- Skill progression tracking
-- CREATE TABLE IF NOT EXISTS user_skill_progression (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--   skill_category TEXT NOT NULL,
--   current_level INTEGER DEFAULT 1 CHECK (current_level BETWEEN 1 AND 10),
--   experience_points INTEGER DEFAULT 0,
--   sessions_at_level INTEGER DEFAULT 0,
--   milestone_reached TEXT,
--   next_milestone TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW(),
--   
--   CONSTRAINT unique_user_skill UNIQUE(user_id, skill_category)
-- );

-- Breakthrough moments and achievements
-- CREATE TABLE IF NOT EXISTS user_breakthroughs (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--   session_id UUID REFERENCES live_sessions(id),
--   breakthrough_type TEXT NOT NULL,
--   description TEXT,
--   impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 100),
--   skill_affected TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
-- ============================================================

-- Performance benchmarks for comparison
CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  user_segment TEXT DEFAULT 'all',
  percentile_data JSONB NOT NULL, -- {p10: 45, p25: 60, p50: 75, p75: 85, p90: 95}
  sample_size INTEGER DEFAULT 0,
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_benchmark UNIQUE(metric_name, user_segment)
);

-- Weekly/Monthly aggregated stats for trend analysis
CREATE TABLE IF NOT EXISTS user_performance_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_type TEXT CHECK (period_type IN ('week', 'month')),
  period_start DATE NOT NULL,
  metrics JSONB NOT NULL, -- Aggregated scores and counts
  sessions_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  improvement_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_period UNIQUE(user_id, period_type, period_start)
);

-- Add columns to users table for quick access to latest patterns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS latest_patterns JSONB,
ADD COLUMN IF NOT EXISTS patterns_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
ADD COLUMN IF NOT EXISTS total_sessions_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_score DECIMAL(5,2);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_metrics_session ON session_detailed_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_session_metrics_user ON session_detailed_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patterns_user ON user_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patterns_type ON user_patterns(pattern_type);
-- CREATE INDEX IF NOT EXISTS idx_skill_progression_user ON user_skill_progression(user_id); -- ARCHIVED
-- CREATE INDEX IF NOT EXISTS idx_breakthroughs_user ON user_breakthroughs(user_id); -- ARCHIVED
-- CREATE INDEX IF NOT EXISTS idx_breakthroughs_session ON user_breakthroughs(session_id); -- ARCHIVED
CREATE INDEX IF NOT EXISTS idx_performance_trends_user ON user_performance_trends(user_id);

-- RLS Policies
ALTER TABLE session_detailed_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_skill_progression ENABLE ROW LEVEL SECURITY; -- ARCHIVED
-- ALTER TABLE user_breakthroughs ENABLE ROW LEVEL SECURITY; -- ARCHIVED
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_performance_trends ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view own metrics" ON session_detailed_metrics
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can view own patterns" ON user_patterns
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- CREATE POLICY "Users can view own progression" ON user_skill_progression -- ARCHIVED
--   FOR SELECT USING (user_id = auth.uid()::uuid);

-- CREATE POLICY "Users can view own breakthroughs" ON user_breakthroughs -- ARCHIVED
--   FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "All users can view benchmarks" ON performance_benchmarks
  FOR SELECT USING (true);

CREATE POLICY "Users can view own trends" ON user_performance_trends
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- Service role has full access (for backend operations)
CREATE POLICY "Service role full access metrics" ON session_detailed_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access patterns" ON user_patterns
  FOR ALL USING (auth.role() = 'service_role');

-- CREATE POLICY "Service role full access progression" ON user_skill_progression -- ARCHIVED
--   FOR ALL USING (auth.role() = 'service_role');

-- CREATE POLICY "Service role full access breakthroughs" ON user_breakthroughs -- ARCHIVED
--   FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access benchmarks" ON performance_benchmarks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access trends" ON user_performance_trends
  FOR ALL USING (auth.role() = 'service_role');
