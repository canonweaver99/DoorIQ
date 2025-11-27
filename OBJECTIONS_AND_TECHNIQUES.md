# Objections and Techniques Detection Guide

This document lists all objections and sales techniques that DoorIQ detects during live sessions and analytics.

---

## 🚫 OBJECTIONS DETECTED

### Enhanced System (Used in Live Session Analysis)

All objections use context-aware detection to reduce false positives. The system analyzes surrounding transcript entries to ensure accurate detection.

#### 1. **Price**
- **Patterns** (Regex):
  - `/too expensive/i`
  - `/can't afford/i`
  - `/cost too much/i`
  - `/price/i`
  - `/money/i`
  - `/cheaper/i`
  - `/financial/i`
- **Severity**: `high`
- **Suggested Approach**: "Pivot to value, ROI, and payment options"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 2. **Timing**
- **Patterns** (Regex):
  - `/not (a good|the right) time/i`
  - `/maybe later/i`
  - `/think about it/i`
  - `/not right now/i`
  - `/busy/i`
  - `/come back/i`
  - `/another time/i`
  - `/let me think/i`
- **Severity**: `medium`
- **Suggested Approach**: "Create urgency and highlight immediate benefits"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 3. **Trust**
- **Patterns** (Regex):
  - `/don't trust/i`
  - `/scam/i`
  - `/legitimate/i`
  - `/never heard of/i`
  - `/references/i`
  - `/proof/i`
  - `/how do I know/i`
  - `/sketchy/i`
  - `/door to door/i`
- **Severity**: `critical`
- **Suggested Approach**: "Build credibility with social proof and guarantees"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 4. **Need**
- **Patterns** (Regex):
  - `/don't need/i`
  - `/not interested/i`
  - `/don't want/i`
  - `/no problems/i`
  - `/doing fine/i`
  - `/already have/i`
  - `/handle it myself/i`
- **Severity**: `medium`
- **Suggested Approach**: "Discover hidden pain points and educate on risks"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 5. **Authority**
- **Patterns** (Regex):
  - `/speak to my (spouse|husband|wife|partner)/i`
  - `/not my decision/i`
  - `/need to ask/i`
  - `/can't decide/i`
  - `/talk it over/i`
  - `/need approval/i`
- **Severity**: `medium`
- **Suggested Approach**: "Get commitment for follow-up or include decision maker"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 6. **Comparison**
- **Patterns** (Regex):
  - `/shop around/i`
  - `/get other quotes/i`
  - `/compare prices/i`
  - `/what makes you different/i`
  - `/why should I choose/i`
  - `/competitors/i`
- **Severity**: `low`
- **Suggested Approach**: "Highlight unique value propositions and create urgency"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 7. **Skepticism**
- **Patterns** (Regex):
  - `/does it really work/i`
  - `/guarantee/i`
  - `/what if it doesn't/i`
  - `/seen this before/i`
  - `/tired of/i`
  - `/promises/i`
- **Severity**: `medium`
- **Suggested Approach**: "Share success stories and offer guarantees"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 8. **Renter/Ownership** ⭐ NEW
- **Patterns** (Regex):
  - `/renting/i`
  - `/don't own/i`
  - `/landlord/i`
  - `/tenant/i`
  - `/not my house/i`
  - `/apartment/i`
  - `/rental/i`
  - `/don't own the/i`
- **Severity**: `medium`
- **Suggested Approach**: "Offer to contact landlord or provide tenant-friendly solutions"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 9. **Existing Service** ⭐ NEW
- **Patterns** (Regex):
  - `/already have someone/i`
  - `/under contract/i`
  - `/current provider/i`
  - `/already use/i`
  - `/have a guy/i`
  - `/already have a/i`
  - `/current company/i`
  - `/already signed/i`
- **Severity**: `medium`
- **Suggested Approach**: "Discover contract end date and highlight switching benefits"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 10. **No Problem Perceived** ⭐ NEW
- **Patterns** (Regex):
  - `/no bugs/i`
  - `/haven't seen any/i`
  - `/don't have pests/i`
  - `/not a problem/i`
  - `/no issues/i`
  - `/no problems/i`
  - `/haven't noticed/i`
  - `/don't see any/i`
