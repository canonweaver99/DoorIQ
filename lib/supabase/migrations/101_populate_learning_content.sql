-- Insert Learning Modules
BEGIN;

-- Module: The Approach: Your First 5 Seconds Decide Everything
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'The Approach: Your First 5 Seconds Decide Everything',
  'approach',
  'approach',
  1,
  3,
  '# The Approach: Your First 5 Seconds Decide Everything
**Estimated read: 3 minutes**

You''ve got five seconds to change their mind about you. Not about your product—about you. Most homeowners have already decided you''re a pushy salesman before you even open your mouth. Your job in those first five seconds is to prove them wrong.

## Positioning Yourself (Literally)

Stand at a 45-degree angle to the door, not straight-on. Straight-on feels confrontational. The angle says "I''m here, but I''m not invading your space." Lean slightly away from the door, like you''re about to leave. Look busy—check your phone, glance at your clipboard, shift your weight. You want them to think you''re doing something important, not waiting for them.

Your body language should scream "I''m not desperate." Desperate reps get doors slammed. Confident reps get conversations.

## The Pattern Interrupt

They expect you to start selling immediately. Flip the script. Don''t mention your product in the first 30 seconds. Instead, acknowledge what they''re probably thinking: "Hey, I know you weren''t expecting me, and I''m not here to waste your time." Or better: "Quick question—are you the homeowner?" Simple, direct, non-threatening.

The goal is to get them to see you as human, not a threat. Once they see you as human, they''ll listen. Until then, you''re just noise.

## Reading the Signs

Before you knock, look for signs of life. Cars in the driveway? Good sign. Lights on? Even better. Toys in the yard? They''re home and probably busy—perfect timing for a quick, respectful approach. No signs of life? Skip it. You''re wasting your time and annoying someone who isn''t even there.

Timing matters. Early morning? They''re probably rushing. Late afternoon? They might be more receptive. Evening? Hit or miss—some people are done with their day, others are just getting started. Read the situation and adjust.

## The Icebreaker That Works

Your opener should do three things: acknowledge their time, establish legitimacy, and create curiosity. Here''s what works across industries:

**Pest Control:** "Hey, quick question—have you noticed more bugs than usual this season? I''m working with a few of your neighbors on a neighborhood-wide treatment program."

**Solar:** "I''m doing a quick survey in your area about energy costs. Mind if I ask—what''s your average electric bill?"

**Internet:** "I''m checking internet speeds in your neighborhood. Are you getting the speeds you''re paying for?"

**Home Security:** "Quick question—do you have a security system? I''m working with a few neighbors on a group discount."

Notice the pattern? You''re not selling. You''re asking. You''re gathering information. You''re positioning yourself as someone doing research or helping neighbors. That''s not threatening—that''s interesting.

## What Not to Do

Don''t start with "Hi, I''m from [Company]." That''s code for "I''m here to sell you something." Don''t mention price in the first minute. Don''t list features. Don''t apologize for being there. Confidence, not apology.

Don''t look like a salesman. If you''re wearing a company polo and carrying a clipboard with brochures, you look like every other rep they''ve ignored. Dress like a professional, not a walking billboard.

## The Transition

Once you''ve broken the pattern and they''re listening, transition naturally. "Actually, since I''m here, let me show you something quick." Or "You know what, I''ve got something that might help with that." The key word is "quick." Nobody has time for a 30-minute pitch. But everyone has time for "quick."

---

**Try This Today**

On your next 10 doors, don''t mention your product or company name until they ask. Start with a question about their situation, acknowledge their time, and see how many more conversations you get. The difference will shock you.

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

-- Module: The Pitch: Building Value Before Price
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'The Pitch: Building Value Before Price',
  'pitch',
  'pitch',
  2,
  3,
  '# The Pitch: Building Value Before Price
**Estimated read: 3 minutes**

Price is the last thing they should think about. If you''re talking price before they understand value, you''ve already lost. Your job is to make them want what you''re offering so badly that price becomes a detail, not a dealbreaker.

## Establishing Legitimacy Fast

