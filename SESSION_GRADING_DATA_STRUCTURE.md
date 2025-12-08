# Session Grading Data Structure

## Current Database Structure

### Table: `live_sessions`

#### Columns Being Updated During Grading:

**Core Scores (Direct Columns):**
- `overall_score` (INTEGER) - Overall performance score 0-100
- `rapport_score` (INTEGER) - Rapport building score 0-100
- `discovery_score` (INTEGER) - Discovery questions score 0-100
- `objection_handling_score` (INTEGER) - Objection handling score 0-100
- `close_score` (INTEGER) - Closing technique score 0-100

**Sale/Deal Status:**
- `sale_closed` (BOOLEAN) - Whether the sale closed
- `return_appointment` (BOOLEAN) - Whether a return appointment was scheduled
- `virtual_earnings` (DECIMAL) - Amount earned from this session

**Earnings & Deal Data (JSONB):**
- `earnings_data` (JSONB) - Detailed earnings breakdown:
  ```json
  {
    "base_amount": number,
    "closed_amount": number,
    "total_earned": number
  }
  ```
- `deal_details` (JSONB) - Product/contract details:
  ```json
  {
    "product_sold": string,
    "service_type": string,
    "base_price": number,
    "monthly_value": number,
    "contract_length": number,
    "total_contract_value": number,
    "payment_method": string,
    "add_ons": [],
    "start_date": string
  }
  ```

**Analytics (JSONB):**
- `analytics` (JSONB) - Comprehensive analysis data:
  ```json
  {
    "deep_analysis": {
      "saleClosed": boolean,
      "virtualEarnings": number,
      "finalScores": {
        "overall": number,
        "rapport": number,
        "discovery": number,
        "objectionHandling": number,
        "closing": number
      },
      "overallAssessment": string,
      "topStrengths": string[],
      "topImprovements": string[],
      "session_highlight": string
    },
    "coaching_plan": {
      "immediateFixes": [],
      "rolePlayScenarios": []
    },
    "feedback": {
      "strengths": string[],
      "improvements": string[],
      "specific_tips": string[]
    },
    "earnings_data": {...},
    "deal_details": {...},
    "voice_analysis": {...},
    "grading_version": "2.0",
    "graded_at": "ISO timestamp"
  }
  ```

**Grading Status:**
- `grading_status` (TEXT) - Status: 'pending', 'processing', 'complete', 'failed'
- `grading_version` (TEXT) - Version of grading system used
- `ended_at` (TIMESTAMPTZ) - When session ended (required for earnings trigger)

## Update Flow

### When Grading Completes (`/api/grade/deep-analysis`):

1. **GPT-4o Analysis:**
   - Analyzes ENTIRE transcript
   - Determines: `sale_closed`, `total_contract_value`, `overall_score`, all sub-scores
   - Returns structured JSON with all analysis

2. **Fallback Detection:**
   - If GPT didn't detect sale, fallback patterns check transcript
   - Looks for: buying signals, info collection, rep asking for info
   - Can override `sale_closed` if evidence found

3. **Score Enforcement:**
   - If `sale_closed=true`: Enforces minimum overall score of 80 (85+ if objections handled well)
   - If `sale_closed=true`: Enforces minimum closing score of 90

4. **Database Update:**
   ```typescript
   updateData = {
     overall_score: number,
     rapport_score: number,
     discovery_score: number,
     objection_handling_score: number,
     close_score: number,
     sale_closed: boolean,
     return_appointment: boolean,
     virtual_earnings: number,
     earnings_data: {...},
     deal_details: {...},
     analytics: {...}, // Merged with existing analytics
     grading_status: 'complete',
     grading_version: '2.0',
     ended_at: timestamp // Set if not already set
   }
   ```

5. **Trigger Fires:**
   - `update_user_virtual_earnings_from_live_sessions_trigger`
   - Updates `users.virtual_earnings` when:
     - `virtual_earnings > 0` AND
     - `ended_at IS NOT NULL`

## Current Issues

### Issue 1: Sale Detection Not Working
- **Symptom:** Sessions showing "CLOSE FAILED" even when sale occurred
- **Possible Causes:**
  1. GPT not detecting sale in transcript
  2. Fallback detection not catching it
  3. Data not being saved correctly
  4. Analytics page reading wrong field

### Issue 2: Data Redundancy
- Sale status stored in multiple places:
  - `sale_closed` (column)
  - `analytics.deep_analysis.saleClosed` (JSONB)
  - `analytics.earnings_data` (JSONB)
- Could lead to inconsistencies

### Issue 3: No Audit Trail
- No way to see:
  - When grading happened
  - What GPT detected vs what fallback detected
  - Why sale wasn't detected
  - Score adjustments made

## Recommendations

### Option 1: Add Grading Audit Table (Recommended)

Create `session_grading_audit` table to track:
- Original GPT analysis
- Fallback detection results
- Score adjustments
- Timestamps
- Reasons for decisions

```sql
CREATE TABLE session_grading_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES live_sessions(id),
  grading_version TEXT,
  gpt_analysis JSONB, -- Original GPT response
  fallback_detection JSONB, -- Fallback detection results
  final_scores JSONB, -- Final scores after enforcement
  score_adjustments JSONB, -- Any adjustments made
  sale_detection_log JSONB, -- Why sale was/wasn't detected
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Option 2: Enhance Current Structure

Add to `analytics` JSONB:
```json
{
  "grading_audit": {
    "gpt_detected_sale": boolean,
    "fallback_detected_sale": boolean,
    "final_sale_closed": boolean,
    "detection_reason": string,
    "score_adjustments": {
      "overall": { "original": number, "adjusted": number, "reason": string },
      "closing": { "original": number, "adjusted": number, "reason": string }
    },
    "graded_at": "timestamp",
    "grading_version": "2.0"
  }
}
```

### Option 3: Restructure with Separate Tables

Create normalized structure:
- `live_sessions` - Core session data
- `session_scores` - All scores
- `session_deals` - Deal/sale information
- `session_analytics` - Detailed analysis
- `session_grading_log` - Audit trail

## Next Steps

1. **Immediate:** Add logging to track sale detection process
2. **Short-term:** Add `grading_audit` to analytics JSONB
3. **Long-term:** Consider separate audit table for better querying
