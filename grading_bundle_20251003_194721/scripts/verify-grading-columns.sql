-- Verification script to check if all grading columns are being populated
-- Run this in your Supabase SQL editor after completing a training session

-- ========================================
-- 1. QUICK CHECK: Most Recent Session
-- ========================================
SELECT 
  id,
  created_at,
  
  -- Basic Scores
  overall_score,
  grade_letter,
  pass,
  outcome,
  sale_closed,
  
  -- Conversation Metrics (should NOT be NULL)
  total_turns,
  conversation_duration_seconds,
  objections_raised,
  objections_resolved,
  close_attempted,
  
  -- New Fields
  closing_technique,
  sales_rep_energy_level,
  homeowner_response_pattern,
  conversation_summary
  
FROM live_sessions 
ORDER BY created_at DESC 
LIMIT 1;

-- ========================================
-- 2. NULL CHECK: Find Missing Data
-- ========================================
-- This shows which columns are still NULL (should be minimal)
SELECT 
  'overall_score' as column_name, 
  COUNT(*) FILTER (WHERE overall_score IS NULL) as null_count,
  COUNT(*) as total_count
FROM live_sessions
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL SELECT 'grade_letter', COUNT(*) FILTER (WHERE grade_letter IS NULL), COUNT(*) FROM live_sessions WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL SELECT 'outcome', COUNT(*) FILTER (WHERE outcome IS NULL), COUNT(*) FROM live_sessions WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL SELECT 'sale_closed', COUNT(*) FILTER (WHERE sale_closed IS NULL), COUNT(*) FROM live_sessions WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL SELECT 'total_turns', COUNT(*) FILTER (WHERE total_turns IS NULL), COUNT(*) FROM live_sessions WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL SELECT 'objections_raised', COUNT(*) FILTER (WHERE objections_raised IS NULL), COUNT(*) FROM live_sessions WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL SELECT 'closing_technique', COUNT(*) FILTER (WHERE closing_technique IS NULL), COUNT(*) FROM live_sessions WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL SELECT 'sales_rep_energy_level', COUNT(*) FILTER (WHERE sales_rep_energy_level IS NULL), COUNT(*) FROM live_sessions WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL SELECT 'homeowner_response_pattern', COUNT(*) FILTER (WHERE homeowner_response_pattern IS NULL), COUNT(*) FROM live_sessions WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL SELECT 'conversation_summary', COUNT(*) FILTER (WHERE conversation_summary IS NULL), COUNT(*) FROM live_sessions WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY null_count DESC;

-- ========================================
-- 3. DETAILED VIEW: Full Session Data
-- ========================================
-- Get complete breakdown of most recent session
SELECT 
  -- Identifiers
  id,
  user_id,
  agent_name,
  created_at,
  
  -- Core Scores
  overall_score,
  grade_letter,
  pass,
  
  -- Score Breakdown
  opening_introduction_score,
  rapport_building_score,
  needs_discovery_score,
  value_communication_score,
  objection_handling_score,
  closing_score,
  safety_score,
  
  -- Deductions
  deductions_interruption_count,
  deductions_pricing_deflections,
  deductions_pressure_tactics,
  deductions_made_up_info,
  deductions_rude_or_dismissive,
  deductions_total,
  
  -- Outcome
  outcome,
  sale_closed,
  
  -- Conversation Metrics
  total_turns,
  conversation_duration_seconds,
  questions_asked_by_homeowner,
  objections_raised,
  objections_resolved,
  close_attempted,
  closing_technique,
  
  -- Homeowner Analysis
  homeowner_response_pattern,
  sales_rep_energy_level,
  time_to_value_seconds,
  
  -- Feedback
  what_worked,
  what_failed,
  key_learnings,
  conversation_summary

FROM live_sessions 
ORDER BY created_at DESC 
LIMIT 1;

-- ========================================
-- 4. STATISTICS: Score Distribution
-- ========================================
-- See how scores are distributed
SELECT 
  grade_letter,
  COUNT(*) as session_count,
  ROUND(AVG(overall_score), 1) as avg_score,
  MIN(overall_score) as min_score,
  MAX(overall_score) as max_score,
  COUNT(*) FILTER (WHERE sale_closed = true) as closed_deals,
  COUNT(*) FILTER (WHERE outcome = 'SUCCESS') as successful_outcomes
FROM live_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
  AND overall_score IS NOT NULL
GROUP BY grade_letter
ORDER BY 
  CASE grade_letter
    WHEN 'A+' THEN 1
    WHEN 'A' THEN 2
    WHEN 'B+' THEN 3
    WHEN 'B' THEN 4
    WHEN 'C+' THEN 5
    WHEN 'C' THEN 6
    WHEN 'D' THEN 7
    WHEN 'F' THEN 8
  END;