They don''t trust you yet. Fix that in the first 60 seconds. Mention neighbors: "I just finished up at the Johnson''s place down the street." Show local knowledge: "I noticed you''ve got that big oak tree—that''s probably attracting pests." Reference something visible: "I see you''ve got solar panels already—smart move."

Legitimacy isn''t about your company''s credentials. It''s about proving you belong in their neighborhood, you understand their situation, and you''re not some random stranger trying to scam them.

## The "What This Does For YOU" Framework

Features are what your product has. Benefits are what your product does for them. Features are boring. Benefits are compelling.

**Pest Control Feature:** "We use a quarterly treatment schedule."
**Benefit:** "You won''t have to think about bugs again. Set it and forget it."

**Solar Feature:** "25-year warranty on panels."
**Benefit:** "Your electric bill is locked in for the next 25 years. No more rate hikes."

**Internet Feature:** "Gigabit speeds available."
**Benefit:** "Your whole family can stream, game, and work from home without anyone lagging."

**Home Security Feature:** "24/7 monitoring."
**Benefit:** "You can sleep knowing someone''s watching your home even when you''re not there."

See the difference? Features are facts. Benefits are feelings. Sell feelings, not facts.

## Creating the Mental Picture

Make them visualize the problem first, then the solution. Don''t just say "pests are annoying." Paint the picture: "You''re having dinner with your family, and a roach crawls across the table. Your kids are grossed out, your wife''s embarrassed, and you''re frustrated because you thought you''d dealt with this."

Then flip to the solution: "Imagine never worrying about that again. You come home, the house is clean, and you can focus on what matters—your family, not bugs."

The problem picture creates urgency. The solution picture creates desire. Both together create a sale.

## Adjusting Your Depth

Not everyone wants the full pitch. Some people are ready to buy in 30 seconds. Others need 10 minutes. Read their engagement level.

**High engagement:** They''re asking questions, nodding, leaning in. Go deeper. Show more value. Build more desire.

**Low engagement:** They''re checking their phone, looking away, giving one-word answers. Keep it short. Hit the high points. Get to the close faster.

**Medium engagement:** They''re listening but not excited. Find what matters to them. Ask: "What''s your biggest concern with [problem]?" Then tailor your pitch to that specific concern.

## Never List Every Feature

You''ve got 20 features. They care about maybe three. Figure out which three matter to them, and focus there. Save the rest for objections.

If you list everything, you sound like you''re reading a brochure. If you focus on what matters to them, you sound like you understand their situation. Guess which one closes more deals?

## Value Statements That Work

**Pest Control:** "Most people don''t realize that one untreated home affects the whole neighborhood. We''re doing a block-wide program that keeps everyone protected—including you."

**Solar:** "Your electric bill is going up every year. Solar locks in your rate for the next 25 years. It''s like buying electricity at today''s prices for the next quarter-century."

**Internet:** "You''re probably paying for speeds you''re not getting. We guarantee the speeds we advertise, or we refund the difference."

**Home Security:** "Most break-ins happen during the day when people think they''re safe. Our system protects you 24/7, whether you''re home or not."

Each statement focuses on a specific benefit they can relate to. Not generic "we''re the best." Specific "here''s what this does for you."

---

**Try This Today**

Before your next pitch, write down three benefits (not features) of your product. Practice explaining each one in one sentence. Use those three sentences in your next conversation and watch how much more engaged they become.

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
  3,
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

