-- ============================================
-- Add 10 Completed Sessions for Each Teammate
-- Generates realistic session data for leaderboards and manager panels
-- ============================================

DO $$
DECLARE
    teammate_record RECORD;
    session_start TIMESTAMPTZ;
    session_end TIMESTAMPTZ;
    session_duration INTEGER;
    i INT;
    j INT;
    overall_score INTEGER;
    rapport_score INTEGER;
    discovery_score INTEGER;
    objection_score INTEGER;
    close_score INTEGER;
    sale_closed BOOLEAN;
    virtual_earnings DECIMAL;
    agent_names TEXT[] := ARRAY['Average Austin', 'Tough Tom', 'Friendly Frank', 'Professional Pat'];
    agent_ids TEXT[] := ARRAY['default-agent-id-1', 'default-agent-id-2', 'default-agent-id-3', 'default-agent-id-4'];
    strengths TEXT[] := ARRAY[
        'Excellent rapport building',
        'Strong discovery questions',
        'Clear value communication',
        'Effective objection handling',
        'Confident closing approach',
        'Active listening demonstrated',
        'Professional tone maintained',
        'Good pacing throughout conversation'
    ];
    improvements TEXT[] := ARRAY[
        'Could ask more probing questions',
        'Should address price concerns earlier',
        'Could use more specific examples',
        'Should confirm understanding more often',
        'Could be more assertive with close',
        'Should handle interruptions better',
        'Could improve transition between topics',
        'Should follow up on concerns more directly'
    ];
    session_count INT := 0;
BEGIN
    -- Loop through all teammates (users with email pattern)
    FOR teammate_record IN 
        SELECT u.id, u.email, u.full_name, u.organization_id
        FROM users u
        WHERE u.email LIKE 'test.teammate%@looplne.design'
          AND u.role = 'rep'
        ORDER BY u.email
    LOOP
        RAISE NOTICE 'Creating sessions for: % (%)', teammate_record.full_name, teammate_record.email;
        
        -- Create 10 sessions for this teammate
        FOR j IN 1..10 LOOP
            -- Calculate session start time (spread over last 30 days, most recent first)
            session_start := NOW() - (j * INTERVAL '2.5 days') - (RANDOM() * INTERVAL '1 day');
            
            -- Session duration: 300-900 seconds (5-15 minutes)
            session_duration := 300 + FLOOR(RANDOM() * 600)::INTEGER;
            session_end := session_start + (session_duration || ' seconds')::INTERVAL;
            
            -- Generate realistic scores (improving over time)
            -- Earlier sessions (higher j) have lower scores, recent sessions have higher scores
            overall_score := 55 + FLOOR((11 - j) * 3.5)::INTEGER + FLOOR(RANDOM() * 10)::INTEGER;
            overall_score := LEAST(overall_score, 95); -- Cap at 95
            
            rapport_score := overall_score - 5 + FLOOR(RANDOM() * 10)::INTEGER;
            rapport_score := GREATEST(50, LEAST(rapport_score, 100));
            
            discovery_score := overall_score - 3 + FLOOR(RANDOM() * 8)::INTEGER;
            discovery_score := GREATEST(50, LEAST(discovery_score, 100));
            
            objection_score := overall_score - 8 + FLOOR(RANDOM() * 12)::INTEGER;
            objection_score := GREATEST(45, LEAST(objection_score, 100));
            
            close_score := overall_score - 10 + FLOOR(RANDOM() * 15)::INTEGER;
            close_score := GREATEST(40, LEAST(close_score, 100));
            
            -- Sale closed probability increases with score
            sale_closed := (overall_score >= 75 AND RANDOM() > 0.3) OR (overall_score >= 85 AND RANDOM() > 0.1);
            
            -- Virtual earnings: $0 if no sale, $500-$2000 if sale closed
            IF sale_closed THEN
                virtual_earnings := 500 + FLOOR(RANDOM() * 1500)::DECIMAL;
            ELSE
                virtual_earnings := 0;
            END IF;
            
            -- Select random agent
            i := 1 + FLOOR(RANDOM() * array_length(agent_names, 1))::INTEGER;
            
            -- Insert session
            INSERT INTO live_sessions (
                user_id,
                agent_name,
                agent_id,
                started_at,
                ended_at,
                duration_seconds,
                overall_score,
                rapport_score,
                discovery_score,
                objection_handling_score,
                close_score,
                sale_closed,
                return_appointment,
                virtual_earnings,
                full_transcript,
                analytics,
                grading_status,
                graded_at,
                created_at
            ) VALUES (
                teammate_record.id,
                agent_names[i],
                agent_ids[i],
                session_start,
                session_end,
                session_duration,
                overall_score,
                rapport_score,
                discovery_score,
                objection_score,
                close_score,
                sale_closed,
                false,
                virtual_earnings,
                -- Generate realistic transcript structure
                jsonb_build_array(
                    jsonb_build_object(
                        'id', '1',
                        'speaker', 'rep',
                        'text', 'Hi, thanks for taking the time to speak with me today.',
                        'timestamp', '00:00'
                    ),
                    jsonb_build_object(
                        'id', '2',
                        'speaker', 'homeowner',
                        'text', 'Sure, what is this about?',
                        'timestamp', '00:05'
                    ),
                    jsonb_build_object(
                        'id', '3',
                        'speaker', 'rep',
                        'text', 'I wanted to discuss how we can help protect your home.',
                        'timestamp', '00:10'
                    )
                ),
                -- Analytics JSONB with feedback
                jsonb_build_object(
                    'feedback', jsonb_build_object(
                        'strengths', (
                            SELECT jsonb_agg(strength)
                            FROM unnest(strengths) AS strength
                            ORDER BY RANDOM()
                            LIMIT 3
                        ),
                        'improvements', (
                            SELECT jsonb_agg(improvement)
                            FROM unnest(improvements) AS improvement
                            ORDER BY RANDOM()
                            LIMIT 2
                        ),
                        'specific_tips', jsonb_build_array(
                            'Try asking open-ended questions to uncover more needs',
                            'Consider addressing price concerns proactively',
                            'Use the assumptive close technique more confidently'
                        )
                    ),
                    'scores', jsonb_build_object(
                        'overall', overall_score,
                        'rapport', rapport_score,
                        'discovery', discovery_score,
                        'objection_handling', objection_score,
                        'closing', close_score
                    ),
                    'grading_version', '2.0',
                    'graded_at', session_end::text
                ),
                'complete',
                session_end,
                session_start
            );
            
            session_count := session_count + 1;
        END LOOP;
        
        RAISE NOTICE '  Created 10 sessions for %', teammate_record.full_name;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Done! Created % total sessions across all teammates.', session_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Sessions spread over last 30 days';
    RAISE NOTICE '  - Scores improve over time (earlier sessions lower, recent higher)';
    RAISE NOTICE '  - Sale closed rate increases with score';
    RAISE NOTICE '  - All sessions marked as completed and graded';
