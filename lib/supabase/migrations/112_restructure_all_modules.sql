-- Restructure all remaining modules with proper headings
-- Generated: 2025-12-01
-- This migration restructures pitch, overcome, close, and communication modules
-- Removes duplicate titles and em dashes

BEGIN;

-- Module: Building Value Before Price
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Price is the last thing they should think about. If you''re talking price before they understand value, you''ve already lost. Your job is to make them want what you''re offering so badly that price becomes a detail, not a dealbreaker.

## The Mistake Most Reps Make

They lead with price. They mention cost in the first minute. They compete on price instead of value. When you lead with price, they''re thinking "That''s too much" before they even know what they''re buying. Price without value feels expensive. Price with value feels like a bargain.

## The Framework

The golden rule: never mention price until they''re ready to hear it. Value must outweigh cost in their mind before you quote anything. They need to see the problem clearly. They need to understand the solution deeply. They need to feel the benefit emotionally. Only then can they process price rationally. Until then, price is just a number that sounds too high.

How to know when they''re ready: they ask, or they''re leaning in. If they ask about price, they''re engaged. They want to know. That''s your signal. If they''re leaning in, nodding along, asking questions, they''re ready. If they''re looking away, checking their phone, giving one-word answers, they''re not ready. Keep building value.

The "what this does for YOU" framework shifts focus from product to person. Instead of "We offer quarterly treatments," say "You won''t have to think about bugs again." Instead of "We have 24/7 monitoring," say "You can sleep knowing someone''s watching your home." Make it about them, not about you.

Stacking benefits until price feels like a bargain is the goal. One benefit might not justify the cost. Three benefits might. Five benefits definitely will. Keep stacking until they''re thinking "This is worth it" before you even mention price. When you finally do mention price, it should feel like a natural next step, not a shock.

If they ask price too early, don''t panic. Say "Great question - let me show you what''s included first so the price makes sense." Then continue building value. They asked because they''re curious, not because they''re ready to buy. Use their curiosity to build more desire.

The goal: they should be surprised the price is so LOW, not so high. When you''ve built enough value, price becomes a detail, not a dealbreaker. When you haven''t built enough value, price becomes an objection, not an opportunity.''',
    updated_at = NOW()
WHERE slug = 'value-before-price';

-- Module: Features vs Benefits
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Features are what you do. Benefits are why they care. Customers don''t buy features - they buy outcomes. Features answer "What is it?" Benefits answer "What''s in it for me?" Always answer the second question first.

## The Mistake Most Reps Make

They list features like a spec sheet. They sound like they''re reading a brochure. They focus on what the product has instead of what it does for the customer. When you list features, you sound like you''re reading a brochure. When you explain benefits, you sound like you understand their situation. Guess which one closes more deals?

## The Framework

Every feature needs a "which means..." translation. "We treat 30 feet into your yard" becomes "which means your kids can play outside without getting bit." "We install Tier 1 panels" becomes "which means you''re covered for 25 years with zero maintenance." "Fiber optic connection" becomes "which means no buffering during movie night." "24/7 monitoring" becomes "which means someone''s always watching, even when you''re asleep."

See the pattern? Features are facts. Benefits are feelings. Facts inform. Feelings motivate. You need both, but benefits close deals.

Don''t list features like a spec sheet - tell them what it means for their life. Match benefits to their specific situation. If they have kids, focus on safety and peace of mind. If they have pets, focus on pet-friendly solutions. If they''re budget-conscious, focus on savings and value. If they''re convenience-focused, focus on set-it-and-forget-it simplicity. One size doesn''t fit all - tailor your benefits to their needs.

The translation exercise is simple: take every feature and add "which means..." Then finish the sentence with what it actually does for them. Not what it does technically. What it does emotionally. What it does practically. What it does for their daily life.

When you master features vs benefits, your pitch transforms. Instead of sounding like a product catalog, you sound like a problem solver. Instead of listing specifications, you''re painting pictures of better outcomes. That''s what closes deals.

## Example Scripts

**Pest Control:**
> "We treat 30 feet into your yard, which means your kids can play outside without getting bit."

**Solar:**
> "We install Tier 1 panels, which means you''re covered for 25 years with zero maintenance."

**Internet:**
> "Fiber optic connection, which means no buffering during movie night."

**Security:**
> "24/7 monitoring, which means someone''s always watching, even when you''re asleep."''',
    updated_at = NOW()
WHERE slug = 'features-vs-benefits';

-- Module: Painting the Picture
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Words create images - use them strategically. Make the invisible problem visible, then paint the solution in vivid detail. When they can visualize the problem, they can feel the need for the solution. When they can''t visualize it, they can''t feel the urgency.

## The Mistake Most Reps Make

They describe problems abstractly. "Pests are annoying." "Electric bills are high." "Internet is slow." These are facts, not feelings. They don''t create urgency. They don''t create desire. They just state the obvious. Abstract problems don''t motivate action. Concrete problems do.

## The Framework

