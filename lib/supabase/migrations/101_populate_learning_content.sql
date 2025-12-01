-- Insert Learning Modules
BEGIN;

-- Module: Positioning Yourself (Literally)
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Positioning Yourself (Literally)',
  'positioning',
  'approach',
  1,
  2,
  '# Positioning Yourself (Literally)
**Estimated read: 2 minutes**

Your body position before they even open the door determines whether they''ll listen or slam it shut.

Stand at a 45-degree angle to the door, never straight-on. Straight-on feels like a confrontation. It''s aggressive. The angle says "I''m here, but I''m not invading your space." It''s subtle psychology, but it works. When you''re angled, you look less threatening. You look like someone who''s passing through, not someone who''s about to launch into a sales pitch.

Lean slightly away from the door, like you''re about to leave. This signals you''re not desperate. Desperate reps lean in, hands on the doorframe, looking like they''re trying to force their way in. Confident reps lean back. They look like they have somewhere else to be. That makes homeowners curious—why isn''t this person desperate?

Look busy while you wait. Check your phone. Glance at your clipboard. Shift your weight. You want them to think you''re doing something important, not waiting for them. When they see you looking busy, they think "This person has a purpose." When they see you just standing there, they think "This person is here to waste my time."

What NOT to do: Standing straight-on makes you look confrontational. Hands in pockets makes you look unprofessional. Slouching makes you look lazy. Leaning against the doorframe makes you look like you''re trying to block them from closing the door. All of these scream "amateur" and "desperate."

Your body language should scream "I''m not desperate." Desperate reps get doors slammed. Confident reps get conversations. The difference is often just a few inches of positioning and the angle of your shoulders.

Practice your stance before you knock. Stand at the angle. Lean back slightly. Hold your materials naturally. Look busy. When you knock, step back half a step. Give them space. Let them come to you, even if it''s just opening the door wider.

---

**Try This Today**

On every door today, position yourself at a 45-degree angle and lean slightly away. Notice how many more doors open wider and how many more people actually step out to talk to you. One physical adjustment, massive difference in results.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: The Pattern Interrupt
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'The Pattern Interrupt',
  'pattern-interrupt',
  'approach',
  2,
  3,
  '# The Pattern Interrupt
**Estimated read: 3 minutes**

They expect you to start selling immediately. That''s exactly why you shouldn''t.

Homeowners have a script running in their head the moment they see you: "Here comes another salesperson. They''re going to tell me about their product. I''m going to say no. They''re going to push. I''m going to get annoyed and shut the door." You need to interrupt that script in the first 30 seconds, or you''re just playing your part in their predictable story.

Don''t mention your product in the first 30 seconds. Don''t mention your company. Don''t mention what you''re selling. Instead, acknowledge their skepticism upfront. Say something like "I know you weren''t expecting me, and I''m not here to waste your time." Or "Quick question—are you the homeowner?" Simple, direct, non-threatening. You''re not selling yet. You''re just asking.

The "Quick question" framework works because questions require answers. When you ask a question, they have to engage. When you make a statement, they can ignore you. Questions create a moment of curiosity. Statements create a moment of resistance.

Your goal is to get them to see you as human, not a threat. Once they see you as human, they''ll listen. Until then, you''re just noise. The fastest way to become human is to acknowledge what they''re probably thinking. "I know this is unexpected." "I know you''re probably busy." "I know you get a lot of people knocking on your door." When you acknowledge their reality, you stop being a threat and start being a person.

This works across every industry. Pest control reps can start with "Quick question—have you noticed more bugs this season?" Solar reps can ask "What''s your average electric bill?" Internet reps can say "Are you getting the speeds you''re paying for?" Security reps can ask "Do you have a security system?" Roofing reps can mention "Did you get any damage from that last storm?"

Notice the pattern? You''re not selling. You''re asking. You''re gathering information. You''re positioning yourself as someone doing research or helping neighbors. That''s not threatening—that''s interesting. When you flip their script, you create space for a real conversation instead of a sales pitch they''re already prepared to reject.

---

**Try This Today**

Test this specific opening on your next 10 doors: "Quick question—are you the homeowner?" Then wait. Don''t follow up with your pitch. Just wait for their answer. Notice how many more people actually engage versus when you lead with your company name. The difference will shock you.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Reading the Signs
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Reading the Signs',
  'reading-signs',
  'approach',
  3,
  3,
  '# Reading the Signs
**Estimated read: 3 minutes**

Before you knock, read the house. It''s telling you everything you need to know.

Signs of life are your best friend. Cars in the driveway? Good sign—they''re home. Multiple cars? Even better—more decision makers present. Lights on inside? They''re definitely there. Toys scattered in the yard? They''re home and probably busy with kids—perfect timing for a quick, respectful approach. A/C unit running? Someone''s definitely inside. TV sounds or music? They''re awake and active.

When to knock versus when to skip is simple: if there are signs of life, knock. If there aren''t, skip it. You''re wasting your time knocking on empty houses, and you''re annoying people who aren''t even there. Save your energy for doors that might actually open.

Time of day strategy matters. Early morning? They''re probably rushing—kids to school, work to get to. Keep it brief. Late afternoon? They might be more receptive—workday winding down, less pressure. Evening? Hit or miss. Some people are done with their day and want to relax. Others are just getting started with dinner and family time. Read the situation and adjust your energy accordingly.

Reading the neighborhood tells you what to expect. Nice yards with fresh landscaping? These homeowners care about their property—they might be more receptive to maintenance or improvement services. Neglected yards? They might be struggling financially or just not prioritizing home care—adjust your approach. New construction? They just moved in—perfect timing for security, internet, or other essential services. Older homes? They might need updates or repairs.

Adjust your energy based on what you observe before knocking. See kids'' toys? They''re busy parents—be respectful of their time. See work trucks? They might be contractors or tradespeople—speak their language. See luxury cars? They have money—don''t be afraid to present premium options. See "No Soliciting" signs? Skip it entirely—they''ve made their position clear.

The "re-knock" strategy works: make morning passes for early risers and evening passes for night owls. Some people are home in the morning but not afternoon. Others are home in the evening but not morning. If you see signs of life but no answer, try a different time. Don''t give up after one attempt if the signs suggest they''re there.

---

**Try This Today**

Before every knock today, identify two signs of life. Write them down. Then notice how your confidence changes when you know someone''s actually home versus when you''re just hoping. This simple observation will dramatically improve your approach quality.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: The Icebreaker That Works
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'The Icebreaker That Works',
  'icebreaker',
  'approach',
  4,
  3,
  '# The Icebreaker That Works
**Estimated read: 3 minutes**

Your opener has one job: get them to stop and listen. Most reps fail here because they lead with their company name instead of curiosity.

Every icebreaker must do three things: acknowledge their time, establish legitimacy, and create curiosity. Acknowledge their time shows respect. "I know you''re busy" or "This will just take a second" tells them you value what they''re doing. Establish legitimacy makes you credible. "I''m working with a few of your neighbors" or "I''m doing a quick survey in your area" tells them you''re not random. Create curiosity makes them want to know more. "Quick question" or "I noticed something" makes them lean in instead of lean away.

Why questions beat statements every time. Questions require engagement. Statements invite dismissal. When you ask "Have you noticed more bugs this season?" they have to think about it. When you say "I''m here to tell you about our pest control service," they can tune you out. Questions create a moment of connection. Statements create a moment of resistance.

The "neighbor" framework gives you instant credibility. "I just finished up at the Johnson''s place down the street" or "I''m working with a few neighbors on a group discount" makes you local, not random. It makes you legitimate, not suspicious. When you mention neighbors, you''re not a stranger anymore—you''re someone who belongs in their neighborhood.

Industry-specific icebreakers that work: Pest control can ask "Have you noticed more bugs this season?" Solar can ask "What''s your average electric bill?" Internet can ask "Are you getting the speeds you''re paying for?" Security can ask "Do you have a security system?" Roofing can ask "Did you get any damage from that last storm?" Each of these opens a conversation instead of starting a pitch.

Adapting to their energy when they open the door is crucial. If they look rushed, match their pace: "Quick question—30 seconds?" If they look relaxed, slow down: "Hey, got a minute? I''m working with some neighbors." If they look annoyed, acknowledge it: "I know this is unexpected, but quick question?" If they look curious, lean in: "I noticed something about your house—mind if I show you?"

The best icebreakers feel like conversations, not sales pitches. They make homeowners want to answer. They make homeowners want to know more. They make homeowners see you as helpful, not pushy.

---

**Try This Today**

Write three icebreakers for your specific industry. Test them on your next 10 doors. Notice which one gets the most engagement. Then double down on what works. Your icebreaker determines everything that comes after.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: What Not to Do
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'What Not to Do',
  'what-not-to-do',
  'approach',
  5,
  3,
  '# What Not to Do
**Estimated read: 3 minutes**

