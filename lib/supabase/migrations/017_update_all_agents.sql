-- Replace all agents with the new 12 ElevenLabs agents
-- This migration is idempotent and can be run multiple times

-- Clear existing agents
DELETE FROM agents;

-- Insert the 12 new agents
INSERT INTO agents (name, persona, eleven_agent_id, is_active) VALUES
  (
    'Austin',
    'Your original agent - Skeptical but fair, direct communicator. Asks tough questions and spots pressure tactics instantly.',
    'agent_7001k5jqfjmtejvs77jvhjf254tz',
    TRUE
  ),
  (
    'No Problem Nancy',
    'Easy-going homeowner who agrees to everything quickly. Great for building confidence and practicing smooth closes.',
    'agent_0101k6dvb96zejkv35ncf1zkj88m',
    TRUE
  ),
  (
    'Already Got It Alan',
    'Currently has a pest control service. Practice competitive positioning and switching tactics.',
    'agent_9901k6dvcv32embbydd7nn0prdgq',
    TRUE
  ),
  (
    'Not Interested Nick',
    'Dismissive and wants to end the conversation quickly. Master the art of pattern interrupts and value hooks.',
    'agent_7601k6dtrf5fe0k9dh8kwmkde0ga',
    TRUE
  ),
  (
    'DIY Dave',
    'Prefers to handle pest control himself. Practice demonstrating professional value over DIY solutions.',
    'agent_1701k6dvc3nfejmvydkk7r85tqef',
    TRUE
  ),
  (
    'Too Expensive Tim',
    'Price-sensitive homeowner who thinks everything costs too much. Perfect for value framing and ROI discussions.',
    'agent_3901k6dtsjyqfvxbxd1pwzzdham0',
    TRUE
  ),
  (
    'Spouse Check Susan',
    'Needs to check with spouse before making any decisions. Practice building urgency and handling the spouse objection.',
    'agent_4601k6dvddj8fp89cey35hdj9ef8',
    TRUE
  ),
  (
    'Busy Beth',
    'Always in a hurry with no time to talk. Learn to respect time while delivering value quickly.',
    'agent_4801k6dvap8tfnjtgd4f99hhsf10',
    TRUE
  ),
  (
    'Renter Randy',
    'Renting the property and unsure if he can make decisions. Navigate authority and landlord dynamics.',
    'agent_5701k6dtt9p4f8jbk8rs1akqwtmx',
    TRUE
  ),
  (
    'Skeptical Sam',
    'Doubts everything you say and needs proof. Build credibility through testimonials and guarantees.',
    'agent_9201k6dts0haecvssk737vwfjy34',
    TRUE
  ),
  (
    'Just Treated Jerry',
    'Recently had pest control service done. Practice timing objections and future booking strategies.',
    'agent_8401k6dv9z2kepw86hhe5bvj4djz',
    TRUE
  ),
  (
    'Think About It Tina',
    'Needs time to think about everything. Overcome analysis paralysis and create urgency.',
    'agent_2501k6btmv4cf2wt8hxxmq4hvzxv',
    TRUE
  );

-- Add helpful comment
COMMENT ON TABLE agents IS 'ElevenLabs conversational AI agents for door-to-door sales training';
