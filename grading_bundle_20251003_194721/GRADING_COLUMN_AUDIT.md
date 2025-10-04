# 🔍 Grading System Database Column Audit

**Date:** October 2, 2025  
**Purpose:** Verify that all `live_sessions` table columns are being properly populated after a session ends

---

## 📊 Summary Status

| Category | Populated | Missing/Unused | Total |
|----------|-----------|----------------|-------|
| Basic Session Data | 8/8 | 0/8 | 8 |
| Conversation Metrics | 0/15 | 15/15 | 15 |
| Score Breakdown | 4/14 | 10/14 | 14 |
| Deductions | 0/6 | 6/6 | 6 |
| Outcome/Sales | 0/8 | 8/8 | 8 |
| Legacy Scores | 0/4 | 4/4 | 4 |
| JSON Fields | 3/4 | 1/4 | 4 |
| **TOTAL** | **15/59** | **44/59** | **59** |

**Overall: Only 25% of columns are being populated** ❌

---

## ✅ Columns Being Populated (15 total)

### Basic Session Data (8/8)
| Column | Source | Notes |
|--------|--------|-------|
| `id` | Created at session start | ✅ |
| `created_at` | Created at session start | ✅ |
| `started_at` | Created at session start | ✅ |
| `ended_at` | `/api/sessions/end` | ✅ |
| `duration_seconds` | `/api/sessions/end` | ✅ |
| `user_id` | Created at session start | ✅ |
| `agent_id` | Created at session start | ✅ |
| `agent_name` | Created at session start | ✅ |

### Score Fields (4/14)
| Column | Source | Calculation |
|--------|--------|-------------|
| `overall_score` | `/api/grade/session` | `packet.components.final` (0-100) |
| `rapport_score` | `/api/grade/session` | `packet.llm.clarity_empathy.score * 10` |
| `objection_handling_score` | `/api/grade/session` | `packet.llm.objection_handling.overall` |
| `safety_score` | `/api/grade/session` | Heuristic based on safety keywords |

### Legacy Scores (2/4)
| Column | Source | Calculation |
|--------|--------|-------------|
| `introduction_score` | `/api/grade/session` | `packet.objective.stepCoverage.opener ? 85 : 40` |
| `listening_score` | `/api/grade/session` | `packet.objective.questionRate * 100` |

### JSON Fields (3/4)
| Column | Source | Content |
|--------|--------|---------|
| `full_transcript` | `/api/sessions/end` | Raw transcript array |
| `analytics` | `/api/grade/session` | Complete grading packet + feedback |
| `conversation_metadata` | Created at session start | Agent info, persona |

---

## ❌ Columns NOT Being Populated (44 total)

### Conversation Metrics (15 columns) - **ALL MISSING**
These have data available from `packet.objective` but aren't being written:

| Column | Available Data | Where to Get It |
|--------|----------------|-----------------|
| `total_turns` | ✅ | `gTranscript.turns.length` |
| `conversation_duration_seconds` | ✅ | `(turns.at(-1).endMs - turns[0].startMs) / 1000` |
| `questions_asked_by_homeowner` | ✅ | Count homeowner turns with `?` |
| `objections_raised` | ✅ | `packet.objectionSpans.length` |
| `objections_resolved` | ✅ | `packet.objectionCases.filter(c => c.score >= 15).length` |
| `homeowner_response_pattern` | ✅ | Analyze homeowner turn lengths |
| `homeowner_first_words` | ✅ | `turns.find(t => t.speaker === 'homeowner')?.text` |
| `homeowner_final_words` | ✅ | `turns.reverse().find(t => t.speaker === 'homeowner')?.text` |
| `homeowner_key_questions` | ✅ | Filter homeowner questions from transcript |
| `sales_rep_energy_level` | ⚠️ | Could derive from `wpmRep` + exclamation marks |
| `close_attempted` | ✅ | `packet.objective.closeAttempts > 0` |
| `closing_technique` | ✅ | Detect assumptive/trial/direct close |
| `sentiment_progression` | ⚠️ | Would require additional analysis |
| `time_to_value_seconds` | ⚠️ | Detect when value is first mentioned |
| `interruptions_count` | ✅ | `packet.objective.interrupts` |