Sometimes the best advice is knowing what to avoid. These mistakes kill conversations before they start.

Don''t lead with "Hi, I''m from [Company]." That''s code for "I''m here to sell you something." The moment you say your company name, their defenses go up. They''ve already decided to say no. Instead, lead with a question or an observation. Make them curious first. Tell them who you are later, after they''re already engaged.

Don''t mention price in the first minute. Price is the last thing they should think about. If you''re talking price before they understand value, you''ve already lost. Build desire first. Make them want what you''re offering. Then price becomes a detail, not a dealbreaker. When you lead with price, you''re competing on cost. When you lead with value, you''re competing on results.

Don''t list features before building rapport. Features are boring when they don''t know you. Benefits are compelling when they trust you. Build trust first. Show them you understand their situation. Then your features become relevant. Until then, you''re just listing things they don''t care about.

Don''t apologize for being there. "Sorry to bother you" or "I know you''re busy" sounds weak. Confidence, not apology. You''re there to help them. You''re there to solve a problem. You''re not bothering them—you''re serving them. When you apologize, you''re telling them they should feel annoyed. When you''re confident, you''re telling them they should feel curious.

Don''t dress like a walking billboard. If you''re wearing a company polo covered in logos and carrying a clipboard with brochures, you look like every other rep they''ve ignored. Dress like a professional, not a salesman. Look like someone they''d want to talk to, not someone they''d want to avoid. Your appearance should say "I''m here to help," not "I''m here to sell."

Don''t predetermine outcomes based on house appearance. Nice house doesn''t mean they''ll buy. Modest house doesn''t mean they won''t. Every door is a new opportunity. Don''t skip houses because they look "too nice" or "too poor." You don''t know their situation. You don''t know their needs. Knock every door with signs of life and let them decide.

The "cancer rep" mentality kills momentum. That''s the rep who complains about everything: "This neighborhood is terrible." "Nobody''s buying today." "These people are cheap." Negativity is contagious. When you''re negative, you attract negative results. When you''re positive, you attract positive results. Your mindset determines your outcomes.

---

**Try This Today**

Identify your number one bad habit from this list. Eliminate it completely for a full day. Notice how your conversations change. One bad habit removed can transform your entire approach.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: The Transition
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'The Transition',
  'transition',
  'approach',
  6,
  2,
  '# The Transition
**Estimated read: 2 minutes**

The moment between icebreaker and pitch is where most reps lose momentum. Master this transition, and you''ll close more deals.

When to shift from icebreaker to pitch depends entirely on reading their engagement. Are they asking questions? That''s high engagement—they''re curious. Are they nodding along? That''s medium engagement—they''re listening. Are they checking their phone or looking away? That''s low engagement—keep it brief or wrap it up. The best transition happens when they''re leaning in, not leaning away.

Transition phrases that work sound natural, not salesy. "Actually, since I''m here, let me show you something quick." "You know what, I''ve got something that might help with that." "That''s exactly why I''m in your neighborhood." Each of these connects your icebreaker to your pitch without feeling forced. They flow. They make sense. They create curiosity instead of resistance.

The power of the word "quick" cannot be overstated. Nobody has time for a 30-minute pitch. But everyone has time for "quick." When you say "quick," you''re telling them this won''t take long. You''re respecting their time. You''re making it easy to say yes. "Quick question" gets doors open. "Quick look" gets them to step outside. "Quick demo" gets them to see your product. "Quick" removes the pressure and creates permission.

Keeping the door open literally and figuratively matters. Literally: don''t let them close it. If they start to close it, you''ve lost. Keep them engaged. Keep them curious. Keep them talking. Figuratively: don''t let the conversation die. If there''s a pause, fill it with a question. If they look disengaged, re-engage with curiosity. The moment the door closes—literally or figuratively—you''re done.

Moving them away from the doorframe changes everything. When they''re in the doorframe, they''re in defensive position. They can close the door easily. They can end the conversation quickly. When you get them to step outside or invite you in, they''re committed. They''ve invested. They''re engaged. "Mind if I show you something out here?" or "Can I step in for just a second?" gets them moving, and movement creates momentum.

Setting up the pitch without feeling salesy is an art. You''re not "transitioning to the pitch." You''re "showing them something that might help." You''re not "selling them." You''re "solving a problem." Frame it as help, not sales. Frame it as value, not pitch. When you frame it right, they want to see more. When you frame it wrong, they want to see less.

The best transitions feel like natural progressions, not forced sales moves. They flow from curiosity to interest to desire. Master the transition, and you''ll master the approach.

---

**Try This Today**

Practice three transition phrases until they feel natural. Say them out loud. Say them in the mirror. Say them until they don''t sound scripted. Then use them on your next 10 doors. Notice how many more people actually engage with your pitch versus when you stumble through the transition.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Building Value Before Price
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Building Value Before Price',
  'value-before-price',
  'pitch',
  8,
  3,
  '# Building Value Before Price
**Estimated read: 3 minutes**

Price is the last thing they should think about. If you''re talking price before they understand value, you''ve already lost.

The golden rule: never mention price until they''re ready to hear it. Price without value feels expensive. Price with value feels like a bargain. Your job is to build so much value that when you finally mention price, they''re surprised it''s so low, not so high.

Why leading with price kills the conversation is simple: price is an objection waiting to happen. When you lead with price, they''re thinking "That''s too much" before they even know what they''re buying. When you lead with value, they''re thinking "I need this" before they even know what it costs. The difference determines whether you close or get rejected.

Value must outweigh cost in their mind before you quote anything. They need to see the problem clearly. They need to understand the solution deeply. They need to feel the benefit emotionally. Only then can they process price rationally. Until then, price is just a number that sounds too high.

How to know when they''re ready: they ask, or they''re leaning in. If they ask about price, they''re engaged. They want to know. That''s your signal. If they''re leaning in, nodding along, asking questions, they''re ready. If they''re looking away, checking their phone, giving one-word answers, they''re not ready. Keep building value.

The "what this does for YOU" framework shifts focus from product to person. Instead of "We offer quarterly treatments," say "You won''t have to think about bugs again." Instead of "We have 24/7 monitoring," say "You can sleep knowing someone''s watching your home." Make it about them, not about you.

Stacking benefits until price feels like a bargain is the goal. One benefit might not justify the cost. Three benefits might. Five benefits definitely will. Keep stacking until they''re thinking "This is worth it" before you even mention price. When you finally do mention price, it should feel like a natural next step, not a shock.

If they ask price too early, don''t panic. Say "Great question—let me show you what''s included first so the price makes sense." Then continue building value. They asked because they''re curious, not because they''re ready to buy. Use their curiosity to build more desire.

The goal: they should be surprised the price is so LOW, not so high. When you''ve built enough value, price becomes a detail, not a dealbreaker. When you haven''t built enough value, price becomes an objection, not an opportunity.

---

**Try This Today**

On your next 5 doors, don''t mention price until they ask or until you''ve named at least 3 benefits. Notice how many more people actually want to know the price versus when you lead with it. The difference will show you the power of value-first selling.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Features vs Benefits
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Features vs Benefits',
  'features-vs-benefits',
  'pitch',
  9,
  3,
  '# Features vs Benefits
**Estimated read: 3 minutes**

Features are what you do. Benefits are why they care. Customers don''t buy features—they buy outcomes.

Every feature needs a "which means..." translation. "We treat 30 feet into your yard" becomes "which means your kids can play outside without getting bit." "We install Tier 1 panels" becomes "which means you''re covered for 25 years with zero maintenance." "Fiber optic connection" becomes "which means no buffering during movie night." "24/7 monitoring" becomes "which means someone''s always watching, even when you''re asleep."

See the pattern? Features are facts. Benefits are feelings. Facts inform. Feelings motivate. You need both, but benefits close deals. Features answer "What is it?" Benefits answer "What''s in it for me?" Always answer the second question first.

Don''t list features like a spec sheet—tell them what it means for their life. When you list features, you sound like you''re reading a brochure. When you explain benefits, you sound like you understand their situation. Guess which one closes more deals?

Match benefits to their specific situation. If they have kids, focus on safety and peace of mind. If they have pets, focus on pet-friendly solutions. If they''re budget-conscious, focus on savings and value. If they''re convenience-focused, focus on set-it-and-forget-it simplicity. One size doesn''t fit all—tailor your benefits to their needs.

Industry examples that work: Pest control can say "We treat 30 feet into your yard, which means your kids can play outside without getting bit." Solar can say "We install Tier 1 panels, which means you''re covered for 25 years with zero maintenance." Internet can say "Fiber optic connection, which means no buffering during movie night." Security can say "24/7 monitoring, which means someone''s always watching, even when you''re asleep."

The translation exercise is simple: take every feature and add "which means..." Then finish the sentence with what it actually does for them. Not what it does technically. What it does emotionally. What it does practically. What it does for their daily life.