- **Severity**: `high`
- **Suggested Approach**: "Educate on hidden infestations and preventive value"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 11. **Contract Fear** ⭐ NEW
- **Patterns** (Regex):
  - `/is this a contract/i`
  - `/locked in/i`
  - `/cancel anytime/i`
  - `/commitment/i`
  - `/how long/i`
  - `/contract term/i`
  - `/long term/i`
  - `/obligation/i`
- **Severity**: `medium`
- **Suggested Approach**: "Clarify flexible terms and cancellation policy"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 12. **Door Policy** ⭐ NEW
- **Patterns** (Regex):
  - `/don't buy at the door/i`
  - `/no soliciting/i`
  - `/don't do business this way/i`
  - `/never buy from/i`
  - `/no door to door/i`
  - `/don't buy door to door/i`
  - `/no solicitation/i`
- **Severity**: `critical`
- **Suggested Approach**: "Respect policy, offer alternative contact method"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 13. **Brush-Off** ⭐ NEW
- **Patterns** (Regex):
  - `/I'll call you/i`
  - `/leave a card/i`
  - `/give me your number/i`
  - `/reach out later/i`
  - `/call you later/i`
  - `/contact you later/i`
  - `/get back to you/i`
  - `/follow up later/i`
- **Severity**: `high`
- **Suggested Approach**: "Create urgency and get commitment for follow-up"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 14. **Bad Past Experience** ⭐ NEW
- **Patterns** (Regex):
  - `/tried that before/i`
  - `/didn't work/i`
  - `/waste of money/i`
  - `/last company/i`
  - `/burned before/i`
  - `/previous company/i`
  - `/didn't help/i`
  - `/wasn't worth it/i`
- **Severity**: `high`
- **Suggested Approach**: "Acknowledge concern, differentiate your service"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

#### 15. **Just Moved** ⭐ NEW
- **Patterns** (Regex):
  - `/just moved/i`
  - `/new to the area/i`
  - `/just bought/i`
  - `/settling in/i`
  - `/recently moved/i`
  - `/new homeowner/i`
  - `/just purchased/i`
- **Severity**: `low`
- **Suggested Approach**: "Welcome them, offer new homeowner special"
- **Detection Method**: Case-insensitive regex match
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

---

## ✅ TECHNIQUES DETECTED

### 1. **Open-Ended Question**
- **Detection Method**: Regex pattern at start of text
- **Pattern**: `/^(what|how|why|when|where|tell me|can you explain)/i`
- **Examples**: 
  - "What do you think?"
  - "How does that work?"
  - "Why is that important?"
  - "Tell me more about..."
  - "Can you explain..."
- **Display Name**: "Open-Ended Question"
- **Location**: `components/analytics/InstantInsightsGrid.tsx`, `hooks/useLiveSessionAnalysis.ts`, `lib/trainer/enhancedPatternAnalyzer.ts`

### 2. **Feel-Felt-Found**
- **Patterns**: 
  - `'i understand how you feel'`
  - `'i felt the same way'`
  - `'others have felt'`
  - `'i know how you feel'`
  - `'i felt that'`
  - `'others felt'`
  - `'i've felt'`
- **Detection Method**: Case-insensitive substring match
- **Display Name**: "Feel-Felt-Found"
- **Location**: `components/analytics/InstantInsightsGrid.tsx`, `hooks/useLiveSessionAnalysis.ts`

### 3. **Social Proof**
- **Patterns**: 
  - `'other customers'`
  - `'neighbors'`
  - `'other homeowners'`
  - `'many customers'`
  - `'lots of people'`
  - `'others have'`
  - `'most people'`
  - `'customers say'`
  - `'neighbors love'`
  - `'everyone says'`
- **Detection Method**: Case-insensitive substring match
- **Display Name**: "Social Proof"
- **Location**: `components/analytics/InstantInsightsGrid.tsx`, `hooks/useLiveSessionAnalysis.ts`

### 4. **Urgency**
- **Patterns**: 
  - `'limited time'`
  - `'today only'`
  - `'special offer'`
  - `'act now'`
  - `'don't wait'`
  - `'limited availability'`
  - `'while supplies last'`
  - `'expires soon'`
  - `'ending soon'`
  - `'last chance'`
- **Detection Method**: Case-insensitive substring match
- **Display Name**: "Urgency"
- **Location**: `components/analytics/InstantInsightsGrid.tsx`, `hooks/useLiveSessionAnalysis.ts`

