-- Create a function to get user sessions without UUID corruption
-- This bypasses the Supabase JS SDK which corrupts UUIDs with hex escape sequences

CREATE OR REPLACE FUNCTION get_user_sessions(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  user_id TEXT,
  agent_id TEXT,
  agent_name TEXT,
  duration_seconds INTEGER,
  overall_score INTEGER,
  rapport_score INTEGER,
  objection_handling_score INTEGER,
  safety_score INTEGER,
  close_effectiveness_score INTEGER,
  introduction_score INTEGER,
  listening_score INTEGER,
  virtual_earnings DECIMAL,
  full_transcript JSONB,
  analytics JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ls.id::TEXT,
    ls.started_at,
    ls.ended_at,
    ls.user_id::TEXT,
    ls.agent_id::TEXT,
    ls.agent_name,
    ls.duration_seconds,
    ls.overall_score,
    ls.rapport_score,
    ls.objection_handling_score,
    ls.safety_score,
    ls.close_effectiveness_score,
    ls.introduction_score,
    ls.listening_score,
    ls.virtual_earnings,
    ls.full_transcript,
    ls.analytics,
    ls.created_at
  FROM live_sessions ls
  WHERE ls.user_id = p_user_id
  ORDER BY ls.started_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_sessions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_sessions(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_user_sessions(UUID, INTEGER) TO service_role;

COMMENT ON FUNCTION get_user_sessions IS 'Returns user sessions with UUIDs as TEXT to avoid corruption in Supabase JS SDK';