When you master features vs benefits, your pitch transforms. Instead of sounding like a product catalog, you sound like a problem solver. Instead of listing specifications, you''re painting pictures of better outcomes. That''s what closes deals.

---

**Try This Today**

Write down your top 5 features and translate each into a benefit statement. Practice saying them out loud. Use "which means" to connect the feature to the benefit. Then use these translations in your next pitch. Notice how much more engaged they become when you''re talking about outcomes instead of specifications.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Painting the Picture
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Painting the Picture',
  'painting-the-picture',
  'pitch',
  10,
  3,
  '# Painting the Picture
**Estimated read: 3 minutes**

Words create images—use them strategically. Make the invisible problem visible, then paint the solution in vivid detail.

Describing the problem vividly before offering the solution creates urgency. Don''t just say "pests are annoying." Paint the picture: "You''re having dinner with your family, and a roach crawls across the table. Your kids are grossed out, your wife''s embarrassed, and you''re frustrated because you thought you''d dealt with this." That''s not annoying—that''s a problem they can feel.

Walk them through the scenario using "Imagine this..." Make it real. Make it visceral. Make it something they can see happening in their own home. When they can visualize the problem, they can feel the need for the solution. When they can''t visualize it, they can''t feel the urgency.

Use their environment to make it concrete. Point to the flower bed: "See those ants by your foundation? They''re using that crack to get into your walls right now." Point to the eaves: "That''s where wasps build nests—right where your kids play." Point to the meter: "Every month that bill comes, that''s money you''ll never see again." Point to the router location: "When everyone''s home streaming at once, that''s when you notice the lag."

Slow hand movements to illustrate what you''re describing. When you point, they look. When they look, they see. When they see, they understand. Don''t just talk—show. Your hands become your visual aids. Use them to guide their attention to what matters.

Get them physically involved. Have them look where you''re pointing. Walk with you around the property. Touch the problem area. When they''re physically engaged, they''re mentally engaged. When they''re just listening, they can tune out. When they''re looking and touching, they''re invested.

Creating urgency through visualization works because it makes abstract problems concrete. "If we don''t treat this now, by July you''ll see..." makes them see the future problem. "Every month that bill comes, that''s money you''ll never see again" makes them feel the ongoing cost. "When everyone''s home streaming at once, that''s when you notice the lag" makes them experience the frustration.

Industry examples that paint pictures: Pest control can say "See those ants by your foundation? They''re using that crack to get into your walls right now." Solar can say "Every month that bill comes, that''s money you''ll never see again." Internet can say "When everyone''s home streaming at once, that''s when you notice the lag." Each of these creates a visual, visceral understanding of the problem.

Make the invisible problem visible. Most problems are hidden until they''re not. Show them what''s happening behind the scenes. Show them what''s coming if they don''t act. Show them what they''re missing by not having your solution. When they can see it, they can feel it. When they can feel it, they can act on it.

---

**Try This Today**

On your next door, physically point to 2 areas of their property while explaining the problem. Notice how much more engaged they become when they''re looking at what you''re describing versus just listening to words. Visual engagement creates mental engagement.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Keep Ammo in Your Pocket
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Keep Ammo in Your Pocket',
  'keep-ammo',
  'pitch',
  11,
  2,
  '# Keep Ammo in Your Pocket
**Estimated read: 2 minutes**

Don''t dump every feature in the first 60 seconds. Information overload kills interest—they stop listening.

You''ve got 20 features. They care about maybe three. Figure out which three matter to them, and focus there. Save the rest for objections. When you list everything upfront, you sound like you''re reading a brochure. When you reveal benefits strategically, you sound like you understand their situation. Guess which one closes more deals?

Hold back value points to use when overcoming objections. If you''ve already mentioned everything, you have nothing left when they push back. If you''ve held back your best differentiators, you can reveal them at the perfect moment. That moment is when they object. That''s when they''re listening hardest. That''s when your ammo matters most.

The "one more thing" technique reveals benefits strategically. After they''ve heard your main pitch, after they''ve processed the initial value, hit them with "Oh, and one more thing..." Then reveal something powerful. A warranty. A guarantee. A bonus feature. Something that makes them think "Wait, this is even better than I thought."

If they''re already sold, stop selling. Don''t keep talking. Don''t add more features. Don''t risk talking them out of it. When they''re ready to buy, close. When they''re not ready, that''s when you use your ammo. Save your best stuff for when you need it most.

Save your best differentiators for when they push back. Price objection? Reveal the warranty. Timing objection? Reveal the limited-time bonus. Comparison objection? Reveal the unique feature competitors don''t have. Your ammo is your secret weapon—don''t waste it on doors that are already open.

Example flow that works: Initial pitch covers 3 key benefits. First objection gets the warranty or guarantee revealed. Second objection gets price flexibility or bonus feature revealed. Close reminds them of the entire stack. Each objection becomes an opportunity to add more value, not defend what you''ve already said.

Think of your pitch like a deck of cards—play them one at a time. Don''t show your whole hand upfront. Show enough to get them interested. Then reveal more as they engage. As they object. As they need more reasons to say yes. Strategic revelation beats information dumping every time.

When you keep ammo in your pocket, you always have something to overcome objections. When you dump everything upfront, you''re defenseless when they push back. Save your best for when it matters most.

---

**Try This Today**

Identify 3 features you always mention early and save ONE for objection handling instead. Notice how much more powerful it feels when you reveal it at the perfect moment versus when you mention it upfront. Strategic timing creates strategic impact.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Reading and Adjusting
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Reading and Adjusting',
  'reading-adjusting',
  'pitch',
  12,
  3,
  '# Reading and Adjusting
**Estimated read: 3 minutes**

Not every customer needs the same pitch. Read their engagement and adjust your delivery accordingly.

Reading body language tells you everything. Arms crossed? They''re defensive—slow down, build more rapport. Leaning in? They''re engaged—go deeper, show more value. Looking away? They''re disengaged—keep it short, hit high points. Checking their phone? They''re distracted—wrap it up or re-engage with a question. Body language doesn''t lie. Read it and respond.

Adjusting depth based on engagement is crucial. High engagement means they''re asking questions, nodding, leaning in. Go deeper. Show more value. Build more desire. Low engagement means they''re checking their phone, looking away, giving one-word answers. Keep it short. Hit the high points. Get to the close faster. Medium engagement means they''re listening but not excited. Find what matters to them. Ask "What''s your biggest concern?" Then tailor your pitch to that specific concern.

Mirroring their energy creates connection. Low energy customer? Match their calm delivery. Don''t be overly enthusiastic—it feels fake and pushy. High energy customer? Match their excitement. Don''t be monotone—it feels boring and disengaged. When you match their energy, you create rapport. When you don''t, you create disconnect.

When to speed up vs slow down depends on their signals. Rushing signals? Speed up. Get to the point. They''re busy. Curious signals? Slow down. Go deeper. They want to know more. Impatient signals? Speed up and close. Engaged signals? Slow down and build value. Read the room and respond.

If they''re not listening, stop talking and ask a question. Don''t keep pitching to someone who''s tuned out. Re-engage them. "Does that make sense so far?" or "What questions do you have?" or "What matters most to you?" Questions require answers. Answers require engagement. Engagement requires listening.

The "gut check" mid-pitch works because it gives you feedback. "Does that make sense so far?" tells you if they''re following. "What questions do you have?" tells you what they care about. "What matters most to you?" tells you what to focus on. Use these checks to adjust your pitch in real-time.

When to pivot topics entirely happens when they don''t care about what you''re saying. They don''t care about price? Pivot to safety. They don''t care about features? Pivot to convenience. They don''t care about savings? Pivot to peace of mind. Find what they care about and talk about that instead.

Upper class vs middle class vs elderly requires different approaches. Upper class wants quality and exclusivity. Middle class wants value and reliability. Elderly wants simplicity and trust. Adjust your language, your examples, your focus. One pitch doesn''t fit all demographics.

---

**Try This Today**

Mid-pitch, pause and ask "What matters most to you?" Then tailor the rest of your pitch to their answer. Notice how much more engaged they become when you''re talking about what they care about versus what you think they should care about. Reading and adjusting closes more deals than rigid pitching.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Overcoming Objections: The R.A.C. Framework
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Overcoming Objections: The R.A.C. Framework',
  'overcome',
  'overcome',
  13,
  3,
  '# Overcoming Objections: The R.A.C. Framework
**Estimated read: 3 minutes**

Objections aren''t "no." They''re "not yet." Most reps hear an objection and panic. Top reps hear an objection and think: "Perfect, now I know what they''re actually thinking. Let me address this."

## Smokescreens vs Real Objections

First time they say "I need to think about it"? That''s a smokescreen. They''re buying time, not saying no. Second time they say it? Now it''s real. Address it.