### Score Breakdown (10 columns) - **ALL MISSING**
These correspond to the new grading system but aren't being written:

| Column | Available Data | Where to Get It |
|--------|----------------|-----------------|
| `opening_introduction_score` | ✅ | `packet.llm.discovery.score` or opener check |
| `opening_introduction_reason` | ✅ | `packet.llm.top_wins[0]` or custom |
| `rapport_building_score` | ✅ | `packet.llm.clarity_empathy.score * 10` |
| `rapport_building_reason` | ✅ | `packet.llm.clarity_empathy.notes` |
| `needs_discovery_score` | ✅ | `packet.llm.discovery.score * 5` |
| `needs_discovery_reason` | ✅ | Evidence from discovery |
| `value_communication_score` | ✅ | `packet.llm.solution_framing.score * 10` |
| `value_communication_reason` | ✅ | `packet.llm.solution_framing.notes` |
| `closing_reason` | ✅ | `packet.llm.pricing_next_step.notes` |
| `filler_words_count` | ✅ | `packet.objective.fillersPer100 * packet.objective._repWords / 100` |

### Deductions (6 columns) - **ALL MISSING**
These can be derived from the grading system:

| Column | Available Data | Where to Get It |
|--------|----------------|-----------------|
| `deductions_interruption_count` | ✅ | `packet.objective.interrupts` |
| `deductions_pricing_deflections` | ⚠️ | Count price mentions without value |
| `deductions_pressure_tactics` | ⚠️ | Detect aggressive language |
| `deductions_made_up_info` | ✅ | `packet.llm.compliance.violations` (type check) |
| `deductions_rude_or_dismissive` | ⚠️ | Sentiment analysis needed |
| `deductions_total` | ✅ | `Math.abs(packet.components.penalties)` |

### Outcome & Sales (8 columns) - **ALL MISSING**
These should be populated if deal closes:

| Column | Available Data | Where to Get It |
|--------|----------------|-----------------|
| `outcome` | ⚠️ | Detect from final turns + keywords |
| `sale_closed` | ⚠️ | Detect "yes", "book", "schedule" in homeowner final |
| `sale_amount` | ❌ | Not tracked - would need agent to mention |
| `service_type` | ⚠️ | Detect from conversation (pest control, recurring, etc.) |
| `service_frequency` | ⚠️ | Detect "monthly", "quarterly", etc. |
| `total_contract_value` | ❌ | Not tracked |
| `commission_amount` | ❌ | Not tracked |
| `revenue_category` | ❌ | Not tracked |

### Grade Fields (2 columns) - **MISSING**
| Column | Available Data | Where to Get It |
|--------|----------------|-----------------|
| `grade_letter` | ✅ | Map `overall_score` to letter grade |
| `pass` | ✅ | `overall_score >= 70` |

### Metadata (4 columns) - **1 missing**
| Column | Status | Notes |
|--------|--------|-------|
| `agent_persona` | ⚠️ | Should be populated at start |
| `conversation_id` | ⚠️ | Should be ElevenLabs conversation ID |
| `conversation_summary` | ❌ | Should be generated from LLM |
| `audio_url` | ✅ | From useSessionRecording hook |

### Feedback Fields (3 columns) - **ALL MISSING (but in analytics JSON)**
| Column | Available Data | Where to Get It |
|--------|----------------|-----------------|
| `what_worked` | ✅ | `packet.llm.top_wins` (currently in analytics JSON) |
| `what_failed` | ✅ | `packet.llm.top_fixes` (currently in analytics JSON) |
| `key_learnings` | ✅ | `packet.llm.drills` (currently in analytics JSON) |

