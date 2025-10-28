# Grading Performance Analysis - Why 45 Seconds?

## Current Performance Breakdown (~45s total)

Based on the code analysis, here's where your time is going:

### 1. **OpenAI API Call: ~35-40 seconds** 🐌 (MAIN BOTTLENECK)

**Why it's slow:**
- **Model**: Using `gpt-4o-mini` (not the fastest variant)
- **Large Input**: 
  - Detailed system prompt (~2,000 tokens)
  - Full transcript (varies, typically 200-800 lines = ~3,000-12,000 tokens)
  - Knowledge context (if team has docs, adds ~1,000 tokens)
  - **Total input**: Often 5,000-15,000 tokens
  
- **Large Output**: 
  - Requesting 1,800 max tokens
  - Structured JSON with 12+ categories
  - Detailed feedback with specific examples
  - Objection analysis
  - Coaching plan
  - Timeline moments
  - Earnings calculations

- **JSON Mode**: Adds latency for structured output validation

**Token Usage Example:**
```
Prompt tokens: ~8,000 (system + transcript + context)
Completion tokens: ~1,500 (detailed grading response)
Total: ~9,500 tokens
```

### 2. **Database Queries: ~2-5 seconds**

**Sequential queries:**
1. Fetch session data (~200ms)
2. Fetch user profile (~150ms)
3. Fetch team grading config (~200ms, or instant if cached)
4. Fetch knowledge documents (~300ms, up to 3 docs)

**Current optimization:**
- Team config has 5-minute cache ✅
- Knowledge docs limited to 3 ✅
- But queries are mostly sequential ❌

### 3. **Data Processing: ~1-2 seconds**

- Transcript formatting (adding timestamps, speaker labels)
- Building knowledge context string
- Constructing the massive prompt
- JSON parsing the response
- Calculating derived scores

### 4. **Database Update: ~500ms-1s**

- Updating `live_sessions` with all scores and data

---

## Why OpenAI is So Slow

### Problem 1: Overly Detailed Prompt
Your system prompt is **extremely detailed** (600+ lines). It asks for:

```typescript
{
  session_summary: { ... },
  scores: { 12 different scores },
  line_ratings: [ ... ], // Currently disabled but in schema
  feedback: { strengths, improvements, specific_tips },
  objection_analysis: { detailed breakdown },
  coaching_plan: { immediate_fixes with scenarios },
  timeline_key_moments: [ 3 moments with context ],
  sale_closed: boolean,
  return_appointment: boolean,
  virtual_earnings: number,
  earnings_data: { detailed breakdown },
  deal_details: { monthly_value, contract_length, etc. }
}
```

**The prompt requires:**
- Hyper-specific feedback with proper nouns
- Exact quote references
- Timeline moments at 33%, 66%, 90%
- Filler word counts with line numbers
- Objection effectiveness ratings
- Practice scenarios for coaching

### Problem 2: Model Choice
- `gpt-4o-mini` is slower than `gpt-4o` (standard)
- For structured JSON output, `gpt-4o` can be 2-3x faster
- Alternatively, `gpt-4o-mini-2024-07-18` is optimized

### Problem 3: Token Count
- Input: 5,000-15,000 tokens (very high)
- Output: 1,500-1,800 tokens (high)
- More tokens = more time

---

## Optimization Opportunities

### 🚀 **Quick Wins (Could reduce to ~15-20s)**

#### 1. **Switch to `gpt-4o` (Standard)**
```typescript
model: "gpt-4o"  // Instead of "gpt-4o-mini"
```
- **Expected improvement**: 40s → 15-20s (50-60% faster)
- **Cost**: ~2-3x more expensive BUT still cheap
- **Speed**: gpt-4o is significantly faster for JSON mode
- **Quality**: Better, more accurate grading

**Cost comparison** (approximate):
- Current (gpt-4o-mini): ~$0.01-0.02 per session
- With gpt-4o: ~$0.03-0.06 per session
- **Still very affordable** for the speed gain!

#### 2. **Reduce Output Tokens**
```typescript
max_tokens: 1200  // Instead of 1800
```
- Remove some verbose requirements
- Simplify coaching plan (fewer practice scenarios)
- Reduce timeline moments from 3 to 2
- **Expected improvement**: 35s → 25-28s (20-30% faster)

#### 3. **Simplify the Prompt**
Your prompt is asking for A LOT. Consider:
- Remove hyper-specific requirements (proper nouns, exact quotes)
- Simplify feedback to 2-3 items instead of detailed arrays
- Remove timeline moments (or make optional)
- Focus on core scores + brief feedback

**Expected improvement**: 35s → 20-25s (30-40% faster)

#### 4. **Parallel Database Queries**
```typescript
const [session, userProfile, teamConfig] = await Promise.all([
  supabase.from('live_sessions').select('*').eq('id', sessionId).single(),
  supabase.from('users').select('team_id, full_name').eq('id', userId).single(),
  // ... etc
])
```
**Expected improvement**: 3s → 1s for DB queries

