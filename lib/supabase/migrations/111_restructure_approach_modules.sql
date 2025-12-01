-- Restructure approach modules with proper headings
-- Generated: 2025-12-01
-- This migration restructures approach modules with accurate headings based on content analysis

BEGIN;

-- Module: Positioning Yourself (Literally)
UPDATE learning_modules
SET content = '''**Estimated read: 2 minutes**

## Why This Matters

Your body position before they even open the door determines whether they''ll listen or slam it shut. Most reps don''t think about positioning-they just stand there and hope for the best. Top reps know that positioning is psychology, and psychology wins sales.

## The Mistake Most Reps Make

They stand straight-on to the door, hands in pockets, looking desperate. Straight-on feels like a confrontation. It''s aggressive. Standing there waiting makes you look like you have nowhere else to be. That screams "desperate" and "amateur." Homeowners can sense desperation from 10 feet away, and desperate reps get doors slammed.

## The Framework

Stand at a 45-degree angle to the door, never straight-on. The angle says "I''m here, but I''m not invading your space." It''s subtle psychology, but it works. When you''re angled, you look less threatening. You look like someone who''s passing through, not someone who''s about to launch into a sales pitch.

Lean slightly away from the door, like you''re about to leave. This signals you''re not desperate. Desperate reps lean in, hands on the doorframe, looking like they''re trying to force their way in. Confident reps lean back. They look like they have somewhere else to be. That makes homeowners curious-why isn''t this person desperate?

Look busy while you wait. Check your phone. Glance at your clipboard. Shift your weight. You want them to think you''re doing something important, not waiting for them. When they see you looking busy, they think "This person has a purpose." When they see you just standing there, they think "This person is here to waste my time."

What NOT to do: Standing straight-on makes you look confrontational. Hands in pockets makes you look unprofessional. Slouching makes you look lazy. Leaning against the doorframe makes you look like you''re trying to block them from closing the door. All of these scream "amateur" and "desperate."

Your body language should scream "I''m not desperate." Desperate reps get doors slammed. Confident reps get conversations. The difference is often just a few inches of positioning and the angle of your shoulders.

Practice your stance before you knock. Stand at the angle. Lean back slightly. Hold your materials naturally. Look busy. When you knock, step back half a step. Give them space. Let them come to you, even if it''s just opening the door wider.''',
    updated_at = NOW()
WHERE slug = 'positioning';

-- Module: The Pattern Interrupt
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

They expect you to start selling immediately. That''s exactly why you shouldn''t. Homeowners have a script running in their head the moment they see you: "Here comes another salesperson. They''re going to tell me about their product. I''m going to say no. They''re going to push. I''m going to get annoyed and shut the door." You need to interrupt that script in the first 30 seconds, or you''re just playing your part in their predictable story.

## The Mistake Most Reps Make

They start selling immediately. They mention their company name, their product, what they''re selling-all in the first 30 seconds. That''s exactly what homeowners expect, and that''s exactly why they shut the door. When you lead with your company name, their defenses go up. They''ve already decided to say no before you''ve even started.

## The Framework

Don''t mention your product in the first 30 seconds. Don''t mention your company. Don''t mention what you''re selling. Instead, acknowledge their skepticism upfront. Say something like "I know you weren''t expecting me, and I''m not here to waste your time." Or "Quick question-are you the homeowner?" Simple, direct, non-threatening. You''re not selling yet. You''re just asking.

The "Quick question" framework works because questions require answers. When you ask a question, they have to engage. When you make a statement, they can ignore you. Questions create a moment of curiosity. Statements create a moment of resistance.

Your goal is to get them to see you as human, not a threat. Once they see you as human, they''ll listen. Until then, you''re just noise. The fastest way to become human is to acknowledge what they''re probably thinking. "I know this is unexpected." "I know you''re probably busy." "I know you get a lot of people knocking on your door." When you acknowledge their reality, you stop being a threat and start being a person.

Notice the pattern? You''re not selling. You''re asking. You''re gathering information. You''re positioning yourself as someone doing research or helping neighbors. That''s not threatening-that''s interesting. When you flip their script, you create space for a real conversation instead of a sales pitch they''re already prepared to reject.

## Example Scripts

**Pest Control:**
> **Rep:** "Quick question-have you noticed more bugs this season?"

**Solar:**
> **Rep:** "What''s your average electric bill?"

**Internet:**
> **Rep:** "Are you getting the speeds you''re paying for?"

**Security:**
> **Rep:** "Do you have a security system?"

**Roofing:**
> **Rep:** "Did you get any damage from that last storm?"