Describing the problem vividly before offering the solution creates urgency. Don''t just say "pests are annoying." Paint the picture: "You''re having dinner with your family, and a roach crawls across the table. Your kids are grossed out, your wife''s embarrassed, and you''re frustrated because you thought you''d dealt with this." That''s not annoying - that''s a problem they can feel.

Walk them through the scenario using "Imagine this..." Make it real. Make it visceral. Make it something they can see happening in their own home.

Use their environment to make it concrete. Point to the flower bed: "See those ants by your foundation? They''re using that crack to get into your walls right now." Point to the eaves: "That''s where wasps build nests - right where your kids play." Point to the meter: "Every month that bill comes, that''s money you''ll never see again." Point to the router location: "When everyone''s home streaming at once, that''s when you notice the lag."

Slow hand movements to illustrate what you''re describing. When you point, they look. When they look, they see. When they see, they understand. Don''t just talk - show. Your hands become your visual aids. Use them to guide their attention to what matters.

Get them physically involved. Have them look where you''re pointing. Walk with you around the property. Touch the problem area. When they''re physically engaged, they''re mentally engaged. When they''re just listening, they can tune out. When they''re looking and touching, they''re invested.

Creating urgency through visualization works because it makes abstract problems concrete. "If we don''t treat this now, by July you''ll see..." makes them see the future problem. "Every month that bill comes, that''s money you''ll never see again" makes them feel the ongoing cost. "When everyone''s home streaming at once, that''s when you notice the lag" makes them experience the frustration.

Make the invisible problem visible. Most problems are hidden until they''re not. Show them what''s happening behind the scenes. Show them what''s coming if they don''t act. Show them what they''re missing by not having your solution. When they can see it, they can feel it. When they can feel it, they can act on it.''',
    updated_at = NOW()
WHERE slug = 'painting-the-picture';

-- Module: Keep Ammo in Your Pocket
UPDATE learning_modules
SET content = '''**Estimated read: 2 minutes**

## Why This Matters

Don''t dump every feature in the first 60 seconds. Information overload kills interest - they stop listening. You''ve got 20 features. They care about maybe three. Figure out which three matter to them, and focus there. Save the rest for objections.

## The Mistake Most Reps Make

They list everything upfront. They dump every feature, every benefit, every detail in the first minute. When you list everything, you sound like you''re reading a brochure. Information overload kills interest. They stop listening. They tune out. Then when they object, you have nothing left to overcome it.

## The Framework

Hold back value points to use when overcoming objections. If you''ve already mentioned everything, you have nothing left when they push back. If you''ve held back your best differentiators, you can reveal them at the perfect moment. That moment is when they object. That''s when they''re listening hardest. That''s when your ammo matters most.

The "one more thing" technique reveals benefits strategically. After they''ve heard your main pitch, after they''ve processed the initial value, hit them with "Oh, and one more thing..." Then reveal something powerful. A warranty. A guarantee. A bonus feature. Something that makes them think "Wait, this is even better than I thought."

If they''re already sold, stop selling. Don''t keep talking. Don''t add more features. Don''t risk talking them out of it. When they''re ready to buy, close. When they''re not ready, that''s when you use your ammo. Save your best stuff for when you need it most.

Save your best differentiators for when they push back. Price objection? Reveal the warranty. Timing objection? Reveal the limited-time bonus. Comparison objection? Reveal the unique feature competitors don''t have. Your ammo is your secret weapon - don''t waste it on doors that are already open.

Example flow that works: Initial pitch covers 3 key benefits. First objection gets the warranty or guarantee revealed. Second objection gets price flexibility or bonus feature revealed. Close reminds them of the entire stack. Each objection becomes an opportunity to add more value, not defend what you''ve already said.

Think of your pitch like a deck of cards - play them one at a time. Don''t show your whole hand upfront. Show enough to get them interested. Then reveal more as they engage. As they object. As they need more reasons to say yes. Strategic revelation beats information dumping every time.