Smokescreens are easy to spot: "I need to talk to my spouse," "Let me check my budget," "I''ll call you back." Real objections are specific: "It''s too expensive," "I already have a service," "I don''t trust door-to-door salespeople."

Treat smokescreens like buying signals. They''re interested, they''re just not ready to commit. Treat real objections like opportunities. They''re telling you exactly what''s blocking the sale. Fix that, and you''ve got a deal.

## The R.A.C. Framework

**Resolve, Ace, Close.** Three steps, every objection.

### Resolve: Acknowledge Without Validating

When they say "It''s too expensive," don''t say "Oh, you think it''s expensive?" That repeats their objection and makes it stronger. Instead, say "Of course price matters." You''re acknowledging their concern without agreeing with it.

**Bad:** "Oh, you''re not seeing bugs? That''s great!" (You just validated their reason to say no.)
**Good:** "Of course you want to make sure you''re getting value." (You acknowledged their concern without validating their excuse.)

The word "of course" is powerful. It says "I understand, I''m not surprised, and I''ve got this handled."

### Ace: Tip the Scale

Now give them something that tips the scale in your favor. A feature they didn''t know about. A specific benefit that addresses their concern. A price adjustment or payment plan.

**Price objection:** "Of course price matters. That''s why we offer a payment plan that''s less than what most people spend on coffee each month."

**Already have service:** "Of course you want to stick with what works. That''s why we offer a free comparison—no commitment, just see if we can save you money or give you better service."

**Need to think:** "Of course you want to make the right decision. That''s why I''m here—to answer any questions so you can decide with confidence."

You''re not arguing. You''re adding information that changes their perspective.

### Close: Ask Again

After you''ve resolved and aced, close. Don''t wait for them to bring it up. "So, should we get you set up?" or "Ready to get started?" or "Want me to check availability?"

Most reps stop after resolving. Top reps always close after acing.

## Mirroring Energy

Match their energy before redirecting. If they''re calm, stay calm. If they''re excited, match that excitement. If they''re skeptical, acknowledge the skepticism.

**They''re skeptical:** "I get it—you''ve probably heard this before. Let me show you something different."

**They''re rushed:** "I know you''re busy. Let me make this quick—30 seconds, that''s it."

**They''re friendly:** "I appreciate that! Let me show you something I think you''ll really like."

Mirror first, redirect second. If you redirect without mirroring, you sound like you''re not listening.

## When to Walk Away

Some objections are real dealbreakers. "I''m moving next month" is probably real. "I''m filing for bankruptcy" is definitely real. "My spouse said absolutely not" might be real.

But most objections are excuses. "I need to think about it" is an excuse. "I''ll call you back" is an excuse. "Let me check my budget" is an excuse.

If it''s a real dealbreaker, respect it. "I understand. When would be a better time to follow up?" Get their contact info, set a reminder, move on.

If it''s an excuse, push through. Use R.A.C. and close again.

## Never Repeat Their Objection

This is critical: Don''t repeat their objection back to them. If they say "It''s too expensive," don''t say "So you think it''s too expensive?" That just reinforces their objection.

Instead, reframe it. "So price is a concern?" or "So you want to make sure you''re getting value?" You''re addressing the same concern, but you''re framing it in a way that''s easier to overcome.

## Examples Across Industries

**Pest Control:** "I already have a service."
**Resolve:** "Of course you want to stick with what works."
**Ace:** "That''s why I''m offering a free comparison—no commitment, just see if we can do better."
**Close:** "Want me to show you what we offer?"

**Solar:** "I can''t afford it."
**Resolve:** "Of course affordability matters."
**Ace:** "That''s why we offer zero down and payments that are less than your current electric bill."
**Close:** "Want me to run the numbers for you?"

**Internet:** "I''m happy with what I have."
**Resolve:** "Of course you want to stick with what works."
**Ace:** "That''s why I''m just asking—are you getting the speeds you''re paying for? If you are, great. If not, I can help."
**Close:** "Want me to check your speeds real quick?"

---

**Try This Today**

Next time you hear an objection, don''t repeat it. Instead, acknowledge it with "Of course," then add one piece of information that addresses their concern, then ask for the close. Practice this three-step process on your next five objections.


',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Soft Closes vs Hard Closes
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Soft Closes vs Hard Closes',
  'soft-vs-hard',
  'close',
  15,
  3,
  '# Soft Closes vs Hard Closes
**Estimated read: 3 minutes**

Soft closes open the door. Hard closes walk through it. You need both, and you need them in the right order.

A soft close is a question or statement that moves them toward commitment without directly asking for the sale. "Does this sound like something that would help you?" "Would you be interested in getting started?" "Should I check availability?" These test the water. Their response tells you if they''re ready.

A hard close is directly collecting agreement information. Name, phone, email, payment. The actual commitment. "What''s the best email for you?" "Are you using a credit or debit card?" These seal the deal. But you never jump straight to a hard close—you earn it with soft closes first.

Soft closes test the water. Their response tells you if they''re ready. If they respond positively to a soft close, transition immediately to hard close. Don''t pause. Don''t celebrate. Don''t ask "So you want to do it?" Just start collecting information. Momentum is everything. When they say yes to a soft close, they''re saying yes to moving forward. Capture that momentum immediately.

If they hesitate, address the concern, then soft close again. Don''t push to hard close when they''re hesitating. That''s when you sound pushy. Address what''s holding them back. Answer their concern. Then soft close again. "I understand you''re worried about cost. Let me show you how this actually saves money. Does that help?" Then soft close: "Should I check availability?"

The soft close is the bridge. The hard close is the destination. You can''t skip the bridge. You can''t stay on the bridge forever. You need to cross it to get where you''re going. Soft closes build momentum. Hard closes capture commitment. Both are necessary. Neither works alone.

Hard close examples that work: "What''s the best email for you?" "Are you using a credit or debit card?" "What''s the best name for the account?" These are assumptive. They assume the sale is happening. They don''t ask permission—they collect information. That''s the difference between soft and hard. Soft asks. Hard assumes.

The sequence is everything. Soft close. Get agreement. Address concerns if needed. Soft close again. Get stronger agreement. Then hard close. Collect information. Don''t rush it. Don''t drag it out. Find the rhythm. Master the flow. Soft to hard, not hard to soft.

---

**Try This Today**

Write down 3 soft closes and 3 hard closes. Practice transitioning between them until it feels natural. Say them out loud. Practice the flow. Soft close, pause, hard close. Make it conversational, not robotic. Speed and confidence matter.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Types of Soft Closes
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Types of Soft Closes',
  'soft-close-types',
  'close',
  16,
  3,
  '# Types of Soft Closes
**Estimated read: 3 minutes**

Different situations need different closes. Master these types and you''ll always have the right tool for the moment.

The Urgency Close creates time pressure without being fake. "This is the best time to get started because..." "I''m only in the neighborhood today." "The trucks are already here." These work because they''re true. You are in the neighborhood today. The trucks are nearby. Frame it as opportunity, not manipulation. Urgency works when they''re on the fence. It helps them decide. But don''t fake urgency. Real urgency is powerful. Fake urgency is transparent.

The Bandwagon Close uses social proof in action. "If I can get you set up with your neighbor Susan, it''ll help me out—how does that sound?" "Most of your neighbors went with the full package." These work because people follow what others do. When they know neighbors are doing it, it feels safer. It feels normal. It feels like the right choice. Bandwagon works when they''re skeptical. It proves you''re legitimate. It proves others trust you.

The Option Close gives them a choice between two yeses. "Do you want me to start in the front or back?" "Does morning or evening work better for the install?" "Would you like my guy to park out front or in the driveway?" These work because they''re not asking if—they''re asking which. When you give them options, they''re choosing between yeses, not yes or no. Option closes work when they''re interested but indecisive. They help them move forward by making small decisions.

The Responsibility Close gives them a small task that assumes the sale. "Can you make sure the dog is put away when my tech arrives?" "Can you leave the gate unlocked for us?" These work because they''re practical. They''re about logistics, not commitment. But by asking them to do something, you''re assuming the sale is happening. Responsibility closes work when they''re close but need a nudge. They make the sale feel real and practical.

The Sincerity Close is your last resort—pull at the relationship. "Let me prove to you that you''re going to love this. Give me an honest try." "I know you''re going to love me—just give me a shot." These work because they''re personal. They''re about trust. They''re about the relationship you''ve built. Sincerity closes work when nothing else has. They''re your Hail Mary. Use them sparingly, but use them when you need them.

Each close type has its moment. Urgency for the fence-sitters. Bandwagon for the skeptics. Option for the indecisive. Responsibility for the almost-there. Sincerity for the relationship-focused. Master them all, and you''ll always have the right close for the right moment.

---

**Try This Today**

