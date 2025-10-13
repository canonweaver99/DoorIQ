# Timeline Enhancement - October 13, 2025

## Overview
Updated the grading system to have the LLM explicitly identify 6 key conversation moments for enhanced timeline visualization.

## Changes Made

### 1. Grading API Updates (`app/api/grade/session/route.ts`)

#### New Field in Response Schema
Added `timeline_key_moments` as a required field in the grading response:

```typescript
timeline_key_moments: [
  { position: 15, line_number: int, timestamp: "0:00", moment_type: "Initial Resistance", quote: "actual quote", is_positive: bool },
  { position: 30, line_number: int, timestamp: "0:00", moment_type: "Problem Discovery", quote: "actual quote", is_positive: bool },
  { position: 45, line_number: int, timestamp: "0:00", moment_type: "Trust Building", quote: "actual quote", is_positive: bool },
  { position: 60, line_number: int, timestamp: "0:00", moment_type: "First Objection", quote: "actual quote", is_positive: bool },
  { position: 75, line_number: int, timestamp: "0:00", moment_type: "Critical Moment", quote: "actual quote", is_positive: bool },
  { position: 90, line_number: int, timestamp: "0:00", moment_type: "Close Attempt", quote: "actual quote", is_positive: bool }
]
```

#### LLM Instructions
Added detailed instructions for the LLM to identify 6 specific moments:
- **Position 15% (Early):** Initial resistance or opening moment
- **Position 30% (Early-Mid):** Problem discovery - when customer reveals their issue
- **Position 45% (Mid):** Trust building - rapport moment or emotional connection
- **Position 60% (Mid-Late):** First major objection - customer's primary concern
- **Position 75% (Late):** Critical turning point - the make-or-break moment
- **Position 90% (End):** Close attempt - final outcome

Each moment includes:
- `line_number`: Exact line index from transcript
- `timestamp`: Actual timestamp from that line
- `moment_type`: Short descriptive label (e.g., "Trust Broken", "Price Objection")
- `quote`: EXACT text spoken (verbatim from transcript)
- `is_positive`: Whether the moment helped or hurt the sale

#### Storage
Timeline moments are now stored in the `analytics` JSONB column under `timeline_key_moments`.

### 2. Component Updates

#### ScoresViewV2 Component
- Added `timelineKeyMoments` prop
- Updated to prefer LLM-generated moments over extracted moments
- Falls back to old extraction method if LLM moments not available
- Passes `fullTranscript` and `timelineKeyMoments` to SessionTimeline

#### SessionTimeline Component
- Enhanced to use actual conversation quotes from transcript
- Improved dot color-coding based on success/failure
- Better mapping between timeline positions and conversation moments
- Works with both LLM-generated moments and extracted moments

#### Analytics Page
- Now passes `timelineKeyMoments` from session data to ScoresViewV2
- Retrieved from `session.analytics?.timeline_key_moments`

## Benefits

1. **More Accurate Moments:** LLM identifies the most impactful moments rather than algorithmic guessing
2. **Actual Quotes:** Timeline displays verbatim conversation text
3. **Better Context:** LLM understands conversation flow and can identify true turning points
4. **Failure Tracking:** LLM explicitly marks which moment killed the deal
5. **No Migration Needed:** Stored in existing `analytics` JSONB column

## Testing

To test:
1. Grade a new session through `/api/grade/session`
2. LLM will now return `timeline_key_moments` array
3. View session analytics page - timeline dots should appear with actual quotes
4. Hover over dots to see conversation moments
5. For failed sales, the failure dot should pulse and show "DEAL KILLER"

## Grading Version
Updated from `6.0-comprehensive` to `6.1-with-timeline`

## No Migration Required

Since `timeline_key_moments` is stored in the existing `analytics` JSONB column, no database migration is needed. Existing sessions without this data will fall back to the old extraction method.