When you keep ammo in your pocket, you always have something to overcome objections. When you dump everything upfront, you''re defenseless when they push back. Save your best for when it matters most.''',
    updated_at = NOW()
WHERE slug = 'keep-ammo';

-- Module: Reading and Adjusting
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Not every customer needs the same pitch. Read their engagement and adjust your delivery accordingly. One pitch doesn''t fit all. The best reps adapt. The worst reps stick to the script no matter what.

## The Mistake Most Reps Make

They deliver the same pitch to everyone. They don''t read body language. They don''t adjust depth. They don''t mirror energy. They just plow through their script regardless of whether the customer is engaged or not. When you ignore their signals, you sound like you''re not listening. When you sound like you''re not listening, you lose.

## The Framework

Reading body language tells you everything. Arms crossed? They''re defensive - slow down, build more rapport. Leaning in? They''re engaged - go deeper, show more value. Looking away? They''re disengaged - keep it short, hit high points. Checking their phone? They''re distracted - wrap it up or re-engage with a question. Body language doesn''t lie. Read it and respond.

Adjusting depth based on engagement is crucial. High engagement means they''re asking questions, nodding, leaning in. Go deeper. Show more value. Build more desire. Low engagement means they''re checking their phone, looking away, giving one-word answers. Keep it short. Hit the high points. Get to the close faster. Medium engagement means they''re listening but not excited. Find what matters to them. Ask "What''s your biggest concern?" Then tailor your pitch to that specific concern.

Mirroring their energy creates connection. Low energy customer? Match their calm delivery. Don''t be overly enthusiastic - it feels fake and pushy. High energy customer? Match their excitement. Don''t be monotone - it feels boring and disengaged. When you match their energy, you create rapport. When you don''t, you create disconnect.

When to speed up vs slow down depends on their signals. Rushing signals? Speed up. Get to the point. They''re busy. Curious signals? Slow down. Go deeper. They want to know more. Impatient signals? Speed up and close. Engaged signals? Slow down and build value. Read the room and respond.

If they''re not listening, stop talking and ask a question. Don''t keep pitching to someone who''s tuned out. Re-engage them. "Does that make sense so far?" or "What questions do you have?" or "What matters most to you?" Questions require answers. Answers require engagement. Engagement requires listening.

The "gut check" mid-pitch works because it gives you feedback. "Does that make sense so far?" tells you if they''re following. "What questions do you have?" tells you what they care about. "What matters most to you?" tells you what to focus on. Use these checks to adjust your pitch in real-time.

When to pivot topics entirely happens when they don''t care about what you''re saying. They don''t care about price? Pivot to safety. They don''t care about features? Pivot to convenience. They don''t care about savings? Pivot to peace of mind. Find what they care about and talk about that instead.

Upper class vs middle class vs elderly requires different approaches. Upper class wants quality and exclusivity. Middle class wants value and reliability. Elderly wants simplicity and trust. Adjust your language, your examples, your focus. One pitch doesn''t fit all demographics.''',
    updated_at = NOW()
WHERE slug = 'reading-adjusting';

-- Module: Overcoming Objections: The R.A.C. Framework
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Objections aren''t "no." They''re "not yet." Most reps hear an objection and panic. Top reps hear an objection and think: "Perfect, now I know what they''re actually thinking. Let me address this." Objections are opportunities, not rejections.

## The Mistake Most Reps Make

They panic when they hear an objection. They defend. They argue. They repeat the objection back. They give up. Most reps hear "It''s too expensive" and think "I lost." Top reps hear "It''s too expensive" and think "They''re interested, they just need to understand the value." The difference determines whether you close or get rejected.

## The Framework

**Resolve, Ace, Close.** Three steps, every objection.

**Resolve: Acknowledge Without Validating**

When they say "It''s too expensive," don''t say "Oh, you think it''s expensive?" That repeats their objection and makes it stronger. Instead, say "Of course price matters." You''re acknowledging their concern without agreeing with it.

The word "of course" is powerful. It says "I understand, I''m not surprised, and I''ve got this handled."

**Ace: Tip the Scale**

Now give them something that tips the scale in your favor. A feature they didn''t know about. A specific benefit that addresses their concern. A price adjustment or payment plan.

You''re not arguing. You''re adding information that changes their perspective.

**Close: Ask Again**

After you''ve resolved and aced, close. Don''t wait for them to bring it up. "So, should we get you set up?" or "Ready to get started?" or "Want me to check availability?"

Most reps stop after resolving. Top reps always close after acing.

## Example Scripts

**Pest Control:**
> **Homeowner:** "I already have a service."
> **Rep:** "Of course you want to stick with what works."
> **Ace:** "That''s why I''m offering a free comparison - no commitment, just see if we can do better."
> **Close:** "Want me to show you what we offer?"

**Solar:**
> **Homeowner:** "I can''t afford it."
> **Rep:** "Of course affordability matters."
> **Ace:** "That''s why we offer zero down and payments that are less than your current electric bill."
> **Close:** "Want me to run the numbers for you?"