Each of these interrupts their expected script and creates curiosity instead of resistance.''',
    updated_at = NOW()
WHERE slug = 'pattern-interrupt';

-- Module: Reading the Signs
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Before you knock, read the house. It''s telling you everything you need to know. Most reps knock blindly, hoping someone''s home. Top reps read the signs first, then decide whether to knock. This simple skill saves time, increases confidence, and improves your approach quality.

## The Mistake Most Reps Make

They knock on every door without reading the signs. They waste time on empty houses. They annoy people who aren''t even there. They approach houses at the wrong time. They miss opportunities because they don''t know what to look for. Reading the signs before you knock is free intelligence-use it.

## The Framework

Signs of life are your best friend. Cars in the driveway? Good sign-they''re home. Multiple cars? Even better-more decision makers present. Lights on inside? They''re definitely there. Toys scattered in the yard? They''re home and probably busy with kids-perfect timing for a quick, respectful approach. A/C unit running? Someone''s definitely inside. TV sounds or music? They''re awake and active.

When to knock versus when to skip is simple: if there are signs of life, knock. If there aren''t, skip it. You''re wasting your time knocking on empty houses, and you''re annoying people who aren''t even there. Save your energy for doors that might actually open.

Time of day strategy matters. Early morning? They''re probably rushing-kids to school, work to get to. Keep it brief. Late afternoon? They might be more receptive-workday winding down, less pressure. Evening? Hit or miss. Some people are done with their day and want to relax. Others are just getting started with dinner and family time. Read the situation and adjust your energy accordingly.

Reading the neighborhood tells you what to expect. Nice yards with fresh landscaping? These homeowners care about their property-they might be more receptive to maintenance or improvement services. Neglected yards? They might be struggling financially or just not prioritizing home care-adjust your approach. New construction? They just moved in-perfect timing for security, internet, or other essential services. Older homes? They might need updates or repairs.

Adjust your energy based on what you observe before knocking. See kids'' toys? They''re busy parents-be respectful of their time. See work trucks? They might be contractors or tradespeople-speak their language. See luxury cars? They have money-don''t be afraid to present premium options. See "No Soliciting" signs? Skip it entirely-they''ve made their position clear.

The "re-knock" strategy works: make morning passes for early risers and evening passes for night owls. Some people are home in the morning but not afternoon. Others are home in the evening but not morning. If you see signs of life but no answer, try a different time. Don''t give up after one attempt if the signs suggest they''re there.''',
    updated_at = NOW()
WHERE slug = 'reading-signs';

-- Module: The Icebreaker That Works
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Your opener has one job: get them to stop and listen. Most reps fail here because they lead with their company name instead of curiosity. The icebreaker determines everything that comes after. Get it right, and you create engagement. Get it wrong, and you create resistance.

## The Mistake Most Reps Make

They lead with their company name. "Hi, I''m from [Company]." That''s code for "I''m here to sell you something." The moment you say your company name, their defenses go up. They''ve already decided to say no. Instead, lead with a question or an observation. Make them curious first. Tell them who you are later, after they''re already engaged.

## The Framework

Every icebreaker must do three things: acknowledge their time, establish legitimacy, and create curiosity. Acknowledge their time shows respect. "I know you''re busy" or "This will just take a second" tells them you value what they''re doing. Establish legitimacy makes you credible. "I''m working with a few of your neighbors" or "I''m doing a quick survey in your area" tells them you''re not random. Create curiosity makes them want to know more. "Quick question" or "I noticed something" makes them lean in instead of lean away.

Why questions beat statements every time. Questions require engagement. Statements invite dismissal. When you ask "Have you noticed more bugs this season?" they have to think about it. When you say "I''m here to tell you about our pest control service," they can tune you out. Questions create a moment of connection. Statements create a moment of resistance.

The "neighbor" framework gives you instant credibility. "I just finished up at the Johnson''s place down the street" or "I''m working with a few neighbors on a group discount" makes you local, not random. It makes you legitimate, not suspicious. When you mention neighbors, you''re not a stranger anymore-you''re someone who belongs in their neighborhood.

Adapting to their energy when they open the door is crucial. If they look rushed, match their pace: "Quick question-30 seconds?" If they look relaxed, slow down: "Hey, got a minute? I''m working with some neighbors." If they look annoyed, acknowledge it: "I know this is unexpected, but quick question?" If they look curious, lean in: "I noticed something about your house-mind if I show you?"

The best icebreakers feel like conversations, not sales pitches. They make homeowners want to answer. They make homeowners want to know more. They make homeowners see you as helpful, not pushy.

## Example Scripts

**Pest Control:**
> **Rep:** "Quick question-have you noticed more bugs this season?"

**Solar:**
> **Rep:** "What''s your average electric bill?"

**Internet:**
> **Rep:** "Are you getting the speeds you''re paying for?"

**Security:**
> **Rep:** "Do you have a security system?"

**Roofing:**
> **Rep:** "Did you get any damage from that last storm?"