### 5. **Active Listening**
- **Patterns**: 
  - `'i hear you'`
  - `'i understand'`
  - `'that makes sense'`
  - `'i see'`
  - `'got it'`
  - `'i get that'`
  - `'absolutely'`
  - `'you're right'`
  - `'i can see why'`
  - `'that's understandable'`
- **Detection Method**: Case-insensitive substring match
- **Display Name**: "Active Listening"
- **Location**: `components/analytics/InstantInsightsGrid.tsx`, `hooks/useLiveSessionAnalysis.ts`

### 6. **Tie-Down** ⭐ NEW
- **Patterns** (Regex):
  - `/\bright\?/i`
  - `/wouldn't you agree/i`
  - `/makes sense/i`
  - `/don't you think/i`
  - `/fair enough/i`
  - `/\bright\b/i`
  - `/doesn't it/i`
  - `/wouldn't it/i`
- **Display Name**: "Tie-Down"
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

### 7. **Future Pacing** ⭐ NEW
- **Patterns** (Regex):
  - `/\bimagine\b/i`
  - `/picture this/i`
  - `/\bthink about\b/i`
  - `/wouldn't it be nice/i`
  - `/what if you could/i`
  - `/picture yourself/i`
  - `/envision/i`
- **Display Name**: "Future Pacing"
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

### 8. **Pain Discovery** ⭐ NEW
- **Patterns** (Regex):
  - `/have you noticed/i`
  - `/what kind of bugs/i`
  - `/how often do you see/i`
  - `/what's been your experience/i`
  - `/what problems/i`
  - `/what issues/i`
  - `/what challenges/i`
- **Display Name**: "Pain Discovery"
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

### 9. **Takeaway** ⭐ NEW
- **Patterns** (Regex):
  - `/might not be for you/i`
  - `/not for everyone/i`
  - `/\bonly if\b/i`
  - `/no pressure/i`
  - `/totally understand if/i`
  - `/might not work/i`
  - `/not right for/i`
- **Display Name**: "Takeaway"
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

### 10. **Alternative Close** ⭐ NEW
- **Patterns** (Regex):
  - `/morning or afternoon/i`
  - `/this week or next/i`
  - `/would you prefer/i`
  - `/which works better/i`
  - `/today or tomorrow/i`
  - `/this or that/i`
  - `/option a or b/i`
- **Display Name**: "Alternative Close"
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

### 11. **Price Reframe** ⭐ NEW
- **Patterns** (Regex):
  - `/less than a dollar/i`
  - `/cost of a coffee/i`
  - `/pennies a day/i`
  - `/\bcompared to\b/i`
  - `/cheaper than/i`
  - `/only.*per day/i`
  - `/just.*per/i`
  - `/that's only/i`
- **Display Name**: "Price Reframe"
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

### 12. **Third-Party Story** ⭐ NEW
- **Patterns** (Regex):
  - `/had a customer/i`
  - `/talked to someone/i`
  - `/neighbor down the street/i`
  - `/just last week/i`
  - `/funny story/i`
  - `/customer of mine/i`
  - `/someone I know/i`
  - `/neighbor of yours/i`
- **Display Name**: "Third-Party Story"
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

### 13. **Pattern Interrupt** ⭐ NEW
- **Patterns** (Regex):
  - `/before you say no/i`
  - `/I know what you're thinking/i`
  - `/hear me out/i`
  - `/quick question/i`
  - `/before you decide/i`
  - `/hold on/i`
  - `/wait a second/i`
- **Display Name**: "Pattern Interrupt"
- **Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

---

## 📊 ADDITIONAL PATTERNS (Enhanced Analyzer Only)

### Close Attempts

#### **Soft Close**
- **Patterns** (Regex):
  - `/would you like to/i`
  - `/shall we/i`
  - `/can we schedule/i`
  - `/does.*sound good/i`
  - `/how.*feel about/i`
  - `/what do you think/i`

#### **Hard Close**
- **Patterns** (Regex):
  - `/let's get you started/i`
  - `/I'll set you up/i`
  - `/here's what we'll do/i`
  - `/I'm going to/i`
  - `/we're going to/i`