**Internet:**
> **Homeowner:** "I''m happy with what I have."
> **Rep:** "Of course you want to stick with what works."
> **Ace:** "That''s why I''m just asking - are you getting the speeds you''re paying for? If you are, great. If not, I can help."
> **Close:** "Want me to check your speeds real quick?"''',
    updated_at = NOW()
WHERE slug = 'overcome';

-- Module: Soft Closes vs Hard Closes
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Soft closes open the door. Hard closes walk through it. You need both, and you need them in the right order. The sequence is everything. Soft close. Get agreement. Address concerns if needed. Soft close again. Get stronger agreement. Then hard close. Collect information. Don''t rush it. Don''t drag it out. Find the rhythm. Master the flow.

## The Mistake Most Reps Make

They jump straight to hard closes. They ask for payment before building agreement. They skip the soft closes. Or they stay in soft closes forever, never moving to hard close. Both approaches fail. You can''t skip the bridge. You can''t stay on the bridge forever. You need to cross it to get where you''re going.

## The Framework

A soft close is a question or statement that moves them toward commitment without directly asking for the sale. "Does this sound like something that would help you?" "Would you be interested in getting started?" "Should I check availability?" These test the water. Their response tells you if they''re ready.

A hard close is directly collecting agreement information. Name, phone, email, payment. The actual commitment. "What''s the best email for you?" "Are you using a credit or debit card?" These seal the deal. But you never jump straight to a hard close - you earn it with soft closes first.

Soft closes test the water. Their response tells you if they''re ready. If they respond positively to a soft close, transition immediately to hard close. Don''t pause. Don''t celebrate. Don''t ask "So you want to do it?" Just start collecting information. Momentum is everything. When they say yes to a soft close, they''re saying yes to moving forward. Capture that momentum immediately.

If they hesitate, address the concern, then soft close again. Don''t push to hard close when they''re hesitating. That''s when you sound pushy. Address what''s holding them back. Answer their concern. Then soft close again. "I understand you''re worried about cost. Let me show you how this actually saves money. Does that help?" Then soft close: "Should I check availability?"

The soft close is the bridge. The hard close is the destination. You can''t skip the bridge. You can''t stay on the bridge forever. You need to cross it to get where you''re going. Soft closes build momentum. Hard closes capture commitment. Both are necessary. Neither works alone.

Hard close examples that work: "What''s the best email for you?" "Are you using a credit or debit card?" "What''s the best name for the account?" These are assumptive. They assume the sale is happening. They don''t ask permission - they collect information. That''s the difference between soft and hard. Soft asks. Hard assumes.''',
    updated_at = NOW()
WHERE slug = 'soft-vs-hard';

-- Module: Types of Soft Closes
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Different situations need different closes. Master these types and you''ll always have the right tool for the moment. Each close type has its moment. Urgency for the fence-sitters. Bandwagon for the skeptics. Option for the indecisive. Responsibility for the almost-there. Sincerity for the relationship-focused. Master them all, and you''ll always have the right close for the right moment.

## The Mistake Most Reps Make

They use the same close for every situation. They don''t read the customer. They don''t match the close to the moment. One-size-fits-all closes don''t work. Different customers need different approaches. Different situations need different closes.

## The Framework

The Urgency Close creates time pressure without being fake. "This is the best time to get started because..." "I''m only in the neighborhood today." "The trucks are already here." These work because they''re true. You are in the neighborhood today. The trucks are nearby. Frame it as opportunity, not manipulation. Urgency works when they''re on the fence. It helps them decide. But don''t fake urgency. Real urgency is powerful. Fake urgency is transparent.

The Bandwagon Close uses social proof in action. "If I can get you set up with your neighbor Susan, it''ll help me out - how does that sound?" "Most of your neighbors went with the full package." These work because people follow what others do. When they know neighbors are doing it, it feels safer. It feels normal. It feels like the right choice. Bandwagon works when they''re skeptical. It proves you''re legitimate. It proves others trust you.

The Option Close gives them a choice between two yeses. "Do you want me to start in the front or back?" "Does morning or evening work better for the install?" "Would you like my guy to park out front or in the driveway?" These work because they''re not asking if - they''re asking which. When you give them options, they''re choosing between yeses, not yes or no. Option closes work when they''re interested but indecisive. They help them move forward by making small decisions.

The Responsibility Close gives them a small task that assumes the sale. "Can you make sure the dog is put away when my tech arrives?" "Can you leave the gate unlocked for us?" These work because they''re practical. They''re about logistics, not commitment. But by asking them to do something, you''re assuming the sale is happening. Responsibility closes work when they''re close but need a nudge. They make the sale feel real and practical.

