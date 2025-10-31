-- Replace old 3 agents with new 4 agents
-- Update this migration with actual ElevenLabs agent IDs when available
-- This migration is idempotent and can be run multiple times

DO $$
BEGIN
  -- Remove old agents if they exist
  DELETE FROM agents WHERE name IN ('Comparison Katie', 'Bad Experience Bill', 'Neighbor Reference Nate');

  -- Insert Veteran Victor if not exists
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'Veteran Victor') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'Veteran Victor',
      'Veteran homeowner with structured thinking. Respect service and demonstrate value. Disciplined, values structure and respect.',
      'agent_3701k8s40awcf30tbs5mrksskzav',
      TRUE
    );
  ELSE
    -- Update if exists
    UPDATE agents SET
      persona = 'Veteran homeowner with structured thinking. Respect service and demonstrate value. Disciplined, values structure and respect.',
      eleven_agent_id = 'agent_3701k8s40awcf30tbs5mrksskzav',
      is_active = TRUE
    WHERE name = 'Veteran Victor';
  END IF;

  -- Insert English Second Language Elena if not exists
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'English Second Language Elena') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'English Second Language Elena',
      'Speaks English as second language. Practice clear communication and patience. Needs simple, clear explanations.',
      'agent_5901k8s3rnrkfp9vky7q1j4t3xhj',
      TRUE
    );
  ELSE
    -- Update if exists
    UPDATE agents SET
      persona = 'Speaks English as second language. Practice clear communication and patience. Needs simple, clear explanations.',
      eleven_agent_id = 'agent_5901k8s3rnrkfp9vky7q1j4t3xhj',
      is_active = TRUE
    WHERE name = 'English Second Language Elena';
  END IF;

  -- Insert Tag Team Tanya & Tom if not exists
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'Tag Team Tanya & Tom') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'Tag Team Tanya & Tom',
      'Both homeowners present. Navigate dual decision-makers and build consensus. Collaborative decision-makers, need both to agree.',
      'agent_4301k8s3mmvvekqb6fdpyszs9md4',
      TRUE
    );
  ELSE
    -- Update if exists
    UPDATE agents SET
      persona = 'Both homeowners present. Navigate dual decision-makers and build consensus. Collaborative decision-makers, need both to agree.',
      eleven_agent_id = 'agent_4301k8s3mmvvekqb6fdpyszs9md4',
      is_active = TRUE
    WHERE name = 'Tag Team Tanya & Tom';
  END IF;

  -- Insert Comparing Carl if not exists
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'Comparing Carl') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'Comparing Carl',
      'Wants to compare options. Build urgency and demonstrate unique value. Analytical, compares everything, price-focused.',
      'agent_5301k8s3gw9zf6jsmp2bfw7v7crn',
      TRUE
    );
  ELSE
    -- Update if exists
    UPDATE agents SET
      persona = 'Wants to compare options. Build urgency and demonstrate unique value. Analytical, compares everything, price-focused.',
      eleven_agent_id = 'agent_5301k8s3gw9zf6jsmp2bfw7v7crn',
      is_active = TRUE
    WHERE name = 'Comparing Carl';
  END IF;
END $$;

-- Update comment to reflect new agent count
COMMENT ON TABLE agents IS 'ElevenLabs conversational AI agents for door-to-door sales training - 16 total agents';
