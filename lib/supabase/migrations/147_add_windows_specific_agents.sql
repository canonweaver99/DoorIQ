-- Add 10 new windows and doors specific agent personas
-- These are placeholder agents that will be built out with ElevenLabs agent IDs later

DO $$
BEGIN
  -- Insert or update each agent
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'My Windows Are Fine') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'My Windows Are Fine',
      'Smokescreen/Real objection - Most common (70%+). Windows work (open/close), so they don''t see a problem. What it means: "They''re not broken, why would I replace them?". Overcome by: Energy loss (higher bills), drafts, condensation, resale value, showing age/efficiency issues.',
      'placeholder_windows_001',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Most common (70%+). Windows work (open/close), so they don''t see a problem. What it means: "They''re not broken, why would I replace them?". Overcome by: Energy loss (higher bills), drafts, condensation, resale value, showing age/efficiency issues.',
      eleven_agent_id = 'placeholder_windows_001',
      is_active = TRUE
    WHERE name = 'My Windows Are Fine';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'How Much Does It Cost?') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'How Much Does It Cost?',
      'Smokescreen/Real concern - Very common (60%+). Heard windows are $1k+ per window, want to disqualify you. What it means: "This is going to be way too expensive". Overcome by: Can''t quote without measuring, focus on savings/ROI, financing options, whole-house vs per-window.',
      'placeholder_windows_002',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real concern - Very common (60%+). Heard windows are $1k+ per window, want to disqualify you. What it means: "This is going to be way too expensive". Overcome by: Can''t quote without measuring, focus on savings/ROI, financing options, whole-house vs per-window.',
      eleven_agent_id = 'placeholder_windows_002',
      is_active = TRUE
    WHERE name = 'How Much Does It Cost?';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'That''s Too Expensive') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'That''s Too Expensive',
      'Real objection - Sticker shock - Very common (65%+). $15k-$40k for whole house is legitimately expensive. What it means: "That''s more money than I have or want to spend". Overcome by: Financing ($200/month sounds better than $25k), energy savings ROI, home value increase, payment plans.',
      'placeholder_windows_003',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection - Sticker shock - Very common (65%+). $15k-$40k for whole house is legitimately expensive. What it means: "That''s more money than I have or want to spend". Overcome by: Financing ($200/month sounds better than $25k), energy savings ROI, home value increase, payment plans.',
      eleven_agent_id = 'placeholder_windows_003',
      is_active = TRUE
    WHERE name = 'That''s Too Expensive';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Need to Talk to My Spouse') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Need to Talk to My Spouse',
      'Smokescreen/Real objection - Very common (55%+). Major home improvement decision, both must agree, or easy out. What it means: "Too big a decision for me alone" OR "Go away". Overcome by: Only present to both, schedule evening appointments, FaceTime spouse, never one-leg a windows deal.',
      'placeholder_windows_004',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Very common (55%+). Major home improvement decision, both must agree, or easy out. What it means: "Too big a decision for me alone" OR "Go away". Overcome by: Only present to both, schedule evening appointments, FaceTime spouse, never one-leg a windows deal.',
      eleven_agent_id = 'placeholder_windows_004',
      is_active = TRUE
    WHERE name = 'I Need to Talk to My Spouse';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''m Going to Get Multiple Quotes') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Going to Get Multiple Quotes',
      'Real objection - Smart consumer behavior - Very common (50%+). Legitimately want to compare 3-5 companies for major purchase. What it means: "I''m not buying today, I''m shopping around". Overcome by: Encourage it but position your value, apples-to-apples comparison education, limited-time incentives.',
      'placeholder_windows_005',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection - Smart consumer behavior - Very common (50%+). Legitimately want to compare 3-5 companies for major purchase. What it means: "I''m not buying today, I''m shopping around". Overcome by: Encourage it but position your value, apples-to-apples comparison education, limited-time incentives.',
      eleven_agent_id = 'placeholder_windows_005',
      is_active = TRUE
    WHERE name = 'I''m Going to Get Multiple Quotes';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Just Need One or Two Windows') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Just Need One or Two Windows',
      'Real objection - Partial project - Common (30%+). Want to replace broken/problem windows only, not whole house. What it means: "I don''t want/need a $30k project". Overcome by: Single window pricing (but higher per-unit), energy loss from old windows surrounding new ones, staged approach.',
      'placeholder_windows_006',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection - Partial project - Common (30%+). Want to replace broken/problem windows only, not whole house. What it means: "I don''t want/need a $30k project". Overcome by: Single window pricing (but higher per-unit), energy loss from old windows surrounding new ones, staged approach.',
      eleven_agent_id = 'placeholder_windows_006',
      is_active = TRUE
    WHERE name = 'I Just Need One or Two Windows';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''m Selling/Moving Soon') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Selling/Moving Soon',
      'Smokescreen/Real objection - Common (25%+). Sometimes true, often convenient excuse. What it means: "Won''t be here to enjoy it" OR "Just want you gone". Overcome by: New windows = higher sale price, selling point for buyers, required for inspection, helps house show better.',
      'placeholder_windows_007',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Common (25%+). Sometimes true, often convenient excuse. What it means: "Won''t be here to enjoy it" OR "Just want you gone". Overcome by: New windows = higher sale price, selling point for buyers, required for inspection, helps house show better.',
      eleven_agent_id = 'placeholder_windows_007',
      is_active = TRUE
    WHERE name = 'I''m Selling/Moving Soon';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''ll Just Do It Myself') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''ll Just Do It Myself',
      'Real objection - DIY or existing relationship - Common (25-30%). Handy homeowner or has contractor friend/family. What it means: "I can save money doing it myself or using my guy". Overcome by: Warranty only with professional install, proper installation critical, manufacturer certification, time value.',
      'placeholder_windows_008',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection - DIY or existing relationship - Common (25-30%). Handy homeowner or has contractor friend/family. What it means: "I can save money doing it myself or using my guy". Overcome by: Warranty only with professional install, proper installation critical, manufacturer certification, time value.',
      eleven_agent_id = 'placeholder_windows_008',
      is_active = TRUE
    WHERE name = 'I''ll Just Do It Myself';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'What''s Wrong With My Current Windows?') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'What''s Wrong With My Current Windows?',
      'Real objection - Need education - Common (35%+). Don''t understand energy loss, single-pane issues, or how old their windows are. What it means: "Convince me there''s actually a problem". Overcome by: Energy audit, showing drafts, condensation problems, outside noise, age of home/windows, comfort issues.',
      'placeholder_windows_009',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection - Need education - Common (35%+). Don''t understand energy loss, single-pane issues, or how old their windows are. What it means: "Convince me there''s actually a problem". Overcome by: Energy audit, showing drafts, condensation problems, outside noise, age of home/windows, comfort issues.',
      eleven_agent_id = 'placeholder_windows_009',
      is_active = TRUE
    WHERE name = 'What''s Wrong With My Current Windows?';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''m Waiting Until...') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Waiting Until...',
      'Smokescreen - Procrastination - Common (40%+). Putting off major expense/decision indefinitely. What it means: "I know I need it eventually but not dealing with it now". Overcome by: Energy loss costs them money every month, incentives expiring, financing promotions, winter/summer comfort urgency.',
      'placeholder_windows_010',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen - Procrastination - Common (40%+). Putting off major expense/decision indefinitely. What it means: "I know I need it eventually but not dealing with it now". Overcome by: Energy loss costs them money every month, incentives expiring, financing promotions, winter/summer comfort urgency.',
      eleven_agent_id = 'placeholder_windows_010',
      is_active = TRUE
    WHERE name = 'I''m Waiting Until...';
  END IF;
