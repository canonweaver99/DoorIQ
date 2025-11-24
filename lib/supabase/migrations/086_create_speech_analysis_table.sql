-- Migration: Create speech_analysis table for storing voice/speech metrics
-- This table stores speech analysis data collected during live sessions

CREATE TABLE IF NOT EXISTS speech_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analysis_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When this analysis snapshot was taken
  
  -- Pitch metrics (Hz)
  avg_pitch FLOAT,
  min_pitch FLOAT,
  max_pitch FLOAT,
  pitch_variation FLOAT, -- percentage
  
  -- Volume metrics (dB)
  avg_volume FLOAT,
  volume_consistency FLOAT, -- coefficient of variation
  
  -- Speech rate metrics
  avg_wpm INTEGER NOT NULL DEFAULT 0, -- Words per minute
  total_filler_words INTEGER NOT NULL DEFAULT 0,
  filler_words_per_minute FLOAT NOT NULL DEFAULT 0,
  
  -- Pause and monotone detection
  long_pauses_count INTEGER NOT NULL DEFAULT 0,
  monotone_periods INTEGER NOT NULL DEFAULT 0,
  
  -- Timeline data (stored as JSONB arrays)
  pitch_timeline JSONB DEFAULT '[]'::jsonb, -- Array of {time: number, value: number}
  volume_timeline JSONB DEFAULT '[]'::jsonb, -- Array of {time: number, value: number}
  wpm_timeline JSONB DEFAULT '[]'::jsonb, -- Array of {time: number, value: number}
  
  -- Detected issues (stored as JSONB object)
  issues JSONB DEFAULT '{}'::jsonb, -- {tooFast: boolean, tooSlow: boolean, monotone: boolean, etc.}
  
  -- Metadata
  is_final BOOLEAN DEFAULT FALSE, -- True if this is the final analysis for the session
  has_pitch_data BOOLEAN DEFAULT FALSE, -- True if microphone pitch data is available
  has_volume_data BOOLEAN DEFAULT FALSE, -- True if microphone volume data is available
  
  -- Constraints
  CONSTRAINT valid_wpm CHECK (avg_wpm >= 0),
  CONSTRAINT valid_filler_words CHECK (total_filler_words >= 0),
  CONSTRAINT valid_filler_rate CHECK (filler_words_per_minute >= 0)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_speech_analysis_session_id ON speech_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_speech_analysis_session_final ON speech_analysis(session_id, is_final) WHERE is_final = TRUE;
CREATE INDEX IF NOT EXISTS idx_speech_analysis_created_at ON speech_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_speech_analysis_timestamp ON speech_analysis(analysis_timestamp DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_speech_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_speech_analysis_updated_at
  BEFORE UPDATE ON speech_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_speech_analysis_updated_at();

-- Comments for documentation
COMMENT ON TABLE speech_analysis IS 'Stores speech analysis data collected during live training sessions. Can store incremental snapshots or final aggregated data.';
COMMENT ON COLUMN speech_analysis.session_id IS 'Foreign key to live_sessions table';
COMMENT ON COLUMN speech_analysis.analysis_timestamp IS 'Timestamp when this analysis snapshot was taken (may differ from created_at for incremental saves)';
COMMENT ON COLUMN speech_analysis.avg_wpm IS 'Average words per minute calculated from transcript';
COMMENT ON COLUMN speech_analysis.pitch_timeline IS 'Array of pitch measurements over time: [{time: seconds, value: Hz}, ...]';
COMMENT ON COLUMN speech_analysis.volume_timeline IS 'Array of volume measurements over time: [{time: seconds, value: dB}, ...]';
COMMENT ON COLUMN speech_analysis.wpm_timeline IS 'Array of WPM measurements over time: [{time: seconds, value: WPM}, ...]';
COMMENT ON COLUMN speech_analysis.issues IS 'Detected speech issues: {tooFast: boolean, tooSlow: boolean, monotone: boolean, lowEnergy: boolean, excessiveFillers: boolean, poorEndings: boolean}';
COMMENT ON COLUMN speech_analysis.is_final IS 'True if this is the final analysis snapshot for the session (set when session ends)';

-- Optional: Create a view for easy access to latest analysis per session
CREATE OR REPLACE VIEW speech_analysis_latest AS
SELECT DISTINCT ON (session_id)
  *
FROM speech_analysis
ORDER BY session_id, analysis_timestamp DESC;

COMMENT ON VIEW speech_analysis_latest IS 'View showing the most recent speech analysis for each session';