The Sincerity Close is your last resort - pull at the relationship. "Let me prove to you that you''re going to love this. Give me an honest try." "I know you''re going to love me - just give me a shot." These work because they''re personal. They''re about trust. They''re about the relationship you''ve built. Sincerity closes work when nothing else has. They''re your Hail Mary. Use them sparingly, but use them when you need them.''',
    updated_at = NOW()
WHERE slug = 'soft-close-types';

-- Module: The 3-Close Rule
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

The rule: Attempt to close at least 3 times before walking away from any door. Most sales happen after the second or third ask - not the first. Walking away after one "no" is leaving money on the table. Most reps do this. They hear one no and they''re done. But one no isn''t a rejection - it''s a hesitation. Address it. Overcome it. Close again. That''s how sales happen.

## The Mistake Most Reps Make

They give up after one "no." They hear rejection and they''re done. They don''t realize that most "no''s" aren''t real no''s. They''re soft no''s. They''re testing you. They''re hesitating. They need reassurance. They need a new angle. The first close is where they test you. They say no to see if you''ll fold. Most reps fold. Don''t be most reps.

## The Framework

Why 3? Because most "no''s" aren''t real no''s. They''re soft no''s. They''re testing you. They''re hesitating. They need reassurance. They need a new angle.

The first close: They''re testing you. They say no to see if you''ll fold. If you fold, you''ve confirmed their suspicion that you''re not confident. If you persist, you''ve proven you believe in what you''re selling. The first no is often just a test. Pass the test.

The second close: They''re considering. They need reassurance or a new angle. Address their concern. Show them a different benefit. Give them a new reason to say yes. Then close again. The second close is where hesitation turns into interest. Don''t skip it.

The third close: They''re deciding. This is where deals happen. By the third close, they''ve heard everything. They''ve processed the value. They''ve considered the objections. Now they''re deciding. This is your moment. Make it count.

Each close should come from a different angle or address a new concern. Don''t just ask the same question three times. That''s annoying. First close: test interest. Second close: address concern, then test again. Third close: final push with new angle. Each close builds on the last.

The 3-close rule isn''t about being annoying - it''s about being persistent with purpose. You''re not harassing them. You''re helping them decide. You''re giving them multiple opportunities to say yes. That''s service, not pressure.

Know when to walk: If they''re hostile, rude, or clearly not a buyer - move on. The 3-close rule isn''t about forcing sales. It''s about not giving up too early. But if they''re genuinely not interested after three closes, respect that and move on.

Most "no''s" are soft no''s. They''re not rejecting you - they''re hesitating. Help them through the hesitation. That''s what the 3-close rule does. It gives you three chances to help them decide. Use all three.''',
    updated_at = NOW()
WHERE slug = 'three-close-rule';

-- Module: Assumptive Language
UPDATE learning_modules
SET content = '''**Estimated read: 2 minutes**

## Why This Matters

Assumptive language: speaking as if the sale is already happening. It shifts their mindset from "Should I?" to "How does this work?" When you speak as if it''s happening, they start thinking about how it works, not whether they want it. That''s the shift that closes deals. They''re no longer deciding if - they''re deciding how.

## The Mistake Most Reps Make

They use conditional language. "Would you like to..." "If you decide to go with us..." "Should you choose..." These phrases give them an out. They create doubt. They make the sale feel optional. When you use conditional language, you''re asking permission. When you use assumptive language, you''re assuming forward motion.

## The Framework

Instead of "Would you like to..." say "When we get you set up..." Instead of "If you decide to go with us..." say "Once my tech comes out..." The difference is subtle but powerful. One phrase gives them an out. The other assumes forward motion.

It''s not trickery - it''s confidence. When you use assumptive language, you''re showing confidence in your product. You''re showing confidence in the value you''ve built. You''re showing confidence that this is the right choice for them. Confidence is contagious. When you''re confident, they become confident.

Use assumptive language throughout the pitch, not just at the close. "When my guy comes out, he''s going to start with the yard." "You''re going to love what we do with your eaves." "After the first service, you''ll notice a difference within 48 hours." These phrases assume the sale from the beginning. They create momentum throughout the conversation.

Pair with soft closes: "When we get you on the schedule, does morning or afternoon work better?" This combines assumptive language with a soft close. It assumes they''re signing up, but gives them a choice in the details. That''s powerful. They''re not deciding if - they''re deciding when.

Assumptive language only works if your tone matches - confident, not arrogant. If you sound pushy, assumptive language sounds manipulative. If you sound confident, assumptive language sounds natural. Your tone determines whether assumptive language builds trust or breaks it.

The goal: make the sale feel inevitable, not forced. When you use assumptive language throughout, the close feels like the natural next step, not a sudden ask. It feels like completing what you started, not starting something new.''',
    updated_at = NOW()
WHERE slug = 'assumptive-language';

-- Module: The Hard Close Sequence
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Once they''ve responded positively to a soft close - go immediately into the hard close. Don''t pause, don''t celebrate, don''t ask "So you want to do it?" Just start collecting info. Momentum is everything. When they say yes to a soft close, they''re saying yes to moving forward. Capture that momentum immediately.

## The Mistake Most Reps Make

They pause after a soft close. They celebrate. They ask "So you want to do it?" They give them time to second-guess. They let the momentum die. When you pause, they think. When they think, they hesitate. When they hesitate, you lose. Don''t pause. Don''t celebrate. Just start collecting information.

## The Framework

The sequence flows naturally, not robotically. You''re filling out information, not interrogating them. Keep it conversational. Keep it moving. Momentum is everything.

The sequence: "Perfect. What''s the best name for the account?" Start with name. It''s easy. It''s non-threatening. It gets them talking. Then: "And what''s a good phone number for you?" Continue the flow. Don''t pause between questions. Keep moving. "Email?" Short and direct. They know what you need. "This address here, right?" Confirm the address. Make sure you have it right. "Anything specific I should note for the tech?" This makes them feel involved. It makes the sale feel real. "Are you using a credit or debit card today?" Payment question last. By then, everything else is done and backing out feels harder.

Keep it conversational - you''re filling out info, not interrogating them. Don''t sound like you''re reading from a script. Don''t sound like you''re checking boxes. Sound like you''re helping them get set up. That''s the difference between closing and collecting.