-- ========================================
-- 5. OBJECTION HANDLING ANALYSIS
-- ========================================
-- See how well objections are being handled
SELECT 
  objections_raised,
  objections_resolved,
  COUNT(*) as session_count,
  ROUND(AVG(overall_score), 1) as avg_score,
  ROUND(AVG(objection_handling_score), 1) as avg_objection_score
FROM live_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
  AND objections_raised IS NOT NULL
GROUP BY objections_raised, objections_resolved
ORDER BY objections_raised DESC, objections_resolved DESC;

-- ========================================
-- 6. CLOSING TECHNIQUE EFFECTIVENESS
-- ========================================
-- Which closing techniques work best?
SELECT 
  closing_technique,
  COUNT(*) as times_used,
  COUNT(*) FILTER (WHERE sale_closed = true) as successful_closes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE sale_closed = true) / COUNT(*), 1) as success_rate,
  ROUND(AVG(overall_score), 1) as avg_score
FROM live_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
  AND closing_technique IS NOT NULL
GROUP BY closing_technique
ORDER BY success_rate DESC;

-- ========================================
-- 7. ENERGY LEVEL ANALYSIS
-- ========================================
-- Does rep energy impact success?
SELECT 
  sales_rep_energy_level,
  COUNT(*) as session_count,
  COUNT(*) FILTER (WHERE sale_closed = true) as closed_deals,
  ROUND(100.0 * COUNT(*) FILTER (WHERE sale_closed = true) / COUNT(*), 1) as close_rate,
  ROUND(AVG(overall_score), 1) as avg_score
FROM live_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
  AND sales_rep_energy_level IS NOT NULL
GROUP BY sales_rep_energy_level
ORDER BY 
  CASE sales_rep_energy_level
    WHEN 'too aggressive' THEN 1
    WHEN 'high' THEN 2
    WHEN 'moderate' THEN 3
    WHEN 'low' THEN 4
  END;

-- ========================================
-- 8. VALIDATION: Check Feedback Arrays
-- ========================================
-- Ensure feedback arrays are populated
SELECT 
  id,
  created_at,
  overall_score,
  
  -- Check array lengths
  COALESCE(array_length(what_worked, 1), 0) as strengths_count,
  COALESCE(array_length(what_failed, 1), 0) as improvements_count,
  COALESCE(array_length(key_learnings, 1), 0) as learnings_count,
  COALESCE(array_length(homeowner_key_questions, 1), 0) as questions_count,
  
  -- Show first item from each array
  what_worked[1] as top_strength,
  what_failed[1] as top_improvement,
  key_learnings[1] as top_learning

FROM live_sessions 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC 
LIMIT 5;

-- ========================================
-- 9. PERFORMANCE OVER TIME
-- ========================================
-- Track improvement
SELECT 
  DATE(created_at) as date,
  COUNT(*) as sessions,
  ROUND(AVG(overall_score), 1) as avg_score,
  COUNT(*) FILTER (WHERE pass = true) as passing_sessions,
  COUNT(*) FILTER (WHERE sale_closed = true) as closed_deals,
  COUNT(*) FILTER (WHERE grade_letter IN ('A+', 'A')) as a_grades
FROM live_sessions
WHERE created_at > NOW() - INTERVAL '30 days'
  AND overall_score IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ========================================
-- 10. COMPLETENESS CHECK
-- ========================================
-- Verify that recently graded sessions have all expected fields
WITH recent_sessions AS (
  SELECT * FROM live_sessions 
  WHERE created_at > NOW() - INTERVAL '1 day'
  ORDER BY created_at DESC
  LIMIT 10
)
SELECT 
  COUNT(*) as total_sessions,
  
  -- Core fields
  COUNT(overall_score) as has_score,
  COUNT(grade_letter) as has_grade,
  COUNT(outcome) as has_outcome,
  
  -- Metrics
  COUNT(total_turns) as has_turns,
  COUNT(objections_raised) as has_objections,
  COUNT(closing_technique) as has_technique,
  
  -- Feedback
  COUNT(conversation_summary) as has_summary,
  COUNT(CASE WHEN array_length(what_worked, 1) > 0 THEN 1 END) as has_strengths,
  COUNT(CASE WHEN array_length(what_failed, 1) > 0 THEN 1 END) as has_improvements
  
FROM recent_sessions;

-- ========================================
-- Expected Result for Query 10:
-- All counts should equal total_sessions
-- If any count is lower, those fields aren't being populated
-- ========================================