END $$;

-- Assign all these new agents to windows industry only
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name IN (
  'My Windows Are Fine',
  'How Much Does It Cost?',
  'That''s Too Expensive',
  'I Need to Talk to My Spouse',
  'I''m Going to Get Multiple Quotes',
  'I Just Need One or Two Windows',
  'I''m Selling/Moving Soon',
  'I''ll Just Do It Myself',
  'What''s Wrong With My Current Windows?',
  'I''m Waiting Until...',
  'Not the Right Time / Maybe Next Year',
  'Angry Indian'
)
  AND i.slug = 'windows'
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;

-- Remove all other agents from windows industry except these new ones
DELETE FROM agent_industries
WHERE industry_id = (SELECT id FROM industries WHERE slug = 'windows')
  AND agent_id NOT IN (
    SELECT id FROM agents 
    WHERE name IN (
      'My Windows Are Fine',
      'How Much Does It Cost?',
      'That''s Too Expensive',
      'I Need to Talk to My Spouse',
      'I''m Going to Get Multiple Quotes',
      'I Just Need One or Two Windows',
      'I''m Selling/Moving Soon',
      'I''ll Just Do It Myself',
      'What''s Wrong With My Current Windows?',
      'I''m Waiting Until...',
      'Not the Right Time / Maybe Next Year',
      'Angry Indian'
    )
  );