-- Module: The Close: Why Customers Expect You to Ask
INSERT INTO learning_modules (title, slug, category, display_order, estimated_minutes, content, is_published)
VALUES (
  'The Close: Why Customers Expect You to Ask',
  'close',
  'close',
  4,
  2,
  '# The Close: Why Customers Expect You to Ask
**Estimated read: 2 minutes**

Customers expect you to close. Seriously. They''re standing at the door, listening to your pitch, and thinking: "When is this person going to ask me to buy?" If you don''t close, they''re confused. Did you forget? Are you not confident in your product? Do you not want the sale?

Closing isn''t pushy. Closing is professional. Closing is expected.

## Why Reps Fear Closing

Most reps are afraid to close because they''re afraid of rejection. But here''s the thing: If you don''t ask, you''ll never know. And if you don''t ask, you''re wasting everyone''s time—theirs and yours.

The customer has already invested time listening to you. They''ve already considered your product. They''re waiting for you to make it easy for them to say yes. That''s your job. Make it easy.

## Soft Closes vs Hard Closes

**Soft close:** Getting agreement that they want what you''re offering. "Does this sound like something that would help you?" "Would you be interested in getting started?" "Should I check availability?"

**Hard close:** Collecting the information needed to complete the sale. Name, phone number, credit card, signature. The actual commitment.

You need both. Soft closes build momentum. Hard closes seal the deal.

## The Soft-to-Hard Close Sequence

Start soft, end hard. Don''t jump straight to "Can I get your credit card?" That''s jarring. Instead, build up to it.

**Soft close 1:** "Does this sound like something that would help you?" (Get agreement.)
**Soft close 2:** "Want me to check if we have availability in your area?" (Create urgency.)
**Hard close:** "Great! Let me get your information and we can get you set up today." (Collect the info.)

Each close builds on the last. If they say yes to the soft close, they''re more likely to say yes to the hard close.

## Types of Soft Closes

**Urgency Close:** "We''re only doing this neighborhood this week. After that, we move to the next area." Creates FOMO without being pushy.

**Bandwagon Close:** "I''ve already signed up three of your neighbors this week. They''re all excited about it." Social proof is powerful.

**Option Close:** "We''ve got two options—the basic plan or the premium. Which one sounds better for you?" Give them choices, not ultimatums.

**Responsibility Close:** "This is really about protecting your family. That''s worth it, right?" Appeal to their values.

**Sincerity Close:** "Look, I''m not here to pressure you. If this isn''t right for you, that''s totally fine. But if it is, let''s get you set up." Honesty disarms skepticism.

Use different closes for different situations. Urgency works when they''re on the fence. Bandwagon works when they''re skeptical. Option works when they''re interested but indecisive.

## The Hard Close

The hard close is simple: Collect the information you need to complete the sale. Name, phone number, address confirmation, payment method.

Don''t ask permission to collect information. Just start collecting it. "Great! Let me get your name and phone number." Not "Can I get your name and phone number?" The first is assumptive. The second gives them a chance to say no.

Assumptive language throughout the conversation makes the hard close easier. "When we get you set up..." not "If we get you set up..." "Your first service will be..." not "If you decide to sign up..."

## The 3-Close Rule

Ask three times before leaving any door. Not three hard closes—that''s pushy. Three soft closes, building to a hard close.

**Close 1:** "Does this sound like something that would help?"
**If yes:** Move to close 2.
**If no:** Address the objection, then try close 1 again.

**Close 2:** "Want me to check availability?"
**If yes:** Move to hard close.
**If no:** Address the concern, then try close 2 again.

**Close 3 (Hard):** "Let me get your information and we can get you set up."
**If yes:** You''ve got a sale.
**If no:** Address the final objection, then try one more time.

Three times. Not two. Not four. Three. After three, if they''re still not interested, respect that and move on. But most reps give up after one. Don''t be most reps.

## Assumptive Language Throughout

From the moment you start talking, use assumptive language. "When we get you set up..." "Your first service will be..." "You''ll love how easy this is..."

Not "If you decide to sign up..." or "Should you choose our service..." Those phrases give them an out. Assumptive language creates momentum toward the close.

## Examples Across Industries

**Pest Control:** "When we get you on our quarterly program, you won''t have to think about bugs again. Want me to check what dates work for your first treatment?"

**Solar:** "Once we get your system installed, your electric bill drops to basically nothing. Should I check if we have availability this month?"

**Internet:** "When we get you switched over, you''ll notice the speed difference immediately. Want me to see what''s available at your address?"

**Home Security:** "Once we get your system installed, you''ll have 24/7 protection. Should I check what package works best for your home?"

Each example uses assumptive language ("when," "once") and ends with a soft close that leads to a hard close.

---

**Try This Today**

On your next five doors, use assumptive language from the start. Say "when" instead of "if," "your" instead of "the," and "we''ll" instead of "you could." Then, before you leave any door, ask for the close three times. Watch how many more sales you get.

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