Pick 2 soft close types and use each at least 3 times today. Track which gets the best response. Notice which situations call for which closes. Build your intuition for matching close types to customer types.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: The 3-Close Rule
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'The 3-Close Rule',
  'three-close-rule',
  'close',
  17,
  3,
  '# The 3-Close Rule
**Estimated read: 3 minutes**

The rule: Attempt to close at least 3 times before walking away from any door. Most sales happen after the second or third ask—not the first.

Why 3? Because most "no''s" aren''t real no''s. They''re soft no''s. They''re testing you. They''re hesitating. They need reassurance. They need a new angle. The first close is where they test you. They say no to see if you''ll fold. Most reps fold. Don''t be most reps.

The first close: They''re testing you. They say no to see if you''ll fold. If you fold, you''ve confirmed their suspicion that you''re not confident. If you persist, you''ve proven you believe in what you''re selling. The first no is often just a test. Pass the test.

The second close: They''re considering. They need reassurance or a new angle. Address their concern. Show them a different benefit. Give them a new reason to say yes. Then close again. The second close is where hesitation turns into interest. Don''t skip it.

The third close: They''re deciding. This is where deals happen. By the third close, they''ve heard everything. They''ve processed the value. They''ve considered the objections. Now they''re deciding. This is your moment. Make it count.

Walking away after one "no" is leaving money on the table. Most reps do this. They hear one no and they''re done. But one no isn''t a rejection—it''s a hesitation. Address it. Overcome it. Close again. That''s how sales happen.

Each close should come from a different angle or address a new concern. Don''t just ask the same question three times. That''s annoying. First close: test interest. Second close: address concern, then test again. Third close: final push with new angle. Each close builds on the last.

The 3-close rule isn''t about being annoying—it''s about being persistent with purpose. You''re not harassing them. You''re helping them decide. You''re giving them multiple opportunities to say yes. That''s service, not pressure.

Know when to walk: If they''re hostile, rude, or clearly not a buyer—move on. The 3-close rule isn''t about forcing sales. It''s about not giving up too early. But if they''re genuinely not interested after three closes, respect that and move on.

Most "no''s" are soft no''s. They''re not rejecting you—they''re hesitating. Help them through the hesitation. That''s what the 3-close rule does. It gives you three chances to help them decide. Use all three.

---

**Try This Today**

Don''t leave a single door until you''ve closed 3 times. Track how many sales happen on close #2 or #3. You''ll be shocked at how many people say yes after saying no the first time. The 3-close rule works because most people need time to decide.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Assumptive Language
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Assumptive Language',
  'assumptive-language',
  'close',
  18,
  2,
  '# Assumptive Language
**Estimated read: 2 minutes**

Assumptive language: speaking as if the sale is already happening. It shifts their mindset from "Should I?" to "How does this work?"

Instead of "Would you like to..." say "When we get you set up..." Instead of "If you decide to go with us..." say "Once my tech comes out..." The difference is subtle but powerful. One phrase gives them an out. The other assumes forward motion.

Assumptive language shifts their mindset from "Should I?" to "How does this work?" When you speak as if it''s happening, they start thinking about how it works, not whether they want it. That''s the shift that closes deals. They''re no longer deciding if—they''re deciding how.

It''s not trickery—it''s confidence. When you use assumptive language, you''re showing confidence in your product. You''re showing confidence in the value you''ve built. You''re showing confidence that this is the right choice for them. Confidence is contagious. When you''re confident, they become confident.

Use assumptive language throughout the pitch, not just at the close. "When my guy comes out, he''s going to start with the yard." "You''re going to love what we do with your eaves." "After the first service, you''ll notice a difference within 48 hours." These phrases assume the sale from the beginning. They create momentum throughout the conversation.

Examples that work: "When my guy comes out, he''s going to start with the yard." "You''re going to love what we do with your eaves." "After the first service, you''ll notice a difference within 48 hours." Each assumes the sale is happening. Each creates forward momentum. Each makes the close feel natural, not forced.

Pair with soft closes: "When we get you on the schedule, does morning or afternoon work better?" This combines assumptive language with a soft close. It assumes they''re signing up, but gives them a choice in the details. That''s powerful. They''re not deciding if—they''re deciding when.

Assumptive language only works if your tone matches—confident, not arrogant. If you sound pushy, assumptive language sounds manipulative. If you sound confident, assumptive language sounds natural. Your tone determines whether assumptive language builds trust or breaks it.

The goal: make the sale feel inevitable, not forced. When you use assumptive language throughout, the close feels like the natural next step, not a sudden ask. It feels like completing what you started, not starting something new.

---

**Try This Today**

Eliminate "if" from your pitch. Replace every "if you decide" with "when we get you started." Replace every "should you choose" with "once we set you up." Notice how much more momentum you create. Assumptive language makes closing feel natural, not pushy.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: The Hard Close Sequence
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'The Hard Close Sequence',
  'hard-close-sequence',
  'close',
  19,
  3,
  '# The Hard Close Sequence
**Estimated read: 3 minutes**

Once they''ve responded positively to a soft close—go immediately into the hard close. Don''t pause, don''t celebrate, don''t ask "So you want to do it?" Just start collecting info.

The sequence flows naturally, not robotically. You''re filling out information, not interrogating them. Keep it conversational. Keep it moving. Momentum is everything. When they say yes to a soft close, they''re saying yes to moving forward. Capture that momentum immediately.

The sequence: "Perfect. What''s the best name for the account?" Start with name. It''s easy. It''s non-threatening. It gets them talking. Then: "And what''s a good phone number for you?" Continue the flow. Don''t pause between questions. Keep moving. "Email?" Short and direct. They know what you need. "This address here, right?" Confirm the address. Make sure you have it right. "Anything specific I should note for the tech?" This makes them feel involved. It makes the sale feel real. "Are you using a credit or debit card today?" Payment question last. By then, everything else is done and backing out feels harder.

Keep it conversational—you''re filling out info, not interrogating them. Don''t sound like you''re reading from a script. Don''t sound like you''re checking boxes. Sound like you''re helping them get set up. That''s the difference between closing and collecting.

If they hesitate at any point, address it calmly and continue. Don''t panic. Don''t back off. Address the concern. Answer the question. Then continue the sequence. "I understand you''re worried about that. Here''s how we handle it..." Then back to collecting info. Don''t let hesitation derail the momentum.

Payment question last—by then, everything else is done and backing out feels harder. When you''ve collected name, phone, email, address, and notes, they''re invested. They''ve given you information. They''ve committed mentally. The payment question feels like the final step, not the first commitment.

After payment: confirm next steps, thank them, move on confidently. "You''re all set. My tech will be out [date]. You''re going to love it." Don''t linger. Don''t keep selling. Don''t second-guess. Confirm. Thank. Move on. Confidence in the close shows confidence in the sale.

The handoff is crucial: "You''re all set. My tech will be out [date]. You''re going to love it." This confirms everything. It sets expectations. It ends on a positive note. Then move on. Don''t hang around. Don''t keep talking. Close confidently. Leave confidently.

Speed and confidence matter. The faster you move through the sequence, the less time they have to second-guess. The more confident you sound, the more confident they feel. Master the sequence. Practice it until it flows. Then execute it with speed and confidence.

---

**Try This Today**

Practice the hard close sequence out loud 10 times until it flows without thinking. Say it fast. Say it confidently. Make it conversational, not robotic. Then use it on your next door. Speed and confidence matter. The faster you move, the more sales you''ll close.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Mirroring — Get Into Their World
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Mirroring — Get Into Their World',
  'mirroring',
  'communication',
  20,
  3,
  '# Mirroring — Get Into Their World
**Estimated read: 3 minutes**

When you knock, they''re in their world—watching TV, cooking, working, napping. Your knock disrupts that world. Your job is to pull them into yours.

But first, you have to meet them where they are. Mirroring means reflecting their energy, mood, and body language. If they''re low energy and quiet, don''t come in like a game show host. If they''re high energy and chatty, match that enthusiasm. You can''t pull them into your world until you''ve entered theirs.

Physical mirroring works because it creates subconscious rapport. They lean on the doorframe, you lean on the wall. They cross their arms, you relax yours—but don''t mirror negativity. If they''re defensive, neutralize it with open body language. Mirror positive signals. Neutralize negative ones.

Vocal mirroring matches their volume, pace, and tone. Quiet speaker? Lower your voice. Fast talker? Speed up slightly. Serious tone? Match it. Casual tone? Match that too. When you match their vocal patterns, they feel like you "get" them. That feeling creates trust.

Mirroring builds subconscious rapport—they feel like you "get" them without knowing why. It''s not manipulation. It''s connection. When you mirror someone, you''re showing them you understand their state. That understanding creates comfort. That comfort creates conversation.

Once you''ve matched their energy, you can slowly lead them to a more engaged state. Don''t jump from their energy level to yours immediately. Match first. Build rapport. Then gradually elevate. If they''re at a 3, match the 3. Then slowly move to 4, then 5. They''ll follow because they trust you.

