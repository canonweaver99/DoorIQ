-- Add industry classification for agents
-- Allows agents to be filtered by industry (pest, fiber, windows, solar, roofing)

-- Create industries table
CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL CHECK(slug IN ('pest', 'fiber', 'windows', 'solar', 'roofing')),
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial industries
INSERT INTO industries (slug, name, icon) VALUES
  ('pest', 'Pest Control', 'Bug'),
  ('fiber', 'Fiber Internet', 'Wifi'),
  ('windows', 'Windows & Doors', 'DoorOpen'),
  ('solar', 'Solar', 'Sun'),
  ('roofing', 'Roofing', 'Home')
ON CONFLICT (slug) DO NOTHING;

-- Junction table for agent-industry relationship (many-to-many)
CREATE TABLE IF NOT EXISTS agent_industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, industry_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_industries_agent_id ON agent_industries(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_industries_industry_id ON agent_industries(industry_id);

-- Enable RLS on new tables
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_industries ENABLE ROW LEVEL SECURITY;

-- RLS policies for industries (read-only for all authenticated users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view industries' AND tablename = 'industries'
  ) THEN
    CREATE POLICY "Anyone can view industries" ON industries
      FOR SELECT USING (true);
  END IF;
END $$;

-- RLS policies for agent_industries (read-only for all authenticated users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view agent_industries' AND tablename = 'agent_industries'
  ) THEN
    CREATE POLICY "Anyone can view agent_industries" ON agent_industries
      FOR SELECT USING (true);
  END IF;
END $$;

-- Assign all existing agents to pest control industry by default
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE i.slug = 'pest'
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;