### Legacy Scores (2 columns) - **MISSING**
| Column | Available Data | Notes |
|--------|----------------|-------|
| `close_effectiveness_score` | ✅ | Currently calculated but not using new system |
| `device_info` | ❌ | Not tracked |

---

## 🎯 Recommendations

### High Priority (Impact on User Experience)
1. **Populate outcome & sales fields** - Critical for tracking training success
   - `sale_closed`, `outcome`, `pass`, `grade_letter`
2. **Add conversation metrics** - Users see these in analytics
   - `total_turns`, `objections_raised`, `objections_resolved`, `close_attempted`
3. **Fill score breakdown with reasons** - For detailed feedback
   - All `*_reason` fields from LLM output

### Medium Priority (Data Completeness)
4. **Add homeowner analysis fields** - Better persona insights
   - `homeowner_first_words`, `homeowner_final_words`, `homeowner_key_questions`
5. **Populate deductions** - Transparent scoring
   - `deductions_*` fields from penalties
6. **Add metadata** - Better session context
   - `conversation_id`, `agent_persona`, `conversation_summary`

### Low Priority (Nice to Have)
7. **Energy level & timing** - Advanced analytics
   - `sales_rep_energy_level`, `time_to_value_seconds`
8. **Sales tracking** - If implementing virtual earnings
   - `sale_amount`, `commission_amount`, etc.

---

## 🔧 Where to Fix This

### File: `/app/api/grade/session/route.ts`

**Current issue:** The `updatePayload` object (lines 94-137) only populates 7 columns + analytics JSON.

**Solution:** Expand the `updatePayload` to include all available data from `packet`:

