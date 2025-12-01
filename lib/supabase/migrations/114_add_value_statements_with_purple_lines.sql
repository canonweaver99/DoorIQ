-- Add Value Statements That Work section with purple pipe styling
-- Generated: 2025-12-01
-- This migration adds the "Value Statements That Work" section to the Keep Ammo module

BEGIN;

-- Module: Keep Ammo in Your Pocket - Add Value Statements That Work section
UPDATE learning_modules
SET content = content || '

---

## Value Statements That Work

If you list everything, you sound like you''re reading a brochure. If you focus on what matters to them, you sound like you understand their situation. Guess which one closes more deals?

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Most people don''t realize that one untreated home affects the whole neighborhood. We''re doing a block-wide program that keeps everyone protected - including you."

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Your electric bill is going up every year. Solar locks in your rate for the next 25 years. It''s like buying electricity at today''s prices for the next quarter-century."

**Internet:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You''re probably paying for speeds you''re not getting. We guarantee the speeds we advertise, or we refund the difference."

**Home Security:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Most break-ins happen during the day when people think they''re safe. Our system protects you 24/7, whether you''re home or not."

Each statement focuses on a specific benefit they can relate to. Not generic "we''re the best." Specific "here''s what this does for you."',
    updated_at = NOW()
WHERE slug = 'keep-ammo';

COMMIT;

