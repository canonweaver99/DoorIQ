-- Add 3 more agents to bring total to 15
-- Update this migration with actual ElevenLabs agent IDs when available
-- This migration is idempotent and can be run multiple times

DO $$
BEGIN
  -- Insert Comparison Katie if not exists
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'Comparison Katie') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'Comparison Katie',
      'Wants to compare multiple quotes before deciding. Practice handling comparison objections and building urgency to close today.',
      'agent_PLACEHOLDER_COMPARISON_KATIE',  -- Replace with actual ElevenLabs agent ID
      TRUE
    );
  ELSE
    -- Update if exists
    UPDATE agents SET
      persona = 'Wants to compare multiple quotes before deciding. Practice handling comparison objections and building urgency to close today.',
      eleven_agent_id = 'agent_PLACEHOLDER_COMPARISON_KATIE',
      is_active = TRUE
    WHERE name = 'Comparison Katie';
  END IF;

  -- Insert Bad Experience Bill if not exists
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'Bad Experience Bill') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'Bad Experience Bill',
      'Had a terrible experience with previous pest control company. Practice rebuilding trust and differentiating your service.',
      'agent_PLACEHOLDER_BAD_EXPERIENCE_BILL',  -- Replace with actual ElevenLabs agent ID
      TRUE
    );
  ELSE
    -- Update if exists
    UPDATE agents SET
      persona = 'Had a terrible experience with previous pest control company. Practice rebuilding trust and differentiating your service.',
      eleven_agent_id = 'agent_PLACEHOLDER_BAD_EXPERIENCE_BILL',
      is_active = TRUE
    WHERE name = 'Bad Experience Bill';
  END IF;

  -- Insert Neighbor Reference Nate if not exists
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'Neighbor Reference Nate') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'Neighbor Reference Nate',
      'Only trusts recommendations from neighbors. Practice using social proof and local references to build credibility.',
      'agent_PLACEHOLDER_NEIGHBOR_NATE',  -- Replace with actual ElevenLabs agent ID
      TRUE
    );
  ELSE
    -- Update if exists
    UPDATE agents SET
      persona = 'Only trusts recommendations from neighbors. Practice using social proof and local references to build credibility.',
      eleven_agent_id = 'agent_PLACEHOLDER_NEIGHBOR_NATE',
      is_active = TRUE
    WHERE name = 'Neighbor Reference Nate';
  END IF;
END $$;

-- Update comment to reflect 15 agents
COMMENT ON TABLE agents IS 'ElevenLabs conversational AI agents for door-to-door sales training - 15 total agents';