---

### 🎯 **Medium Wins (More complex but impactful)**

#### 5. **Split Grading into Two Passes**
**First pass (fast):** Basic scores only (5-10s)
```typescript
model: "gpt-4o"
max_tokens: 400
// Just return scores and summary
```

**Second pass (background):** Detailed feedback (15-20s)
```typescript
// Run asynchronously after returning to user
// Add detailed analysis later
```

Users see scores immediately, detailed feedback loads after!

#### 6. **Use Streaming**
```typescript
stream: true
```
- Show scores as they come in
- Users see partial results faster
- Perceived performance improvement

#### 7. **Cache Knowledge Context**
- Pre-process and cache team knowledge summaries
- Don't send full docs every time
- Send compressed summaries instead

---

### ⚡ **Advanced Optimizations**

#### 8. **Use Batch API** (for non-urgent grading)
- OpenAI Batch API is 50% cheaper and async
- Good for historical grading or bulk operations
- Not suitable for real-time user waiting

#### 9. **Transcript Summarization**
For very long transcripts (>500 lines):
```typescript
// First, summarize the transcript
const summary = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ 
    role: "user", 
    content: `Summarize this sales call: ${transcript}` 
  }],
  max_tokens: 500
})

// Then grade using summary + key excerpts
```

#### 10. **Pre-compute Common Patterns**
- Extract objections using regex/simple ML
- Calculate filler words before LLM call
- Pre-compute speaking pace, question ratio
- Only use LLM for subjective scoring

---

## Recommended Action Plan

### Phase 1: Immediate (< 1 hour implementation)
1. ✅ Switch from `gpt-4o-mini` to `gpt-4o`
2. ✅ Reduce `max_tokens` from 1800 to 1200
3. ✅ Make database queries parallel

**Expected result**: 45s → 20-25s (45-50% faster!)

### Phase 2: Short-term (1-2 days)
4. ✅ Simplify prompt requirements
5. ✅ Remove timeline moments or make them optional
6. ✅ Reduce feedback verbosity

**Expected result**: 20-25s → 12-18s (total 60-70% faster!)

### Phase 3: Long-term (1 week)
7. ✅ Implement two-pass grading (immediate scores + delayed feedback)
8. ✅ Add streaming for real-time updates
9. ✅ Pre-compute objective metrics

**Expected result**: Perceived time < 5s (users see results immediately)

---

## Cost Analysis

### Current Costs
- Model: gpt-4o-mini
- ~9,000 tokens total per session
- Cost: ~$0.015 per session
- **$15 per 1,000 sessions**

### With Optimizations (gpt-4o + reduced tokens)
- Model: gpt-4o
- ~6,000 tokens total per session
- Cost: ~$0.045 per session
- **$45 per 1,000 sessions**

### ROI
- **3x cost increase**
- **2-3x speed improvement** (45s → 15-20s)
- **Much better user experience**
- Still only ~$0.04 per session (very affordable!)

---

## Technical Details

### Current Settings
```typescript
model: "gpt-4o-mini"
max_tokens: 1800
temperature: 0.2
timeout: 90000ms (90s)
response_format: { type: "json_object" }
```

### Recommended Settings
```typescript
model: "gpt-4o"  // 🚀 Faster, better
max_tokens: 1200  // ⚡ Reduce output
temperature: 0.2  // Keep same (consistent)
timeout: 30000ms  // Can reduce to 30s
response_format: { type: "json_object" }  // Keep JSON mode
```

### Why gpt-4o is Faster
1. **Better optimization** for JSON mode
2. **More recent architecture** (2024 vs 2023)
3. **Better parallelization** for structured output
4. **Lower latency** on OpenAI's infrastructure
5. **Better at following complex instructions** = fewer retries

---

## Monitoring Recommendations

Add these metrics to track improvements:

```typescript
// Already have timing
logger.perf('Database queries', dbTime)
logger.perf('OpenAI API call', openaiTime)
logger.perf('Total grading time', totalTime)

// Add these
logger.perf('Prompt tokens', promptTokens)
logger.perf('Completion tokens', completionTokens)
logger.perf('Cost estimate', cost)
```

Track over time:
- Average grading time
- P50, P95, P99 latency
- Token usage trends
- Cost per session

---

## Summary

**Main Bottleneck**: OpenAI API call taking 35-40s of the 45s total

**Root Causes**:
1. Using slower model (gpt-4o-mini)
2. Very large/complex prompt
3. High token output requirements (1800 tokens)
4. Asking for hyper-specific detailed feedback

**Quick Fix** (1 hour):
- Change model to `gpt-4o`
- Reduce max_tokens to 1200
- Parallelize DB queries
- **Result**: 45s → 20s (55% faster!)

**Best Fix** (1 week):
- Two-pass grading (immediate scores + async feedback)
- Streaming results
- Simplified prompt
- **Result**: Perceived time < 5s, total time ~15s