END $$;

-- ============================================
-- Verification: Show session statistics
-- ============================================
SELECT 
    u.full_name,
    u.email,
    COUNT(ls.id) as total_sessions,
    COUNT(CASE WHEN ls.sale_closed = true THEN 1 END) as sales_closed,
    ROUND(AVG(ls.overall_score), 1) as avg_overall_score,
    ROUND(AVG(ls.rapport_score), 1) as avg_rapport_score,
    ROUND(AVG(ls.discovery_score), 1) as avg_discovery_score,
    ROUND(AVG(ls.objection_handling_score), 1) as avg_objection_score,
    ROUND(AVG(ls.close_score), 1) as avg_close_score,
    SUM(ls.virtual_earnings) as total_earnings,
    MIN(ls.started_at) as first_session,
    MAX(ls.started_at) as last_session
FROM users u
LEFT JOIN live_sessions ls ON u.id = ls.user_id
WHERE u.email LIKE 'test.teammate%@looplne.design'
  AND u.role = 'rep'
GROUP BY u.id, u.full_name, u.email
ORDER BY u.email;

-- ============================================
-- Leaderboard Preview: Top performers
-- ============================================
SELECT 
    u.full_name,
    COUNT(ls.id) as sessions,
    ROUND(AVG(ls.overall_score), 1) as avg_score,
    SUM(ls.virtual_earnings) as total_earnings,
    COUNT(CASE WHEN ls.sale_closed = true THEN 1 END) as sales_closed
FROM users u
JOIN live_sessions ls ON u.id = ls.user_id
WHERE u.email LIKE 'test.teammate%@looplne.design'
  AND u.role = 'rep'
GROUP BY u.id, u.full_name
ORDER BY avg_score DESC, total_earnings DESC
LIMIT 10;