If they hesitate at any point, address it calmly and continue. Don''t panic. Don''t back off. Address the concern. Answer the question. Then continue the sequence. "I understand you''re worried about that. Here''s how we handle it..." Then back to collecting info. Don''t let hesitation derail the momentum.

Payment question last - by then, everything else is done and backing out feels harder. When you''ve collected name, phone, email, address, and notes, they''re invested. They''ve given you information. They''ve committed mentally. The payment question feels like the final step, not the first commitment.

After payment: confirm next steps, thank them, move on confidently. "You''re all set. My tech will be out [date]. You''re going to love it." Don''t linger. Don''t keep selling. Don''t second-guess. Confirm. Thank. Move on. Confidence in the close shows confidence in the sale.

Speed and confidence matter. The faster you move through the sequence, the less time they have to second-guess. The more confident you sound, the more confident they feel. Master the sequence. Practice it until it flows. Then execute it with speed and confidence.''',
    updated_at = NOW()
WHERE slug = 'hard-close-sequence';

-- Module: Mirroring - Get Into Their World
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

When you knock, they''re in their world - watching TV, cooking, working, napping. Your knock disrupts that world. Your job is to pull them into yours. But first, you have to meet them where they are. Mirroring means reflecting their energy, mood, and body language. You can''t pull them into your world until you''ve entered theirs.

## The Mistake Most Reps Make

They come in at their own energy level regardless of the customer. They''re high energy when the customer is low energy. They''re low energy when the customer is excited. They don''t match. They don''t mirror. They create disconnect instead of connection. When you don''t match their energy, you sound like you''re not listening. When you sound like you''re not listening, you lose.

## The Framework

Physical mirroring works because it creates subconscious rapport. They lean on the doorframe, you lean on the wall. They cross their arms, you relax yours - but don''t mirror negativity. If they''re defensive, neutralize it with open body language. Mirror positive signals. Neutralize negative ones.

Vocal mirroring matches their volume, pace, and tone. Quiet speaker? Lower your voice. Fast talker? Speed up slightly. Serious tone? Match it. Casual tone? Match that too. When you match their vocal patterns, they feel like you "get" them. That feeling creates trust.

Mirroring builds subconscious rapport - they feel like you "get" them without knowing why. It''s not manipulation. It''s connection. When you mirror someone, you''re showing them you understand their state. That understanding creates comfort. That comfort creates conversation.

Once you''ve matched their energy, you can slowly lead them to a more engaged state. Don''t jump from their energy level to yours immediately. Match first. Build rapport. Then gradually elevate. If they''re at a 3, match the 3. Then slowly move to 4, then 5. They''ll follow because they trust you.

The goal: get them out of their world and into a conversation with you. Their world is comfortable. Your conversation is new. Mirroring bridges that gap. It makes the transition feel natural, not forced. It makes them want to engage, not retreat.

When mirroring works, they don''t notice you''re doing it. They just feel comfortable. They just feel understood. They just feel like you''re on the same wavelength. That''s when real conversations happen. That''s when sales close.''',
    updated_at = NOW()
WHERE slug = 'mirroring';

-- Module: Eye Contact - Look, Don't Stare
UPDATE learning_modules
SET content = '''**Estimated read: 2 minutes**

## Why This Matters

Good eye contact equals confidence, sincerity, trust. Too much eye contact equals creepy, aggressive, uncomfortable. Too little equals nervous, shady, untrustworthy. Eye contact is a tool, not a rule. Use it strategically. Use it naturally. Use it to build trust and guide attention.

## The Mistake Most Reps Make

They stare. They lock eyes and don''t break contact. That''s creepy. Or they avoid eye contact entirely. That''s nervous. Both approaches fail. Too much eye contact feels aggressive. Too little feels untrustworthy. Find the balance.

## The Framework

The sweet spot: 3-4 seconds of eye contact, then break naturally. Don''t stare. Don''t avoid. Just connect, then look away with purpose. That purpose matters. Break eye contact with intention - look where you want them to look.

Use your eyes to control the conversation. Glance at the yard, the eaves, the foundation. They''ll follow your gaze. Now you''re guiding the interaction. When you look somewhere, they look there too. Use that to direct their attention to what matters. Point with your eyes, not just your hands.

When making a key point, lock eyes briefly - it adds weight. When you lock eyes during an important statement, it signals "This matters." They''ll pay attention. They''ll remember. Use this strategically. Don''t waste it on small talk. Save it for value statements and closes.

When listening, maintain softer eye contact - show you''re engaged. You don''t need to stare while they''re talking. Softer eye contact shows you''re listening without being intense. Look at them, but don''t lock eyes. That''s for when you''re speaking, not when they''re speaking.

Cultural note: some people are uncomfortable with direct eye contact. Read the situation. If they''re avoiding your eyes, don''t force it. Adjust your approach. Match their comfort level. You can build rapport without constant eye contact. You just need to read the person.

If they won''t look at you, they''re not engaged. Ask a question to pull them back. "Does that make sense?" or "What do you think?" Questions require answers. Answers require engagement. Engagement requires eye contact. Use questions to re-engage when they drift.''',
    updated_at = NOW()