#### **Assumptive Close**
- **Patterns** (Regex):
  - `/when we start/i`
  - `/your first treatment/i`
  - `/once you're enrolled/i`
  - `/after we begin/i`
  - `/during your service/i`

#### **Urgency Close**
- **Patterns** (Regex):
  - `/today only/i`
  - `/limited time/i`
  - `/special pricing/i`
  - `/this week/i`
  - `/expires/i`
  - `/last chance/i`
  - `/while I'm here/i`

**Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

---

### Micro-Commitments (Context-Aware)

Micro-commitments are now detected with context awareness to reduce false positives.

#### **Minimal**
- **Patterns** (Regex):
  - `/uh huh/i`
  - `/I see/i`
  - `/right/i`
  - `/mhm/i`
- **Context Rules**: 
  - `'okay'` and `'sure'` only count if followed by engagement words ('tell me more', 'sounds good', 'I'm interested')
  - `'yes'` and `'yeah'` only count if in response to a question (preceded by '?' in recent context) AND not standalone filler

#### **Moderate**
- **Patterns** (Regex):
  - `/that's interesting/i`
  - `/tell me more/i`
  - `/how does that work/i`
  - `/what.*include/i`
  - `/explain/i`
  - `/good to know/i`
  - `/didn't realize/i`

#### **Strong**
- **Patterns** (Regex):
  - `/I like that/i`
  - `/that would help/i`
  - `/we need that/i`
  - `/sounds good/i`
  - `/that's important/i`
  - `/definitely need/i`
  - `/been looking for/i`

#### **Buying**
- **Patterns** (Regex):
  - `/when can you start/i`
  - `/what's next/i`
  - `/how do I sign up/i`
  - `/where do I sign/i`
  - `/let's do it/i`
  - `/I'm ready/i`
  - `/count me in/i`
  - `/what's the process/i`

**Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

---

## 🔍 CONTEXT-AWARE DETECTION

The enhanced system uses context-aware pattern matching to reduce false positives:

### Context Rules

1. **'later' Pattern**
   - Only matches if preceded by: `'call me'`, `'come back'`, `'reach out'`, `'contact'`, `'follow up'`
   - OR followed by negative sentiment: `'don't'`, `'won't'`, `'can't'`, `'not interested'`, `'no thanks'`
   - Prevents false positives like "I'll see you later" (not an objection)

2. **'budget' Pattern**
   - Only matches if in price objection context (near: `'afford'`, `'cost'`, `'price'`, `'money'`, `'expensive'`, `'cheap'`, `'pay'`, `'dollar'`)
   - Prevents false positives like "what's included in the budget" (neutral context)

3. **'okay'/'sure' as Micro-Commitments**
   - Only counts if followed by engagement words: `'tell me more'`, `'sounds good'`, `'I'm interested'`, `'go ahead'`, `'continue'`
   - Prevents counting filler words as buying signals

4. **'yes'/'yeah' as Micro-Commitments**
   - Only counts if in response to a question (preceded by `'?'` in recent context)
   - AND not standalone filler (must have engagement context)
   - Prevents counting generic affirmations

### Implementation

- Context window: Analyzes previous 2-3 transcript entries
- Uses regex with negative lookbehind/lookahead where possible
- Context scoring function weights patterns based on surrounding text

**Location**: `lib/trainer/enhancedPatternAnalyzer.ts` - `detectWithContext()` function

---

## 📈 STRUCTURAL IMPROVEMENTS

### Objection Sequence Tracking

The system tracks the order of objections to detect patterns:

- **Sequence Storage**: `objectionSequence: ObjectionType[]`
- **Pattern Detection**: 
  - "price after spouse" vs "price first" = different signals
  - Early objections (first 30 seconds) = brush-off signal
  - Late objections (after value build) = genuine concern
- **Functions**: `trackObjection()`, `getObjectionSequence()`, `resetObjectionSequence()`

**Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

### Objection Timing Metrics

Objections are categorized by when they appear in the conversation:

- **Early** (<30 seconds): Indicates brush-off signal
- **Mid** (30s-2min): Standard timing
- **Late** (>2min): Genuine concern after value build

**Function**: `calculateObjectionTiming()`

**Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

### Objection Resolution Detection

Enhanced objection handling assessment:

- **Technique Detection**: Checks if rep used a technique immediately after objection
- **Scoring**: Technique used within 3 exchanges = handled well
- **Quality Levels**: `poor`, `adequate`, `good`, `excellent`
- **Resolution Rate**: Tracked per objection type

**Function**: `assessObjectionHandling()` (enhanced)

**Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

### Buying Temperature Score

Tracks micro-commitment progression over time:

- **Scoring**: minimal=1, moderate=2, strong=3, buying=5
- **Weighting**: Recent commitments weighted higher (exponential decay over 10 minutes)
- **Trend Detection**: 
  - `warming_up`: Recent scores > older scores by 20%+
  - `cooling_off`: Recent scores < older scores by 20%+
  - `stable`: No significant change
- **History**: Stores last 20 commitments with timestamps

**Function**: `calculateBuyingTemperature()`

**Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

### Objection Stacking Detection

Flags when multiple objections occur rapidly:

- **Detection**: 3+ objections within 30 seconds
- **Signal**: Indicates "trying to get rid of you" vs genuine concerns
- **Metadata**: Adds `isStacked: boolean` flag to objection metadata
- **Coaching**: Provides different feedback for stacked objections

**Function**: `detectObjectionStacking()`

**Location**: `lib/trainer/enhancedPatternAnalyzer.ts`

---

## 🔍 DETECTION METHOD SUMMARY

### Enhanced System (Primary)
- **Method**: Context-aware regex pattern matching
- **Implementation**: `detectObjection(text, contextWindow, contextIndex)` with `detectWithContext()` helper
- **Used For**: Live session analysis with severity levels, timing metrics, sequence tracking, and advanced analytics
- **Files**: 
  - `lib/trainer/enhancedPatternAnalyzer.ts` (primary)
  - `hooks/useLiveSessionAnalysis.ts` (integrated)
  - `components/analytics/InstantInsightsGrid.tsx` (fallback to enhanced)
  - `app/api/session/route.ts` (backend calculation)

### Legacy System (Fallback)
- **Method**: Simple substring matching
- **Implementation**: `text.toLowerCase().includes(pattern)`
- **Used For**: Backward compatibility and fallback detection
- **Files**: 
  - `components/analytics/InstantInsightsGrid.tsx`
  - `hooks/useLiveSessionAnalysis.ts`
  - `app/api/session/route.ts`

### Open-Ended Questions
- **Method**: Regex at start of text
- **Implementation**: `/^(what|how|why|when|where|tell me|can you explain)/i.test(text.trim())`
- **Special Case**: Checks if text starts with question words

---

## 📝 NOTES

- **Enhanced System**: Primary detection method with:
  - Context-aware pattern matching to reduce false positives
  - Severity levels (low, medium, high, critical)
  - Suggested approaches for handling objections
  - Timing metrics (early, mid, late)
  - Sequence tracking
  - Objection stacking detection
  - Buying temperature scoring
  - Enhanced micro-commitment detection

- **Legacy System**: Maintained for backward compatibility and fallback

- All detection is **case-insensitive**

- Multiple techniques/objections can be detected in a single transcript entry

- Context-aware detection analyzes previous 2-3 transcript entries to improve accuracy

- Objection sequences, timing, and buying temperature are tracked throughout the session

---

## 🎯 DETECTION ACCURACY IMPROVEMENTS

### False Positive Reduction

1. **'later'**: Now only triggers in objection context (call me later, come back later) vs casual use (see you later)
2. **'budget'**: Only matches in price objection context, not neutral mentions
3. **'okay'/'sure'**: Only counts as micro-commitment with engagement context
4. **'yes'/'yeah'**: Only counts when responding to questions, not as filler

### Advanced Analytics

1. **Sequence Patterns**: Identifies objection patterns (e.g., price after spouse = different signal than price first)
2. **Timing Analysis**: Early objections flagged as brush-offs, late objections as genuine concerns
3. **Buying Temperature**: Tracks engagement progression over time with weighted scoring
4. **Objection Stacking**: Detects rapid-fire objections indicating dismissal vs real concerns

---

## 📚 RELATED FILES

- `lib/trainer/enhancedPatternAnalyzer.ts` - Core detection logic with context awareness
- `hooks/useLiveSessionAnalysis.ts` - Live session integration with analytics
- `components/analytics/InstantInsightsGrid.tsx` - Analytics display component
- `app/api/session/route.ts` - Backend calculation and storage