The goal: get them out of their world and into a conversation with you. Their world is comfortable. Your conversation is new. Mirroring bridges that gap. It makes the transition feel natural, not forced. It makes them want to engage, not retreat.

When mirroring works, they don''t notice you''re doing it. They just feel comfortable. They just feel understood. They just feel like you''re on the same wavelength. That''s when real conversations happen. That''s when sales close.

---

**Try This Today**

On every door, consciously identify their energy level (1-10) and match it before trying to lead them anywhere. Notice how much easier conversations become when you start where they are instead of where you want them to be.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Eye Contact — Look, Don't Stare
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Eye Contact — Look, Don''t Stare',
  'eye-contact',
  'communication',
  21,
  2,
  '# Eye Contact — Look, Don''t Stare
**Estimated read: 2 minutes**

Good eye contact equals confidence, sincerity, trust. Too much eye contact equals creepy, aggressive, uncomfortable. Too little equals nervous, shady, untrustworthy.

The sweet spot: 3-4 seconds of eye contact, then break naturally. Don''t stare. Don''t avoid. Just connect, then look away with purpose. That purpose matters. Break eye contact with intention—look where you want them to look.

Use your eyes to control the conversation. Glance at the yard, the eaves, the foundation. They''ll follow your gaze. Now you''re guiding the interaction. When you look somewhere, they look there too. Use that to direct their attention to what matters. Point with your eyes, not just your hands.

When making a key point, lock eyes briefly—it adds weight. When you lock eyes during an important statement, it signals "This matters." They''ll pay attention. They''ll remember. Use this strategically. Don''t waste it on small talk. Save it for value statements and closes.

When listening, maintain softer eye contact—show you''re engaged. You don''t need to stare while they''re talking. Softer eye contact shows you''re listening without being intense. Look at them, but don''t lock eyes. That''s for when you''re speaking, not when they''re speaking.

Cultural note: some people are uncomfortable with direct eye contact. Read the situation. If they''re avoiding your eyes, don''t force it. Adjust your approach. Match their comfort level. You can build rapport without constant eye contact. You just need to read the person.

If they won''t look at you, they''re not engaged. Ask a question to pull them back. "Does that make sense?" or "What do you think?" Questions require answers. Answers require engagement. Engagement requires eye contact. Use questions to re-engage when they drift.

Eye contact is a tool, not a rule. Use it strategically. Use it naturally. Use it to build trust and guide attention. But don''t overthink it. Natural eye contact feels right. Forced eye contact feels wrong. Find the balance.

---

**Try This Today**

Practice the 3-4 second rule. Count in your head until it becomes natural. Three seconds of eye contact, then break naturally. Notice how much more comfortable conversations become when you''re not staring or avoiding.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Paraverbals — It's Not What You Say, It's How You Say It
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Paraverbals — It''s Not What You Say, It''s How You Say It',
  'paraverbals',
  'communication',
  22,
  3,
  '# Paraverbals — It''s Not What You Say, It''s How You Say It
**Estimated read: 3 minutes**

Paraverbal equals tone, pitch, pacing, volume—everything except the actual words. The same sentence can mean completely different things based on delivery.

Example: "I didn''t say YOU were stupid" versus "I didn''t say you were STUPID." Same words. Different emphasis. Different meaning. That''s the power of paraverbals. Your words are the script. Your paraverbals are the performance.

Volume matters. Too loud equals aggressive. Too quiet equals nervous. Match the situation. Match their volume, then speak slightly quieter when making important points. People lean in to hear you. Leaning in equals engagement. Use volume strategically.

Pacing matters. Too fast equals anxious, untrustworthy. Too slow equals boring, condescending. Conversational is the goal. Match their pace, then slow down slightly for key points. When you slow down, they pay attention. When you speed up, they feel rushed. Find the rhythm.

Down-toning is crucial. End statements with your voice going DOWN, not up. Up-tone equals question, uncertainty: "We treat the whole yard?" Down-tone equals statement, confidence: "We treat the whole yard." See the difference? One sounds like you''re asking permission. One sounds like you''re stating fact. Down-tone everything.

Pause for emphasis. Silence before a key point makes it land harder. When you pause, they wait. When they wait, they listen. When they listen, they remember. Use pauses strategically. After benefits. Before closes. During transitions. Silence is powerful. Use it.

When nervous, most reps speed up without realizing it. Slow down intentionally. Nervous energy makes you rush. Rushing makes you sound desperate. Desperation kills sales. Breathe. Pause. Slow down. Confidence comes from control. Control your pace.

Record yourself practicing your pitch. Listen for volume, pace, and tone. Adjust. You can''t fix what you can''t hear. Record yourself. Listen critically. What sounds confident? What sounds desperate? What sounds natural? Adjust until it sounds right.

Paraverbals are invisible, but they''re everything. Your words can be perfect, but if your paraverbals are wrong, you''ll lose. Your words can be simple, but if your paraverbals are right, you''ll win. Master the delivery, not just the script.

---

**Try This Today**

Down-tone every sentence in your pitch. Record yourself and listen for any up-tones creeping in. Up-tones sound like questions. Down-tones sound like confidence. Make everything a statement, not a question.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Body Language — What You're Saying Without Words
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Body Language — What You''re Saying Without Words',
  'body-language',
  'communication',
  23,
  3,
  '# Body Language — What You''re Saying Without Words
**Estimated read: 3 minutes**

55% of communication is body language. They''re reading you before you speak. What you''re saying without words matters more than what you''re saying with words.

Positive signals: open posture, relaxed shoulders, natural hand movements, grounded stance. These signal confidence, approachability, trustworthiness. Negative signals: shuffling feet, hands in pockets, crossed arms, looking down, fidgeting. These signal nervousness, defensiveness, untrustworthiness. Your body speaks louder than your mouth.

Slow, deliberate movements equal confidence and control. Fast, jerky movements equal nervousness and desperation. When you move slowly, you look like you have time. When you have time, you look like you''re not desperate. When you''re not desperate, they trust you. Control your movements. Control your image.

Use your hands to illustrate. "We spray three feet up" — show it with your hand. "The treatment covers this area" — point to it. When you use your hands, you''re engaging multiple senses. They see what you''re saying. That makes it real. That makes it memorable. Don''t just talk—show.

Keep your body open. Don''t create barriers between you and the customer. Crossed arms create barriers. Hands in pockets create barriers. Closed posture creates barriers. Open posture invites conversation. Open arms invite trust. Open body language invites sales.

Grounded stance: feet shoulder-width apart, weight evenly distributed. No swaying. No shifting. No fidgeting. When you''re grounded, you look stable. When you look stable, you look trustworthy. When you look trustworthy, they listen. Stand like you belong there.

Head nods work. Nod slightly when making a point. They''ll subconsciously nod back and agree. It''s subtle psychology, but it works. When you nod, they nod. When they nod, they agree. When they agree, they buy. Use nods strategically. Don''t overdo it. Just enough to create agreement.

Smile when the door opens. Smiling is contagious—it disarms them immediately. A smile says "I''m friendly." A smile says "I''m not a threat." A smile says "This will be pleasant." Start with a smile. End with a smile. Smile throughout. It changes everything.

Someone is always watching: neighbors, cameras, people driving by. Your body language is your reputation. Stand tall. Move confidently. Look professional. You''re not just selling to the person at the door. You''re building your reputation with everyone who sees you.

---

**Try This Today**

Eliminate one negative body language habit—hands in pockets, shuffling, looking down. Focus on it for an entire day. Notice how much more confident you feel when your body language matches your message.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Reading Their Body Language
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Reading Their Body Language',
  'reading-body-language',
  'communication',
  24,
  3,
  '# Reading Their Body Language
**Estimated read: 3 minutes**

You''re not just broadcasting—you''re receiving. Watch them closely. Their body language tells you everything you need to know.

Positive signs mean keep going: leaning in, uncrossed arms, nodding along, asking questions, stepping outside the doorframe. These signals say "I''m engaged. I''m interested. Keep talking." When you see these, you''re winning. Speed up toward the close. Build more value. They''re ready.

Negative signs mean adjust immediately: arms crossed, leaning away, looking at their phone, short clipped answers, hand on the door ready to close it. These signals say "I''m not interested. I''m defensive. I want this to end." When you see these, don''t plow ahead. Pause and re-engage.

If you see negative signals, don''t plow ahead—pause and re-engage. Ask a question: "Does that make sense?" or "What''s your biggest concern?" Questions pull them back. Questions require answers. Answers require engagement. When they''re disengaged, questions re-engage them.

Sometimes they''re just distracted, not disinterested. A question pulls them back. They might be thinking about dinner, work, kids. A question brings them back to you. "What do you think about that?" or "Does that sound like something that would help?" These questions re-engage without being pushy.

