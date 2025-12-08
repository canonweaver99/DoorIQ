# GPT-4o Response Fields - Complete List

After every session, GPT-4o analyzes the transcript and returns the following JSON structure:

## Top-Level Fields

### 1. **sale_closed** (boolean)
- Whether the sale closed successfully
- `true` if customer committed to service
- `false` if no sale was made

### 2. **total_contract_value** (number)
- Total value of the sale in dollars
- Extracted from conversation (e.g., "$99/month" = $1188/year)
- Defaults to $1000 if no price mentioned

### 3. **overall_score** (number)
- Overall conversation quality score (0-100)
- Based on: rapport, discovery, objection handling, closing technique, conversation flow
- 90-100: Excellent (sale closed, great technique)
- 80-89: Very good (sale closed or strong progress)
- 70-79: Good (decent conversation)
- 60-69: Average (missed opportunities)
- 50-59: Below average (struggled)
- 0-49: Poor (major issues)

### 4. **overallAssessment** (string)
- One sentence summary comparing this session to user's average performance
- Example: "Strong performance with excellent objection handling, scoring 8 points above your average"

### 5. **topStrengths** (array of strings)
- Top 2-3 strengths observed in the conversation
- Example: `["Excellent rapport building", "Handled price objection effectively"]`

### 6. **topImprovements** (array of strings)
- Top 2-3 areas for improvement
- Example: `["Ask more discovery questions", "Use assumptive language earlier"]`

### 7. **finalScores** (object)
Detailed scores for each category (0-100):

- **overall** (number): Overall score (same as `overall_score` above)
- **rapport** (number): Connection and trust building quality
- **discovery** (number): Quality of questions asked and listening
- **objectionHandling** (number): How well objections were addressed (85+ if handled effectively)
- **closing** (number): 
  - 90-100: Sale closed
  - 75-89: Appointment scheduled
  - 60-74: Trial close
  - 40-59: Weak close attempt
  - 0-39: No close attempt

### 8. **return_appointment** (boolean)
- Whether a return appointment was scheduled
- Usually `false` if `sale_closed=true`

### 9. **virtual_earnings** (number)
- Total virtual earnings for this session
- Same as `total_contract_value` (full deal value, not commission)
- $0 if sale didn't close

### 10. **earnings_data** (object)
Detailed earnings breakdown:

- **base_amount** (number): Base price from conversation
- **closed_amount** (number): Same as `total_contract_value`
- **total_earned** (number): Same as `total_contract_value` (full deal value)

### 11. **deal_details** (object)
Details about the deal (if sale closed):

- **product_sold** (string): What product/service was sold
- **service_type** (string): Type of service (e.g., "pest control", "solar")
- **base_price** (number): Base price found in conversation
- **monthly_value** (number): Monthly value if applicable
- **contract_length** (number): Contract length in months
- **total_contract_value** (number): Total value (same as top-level field)
- **payment_method** (string): Payment method if mentioned (e.g., "credit card", "check")
- **add_ons** (array): Any add-ons or upgrades mentioned
- **start_date** (string): Start date if mentioned

### 12. **coachingPlan** (object)
Personalized coaching recommendations:

- **immediateFixes** (array of objects):
  - **issue** (string): Issue to fix
  - **practiceScenario** (string): Scenario to practice
- **rolePlayScenarios** (array of objects):
  - **scenario** (string): Role-play scenario
  - **focus** (string): What to focus on

### 13. **feedback** (object)
Detailed feedback with quotes:

- **strengths** (array of strings): Strengths with specific quotes from conversation
- **improvements** (array of strings): Areas for improvement
- **specific_tips** (array of strings): Actionable tips

### 14. **session_highlight** (string)
- One specific highlight with actual quote from conversation
- Example: "Excellent objection handling when customer said 'too expensive' - you reframed value effectively"

---

## Complete JSON Structure Example

```json
{
  "sale_closed": true,
  "total_contract_value": 1200,
  "overall_score": 87,
  "overallAssessment": "Strong performance with excellent objection handling, scoring 8 points above your average",
  "topStrengths": [
    "Excellent rapport building with personal connection",
    "Handled all 8 objections effectively using feel-felt-found technique"
  ],
  "topImprovements": [
    "Could ask more discovery questions early in conversation",
    "Use assumptive language earlier to reduce objections"
  ],
  "finalScores": {
    "overall": 87,
    "rapport": 92,
    "discovery": 78,
    "objectionHandling": 95,
    "closing": 90
  },
  "return_appointment": false,
  "virtual_earnings": 1200,
  "earnings_data": {
    "base_amount": 1200,
    "closed_amount": 1200,
    "total_earned": 1200
  },
  "deal_details": {
    "product_sold": "Pest Control Service",
    "service_type": "Monthly Treatment",
    "base_price": 99,
    "monthly_value": 99,
    "contract_length": 12,
    "total_contract_value": 1200,
    "payment_method": "Credit Card",
    "add_ons": [],
    "start_date": "Tomorrow at 9am"
  },
  "coachingPlan": {
    "immediateFixes": [
      {
        "issue": "Ask more discovery questions",
        "practiceScenario": "Practice asking 3-4 discovery questions in first 2 minutes"
      }
    ],
    "rolePlayScenarios": [
      {
        "scenario": "Price objection handling",
        "focus": "Value reframing techniques"
      }
    ]
  },
  "feedback": {
    "strengths": [
      "Excellent rapport: 'I noticed your beautiful garden' - great personal connection",
      "Handled price objection: 'I understand how you feel, others have felt the same way' - effective feel-felt-found"
    ],
    "improvements": [
      "Ask more discovery questions early to understand customer needs better"
    ],
    "specific_tips": [
      "Use assumptive language earlier: 'When we start your service...' instead of 'If you're interested...'"
    ]
  },
  "session_highlight": "Successfully closed sale after handling 8 objections - customer said 'Let's do it' and provided contact info"
}
```

---

## How This Data is Used

1. **Stored in Database**: All fields saved to `live_sessions` table
2. **Displayed in Analytics**: Used to show scores, feedback, and earnings
3. **Leaderboard**: `virtual_earnings` contributes to user's total earnings
4. **Coaching**: `coachingPlan` used for personalized recommendations
5. **Dashboard**: `finalScores` and `feedback` shown in performance cards

---

## Notes

- GPT-4o analyzes the **entire transcript** to determine these values
- Sale detection is based on natural language understanding, not just pattern matching
- Earnings are calculated as **full deal value** (not commission percentage)
- All scores are 0-100 scale
