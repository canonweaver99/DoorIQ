# DoorIQ Agent Testing Guide

## Overview
DoorIQ features 12 unique AI training agents, each designed to simulate different customer personas and objection types commonly encountered in door-to-door sales.

## The 12 Training Agents

### 1. **Austin** 🏡
- **Difficulty:** Moderate
- **Agent ID:** `agent_7001k5jqfjmtejvs77jvhjf254tz`
- **Personality:** Skeptical but fair, direct communicator
- **Key Traits:**
  - Asks direct questions about pricing and guarantees
  - Detects pressure tactics immediately
  - Terminates after three pricing deflections
  - Pets and child safety are top priorities
- **Best For:** Building foundational objection handling and trust
- **Recommended:** ✅ Great starting agent

### 2. **No Problem Nancy** 😊
- **Difficulty:** Easy
- **Agent ID:** `agent_0101k6dvb96zejkv35ncf1zkj88m`
- **Personality:** Warm, agreeable, and trusting
- **Key Traits:**
  - Agrees to most suggestions without pushback
  - Appreciates friendly conversation
  - Makes decisions quickly
  - Great for practicing smooth closes
- **Best For:** Building confidence and perfecting your pitch flow
- **Recommended:** ✅ Perfect for beginners

### 3. **Already Got It Alan** 🤝
- **Difficulty:** Hard
- **Agent ID:** `agent_9901k6dvcv32embbydd7nn0prdgq`
- **Personality:** Loyal to current provider
- **Key Traits:**
  - Satisfied with current pest control company
  - Needs compelling reason to switch
  - Asks about contract terms and cancellation
  - Values consistency and reliability
- **Best For:** Competitive positioning and differentiation tactics

### 4. **Not Interested Nick** 🚪
- **Difficulty:** Very Hard
- **Agent ID:** `agent_7601k6dtrf5fe0k9dh8kwmkde0ga`
- **Personality:** Dismissive, busy, low patience
- **Key Traits:**
  - Says "not interested" within first 10 seconds
  - Tries to close door quickly
  - Needs immediate value hook to stay engaged
  - Responds to pattern interrupts and curiosity
- **Best For:** Mastering opening hooks and pattern interrupts
- **Most Challenging:** ⚠️ Advanced users only

### 5. **DIY Dave** 🔧
- **Difficulty:** Hard
- **Agent ID:** `agent_1701k6dvc3nfejmvydkk7r85tqef`
- **Personality:** Handy, self-reliant
- **Key Traits:**
  - Believes he can handle pest control himself
  - Knows about store-bought products
  - Questions the value of professional service
  - Responds to expertise and time-saving benefits
- **Best For:** Demonstrating professional value over DIY

### 6. **Too Expensive Tim** 💰
- **Difficulty:** Hard
- **Agent ID:** `agent_3901k6dtsjyqfvxbxd1pwzzdham0`
- **Personality:** Price-sensitive, needs ROI
- **Key Traits:**
  - Immediately asks "How much does it cost?"
  - Compares to cheapest competitors
  - Needs value breakdown and ROI explanation
  - Responds to payment plans and guarantees
- **Best For:** Value framing and handling price objections

### 7. **Spouse Check Susan** 👫
- **Difficulty:** Moderate
- **Agent ID:** `agent_4601k6dvddj8fp89cey35hdj9ef8`
- **Personality:** Collaborative decision-maker
- **Key Traits:**
  - Says "I need to check with my husband/wife"
  - Makes joint financial decisions
  - Needs information to share with spouse
  - Responds to urgency and limited-time offers
- **Best For:** Overcoming spouse objection and building urgency

### 8. **Busy Beth** ⏰
- **Difficulty:** Moderate
- **Agent ID:** `agent_4801k6dvap8tfnjtgd4f99hhsf10`
- **Personality:** Rushed, multitasking
- **Key Traits:**
  - Says "I only have a minute"
  - Interrupts to speed things up
  - Appreciates concise, direct communication
  - Responds to quick value propositions
- **Best For:** Respecting time while delivering value efficiently

### 9. **Renter Randy** 🏠
- **Difficulty:** Hard
- **Agent ID:** `agent_5701k6dtt9p4f8jbk8rs1akqwtmx`
- **Personality:** Uncertain about authority
- **Key Traits:**
  - Mentions "I'm just renting"
  - Unsure if landlord would approve
  - Concerned about who pays
  - Needs guidance on renter vs. owner responsibilities
- **Best For:** Navigating authority objections and landlord dynamics

