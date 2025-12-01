-- Add Sample Scripts and Creative Lines to applicable lessons
-- Generated: 2025-12-01
-- This migration adds practical scripts and creative lines to help reps implement the frameworks

BEGIN;

-- Module: The Pattern Interrupt - Add Creative Opening Lines
UPDATE learning_modules
SET content = content || '

---

## Creative Opening Lines

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - have you noticed more bugs this season than usual?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Hey, I''m doing a quick survey in your area - have you seen more ants or roaches lately?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I noticed something about your yard - mind if I show you real quick?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - are you dealing with any pest problems right now?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "What''s your average electric bill? I''m doing a quick survey in your area."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - have you noticed your electric bill going up?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m working with a few neighbors on something that might interest you - what are you paying for electricity?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Mind if I ask - are you happy with your current electric rates?"

**Internet:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Are you getting the speeds you''re paying for? I''m checking speeds in your neighborhood."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - have you noticed any lag or buffering lately?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m doing a quick survey - are you happy with your internet speeds?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Mind if I ask - what internet speeds are you currently getting?"

**Security:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Do you have a security system? I''m working with neighbors on a group discount."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - are you happy with your home security?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I noticed something about your home - mind if I show you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Are you the homeowner? I''m doing a quick survey about home security."

**Roofing:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Did you get any damage from that last storm? I''m checking roofs in your area."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - when was the last time you had your roof inspected?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I noticed something about your roof - mind if I show you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Are you dealing with any leaks or roof issues right now?"

Each of these interrupts their expected script and creates curiosity instead of resistance.',
    updated_at = NOW()
WHERE slug = 'pattern-interrupt';

-- Module: The Icebreaker That Works - Add More Creative Lines
UPDATE learning_modules
SET content = content || '

---

## More Creative Icebreakers

**For Rushed Homeowners:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I know you''re busy - 30 seconds?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - are you the homeowner?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ll make this fast - are you dealing with [problem]?"

**For Curious Homeowners:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I noticed something about your [house/yard/roof] - mind if I show you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - have you noticed [specific problem]?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m working with a few neighbors - mind if I ask you something?"

**For Skeptical Homeowners:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I know you weren''t expecting me - quick question?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I know you probably get a lot of people knocking - this is different."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m not here to waste your time - 30 seconds?"

**For Friendly Homeowners:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Hey, got a minute? I''m working with some neighbors."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - are you the homeowner?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m doing a quick survey in your area - mind if I ask you something?"

**Industry-Specific Creative Lines:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I just finished up at the Johnson''s place down the street - noticed something about your yard."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - have you seen more bugs this season than last year?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m working with neighbors on a neighborhood-wide treatment - are you dealing with pests?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m doing a quick energy survey - what are you paying for electricity?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - have you thought about solar?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m working with neighbors on something that could save you money - mind if I ask?"

**Internet:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m checking internet speeds in your area - are you getting what you pay for?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - have you noticed any lag or buffering?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m working with neighbors on better internet - are you happy with yours?"

**Security:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m working with neighbors on a group discount - do you have a security system?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - are you happy with your home security?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I noticed something about your home - mind if I show you real quick?"

**Roofing:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m checking roofs in your area - did you get any storm damage?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - when was your roof last inspected?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I noticed something about your roof - mind if I show you?"',
    updated_at = NOW()
WHERE slug = 'icebreaker';

-- Module: Building Value Before Price - Add Sample Scripts
UPDATE learning_modules
SET content = content || '

---

## Sample Scripts

**When They Ask Price Too Early:**

**Pest Control:**
> **Homeowner:** "How much does this cost?"
> **Rep:** "Great question - let me show you what''s included first so the price makes sense. We treat your entire yard, inside and out, every quarter. That means your kids can play outside without getting bit, you won''t see bugs inside, and if anything comes back, we come back for free. Plus, we use professional-grade products you can''t buy at the store. Now, does that sound like something that would help you?"

