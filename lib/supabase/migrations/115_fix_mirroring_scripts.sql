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

-- Then add the cleaned up version without bullet points
UPDATE learning_modules
SET content = content || '

## Sample Scripts for Different Energy Levels

**Rushed Customer:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I know you''re busy. Let me make this quick - 30 seconds?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I can see you''re in a hurry. Quick question?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ll be fast. Are you dealing with bugs?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I know you''re busy. Let me make this quick - 30 seconds?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I can see you''re in a hurry. Quick question?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ll be fast. What are you paying for electricity?"

**Friendly Customer:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I appreciate that! Let me show you something I think you''ll really like."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem friendly! Want to see what we do?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I love your attitude! Let me show you our treatment."

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I appreciate that! Let me show you something I think you''ll really like."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem friendly! Want to see the numbers?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I love your attitude! Let me show you the system."

**Low Energy Customer (Calm, Quiet):**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I can see you''re relaxed. Let me show you something that might interest you."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem calm. Let me explain this simply."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ll keep this low-key. Want to see what we do?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I can see you''re relaxed. Let me show you something that might help."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem calm. Let me explain this simply."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ll keep this straightforward. Want to see the numbers?"

**High Energy Customer (Excited, Chatty):**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I can tell you''re excited! Let me show you something amazing."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem really engaged! Want to see what we can do?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I love your energy! Let me show you our full treatment."

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I can tell you''re excited! Let me show you something incredible."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem really engaged! Want to see the numbers?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I love your energy! Let me show you the full system."

**Skeptical Customer:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I get it - you''ve probably heard this before. Let me show you something different."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I understand your skepticism. Let me prove this works."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem skeptical. That''s fair. Let me show you why this is different."

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I get it - you''ve probably heard this before. Let me show you something different."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I understand your skepticism. Let me show you the real numbers."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem skeptical. That''s fair. Let me prove this works."',
    updated_at = NOW()
WHERE slug = 'mirroring';

COMMIT;

