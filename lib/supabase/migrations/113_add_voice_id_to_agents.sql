-- Add eleven_voice_id column to agents table for TTS snippets
-- This allows storing the ElevenLabs voice ID for each agent

DO $$
BEGIN
  -- Add eleven_voice_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'agents' 
    AND column_name = 'eleven_voice_id'
  ) THEN
    ALTER TABLE public.agents ADD COLUMN eleven_voice_id TEXT;
    
    -- Add comment
    COMMENT ON COLUMN public.agents.eleven_voice_id IS 'ElevenLabs voice ID for TTS snippets. Used to generate sample audio on landing page.';
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_agents_voice_id ON public.agents(eleven_voice_id) WHERE eleven_voice_id IS NOT NULL;
  END IF;
END $$;