The door close signal: if their hand goes to the door, you''re losing them. Pivot fast. Don''t keep pitching. Don''t ignore it. Address it immediately. "I can see you''re busy. Let me just show you one quick thing." Or "I know I''m taking your time. One more minute?" When their hand goes to the door, you''re on borrowed time. Use it wisely.

Positive signals equal speed up toward close. Negative signals equal slow down, rebuild rapport. Read the signals. Respond accordingly. Don''t ignore what their body is telling you. Their body doesn''t lie. Their mouth might. Trust the body language.

Trust what their body is telling you more than what their mouth is saying. People say "I''m interested" while crossing their arms. People say "Tell me more" while looking at their phone. The body tells the truth. The mouth tells what they think you want to hear. Read the body. Trust the body.

Reading body language is a skill. Practice it. Every door is practice. Watch for signals. Respond to signals. Adjust based on signals. The better you read them, the better you sell to them. It''s that simple.

---

**Try This Today**

After every door, note one piece of body language you observed and whether you adjusted to it. Did you see crossed arms and address it? Did you see leaning in and close? Build your awareness. Build your response. Build your sales.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Module: Energy Management — Yours and Theirs
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'Energy Management — Yours and Theirs',
  'energy-management',
  'communication',
  25,
  3,
  '# Energy Management — Yours and Theirs
**Estimated read: 3 minutes**

Your energy is contagious—for better or worse. If you''re tired, defeated, or frustrated, they''ll feel it before you say a word. If you''re confident, upbeat, and genuine, they''ll respond to that too.

Reset between doors: don''t carry a bad interaction to the next one. That last door doesn''t matter. This door matters. Every door is a new opportunity. The last door doesn''t exist. Only this door exists. Reset mentally. Reset physically. Reset emotionally.

Physical reset: take a breath, shake it off, roll your shoulders, walk with purpose. Your body affects your mind. When you reset your body, you reset your mind. When you reset your mind, you reset your energy. Don''t carry tension. Don''t carry frustration. Don''t carry defeat. Leave it at the last door.

Mental reset: every door is a new opportunity. The last door doesn''t matter. This door matters. The last rejection doesn''t matter. This conversation matters. The last "no" doesn''t matter. This "yes" matters. Reset your mindset. Reset your expectations. Reset your energy.

Match their energy first, then elevate it slightly. Don''t be Barney the Dinosaur to someone who''s clearly exhausted. Don''t be low-energy with someone who''s excited and chatty. Match where they are, then lead them where you want them to be. That''s energy management.

Your energy should pull them toward a buying state, not push them away. High energy can overwhelm. Low energy can bore. Controlled energy engages. Find the balance. High enough to be engaging. Calm enough to be trustworthy. That''s controlled energy. That''s what closes deals.

The best reps have "controlled energy"—high enough to be engaging, calm enough to be trustworthy. You''re not a cheerleader. You''re not a robot. You''re a professional. Professional energy is confident, not desperate. Professional energy is engaging, not overwhelming. Professional energy closes deals.

End of day energy: the last hour is where reps fade. Push through—that''s where deals hide. When you''re tired, that''s when discipline matters. When you''re fading, that''s when you dig deep. The last hour separates good reps from great reps. Push through. Close strong.

Morning meetings, music, caffeine, movement—find what keeps your energy up and use it. Energy management is personal. What works for you might not work for others. Find your tools. Use them consistently. Your energy is your asset. Manage it like one.

---

**Try This Today**

Between every door, take 3 seconds to physically reset. Shake off the last interaction before you knock. Notice how much better your energy is when you reset versus when you carry the last door with you. Reset. Reset. Reset.

',
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Insert Learning Objections