```typescript
const updatePayload: any = {
  // === EXISTING (7 columns) ===
  overall_score: clamp(packet.components.final, 0, 100),
  rapport_score: clamp((packet.llm?.clarity_empathy?.score ?? 0) * 10, 0, 100),
  introduction_score: clamp((packet.objective.stepCoverage.opener ? 85 : 40), 0, 100),
  listening_score: clamp(Math.round(packet.objective.questionRate * 100), 0, 100),
  objection_handling_score: clamp(packet.llm?.objection_handling?.overall ?? 0, 0, 100),
  safety_score: /* ... existing calculation ... */,
  close_effectiveness_score: /* ... existing calculation ... */,

  // === NEW: Conversation Metrics (15 columns) ===
  total_turns: gTranscript.turns.length,
  conversation_duration_seconds: Math.round((gTranscript.turns.at(-1)?.endMs ?? 0) - (gTranscript.turns[0]?.startMs ?? 0)) / 1000,
  questions_asked_by_homeowner: gTranscript.turns.filter(t => t.speaker === 'homeowner' && t.text.includes('?')).length,
  objections_raised: packet.objectionSpans.length,
  objections_resolved: packet.objectionCases.filter(c => c.score >= 15).length,
  homeowner_response_pattern: analyzeResponsePattern(gTranscript),
  homeowner_first_words: gTranscript.turns.find(t => t.speaker === 'homeowner')?.text?.substring(0, 200) ?? null,
  homeowner_final_words: [...gTranscript.turns].reverse().find(t => t.speaker === 'homeowner')?.text?.substring(0, 200) ?? null,
  homeowner_key_questions: gTranscript.turns.filter(t => t.speaker === 'homeowner' && t.text.includes('?')).map(t => t.text),
  sales_rep_energy_level: determineEnergyLevel(packet.objective.wpmRep, gTranscript),
  close_attempted: packet.objective.closeAttempts > 0,
  closing_technique: detectClosingTechnique(gTranscript),
  sentiment_progression: null, // TODO: implement
  time_to_value_seconds: detectTimeToValue(gTranscript),
  interruptions_count: packet.objective.interrupts,
  filler_words_count: Math.round(packet.objective.fillersPer100 * packet.objective._repWords / 100),

  // === NEW: Score Breakdown with Reasons (10 columns) ===
  opening_introduction_score: clamp((packet.llm?.discovery?.score ?? 0) * 5, 0, 100),
  opening_introduction_reason: packet.objective.stepCoverage.opener ? 'Strong opening detected' : 'Weak or missing opening',
  rapport_building_score: clamp((packet.llm?.clarity_empathy?.score ?? 0) * 10, 0, 100),
  rapport_building_reason: packet.llm?.clarity_empathy?.notes ?? 'N/A',
  needs_discovery_score: clamp((packet.llm?.discovery?.score ?? 0) * 5, 0, 100),
  needs_discovery_reason: `Discovery: ${packet.objective.stepCoverage.discovery ? 'Yes' : 'No'}; Question rate: ${(packet.objective.questionRate * 100).toFixed(0)}%`,
  value_communication_score: clamp((packet.llm?.solution_framing?.score ?? 0) * 10, 0, 100),
  value_communication_reason: packet.llm?.solution_framing?.notes ?? 'N/A',
  closing_reason: packet.llm?.pricing_next_step?.notes ?? 'N/A',

  // === NEW: Deductions (6 columns) ===
  deductions_interruption_count: packet.objective.interrupts,
  deductions_pricing_deflections: countPricingDeflections(gTranscript),
  deductions_pressure_tactics: detectPressureTactics(gTranscript),
  deductions_made_up_info: (packet.llm?.compliance?.violations ?? []).some(v => v.type.includes('misleading')),
  deductions_rude_or_dismissive: detectRudeness(gTranscript),
  deductions_total: Math.abs(packet.components.penalties),

  // === NEW: Outcome & Sales (3 columns) ===
  outcome: detectOutcome(gTranscript, packet),
  sale_closed: detectSaleClosed(gTranscript),
  pass: packet.components.final >= 70,
  grade_letter: scoreToGrade(packet.components.final),

  // === NEW: Feedback Arrays (moved from analytics) ===
  what_worked: packet.llm?.top_wins ?? [],
  what_failed: packet.llm?.top_fixes ?? [],
  key_learnings: (packet.llm?.drills ?? []).map(d => `${d.skill}: ${d.microplay}`),
  conversation_summary: generateSummary(gTranscript, packet),

  // === EXISTING: Analytics JSON (keep for detailed data) ===
  analytics: {
    ...(session.analytics || {}),
    aiGrader: 'openai+rule',
    objective: packet.objective,
    objection_cases: packet.objectionCases,
    pest_control_objections: packet.pestControlObjections,
    moment_of_death: packet.momentOfDeath,
    difficulty_analysis: packet.components.difficulty,
    line_ratings: lineRatings,
    graded_at: new Date().toISOString(),
  },
}
```

---

## 📝 Action Items

- [ ] Add helper functions for new fields (analyzeResponsePattern, detectOutcome, etc.)
- [ ] Update `updatePayload` in `/app/api/grade/session/route.ts`
- [ ] Test with a real session to ensure all columns populate correctly
- [ ] Update analytics display components to use direct columns instead of JSON drilling
- [ ] Consider removing redundant data from `analytics` JSON after migration

---

## 🎓 Why This Matters

**Current State:** Most session data is buried in the `analytics` JSON field, making it:
- ❌ Hard to query (can't filter by objections_raised)
- ❌ Slow for aggregations (can't `AVG(overall_score)` properly)  
- ❌ Inconsistent (analytics structure can change)

**After Fix:** Direct columns enable:
- ✅ Fast SQL queries: `SELECT AVG(overall_score) FROM live_sessions WHERE sale_closed = true`
- ✅ Real leaderboards: `ORDER BY overall_score DESC`
- ✅ Analytics dashboards: Filter by outcome, objections, etc.
- ✅ Data integrity: Type-safe columns with constraints