**Solar:**
> **Homeowner:** "What''s this going to cost me?"
> **Rep:** "I totally get that - let me show you what''s included first. This system will lock in your electric rate for 25 years, so no more rate hikes. You''ll generate your own power, so you''re protected from outages. Plus, you get a 25-year warranty on everything. Now, what are you currently paying for electricity?"

**Internet:**
> **Homeowner:** "How much is this?"
> **Rep:** "Great question - let me show you what you get first. You''ll get guaranteed speeds, so no more buffering during movie night. Your whole family can stream, game, and work from home at the same time. Plus, if you don''t get the speeds we advertise, we refund the difference. Now, are you happy with your current speeds?"

**Building Value Before Price:**

**Pest Control:**
> "You know what I hear most? People say ''I wish I''d done this sooner.'' Because once we treat your home, you won''t have to think about bugs again. Your kids can play outside safely. You won''t see roaches in your kitchen. And if anything comes back, we come back for free. That peace of mind? That''s what this is really about."

**Solar:**
> "Here''s what this does for you: Your electric bill is locked in for 25 years. No more rate hikes. No more surprises. You''re generating your own power, so you''re protected from outages. And after it''s paid off, your electricity is free. That''s not just savings - that''s security."

**Internet:**
> "Here''s what this means for you: No more buffering during movie night. Your whole family can stream, game, and work from home at the same time without anyone lagging. We guarantee the speeds we advertise, or we refund the difference. That''s not just internet - that''s reliability."',
    updated_at = NOW()
WHERE slug = 'value-before-price';

-- Module: Painting the Picture - Add Sample Scripts
UPDATE learning_modules
SET content = content || '

---

## Sample Scripts

**Painting the Problem:**

**Pest Control:**
> "Imagine this: You''re having dinner with your family, and a roach crawls across the table. Your kids are grossed out, your wife''s embarrassed, and you''re frustrated because you thought you''d dealt with this. That''s not annoying - that''s a problem. And it''s happening right now in your walls."

**Solar:**
> "Every month that electric bill comes, that''s money you''ll never see again. $200 this month. $250 next month. $300 the month after. Over 25 years, that''s $60,000 gone. And your rate keeps going up. That''s not just expensive - that''s throwing money away."

**Internet:**
> "Picture this: Everyone''s home. Your kids are streaming. Your spouse is on a video call. You''re trying to watch a movie. And everything starts buffering. You''re paying for speeds you''re not getting. That''s not just frustrating - that''s wasting money."

**Security:**
> "Most break-ins happen during the day when people think they''re safe. You''re at work. Your kids are at school. Someone breaks in. They take everything. And you find out hours later. That''s not just a risk - that''s your family''s safety."

**Painting the Solution:**

**Pest Control:**
> "Now imagine this: Your kids playing outside without you worrying about bugs. No roaches in your kitchen. No ants in your pantry. Just peace of mind. That''s what we do. We treat your entire yard, inside and out, every quarter. And if anything comes back, we come back for free."

**Solar:**
> "Now imagine this: Your electric bill locked in for 25 years. No more rate hikes. No more surprises. You''re generating your own power, so you''re protected from outages. And after it''s paid off, your electricity is free. That''s not just savings - that''s security."

**Internet:**
> "Now imagine this: Your whole family streaming, gaming, and working from home at the same time. No buffering. No lag. Just smooth, fast internet. We guarantee the speeds we advertise, or we refund the difference. That''s not just internet - that''s reliability."

**Using Their Environment:**

**Pest Control:**
> "See those ants by your foundation? They''re using that crack to get into your walls right now. And those wasps by your eaves? That''s where they build nests - right where your kids play. We treat all of that, 30 feet into your yard."

**Solar:**
> "See that meter? Every month it spins, that''s money going out. With solar, that meter spins backward. You''re generating power instead of buying it. That''s money coming back to you."

**Internet:**
> "See that router? When everyone''s home streaming at once, that''s when you notice the lag. With our speeds, everyone can stream, game, and work at the same time without anyone lagging."',
    updated_at = NOW()
