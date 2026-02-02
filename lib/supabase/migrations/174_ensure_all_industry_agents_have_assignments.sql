-- Ensure all industry-specific agents have proper industry assignments
-- This migration fixes the issue where agents exist but don't have entries in agent_industries
-- Based on the agent IDs from migration 173_fix_all_agent_ids.sql

DO $$
DECLARE
  solar_industry_id UUID;
  roofing_industry_id UUID;
  pest_industry_id UUID;
  windows_industry_id UUID;
  fiber_industry_id UUID;
  agent_record_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO solar_industry_id FROM industries WHERE slug = 'solar';
  SELECT id INTO roofing_industry_id FROM industries WHERE slug = 'roofing';
  SELECT id INTO pest_industry_id FROM industries WHERE slug = 'pest';
  SELECT id INTO windows_industry_id FROM industries WHERE slug = 'windows';
  SELECT id INTO fiber_industry_id FROM industries WHERE slug = 'fiber';
  
  IF solar_industry_id IS NULL THEN
    RAISE EXCEPTION 'Solar industry not found';
  END IF;
  
  IF roofing_industry_id IS NULL THEN
    RAISE EXCEPTION 'Roofing industry not found';
  END IF;
  
  IF pest_industry_id IS NULL THEN
    RAISE EXCEPTION 'Pest industry not found';
  END IF;
  
  IF windows_industry_id IS NULL THEN
    RAISE EXCEPTION 'Windows industry not found';
  END IF;
  
  IF fiber_industry_id IS NULL THEN
    RAISE EXCEPTION 'Fiber industry not found';
  END IF;

  -- ============================================
  -- SOLAR INDUSTRY AGENTS
  -- ============================================
  
  -- 1. Jennifer Walsh - I'm Selling Soon (Solar) - shared with Roofing
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_2701kg2yvease7b89h6nx6p1eqjy'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 2. Terrell Washington - I Don't Qualify (Solar)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_7401kg2vf3twe1xr9d66asfc43sv'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 3. Linda Morrison - I've Heard Bad Things About Solar (Solar)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_0901kfgyntt4ekz9xfj3q5srk3sh'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 4. Robert Jenkins - My Roof is Too Old (Solar)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_0201kfgymyrpe6yvb7f0ay8efd72'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 5. David Martinez - What If It Doesn't Work? (Solar)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_1801kfgyj8hxf4p91mg5tfpwq9pp'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 6. Sarah Chen - My Electric Bill is Too Low (Solar)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_0501kfgyh9vrea4v9sb923t6vtfv'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 7. James Porter - How Much Does It Cost? (Solar)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_5001kfgygawzf3z9prjqkqv1wj85'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 8. Brian Walsh - Solar is Too Expensive (Solar)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_1501kfgycw6wff3vd46tnzjr8xkb'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 9. Gary Thompson - I'm Not Interested in Solar (Solar)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_2101kfgybvm0fz1shb4msy1q5qxz'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 10. Michelle Torres - I Need to Talk to My Spouse (Solar)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_9101kfgy6d0jft18a06r0zj19jp1'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- ============================================
  -- WINDOWS INDUSTRY AGENTS
  -- ============================================

  -- 1. Steve Harry - Not the Right Time - Maybe Next Year (Windows)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_2601kg2wcsw2f16sw06e5mxaeras'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 2. Jonathan Wright - I'm Waiting Until... (Windows)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_7801kg2wc55se38vwwrj6dafec7d'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 3. Laura Thompson - What's Wrong With My Windows? (Windows)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_7701kg2wbfn0e7mvw4p69wr13rb4'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 4. Patrick Murphy - I'll Just Do It Myself (Windows)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_6601kg2wav3hebnvq04zeymzkbhb'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 5. Sherry Green - I'm Selling/Moving Soon (Windows)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_1401kg2w9r2tf13bwqebxrn9m3g0'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 6. Maria Gonzalez - I Just Need One or Two Windows (Windows)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_9901kg2w904weyjv9xjs9sxjzszt'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 7. Jeffrey Clark - I'm Going to Get Multiple Quotes (Windows)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_9801kg2w89tqfy3tht3zwjp5w3qc'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 8. Kellie Adams - That's Too Expensive (Windows)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_0801kg2w6rdpe2jtdpg6s4ge2xct'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 9. Robert Lee - My Windows Are Fine (Windows)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_5901kg2w2pbke0p81575yq1c6spj'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 10. Angela White - I Need to Talk to My Spouse (Windows)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_3301kg2vydhnf28s2q2b6thzhfa4'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- ============================================
  -- ROOFING INDUSTRY AGENTS
  -- ============================================

  -- 1. Harold Stevens - I Don't Trust Door-to-Door (Roofing)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_7201kfgy3kgeexwvkw15c30n3q3n'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 2. Diane Martinez - I'm Selling Soon (Roofing) - shared with Solar, already handled above

  -- 3. Lisa Martinez - My Insurance Won't Cover It (Roofing)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_3801kfgy1qw9eyxa31hxdy66syrm'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 4. Kevin Anderson - I Already Have Someone (Roofing)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_9201kfgy0r49fc09xn6t28bcr7n5'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 5. Tom Bradley - I'll Call You When I Need a Roof (Roofing)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_3001kfgxy6vfe3wbsjeqpczh4gje'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 6. Carlos Mendez - I Just Had My Roof Done (Roofing)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_6801kfgxt1bxfzvrc1xatssc5f1m'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 7. David Kim - How Much Does a Roof Cost? (Roofing)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_3201kfgxs63qf3yrz6spva0xmn76'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- ============================================
  -- PEST CONTROL INDUSTRY AGENTS
  -- ============================================

  -- 1. Dan Mitchell - I Already Have a Pest Guy (Pest Control)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_7801kfgwtwrnfjn998jh1xztrgen'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, pest_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 2. Rachel Cooper - I Don't Have Any Bugs (Pest Control)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_5901kfgwvwq1e49smdr13zc3mwj0'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, pest_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 3. Tyler Jackson - I'm Renting/Don't Own (Pest Control)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_9801kfgwyjz8ffkbbr1xscdwxfdt'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, pest_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 4. Greg Wilson - I Just Spray Myself (Pest Control)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_5601kfgwzpnweks9myh96gy91zea'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, pest_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 5. Jennifer Lee - Send Me Information (Pest Control)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_8501kfgx77bsfd7bjm9nh30g8z4c'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, pest_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 6. Chris Bennett - We're Selling/Moving Soon (Pest Control)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_1201kfgx8761fv7vkygynecyg5y1'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, pest_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 7. Nicole Rodriguez - I Have Pets/Kids - Worried About Chemicals (Pest Control)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_4901kfgx9acaee6bpmnb0vjhfevx'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, pest_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 8. Mike Sullivan - Bad Timing - Call Me Back Later (Pest Control)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_3801kfgxa5v1fg9van0enjj6qf3p'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, pest_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 9. Vincent "Vinny" Caruso - What's the Price? (Pest Control)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_4701kg2tk5d9f5ksab7r3e7q9t1b'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, pest_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- ============================================
  -- FIBER INTERNET INDUSTRY AGENTS
  -- ============================================

  -- 1. James Wilson - How Much Is It? (Fiber)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_7301kfgsf649e8jah8qme3csnvpx'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 2. Jessica Martinez - I Need to Talk to My Spouse (Fiber)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_7201kfgssnt8eb2a8a4kghb421vd'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 3. Daniel Mitchell - I Already Have Internet (Fiber)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_3401kfgsy2vdfcrb9gesp3zw8jqw'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 4. Amanda Stevens - I didn't sign up for anything (Fiber)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_0401kfgt10g0f5xbtxm3a7y92p27'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 5. Kevin Richardson - I Don't Want to Deal With Switching (Fiber)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_7401kfgt21gtebxt2tasfk46tpyk'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 6. Marcus Johnson - I Just Signed Up (Fiber)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_8601kfgt8mv3ey09nb14fwbwd3jb'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 7. Rob Davis - What's the Catch? (Fiber)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_5701kfgt9n2ff06ajk6bfq7974w5'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 8. Sarah Kim - I'm Moving Soon (Fiber)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_9101kfgtbp2me14t01n0c0nbanw3'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 9. Tom Henderson - My Internet Works Fine (Fiber)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_5901kfgtcpaneyqs2c7ajb3fnb8w'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 10. Linda Morrison - I'm Happy With What I Have (Fiber)
  SELECT id INTO agent_record_id
  FROM agents
  WHERE eleven_agent_id = 'agent_0501kfgtdkcxfs28bb022mc5g9bw'
  LIMIT 1;
  
  IF agent_record_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (agent_record_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

END $$;

-- Add comment
COMMENT ON TABLE agent_industries IS 'Junction table linking agents to industries. Migration 174 ensures all industry-specific agents have proper assignments.';