### 10. **Skeptical Sam** 🔍
- **Difficulty:** Hard
- **Agent ID:** `agent_9201k6dts0haecvssk737vwfjy34`
- **Personality:** Suspicious, needs evidence
- **Key Traits:**
  - Questions every claim you make
  - Asks for proof and references
  - Wants to see reviews and testimonials
  - Responds to guarantees and certifications
- **Best For:** Building credibility and using social proof

### 11. **Just Treated Jerry** 📅
- **Difficulty:** Moderate
- **Agent ID:** `agent_8401k6dv9z2kepw86hhe5bvj4djz`
- **Personality:** Organized, plans ahead
- **Key Traits:**
  - Says "We just had pest control done"
  - Not looking for immediate service
  - Open to future scheduling
  - Responds to pre-booking and seasonal offers
- **Best For:** Overcoming timing objections and future booking

### 12. **Think About It Tina** 🤔
- **Difficulty:** Hard
- **Agent ID:** `agent_2501k6btmv4cf2wt8hxxmq4hvzxv`
- **Personality:** Analytical, overthinks decisions
- **Key Traits:**
  - Says "Let me think about it"
  - Wants to research and compare options
  - Struggles with decision-making
  - Responds to limited-time offers and risk reversal
- **Best For:** Creating urgency and overcoming analysis paralysis

## Testing Protocol

### Pre-Testing Setup
1. Ensure all environment variables are configured (ELEVENLABS_API_KEY)
2. Verify database connections
3. Check that all agent IDs are correctly configured

### Testing Each Agent

For each agent, perform the following tests:

#### 1. **Connection Test**
- [ ] Agent successfully connects
- [ ] Voice quality is clear
- [ ] No latency issues
- [ ] Conversation flows naturally

#### 2. **Personality Consistency**
- [ ] Agent maintains character throughout conversation
- [ ] Responds appropriately to different approaches
- [ ] Uses expected objections and language

#### 3. **Objection Handling**
- [ ] Agent presents expected objections
- [ ] Responds realistically to counter-arguments
- [ ] Escalates appropriately if not handled well

#### 4. **Scoring Accuracy**
- [ ] Session records correctly
- [ ] Transcript captures accurately
- [ ] Grading reflects actual performance
- [ ] Feedback is relevant to agent type

#### 5. **Edge Cases**
- [ ] Handles long pauses appropriately
- [ ] Responds to off-topic questions
- [ ] Gracefully ends conversation when appropriate
- [ ] Handles technical difficulties

### Test Script Template

```
Opening: "Hi, I'm [name] from [company]. I noticed you're a homeowner in the area..."

Objection 1 Response: [Record agent's objection]
Your Counter: [Note your response]
Agent Follow-up: [Record agent's follow-up]

Objection 2 Response: [Record agent's objection]
Your Counter: [Note your response]
Agent Follow-up: [Record agent's follow-up]

Close Attempt: [Document close attempt and result]
```

### Difficulty Progression

**Recommended Training Path:**
1. Start with Easy: No Problem Nancy
2. Move to Moderate: Austin, Spouse Check Susan, Busy Beth, Just Treated Jerry
3. Progress to Hard: Already Got It Alan, DIY Dave, Too Expensive Tim, Renter Randy, Skeptical Sam, Think About It Tina
4. Master Very Hard: Not Interested Nick

### Success Criteria

Each agent should meet these criteria:
- ✅ Maintains consistent personality
- ✅ Presents realistic objections
- ✅ Responds naturally to conversation flow
- ✅ Provides challenging but fair practice
- ✅ Generates accurate scoring and feedback

### Known Issues & Workarounds

Document any issues discovered during testing:

1. **Issue:** [Description]
   - **Workaround:** [Solution]
   - **Status:** [Open/Fixed]

2. **Issue:** [Description]
   - **Workaround:** [Solution]
   - **Status:** [Open/Fixed]

### Performance Metrics

Track these metrics for each agent:
- Average session duration
- Typical score range
- Most common objections used
- Success rate (deals closed)
- User feedback rating

## Continuous Improvement

- Review agent performance monthly
- Collect user feedback on realism
- Update agent prompts based on real-world scenarios
- Balance difficulty levels
- Add new agents based on common objections

## Support

For issues with agents:
1. Check ElevenLabs dashboard for agent status
2. Verify agent IDs in `components/trainer/personas.ts`
3. Review conversation logs in database
4. Contact ElevenLabs support if agent behavior is inconsistent

---

**Last Updated:** October 14, 2025
**Tested By:** [Your Name]
**Status:** All agents configured and ready for testing

