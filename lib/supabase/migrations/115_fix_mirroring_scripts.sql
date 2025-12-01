-- Fix Mirroring module: Remove duplicates, remove bullet points, ensure purple pipe styling
-- Generated: 2025-12-01
-- This migration replaces the Sample Scripts section with cleaned up content

BEGIN;

-- Module: Mirroring - Get Into Their World - Replace Sample Scripts section
-- First, remove the old Sample Scripts section if it exists
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n## Sample Scripts for Different Energy Levels.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE slug = 'mirroring';

-- Then add the cleaned up version - simple format like Example Scripts
UPDATE learning_modules
SET content = content || '

## Example Scripts

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I know you''re busy. Let me make this quick - 30 seconds?"
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I can see you''re in a hurry. Quick question?"
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I''ll be fast. Are you dealing with bugs?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I know you''re busy. Let me make this quick - 30 seconds?"
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I can see you''re in a hurry. Quick question?"
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I''ll be fast. What are you paying for electricity?"

**Internet:**
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I know you''re busy. Let me make this quick - 30 seconds?"
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I can see you''re in a hurry. Quick question?"
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I''ll be fast. Are you getting the speeds you''re paying for?"

**Security:**
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I know you''re busy. Let me make this quick - 30 seconds?"
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I can see you''re in a hurry. Quick question?"
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I''ll be fast. Do you have a security system?"

**Roofing:**
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I know you''re busy. Let me make this quick - 30 seconds?"
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I can see you''re in a hurry. Quick question?"
<span style="color: #a855f7; font-weight: bold;">|</span>
**Rep:** "I''ll be fast. Did you get any damage from that last storm?"',
    updated_at = NOW()
WHERE slug = 'mirroring';

COMMIT;