WHERE slug = 'eye-contact';

-- Module: Paraverbals - It's Not What You Say, It's How You Say It
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Paraverbal equals tone, pitch, pacing, volume - everything except the actual words. The same sentence can mean completely different things based on delivery. Your words are the script. Your paraverbals are the performance. Paraverbals are invisible, but they''re everything. Your words can be perfect, but if your paraverbals are wrong, you''ll lose. Your words can be simple, but if your paraverbals are right, you''ll win.

## The Mistake Most Reps Make

They focus on the words and ignore the delivery. They speak too fast when nervous. They use up-tone endings that sound like questions. They don''t pause for emphasis. They don''t control their volume. When your paraverbals are wrong, your words don''t matter. Delivery determines whether you sound confident or desperate.

## The Framework

Volume matters. Too loud equals aggressive. Too quiet equals nervous. Match the situation. Match their volume, then speak slightly quieter when making important points. People lean in to hear you. Leaning in equals engagement. Use volume strategically.

Pacing matters. Too fast equals anxious, untrustworthy. Too slow equals boring, condescending. Conversational is the goal. Match their pace, then slow down slightly for key points. When you slow down, they pay attention. When you speed up, they feel rushed. Find the rhythm.

Down-toning is crucial. End statements with your voice going DOWN, not up. Up-tone equals question, uncertainty: "We treat the whole yard?" Down-tone equals statement, confidence: "We treat the whole yard." See the difference? One sounds like you''re asking permission. One sounds like you''re stating fact. Down-tone everything.

Pause for emphasis. Silence before a key point makes it land harder. When you pause, they wait. When they wait, they listen. When they listen, they remember. Use pauses strategically. After benefits. Before closes. During transitions. Silence is powerful. Use it.

When nervous, most reps speed up without realizing it. Slow down intentionally. Nervous energy makes you rush. Rushing makes you sound desperate. Desperation kills sales. Breathe. Pause. Slow down. Confidence comes from control. Control your pace.

Record yourself practicing your pitch. Listen for volume, pace, and tone. Adjust. You can''t fix what you can''t hear. Record yourself. Listen critically. What sounds confident? What sounds desperate? What sounds natural? Adjust until it sounds right.

Master the delivery, not just the script.''',
    updated_at = NOW()
WHERE slug = 'paraverbals';

-- Module: Body Language - What You're Saying Without Words
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

55% of communication is body language. They''re reading you before you speak. What you''re saying without words matters more than what you''re saying with words. Your body speaks louder than your mouth.

## The Mistake Most Reps Make

They don''t think about body language. They shuffle their feet. They put their hands in their pockets. They cross their arms. They look down. They fidget. These signal nervousness, defensiveness, untrustworthiness. Negative body language kills sales before you even start talking.

## The Framework

Positive signals: open posture, relaxed shoulders, natural hand movements, grounded stance. These signal confidence, approachability, trustworthiness. Negative signals: shuffling feet, hands in pockets, crossed arms, looking down, fidgeting. These signal nervousness, defensiveness, untrustworthiness.

Slow, deliberate movements equal confidence and control. Fast, jerky movements equal nervousness and desperation. When you move slowly, you look like you have time. When you have time, you look like you''re not desperate. When you''re not desperate, they trust you. Control your movements. Control your image.

Use your hands to illustrate. "We spray three feet up" - show it with your hand. "The treatment covers this area" - point to it. When you use your hands, you''re engaging multiple senses. They see what you''re saying. That makes it real. That makes it memorable. Don''t just talk - show.

Keep your body open. Don''t create barriers between you and the customer. Crossed arms create barriers. Hands in pockets create barriers. Closed posture creates barriers. Open posture invites conversation. Open arms invite trust. Open body language invites sales.

Grounded stance: feet shoulder-width apart, weight evenly distributed. No swaying. No shifting. No fidgeting. When you''re grounded, you look stable. When you look stable, you look trustworthy. When you look trustworthy, they listen. Stand like you belong there.

Head nods work. Nod slightly when making a point. They''ll subconsciously nod back and agree. It''s subtle psychology, but it works. When you nod, they nod. When they nod, they agree. When they agree, they buy. Use nods strategically. Don''t overdo it. Just enough to create agreement.

Smile when the door opens. Smiling is contagious - it disarms them immediately. A smile says "I''m friendly." A smile says "I''m not a threat." A smile says "This will be pleasant." Start with a smile. End with a smile. Smile throughout. It changes everything.

Someone is always watching: neighbors, cameras, people driving by. Your body language is your reputation. Stand tall. Move confidently. Look professional. You''re not just selling to the person at the door. You''re building your reputation with everyone who sees you.''',
    updated_at = NOW()
WHERE slug = 'body-language';

-- Module: Reading Their Body Language
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

