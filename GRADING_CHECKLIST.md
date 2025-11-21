# Grading Checklist - What Gets Analyzed

This document lists all the items that are currently being graded and analyzed during a session review.

## 📊 Session Summary
- **Total lines** in conversation
- **Rep lines** (sales rep speaking)
- **Customer lines** (homeowner speaking)
- **Objections detected** (count)
- **Questions asked** (count)

## 🎯 Performance Scores (0-100 each)
1. **Overall Score** - Average of all scores
2. **Rapport** - Connection, warmth, trust building
3. **Discovery** - Questions asked, needs assessment quality
4. **Objection Handling** - How well objections were addressed
5. **Closing** - Commitment attempts
   - 90-100: Sale closed
   - 75-89: Appointment scheduled
   - 60-74: Trial close attempted
   - 40-59: Weak ask
   - 0-39: No close attempt
6. **Safety** - Pet/child safety mentions
7. **Introduction** - Opening strength and effectiveness
8. **Listening** - Acknowledgment, paraphrasing, active engagement
9. **Speaking Pace** - Appropriate speed of speech
10. **Question Ratio** - Questions vs statements (30-40% ideal)
11. **Active Listening** - Reflects understanding of customer needs
12. **Assumptive Language** - Use of "when" vs "if" language

## 💬 Feedback Analysis
- **Strengths** - Specific examples with exact details from conversation
- **Improvements** - Specific issues with concrete examples
- **Specific Tips** - Actionable tips with context

## ⚠️ Objection Analysis
- **Total objections** detected
- **Individual objections** with:
  - Exact customer quote
  - How rep responded
  - Effectiveness rating (good/poor)

## 🎓 Coaching Plan
- **Immediate Fixes** - Issues with examples, practice scenarios, and resources
- **Skill Development** - Areas for growth
- **Role Play Scenarios** - Specific scenarios based on actual conversation topics

## ⏱️ Timeline Key Moments
Three key moments identified at:
- **33%** of conversation - Opening analysis
- **66%** of conversation - Key moment
- **90%** of conversation - Close attempt

Each moment includes:
- Line number
- Timestamp
- Moment type
- Actual quote from conversation
- Whether it was positive or negative
- Specific actionable takeaway

## 💰 Sales & Earnings Analysis
- **Sale Closed** - Boolean (true ONLY if customer committed to PAID service)
- **Return Appointment** - Boolean (true if appointment/inspection scheduled)
- **Virtual Earnings** - Calculated commission (total_contract_value × 0.30)

### Earnings Data Breakdown
- Base amount
- Closed amount
- Commission rate (always 0.30 / 30%)
- Commission earned
- Bonus modifiers:
  - Quick close bonus
  - Upsell bonus
  - Retention bonus
  - Same day start bonus
  - Referral secured bonus
  - Perfect pitch bonus
- Total earned

### Deal Details
- Product sold
- Service type
- Base price
- Monthly value
- Contract length
- Total contract value
- Payment method
- Add-ons
- Start date
- Next step (if no sale but next step agreed)
- Next step type (return_appointment, callback, inspection, think_it_over, spouse_discussion)

## 🗣️ Enhanced Metrics

### Filler Words Analysis
- **Total count** of filler words
- **Per minute** rate
- **Common fillers** breakdown:
  - "um"
  - "uh"
  - "uhh"
  - "like" (only counted when used as filler, not in normal speech)
  - "erm"
  - "err"
  - "hmm"
- **Locations** - Each filler word with:
  - Line number where it occurred
  - Timestamp
  - Full text quote containing the filler word

## 🎤 Voice Analysis (Collected but NOT in AI Grading)

**Note:** Voice analysis data is collected during live sessions via audio analysis, but is **NOT currently included** in the OpenAI grading prompt. This data is stored separately and displayed in the UI.

### Voice Metrics Collected:
- **Pitch Analysis**:
  - Average pitch (Hz)
  - Minimum pitch (Hz)
  - Maximum pitch (Hz)
  - Pitch variation (percentage)
  - Pitch timeline (tracked every 500ms)
  - Monotone detection (periods with low variation)

- **Volume Analysis**:
  - Average volume (dB)
  - Volume consistency (coefficient of variation)
  - Volume timeline (tracked every 500ms)
  - Low energy detection

- **Speech Rate**:
  - Words Per Minute (WPM) - calculated from transcript
  - WPM timeline (tracked every 500ms)
  - Too fast detection (>180 WPM)
  - Too slow detection (<120 WPM)
  - Ideal range: 140-160 WPM

- **Speech Quality Issues Detected**:
  - Too fast
  - Too slow
  - Monotone (low pitch variation)
  - Low energy
  - Excessive fillers
  - Poor endings

- **Pause Analysis**:
  - Long pauses count (>3 seconds between rep lines)

**Current Status:** Voice analysis is displayed in the `SpeechQualitySection` component but the AI grading only scores "speaking_pace" based on transcript analysis, not using the actual audio voice metrics.

## 📝 Notes
- All feedback must reference actual names, topics, and details from the conversation
- Quotes must be exact phrases from the transcript
- Avoid generic advice - everything must be personalized to the specific call
- Inspections are NOT considered sales (sale_closed=false, return_appointment=true)