WHERE slug = 'painting-the-picture';

-- Module: The Transition - Add Sample Scripts
UPDATE learning_modules
SET content = content || '

---

## Sample Transition Scripts

**Natural Transitions:**

**After Icebreaker:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Actually, since I''m here, let me show you something quick."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You know what, I''ve got something that might help with that."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "That''s exactly why I''m in your neighborhood."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Since you mentioned that, let me show you something."

**Moving Them Outside:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Mind if I show you something out here real quick?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Can you step outside for just a second? I want to show you something."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Let me show you something about your [yard/roof/house]."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I noticed something - mind if I point it out?"

**Moving Them Inside:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Can I step in for just a second? I want to show you something."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Mind if I come in? This will just take 30 seconds."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ve got something to show you - can I step inside?"

**Setting Up the Pitch:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ve got something that might help with that - want to see?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Since you mentioned [problem], let me show you how we handle it."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "That''s exactly what we solve - mind if I show you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I think I''ve got something you''ll like - want to take a look?"

**Industry-Specific Transitions:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Since you mentioned bugs, let me show you what we do."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "That''s exactly what we solve - mind if I show you our treatment?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ve got something that might help - want to see how we treat that?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Since you mentioned your electric bill, let me show you something."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "That''s exactly what solar solves - mind if I show you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ve got something that could help with that - want to see?"

**Internet:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Since you mentioned lag, let me show you what we offer."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "That''s exactly what we fix - mind if I show you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ve got something that might help - want to see our speeds?"

**Security:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Since you mentioned security, let me show you what we do."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "That''s exactly what we solve - mind if I show you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ve got something that might help - want to see our system?"',
    updated_at = NOW()
WHERE slug = 'transition';

-- Module: Soft Closes vs Hard Closes - Add Sample Scripts
UPDATE learning_modules
SET content = content || '

---

## Sample Scripts

**Soft Closes:**

**Testing Interest:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Does this sound like something that would help you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Would this solve the problem you mentioned?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Is this something you''d be interested in?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Does this make sense so far?"

**Creating Urgency:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Should I check if we have availability in your area?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Want me to see if we can get you set up?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Should I check what we can do for you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Want me to run the numbers for you?"

**Building Momentum:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "This sounds like it would help, right?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You''d be interested in this, wouldn''t you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "This solves your problem, doesn''t it?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You want this, right?"

**Hard Closes:**

**Collecting Information:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "What''s the best email for you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "What''s a good phone number?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "What''s the best name for the account?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Are you using a credit or debit card today?"

**Assuming the Sale:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Perfect - let me get your information."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Great - what''s your email?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Awesome - let''s get you set up."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Perfect - let me check availability."

**Industry-Specific Closes:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Does this sound like something that would help keep bugs away?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Want me to check what we can do for your home?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Perfect - what''s the best email for you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Great - when can we get started?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Does this sound like something that would save you money?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Want me to run the numbers for you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Perfect - what''s your email?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Great - let''s get you set up."

**Internet:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Does this sound like something that would fix your lag?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Want me to check what speeds we can get you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Perfect - what''s your email?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Great - let''s get you connected."',
    updated_at = NOW()
WHERE slug = 'soft-vs-hard';

-- Module: Types of Soft Closes - Add More Creative Lines
UPDATE learning_modules
SET content = content || '

---

## Creative Closing Lines

**Urgency Close Examples:**

**Time-Based:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m only in your neighborhood today - after this, we move to the next area."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "The trucks are already here - if we can get you set up today, we can start tomorrow."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "We''ve got a group discount that ends tonight - want me to check if you qualify?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m doing a few houses in your area today - want me to add you to the list?"

**Opportunity-Based:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "This is the best time to get started because [reason]."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "We''ve got availability this week - want me to check?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "The installation schedule fills up fast - want me to see what''s available?"

**Bandwagon Close Examples:**