-- Objection: Price Objection
INSERT INTO learning_objections (name, slug, description, display_order)
VALUES (
  'Price Objection',
  'price',
  '# Price Objection
**Estimated read: 2 minutes**

## Why They Say This

They haven''t seen enough value yet. This isn''t a "them" problem—it''s a "you" problem. You haven''t connected the price to what they actually care about. Price objections are buying signals. They''re interested, they just need to understand why it''s worth it.

## The Mistake Most Reps Make

They defend the price. "It''s actually a great deal!" or "You get what you pay for!" That sounds defensive and makes the price seem high. Never defend. Reframe.

## The Framework

Don''t talk about cost—talk about investment. Break it down to something relatable (per month, per day, per service). Compare it to what they''re already spending or losing. Ask: "Have you ever priced this out before?" That question makes them think about the real cost of not having it.

## Example Scripts

**Solar Example**
> **Homeowner:** "That''s way too expensive."
> **Rep:** "I get it—it''s a big number. Let me ask you this: What are you paying for electricity right now?"
> **Homeowner:** "About $200 a month."
> **Rep:** "So over 25 years, that''s $60,000. This system costs less than that, and after it''s paid off, your electricity is free. Plus, your rate never goes up. Does that make sense?"
> **Homeowner:** "Yeah, I guess so."
> **Rep:** "Want me to show you the numbers?"

**Pest Control Example**
> **Homeowner:** "I can''t afford that."
> **Rep:** "Of course price matters. Quick question—do you buy pest control products from the store?"
> **Homeowner:** "Yeah, sometimes."
> **Rep:** "So you''re probably spending $20-30 every few months on sprays and traps, right? Over a year, that''s $100-150. Our service is about the same, but you get professional-grade treatment, a guarantee, and you never have to think about it. For the same money, you get 10x the coverage. Make sense?"
> **Homeowner:** "I never thought about it that way."
> **Rep:** "Want me to show you what we can do?"

---

**Try This Today**

Next time you hear a price objection, don''t defend. Instead, ask: "What are you currently spending on [related problem/service]?" Then break your price down to a daily or monthly cost and compare. Watch how many more people see the value.


',
  1
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Objection: Switchover Objection
INSERT INTO learning_objections (name, slug, description, display_order)
VALUES (
  'Switchover Objection',
  'switchover',
  '# Switchover Objection
**Estimated read: 2 minutes**

## Why They Say This

This is actually your warmest lead. They already buy this service—they''re not skeptical about whether they need it. They''re just comfortable with what they have. Your job is to make switching feel like an upgrade, not a hassle.

## The Mistake Most Reps Make

They bash the current provider. "Oh, those guys are terrible!" That makes the homeowner defensive. They chose that company—you''re insulting their judgment. Never bash. Elevate.

## The Framework

Equalize first: "I''m sure they do a good job." Then differentiate: "Here''s what we do differently..." Find out how long they''ve been with them—long-term customers often pay more and get less attention. Use assumptive language: "I''m sure you''ve been with them a couple years now, right?" Make switching feel like an upgrade, not a betrayal.

## Example Scripts

**Pest Control Example**
> **Homeowner:** "I already have Terminix."
> **Rep:** "Oh nice—I''m sure they''re doing a good job for you. How long have you been with them?"
> **Homeowner:** "About three years."
> **Rep:** "Got it. So you''re probably paying around $80-100 a month, right? Here''s what we do differently: We do everything they do, plus we offer same-day service calls, a satisfaction guarantee, and we''re local so you can actually talk to the owner if you need to. Same price, better service. Want me to show you what we offer?"
> **Homeowner:** "I guess I could look."
> **Rep:** "Perfect—let me check what we can do for your home."

**Internet Example**
> **Homeowner:** "I''m happy with my current provider."
> **Rep:** "That''s great—I''m glad they''re working for you. Quick question: Are you getting the speeds you''re paying for?"
> **Homeowner:** "I''m not sure, honestly."
> **Rep:** "Most people aren''t. Here''s what we do differently: We guarantee the speeds we advertise, or we refund the difference. Plus, we''re local, so if you have an issue, you talk to a real person, not a call center. Same price, better service. Want me to check what speeds you''re actually getting?"
> **Homeowner:** "Sure, why not."
> **Rep:** "Great—let me run a quick test."

---

**Try This Today**

Next time someone says they already have a service, don''t bash it. Instead, ask how long they''ve been with them, then say: "I do everything they do, plus..." and list one specific differentiator. Make switching feel like an upgrade.


',
  2
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Objection: DIY Objection
INSERT INTO learning_objections (name, slug, description, display_order)
VALUES (
  'DIY Objection',
  'diy',
  '# DIY Objection
**Estimated read: 2 minutes**

## Why They Say This

They think they can do it themselves. They''re not wrong—they probably can do something. But they can''t do what you do. Your job is to respect their effort, then show them the gap between DIY and professional service.

## The Mistake Most Reps Make

They make them feel dumb. "You can''t do this yourself!" That''s insulting. They''ve probably tried, and it might have worked a little. Don''t invalidate their effort—show them why professional is worth the small difference in price.

## The Framework

Respect first: "I totally get wanting to handle it yourself." Then show the gap: professional-grade products they can''t access, time investment, warranty protection. The key: "For a small difference in price, you get 10x the coverage." Don''t make DIY feel stupid—make professional feel like the obvious upgrade.

## Example Scripts

**Pest Control Example**
> **Homeowner:** "I just buy stuff from Home Depot and do it myself."
> **Rep:** "I totally get that—saves money, right? Quick question: How often do you have to reapply?"
> **Homeowner:** "Every few months, I guess."
> **Rep:** "So you''re spending $20-30 every few months, plus your time, plus if it doesn''t work, you''re out the money. Our service is about the same cost, but you get professional-grade products you can''t buy at the store, a guarantee that if bugs come back we come back for free, and you never have to think about it. For the same money, you get 10x the coverage. Make sense?"
> **Homeowner:** "I never thought about it that way."
> **Rep:** "Want me to show you what we can do?"

**Solar Example**
> **Homeowner:** "Why wouldn''t I just buy panels myself?"
> **Rep:** "You absolutely could—and some people do. Here''s the thing: When you buy panels yourself, you''re buying retail. When you go through us, you''re buying wholesale, plus we handle all the permits, installation, warranties, and maintenance. Plus, if something goes wrong, you call us, not the manufacturer. For about the same price, you get the whole package. Does that make sense?"
> **Homeowner:** "I guess so."
> **Rep:** "Want me to show you the difference?"

---

**Try This Today**

Next time someone says they do it themselves, don''t make them feel dumb. Instead, respect their effort, then ask: "How often do you have to redo it?" Then show them that for the same money, they get professional service with a guarantee. Make professional feel like the obvious upgrade.


',
  3
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Objection: Spouse Check Objection
INSERT INTO learning_objections (name, slug, description, display_order)
VALUES (
  'Spouse Check Objection',
  'spouse',
  '# Spouse Check Objection
**Estimated read: 2 minutes**

## Why They Say This

Often it''s a smokescreen to get you off the door. Sometimes it''s real. Your job is to figure out which one, then either create urgency or set a hard callback time. Most reps take this at face value and leave. Don''t be most reps.

## The Mistake Most Reps Make

They accept it immediately. "Oh, okay, I''ll come back later!" Then they never come back. Or they pressure: "Can''t you just decide?" That sounds pushy. Neither works.

## The Framework

Validate the decision-making process: "Of course, you have to do what''s best for your family." Then qualify: "If they were here right now and loved it, would you move forward?" If yes, create urgency—the deal, the schedule, the trucks in the area. If no, set a hard callback time and actually return. Don''t leave without a commitment.

## Example Scripts

**Solar Example**
> **Homeowner:** "I need to talk to my spouse first."
> **Rep:** "Of course—you have to do what''s best for your family. Quick question: If they were here right now and loved it, would you move forward?"
> **Homeowner:** "Yeah, probably."
> **Rep:** "Perfect. Here''s the thing—I''m only in your neighborhood today, and we''ve got a group discount that ends tonight. Plus, our installation schedule fills up fast. Can you shoot them a quick text and see if they can come home? Or I can come back at 7pm when they''re home."
> **Homeowner:** "Let me text them."
> **Rep:** "Great—while you do that, let me show you what we''re offering."

**Security Example**
> **Homeowner:** "My husband needs to be here for this decision."
> **Rep:** "Totally understand—this is a big decision. If he were here right now and loved it, would you move forward?"
> **Homeowner:** "I think so, yeah."
> **Rep:** "Perfect. I''m actually doing a few houses in your neighborhood today, so I can swing back by tonight when he''s home. What time does he usually get home?"
> **Homeowner:** "Around 6."
> **Rep:** "Perfect—I''ll come back at 6:30. In the meantime, let me show you what we''re offering so you can show him when I come back."

---

**Try This Today**

Next time someone says they need to check with their spouse, don''t just leave. Ask: "If they were here right now and loved it, would you move forward?" If yes, create urgency or set a hard callback time. If no, find out what the real concern is.


',
  4
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Objection: Think About It Objection
INSERT INTO learning_objections (name, slug, description, display_order)
VALUES (
  'Think About It Objection',
  'think-about-it',
  '# Think About It Objection
**Estimated read: 2 minutes**

## Why They Say This

Translation: "You haven''t given me a reason to decide right now." They''re not going to think about it—they''re going to forget about it. This is your last chance to create clarity and urgency. Most reps accept this and leave. Don''t be most reps.

## The Mistake Most Reps Make

They accept it. "Okay, think about it and let me know!" Then they never hear from them again. Or they pressure: "What''s there to think about?" That sounds pushy. Neither works.

## The Framework

Isolate the real concern: "Totally fair—what specifically do you want to think over?" Create clarity: "Is it the price, the service, or something else?" Once you know what they''re actually concerned about, address it. Then create soft urgency: "I''m only in the neighborhood today..." Offer to answer any remaining questions right now. Don''t leave without addressing the real concern.

## Example Scripts

**Internet Example**
> **Homeowner:** "I need to think about it."
> **Rep:** "Totally fair—what specifically do you want to think over? Is it the price, the service, or something else?"
> **Homeowner:** "I guess I just want to make sure it''s worth switching."
> **Rep:** "I get that. Let me ask you this: Are you happy with your current speeds?"
> **Homeowner:** "Not really, no."
> **Rep:** "So you''re paying for something you''re not happy with. We guarantee the speeds we advertise, or we refund the difference. Plus, I''m only in your neighborhood today, so if you want to switch, now''s the time. Want me to check what speeds you''re actually getting?"
> **Homeowner:** "Okay, sure."
> **Rep:** "Perfect—let me run a quick test."

**Security Example**
> **Homeowner:** "Let me think about it."
> **Rep:** "Of course—what specifically do you want to think over?"
> **Homeowner:** "I don''t know, just everything."
> **Rep:** "Is it the price, the service, or something else?"
> **Homeowner:** "I guess I''m just not sure if I need it."
> **Rep:** "I get that. Here''s the thing: Most break-ins happen during the day when people think they''re safe. Our system protects you 24/7, whether you''re home or not. Plus, I''m only in your neighborhood today, so if you want to get set up, now''s the time. Want me to show you what we offer?"
> **Homeowner:** "Okay, show me."
> **Rep:** "Perfect—let me walk you through it."

---

**Try This Today**

Next time someone says they need to think about it, don''t accept it. Instead, ask: "What specifically do you want to think over? Is it the price, the service, or something else?" Once you know the real concern, address it, then create soft urgency. Don''t leave without clarity.


',
  5
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Objection: Renter Objection
INSERT INTO learning_objections (name, slug, description, display_order)
VALUES (
  'Renter Objection',
  'renter',
  '# Renter Objection
**Estimated read: 2 minutes**

## Why They Say This

They don''t own the home, so they think they can''t make decisions about services. Sometimes that''s true. Sometimes it''s not. Your job is to qualify quickly, then either pivot to the landlord or find out if they handle services themselves. Don''t waste time on someone who truly can''t decide.

## The Mistake Most Reps Make

They give up immediately. "Oh, you''re renting? Okay, thanks!" Then they leave. Or they push: "Can''t you just decide?" That doesn''t work. Neither does spending 10 minutes trying to convince someone who can''t make the decision.

## The Framework

Qualify quickly: "Do you handle any of the home services, or does the landlord?" If they handle services, pivot to value. If the landlord handles everything, pivot to landlord contact: "Perfect, can you shoot them a quick text?" If they pay utilities, they may pay for services too. Transferability angle: "If you move, the service moves with you." Know when to walk—don''t waste time on someone who truly can''t decide.

## Example Scripts

**Pest Control Example**
> **Homeowner:** "I''m just renting."
> **Rep:** "Got it—do you handle pest control, or does your landlord?"
> **Homeowner:** "I usually handle it myself."
> **Rep:** "Perfect. So you''re probably spending $20-30 every few months on sprays, right? Our service is about the same cost, but you get professional treatment, a guarantee, and if you move, you can transfer the service to your new place. Plus, you never have to think about bugs. Make sense?"
> **Homeowner:** "I guess so."
> **Rep:** "Want me to show you what we can do?"

**Internet Example**
> **Homeowner:** "I''m renting, so I can''t really decide."
> **Rep:** "Totally understand. Quick question: Do you pay for internet, or does your landlord?"
> **Homeowner:** "I pay for it."
> **Rep:** "Perfect. So you''re already making that decision. Here''s the thing: We guarantee the speeds we advertise, or we refund the difference. Plus, if you move, you can transfer the service. Same price, better service. Want me to check what speeds you''re actually getting?"
> **Homeowner:** "I guess I could look."
> **Rep:** "Great—let me run a quick test."

---

**Try This Today**

Next time someone says they''re renting, don''t give up immediately. Instead, qualify: "Do you handle any of the home services, or does the landlord?" If they handle services, pivot to value. If not, pivot to landlord contact or know when to walk. Don''t waste time on someone who can''t decide.


',
  6
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

COMMIT;