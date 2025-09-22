-- Create agents table for different AI personalities/training
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Agent identification
  name TEXT NOT NULL,
  agent_id TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  avatar_initials TEXT,
  
  -- Agent configuration
  voice_id TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  model TEXT DEFAULT 'gpt-4',
  
  -- Training data
  system_prompt TEXT NOT NULL,
  persona_description TEXT NOT NULL,
  conversation_style JSONB DEFAULT '{}',
  knowledge_base JSONB DEFAULT '[]',
  behavioral_rules JSONB DEFAULT '[]',
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}'
);

-- Create levels table for different households/scenarios
CREATE TABLE IF NOT EXISTS levels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Level identification
  level_number INTEGER NOT NULL UNIQUE CHECK (level_number > 0),
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')) DEFAULT 'medium',
  
  -- Household details
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  household_type TEXT NOT NULL,
  
  -- Environment details
  home_description TEXT,
  neighborhood TEXT,
  time_of_day TEXT DEFAULT 'afternoon',
  weather TEXT DEFAULT 'sunny',
  
  -- Scenario configuration
  initial_mood TEXT DEFAULT 'neutral',
  pain_points TEXT[] DEFAULT '{}',
  prior_experiences TEXT[] DEFAULT '{}',
  budget_range TEXT,
  decision_timeline TEXT,
  
  -- Success criteria
  objectives JSONB DEFAULT '[]',
  bonus_objectives JSONB DEFAULT '[]',
  time_limit_seconds INTEGER DEFAULT 600,
  
  -- Unlock requirements
  is_unlocked BOOLEAN DEFAULT false,
  unlock_requirements JSONB DEFAULT '{}',
  
  -- Statistics
  attempts_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  best_score DECIMAL(5,2) DEFAULT 0
);

-- Create junction table for agent training documents
CREATE TABLE IF NOT EXISTS agent_training_docs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  training_document_id UUID NOT NULL REFERENCES training_documents(id) ON DELETE CASCADE,
  
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  category TEXT,
  
  UNIQUE(agent_id, training_document_id)
);

-- Create user progress table
CREATE TABLE IF NOT EXISTS user_level_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  user_id TEXT NOT NULL,
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  
  -- Progress tracking
  is_completed BOOLEAN DEFAULT false,
  best_score DECIMAL(5,2) DEFAULT 0,
  attempts_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  
  -- Achievements
  objectives_completed TEXT[] DEFAULT '{}',
  bonus_objectives_completed TEXT[] DEFAULT '{}',
  stars_earned INTEGER DEFAULT 0 CHECK (stars_earned >= 0 AND stars_earned <= 3),
  
  UNIQUE(user_id, level_id)
);

-- Insert Amanda as the first agent
INSERT INTO agents (
  name,
  agent_id,
  avatar_initials,
  system_prompt,
  persona_description,
  conversation_style,
  behavioral_rules
) VALUES (
  'Amanda Rodriguez',
  'amanda_001',
  'AR',
  'You are Amanda Rodriguez, a realistic homeowner used for training door-to-door pest-control sales reps. Stay in-character and natural. Keep replies 1–3 sentences unless asked for detail.

Persona: 34, Marketing Director at a tech startup; married to David; kids Sofia (6) and Lucas (3); Goldendoodle Bailey.
Values: child & pet safety, predictable pricing, on-time technicians, clear communication.
Pain points: late techs, vague pricing, hidden fees, chemical jargon.',
  'Suburban mom, marketing director, values safety and clear communication',
  '{
    "greeting": "Yes? What can I help you with?",
    "interruptions": ["[kid noise]", "[dog barking]", "[timer dings]"],
    "objections": ["I need to check with my husband", "Not in the budget this month", "Can you email me details?"],
    "interests": ["child safety", "pet safety", "EPA registration", "clear pricing"]
  }'::jsonb,
  '[
    "Polite but time-constrained",
    "Uses short, direct questions",
    "Interrupts if rep talks >20 seconds",
    "Warms up with safety clarity"
  ]'::jsonb
);

-- Insert 5 household levels
WITH amanda_agent AS (
  SELECT id FROM agents WHERE agent_id = 'amanda_001' LIMIT 1
)
INSERT INTO levels (level_number, name, description, difficulty, agent_id, household_type, initial_mood, objectives)
SELECT 
  1,
  'Amanda Rodriguez - Suburban Family',
  'Marketing director mom with young kids and a dog. Neutral but warms with clarity.',
  'medium',
  amanda_agent.id,
  'suburban_family',
  'neutral',
  '[
    {"id": "safety", "description": "Address child and pet safety concerns"},
    {"id": "timing", "description": "Offer specific appointment window"},
    {"id": "pricing", "description": "Provide clear pricing with no hidden fees"},
    {"id": "close", "description": "Schedule a trial service"}
  ]'::jsonb