You''re not just broadcasting - you''re receiving. Watch them closely. Their body language tells you everything you need to know. Trust what their body is telling you more than what their mouth is saying. People say "I''m interested" while crossing their arms. People say "Tell me more" while looking at their phone. The body tells the truth. The mouth tells what they think you want to hear.

## The Mistake Most Reps Make

They don''t read body language. They ignore the signals. They keep pitching when the customer is clearly disengaged. They don''t adjust. They don''t respond. They just plow ahead. When you ignore their signals, you sound like you''re not listening. When you sound like you''re not listening, you lose.

## The Framework

Positive signs mean keep going: leaning in, uncrossed arms, nodding along, asking questions, stepping outside the doorframe. These signals say "I''m engaged. I''m interested. Keep talking." When you see these, you''re winning. Speed up toward the close. Build more value. They''re ready.

Negative signs mean adjust immediately: arms crossed, leaning away, looking at their phone, short clipped answers, hand on the door ready to close it. These signals say "I''m not interested. I''m defensive. I want this to end." When you see these, don''t plow ahead. Pause and re-engage.

If you see negative signals, don''t plow ahead - pause and re-engage. Ask a question: "Does that make sense?" or "What''s your biggest concern?" Questions pull them back. Questions require answers. Answers require engagement. When they''re disengaged, questions re-engage them.

Sometimes they''re just distracted, not disinterested. A question pulls them back. They might be thinking about dinner, work, kids. A question brings them back to you. "What do you think about that?" or "Does that sound like something that would help?" These questions re-engage without being pushy.

The door close signal: if their hand goes to the door, you''re losing them. Pivot fast. Don''t keep pitching. Don''t ignore it. Address it immediately. "I can see you''re busy. Let me just show you one quick thing." Or "I know I''m taking your time. One more minute?" When their hand goes to the door, you''re on borrowed time. Use it wisely.

Positive signals equal speed up toward close. Negative signals equal slow down, rebuild rapport. Read the signals. Respond accordingly. Don''t ignore what their body is telling you. Their body doesn''t lie. Their mouth might. Trust the body language.

Reading body language is a skill. Practice it. Every door is practice. Watch for signals. Respond to signals. Adjust based on signals. The better you read them, the better you sell to them. It''s that simple.''',
    updated_at = NOW()
WHERE slug = 'reading-body-language';

-- Module: Energy Management - Yours and Theirs
UPDATE learning_modules
SET content = '''**Estimated read: 3 minutes**

## Why This Matters

Your energy is contagious - for better or worse. If you''re tired, defeated, or frustrated, they''ll feel it before you say a word. If you''re confident, upbeat, and genuine, they''ll respond to that too. Your energy determines their energy. Your energy determines the sale.

## The Mistake Most Reps Make

They carry bad energy from door to door. They let one rejection affect the next interaction. They don''t reset. They don''t manage their energy. They show up tired, defeated, frustrated. That energy is contagious - in the worst way. When you show up with bad energy, they feel it. When they feel it, they reject you.

## The Framework

Reset between doors: don''t carry a bad interaction to the next one. That last door doesn''t matter. This door matters. Every door is a new opportunity. The last door doesn''t exist. Only this door exists. Reset mentally. Reset physically. Reset emotionally.

Physical reset: take a breath, shake it off, roll your shoulders, walk with purpose. Your body affects your mind. When you reset your body, you reset your mind. When you reset your mind, you reset your energy. Don''t carry tension. Don''t carry frustration. Don''t carry defeat. Leave it at the last door.

Mental reset: every door is a new opportunity. The last door doesn''t matter. This door matters. The last rejection doesn''t matter. This conversation matters. The last "no" doesn''t matter. This "yes" matters. Reset your mindset. Reset your expectations. Reset your energy.

Match their energy first, then elevate it slightly. Don''t be Barney the Dinosaur to someone who''s clearly exhausted. Don''t be low-energy with someone who''s excited and chatty. Match where they are, then lead them where you want them to be. That''s energy management.

Your energy should pull them toward a buying state, not push them away. High energy can overwhelm. Low energy can bore. Controlled energy engages. Find the balance. High enough to be engaging. Calm enough to be trustworthy. That''s controlled energy. That''s what closes deals.

The best reps have "controlled energy" - high enough to be engaging, calm enough to be trustworthy. You''re not a cheerleader. You''re not a robot. You''re a professional. Professional energy is confident, not desperate. Professional energy is engaging, not overwhelming. Professional energy closes deals.

End of day energy: the last hour is where reps fade. Push through - that''s where deals hide. When you''re tired, that''s when discipline matters. When you''re fading, that''s when you dig deep. The last hour separates good reps from great reps. Push through. Close strong.

Morning meetings, music, caffeine, movement - find what keeps your energy up and use it. Energy management is personal. What works for you might not work for others. Find your tools. Use them consistently. Your energy is your asset. Manage it like one.''',
    updated_at = NOW()
WHERE slug = 'energy-management';

COMMIT;

