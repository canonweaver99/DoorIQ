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

-- Then add the cleaned up version - just a few examples like the user showed
UPDATE learning_modules
SET content = content || '

## Sample Scripts for Different Energy Levels

**Rushed Customer:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I know you''re busy. Let me make this quick - 30 seconds?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I can see you''re in a hurry. Quick question?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ll be fast. What are you paying for electricity?"

**Friendly Customer:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I appreciate that! Let me show you something I think you''ll really like."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem friendly! Want to see what we do?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I love your attitude! Let me show you our treatment."

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I appreciate that! Let me show you something I think you''ll really like."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem friendly! Want to see the numbers?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I love your attitude! Let me show you the system."',
    updated_at = NOW()
WHERE slug = 'mirroring';

COMMIT;