**Neighbor References:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I just finished up at the Johnson''s place down the street - want me to add you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Most of your neighbors went with the full package - want to see what they got?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m working with a few neighbors on a group discount - want in?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Your neighbor Susan just signed up - want me to show you what she got?"

**Social Proof:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "A lot of people in your area are switching to this."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "This is what most homeowners in your neighborhood are choosing."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Your neighbors are loving this - want to see why?"

**Option Close Examples:**

**Installation Options:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Do you want me to start in the front or back?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Does morning or afternoon work better for the install?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Would you like my guy to park out front or in the driveway?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Do you want the full package or just the basics?"

**Service Options:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Do you want quarterly or monthly service?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Would you prefer the standard or premium package?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Do you want same-day service or can we schedule it?"

**Responsibility Close Examples:**

**Practical Tasks:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Can you make sure the dog is put away when my tech arrives?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Can you leave the gate unlocked for us?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Can you make sure someone''s home when we come?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Can you clear the area around [location]?"

**Sincerity Close Examples:**

**Relationship-Based:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Let me prove to you that you''re going to love this. Give me an honest try."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I know you''re going to love me - just give me a shot."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I believe in this so much, I''ll personally make sure you''re happy."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Trust me on this one - you won''t regret it."',
    updated_at = NOW()
WHERE slug = 'soft-close-types';

-- Module: Assumptive Language - Add Sample Scripts
UPDATE learning_modules
SET content = content || '

---

## Sample Scripts

**Assumptive Language Throughout the Pitch:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When my guy comes out, he''s going to start with your yard."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You''re going to love what we do with your foundation."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "After the first treatment, you''ll notice a difference within 48 hours."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we get you set up, you won''t have to think about bugs again."

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we install your system, you''ll start saving immediately."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You''re going to love watching your meter spin backward."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "After installation, your electric bill will drop significantly."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we get you set up, you''ll be protected from rate hikes."

**Internet:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we get you connected, you''ll notice the difference immediately."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You''re going to love the speeds we can get you."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "After we install, no more buffering during movie night."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we get you set up, your whole family can stream at once."

**Pairing with Soft Closes:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we get you on the schedule, does morning or afternoon work better?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When my guy comes out, do you want him to start in the front or back?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we set you up, do you want quarterly or monthly service?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we install your system, do you want panels on the front or back?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we get you set up, do you want to finance or pay cash?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we schedule installation, does next week or the week after work better?"

**Internet:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we get you connected, do you want installation this week or next?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we set you up, do you want the standard or premium speeds?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "When we install, do you want us to run the cable underground or overhead?"

**Avoiding Conditional Language:**

**Instead of "If you decide":**
- ❌ | **Rep:** "If you decide to go with us..."
- ✅ | **Rep:** "When we get you set up..."

**Instead of "Should you choose":**
- ❌ | **Rep:** "Should you choose our service..."
- ✅ | **Rep:** "Once we install your system..."

**Instead of "Would you like":**
- ❌ | **Rep:** "Would you like to get started?"
- ✅ | **Rep:** "When we get you started..."',
    updated_at = NOW()
WHERE slug = 'assumptive-language';

-- Module: The Hard Close Sequence - Add Sample Scripts
UPDATE learning_modules
SET content = content || '

## Complete Hard Close Sequence

**Full Sequence Example:**

> **Rep:** "Perfect. What''s the best name for the account?"
> **Homeowner:** "John Smith."
> **Rep:** "Great. And what''s a good phone number for you?"
> **Homeowner:** "555-1234."
> **Rep:** "Perfect. Email?"
> **Homeowner:** "john@email.com."
> **Rep:** "Got it. This address here, right?"
> **Homeowner:** "Yes."
> **Rep:** "Perfect. Anything specific I should note for the tech?"
> **Homeowner:** "Just make sure the dog is put away."
> **Rep:** "Got it. Are you using a credit or debit card today?"
> **Homeowner:** "Credit card."
> **Rep:** "Perfect. You''re all set. My tech will be out [date]. You''re going to love it."

**Variations:**