Each of these opens a conversation instead of starting a pitch.''',
    updated_at = NOW()
WHERE slug = 'icebreaker';

-- Module: What Not to Do
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Sometimes the best advice is knowing what to avoid. These mistakes kill conversations before they start. One bad habit can transform your entire approach-for better or worse. Eliminate these mistakes, and watch your conversations improve dramatically.

## The Mistake Most Reps Make

They make all of these mistakes without realizing it. They lead with their company name. They mention price too early. They list features before building rapport. They apologize for being there. They dress like walking billboards. They predetermine outcomes. They have a "cancer rep" mentality. These mistakes compound, and before they know it, they''re getting doors slammed before they even start.

## The Framework

Don''t lead with "Hi, I''m from [Company]." That''s code for "I''m here to sell you something." The moment you say your company name, their defenses go up. They''ve already decided to say no. Instead, lead with a question or an observation. Make them curious first. Tell them who you are later, after they''re already engaged.

Don''t mention price in the first minute. Price is the last thing they should think about. If you''re talking price before they understand value, you''ve already lost. Build desire first. Make them want what you''re offering. Then price becomes a detail, not a dealbreaker. When you lead with price, you''re competing on cost. When you lead with value, you''re competing on results.

Don''t list features before building rapport. Features are boring when they don''t know you. Benefits are compelling when they trust you. Build trust first. Show them you understand their situation. Then your features become relevant. Until then, you''re just listing things they don''t care about.

Don''t apologize for being there. "Sorry to bother you" or "I know you''re busy" sounds weak. Confidence, not apology. You''re there to help them. You''re there to solve a problem. You''re not bothering them-you''re serving them. When you apologize, you''re telling them they should feel annoyed. When you''re confident, you''re telling them they should feel curious.

Don''t dress like a walking billboard. If you''re wearing a company polo covered in logos and carrying a clipboard with brochures, you look like every other rep they''ve ignored. Dress like a professional, not a salesman. Look like someone they''d want to talk to, not someone they''d want to avoid. Your appearance should say "I''m here to help," not "I''m here to sell."

Don''t predetermine outcomes based on house appearance. Nice house doesn''t mean they''ll buy. Modest house doesn''t mean they won''t. Every door is a new opportunity. Don''t skip houses because they look "too nice" or "too poor." You don''t know their situation. You don''t know their needs. Knock every door with signs of life and let them decide.

The "cancer rep" mentality kills momentum. That''s the rep who complains about everything: "This neighborhood is terrible." "Nobody''s buying today." "These people are cheap." Negativity is contagious. When you''re negative, you attract negative results. When you''re positive, you attract positive results. Your mindset determines your outcomes.''',
    updated_at = NOW()
WHERE slug = 'what-not-to-do';

-- Module: The Transition
UPDATE learning_modules
SET content = '''**Estimated read: 2 minutes**

## Why This Matters

The moment between icebreaker and pitch is where most reps lose momentum. Master this transition, and you''ll close more deals. The transition is the bridge between curiosity and interest. Get it right, and they want to hear more. Get it wrong, and they want you to leave.

## The Mistake Most Reps Make

They stumble through the transition. They don''t know when to shift from icebreaker to pitch. They use forced, salesy language that feels scripted. They don''t read engagement levels. They let the conversation die. They stay in the doorframe instead of moving them. The transition feels awkward, and awkward transitions kill momentum.

## The Framework

When to shift from icebreaker to pitch depends entirely on reading their engagement. Are they asking questions? That''s high engagement-they''re curious. Are they nodding along? That''s medium engagement-they''re listening. Are they checking their phone or looking away? That''s low engagement-keep it brief or wrap it up. The best transition happens when they''re leaning in, not leaning away.

Transition phrases that work sound natural, not salesy. "Actually, since I''m here, let me show you something quick." "You know what, I''ve got something that might help with that." "That''s exactly why I''m in your neighborhood." Each of these connects your icebreaker to your pitch without feeling forced. They flow. They make sense. They create curiosity instead of resistance.

The power of the word "quick" cannot be overstated. Nobody has time for a 30-minute pitch. But everyone has time for "quick." When you say "quick," you''re telling them this won''t take long. You''re respecting their time. You''re making it easy to say yes. "Quick question" gets doors open. "Quick look" gets them to step outside. "Quick demo" gets them to see your product. "Quick" removes the pressure and creates permission.

Keeping the door open literally and figuratively matters. Literally: don''t let them close it. If they start to close it, you''ve lost. Keep them engaged. Keep them curious. Keep them talking. Figuratively: don''t let the conversation die. If there''s a pause, fill it with a question. If they look disengaged, re-engage with curiosity. The moment the door closes-literally or figuratively-you''re done.

Moving them away from the doorframe changes everything. When they''re in the doorframe, they''re in defensive position. They can close the door easily. They can end the conversation quickly. When you get them to step outside or invite you in, they''re committed. They''ve invested. They''re engaged. "Mind if I show you something out here?" or "Can I step in for just a second?" gets them moving, and movement creates momentum.

Setting up the pitch without feeling salesy is an art. You''re not "transitioning to the pitch." You''re "showing them something that might help." You''re not "selling them." You''re "solving a problem." Frame it as help, not sales. Frame it as value, not pitch. When you frame it right, they want to see more. When you frame it wrong, they want to see less.

The best transitions feel like natural progressions, not forced sales moves. They flow from curiosity to interest to desire. Master the transition, and you''ll master the approach.''',
    updated_at = NOW()
WHERE slug = 'transition';

COMMIT;

