#!/bin/bash

# Apply Enhanced Grading Migration Script
# This script applies the new enhanced grading metrics to the database

echo "🚀 Applying Enhanced Grading Migration..."
echo "This will add 5 new grading metrics to your live_sessions table"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with your DIRECT_SUPABASE_URL"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if DIRECT_SUPABASE_URL is set
if [ -z "$DIRECT_SUPABASE_URL" ]; then
    echo "❌ Error: DIRECT_SUPABASE_URL not found in .env"
    echo "Please add: DIRECT_SUPABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres"
    exit 1
fi

echo "📊 Adding enhanced grading metrics..."
echo "  • Speaking Pace (Words Per Minute)"
echo "  • Filler Words Count"
echo "  • Question vs. Statement Ratio"
echo "  • Active Listening Indicators"
echo "  • Assumptive Language Usage"
echo ""

# Apply the migration
psql "$DIRECT_SUPABASE_URL" -f lib/supabase/migrations/028_add_enhanced_grading_metrics.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "What's new:"
    echo "1. Added 5 new scoring columns (speaking_pace_score, filler_words_score, etc.)"
    echo "2. Added corresponding data columns for detailed metrics"
    echo "3. Updated overall score calculation to include all 9 metrics"
    echo "4. Added indexes for performance optimization"
    echo ""
    echo "Next steps:"
    echo "1. Re-grade existing sessions to calculate new metrics:"
    echo "   node scripts/test-grading.js [sessionId]"
    echo ""
    echo "2. The grading system will now automatically calculate:"
    echo "   - Speaking pace (optimal: 140-160 WPM)"
    echo "   - Filler word density"
    echo "   - Question-to-statement ratio (target: 30-40%)"
    echo "   - Active listening indicators"
    echo "   - Assumptive vs tentative language usage"
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check your database connection and try again."
    exit 1
fi