**Fast Sequence (High Engagement):**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Perfect. Name?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Phone?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Email?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Address confirmed?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Card?"

**Detailed Sequence (Need More Reassurance):**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Perfect. Let me get your information. What''s the best name for the account?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Great. And what''s a good phone number where I can reach you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Perfect. What''s your email address?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Got it. And this address here is correct, right?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Perfect. Is there anything specific I should tell my tech when they come out?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Great. And are you using a credit or debit card today?"

**Handling Hesitation:**

**If They Hesitate on Name:**
> **Rep:** "I understand you want to think about it. Let me ask - if the price and service were perfect, would you move forward?"
> **Homeowner:** "Yeah, probably."
> **Rep:** "Perfect. Let me get your information and we can get started."

**If They Hesitate on Payment:**
> **Rep:** "I understand. Here''s the thing - we can get you set up today, or we can wait. But the price and availability might change. Want me to check what we can do right now?"
> **Homeowner:** "Okay."
> **Rep:** "Perfect. What''s your email?"

**After Payment Confirmation:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You''re all set. My tech will be out [date]. You''re going to love it."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Perfect. You''re scheduled for [date]. You''re going to be so happy with this."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Awesome. You''re all set. We''ll see you on [date]."',
    updated_at = NOW()
WHERE slug = 'hard-close-sequence';

-- Module: Reading and Adjusting - Add Sample Scripts
UPDATE learning_modules
SET content = content || '

## Sample Scripts for Different Situations

**High Engagement (Leaning In, Asking Questions):**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You''re asking great questions. Let me show you exactly how we handle that."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I can tell you''re interested. Let me show you what we can do for your home."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem really engaged. Want me to show you our full treatment process?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You''re asking all the right questions. Let me show you the numbers."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I can tell you''re interested. Let me show you exactly how this works."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem really engaged. Want me to show you the full system?"

**Low Engagement (Looking Away, Checking Phone):**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I can see you''re busy. Let me just show you one quick thing."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I know I''m taking your time. One more minute?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Quick question - what''s your biggest concern with pests?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I can see you''re busy. Let me make this quick - 30 seconds?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I know you''re probably busy. One quick question?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "What matters most to you - saving money or protecting from outages?"

**Rushed Customer:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I know you''re busy. Quick question - are you dealing with bugs?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ll make this fast. Are you interested in pest control?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "30 seconds - want me to show you what we do?"

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I know you''re busy. Quick question - what are you paying for electricity?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''ll make this fast. Are you interested in solar?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "30 seconds - want me to show you the numbers?"

**Curious Customer:**

**Pest Control:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Great question. Let me show you exactly how we handle that."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m glad you asked. Let me walk you through it."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "That''s a great point. Here''s how we solve that."

**Solar:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Great question. Let me show you exactly how this works."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I''m glad you asked. Let me break down the numbers."
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "That''s a great point. Here''s how we handle that."

**Gut Check Questions:**

**Mid-Pitch:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Does that make sense so far?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "What questions do you have?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "What matters most to you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "What''s your biggest concern?"

**Pivoting Topics:**

**If They Don''t Care About Price:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I get it - price isn''t everything. What matters more to you - safety or convenience?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Price is important, but what about peace of mind?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Let me ask - what''s more important to you, saving money or protecting your family?"

**If They Don''t Care About Features:**
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Features are great, but what about results?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "Let me ask - what matters more to you, how it works or what it does for you?"
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I get it - features aren''t everything. What about convenience?"',
    updated_at = NOW()
WHERE slug = 'reading-adjusting';

-- Module: Mirroring - Get Into Their World - Add Sample Scripts
UPDATE learning_modules
SET content = content || '

## Sample Scripts for Different Energy Levels

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
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "You seem skeptical. That''s fair. Let me prove this works."

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
<span style="color: #a855f7; font-weight: bold;">|</span> **Rep:** "I love your attitude! Let me show you the system."',
    updated_at = NOW()
WHERE slug = 'mirroring';

COMMIT;