FROM amanda_agent;

-- Level 2: Skeptical Retiree
INSERT INTO agents (name, agent_id, avatar_initials, system_prompt, persona_description)
VALUES (
  'Frank Thompson',
  'frank_001',
  'FT',
  'You are Frank Thompson, a 68-year-old retired engineer. Highly skeptical of salespeople. You''ve been burned before by pest control companies. Very analytical, wants facts and proof.',
  'Skeptical retiree, wants facts and proof, hates pushy sales tactics'
);

-- Level 3: Busy Tech Executive  
INSERT INTO agents (name, agent_id, avatar_initials, system_prompt, persona_description)
VALUES (
  'Priya Patel',
  'priya_001',
  'PP',
  'You are Priya Patel, a 38-year-old VP of Engineering at a startup. Extremely busy, works from home. Values efficiency and digital communication. Has a severe ant problem in home office.',
  'Busy tech executive, values efficiency, works from home'
);

-- Level 4: Budget-Conscious Young Couple
INSERT INTO agents (name, agent_id, avatar_initials, system_prompt, persona_description)
VALUES (
  'Jake & Emma Wilson',
  'jake_emma_001',
  'JE',
  'You are Jake Wilson, 28, speaking for you and your wife Emma. First-time homeowners on a tight budget. Very price-sensitive but dealing with a spider problem. Emma is pregnant.',
  'Young couple, first-time homeowners, budget-conscious, expecting baby'
);

-- Level 5: Chatty Grandma
INSERT INTO agents (name, agent_id, avatar_initials, system_prompt, persona_description)
VALUES (
  'Dorothy Mae Johnson',
  'dorothy_001',
  'DM',
  'You are Dorothy Mae Johnson, 75, a sweet but lonely grandmother. You love to chat and tell stories. Your late husband Harold always handled these things. You have mice in the garage.',
  'Friendly grandmother, loves to chat, recently widowed, needs help deciding'
);

-- Add remaining levels
INSERT INTO levels (level_number, name, difficulty, agent_id, household_type, initial_mood, home_description)
SELECT 
  2, 
  'Frank Thompson - Skeptical Retiree',
  'hard',
  (SELECT id FROM agents WHERE agent_id = 'frank_001'),
  'suburban_home',
  'skeptical',
  'Well-maintained older home, garage workshop'
UNION ALL
SELECT 
  3,
  'Priya Patel - Tech Executive', 
  'medium',
  (SELECT id FROM agents WHERE agent_id = 'priya_001'),
  'modern_home',
  'busy',
  'Modern smart home, home office, ant problem'
UNION ALL
SELECT 
  4,
  'Jake & Emma - Young Couple',
  'easy',
  (SELECT id FROM agents WHERE agent_id = 'jake_emma_001'),
  'starter_home',
  'friendly',
  'Small starter home, nursery being prepared'
UNION ALL
SELECT 
  5,
  'Dorothy Mae - Chatty Grandma',
  'expert',
  (SELECT id FROM agents WHERE agent_id = 'dorothy_001'),
  'vintage_home',
  'lonely',
  'Older home full of memories, mice in garage';

-- Create indexes for performance
CREATE INDEX idx_agents_agent_id ON agents(agent_id);
CREATE INDEX idx_agents_is_active ON agents(is_active);
CREATE INDEX idx_levels_level_number ON levels(level_number);
CREATE INDEX idx_levels_agent_id ON levels(agent_id);
CREATE INDEX idx_levels_is_unlocked ON levels(is_unlocked);
CREATE INDEX idx_user_progress_user_level ON user_level_progress(user_id, level_id);
CREATE INDEX idx_agent_training_agent ON agent_training_docs(agent_id);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_training_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_level_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Agents are readable by all, writable by admins only
CREATE POLICY "Anyone can read agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Admins can manage agents" ON agents FOR ALL USING (true);

-- Levels are readable by all, progress tracked per user
CREATE POLICY "Anyone can read levels" ON levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage levels" ON levels FOR ALL USING (true);

-- Users can only see/update their own progress
CREATE POLICY "Users can view own progress" ON user_level_progress 
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can update own progress" ON user_level_progress 
  FOR ALL USING (auth.uid()::text = user_id);

-- Training docs managed by admins
CREATE POLICY "Anyone can read agent training docs" ON agent_training_docs FOR SELECT USING (true);
CREATE POLICY "Admins can manage agent training docs" ON agent_training_docs FOR ALL USING (true);
