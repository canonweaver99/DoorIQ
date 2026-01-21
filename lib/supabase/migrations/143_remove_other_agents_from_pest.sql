-- Remove all agents from pest control industry except the 10 new pest-specific agents

DELETE FROM agent_industries
WHERE industry_id = (SELECT id FROM industries WHERE slug = 'pest')
  AND agent_id NOT IN (
    SELECT id FROM agents 
    WHERE name IN (
      'I Already Have a Pest Guy',
      'I Don''t Have Any Bugs',
      'How Much Is It?',
      'I Need to Talk to My Spouse',
      'I''m Renting/Don''t Own',
      'I Just Spray Myself',
      'Send Me Information',
      'We''re Selling/Moving Soon',
      'I Have Pets/Kids - Worried About Chemicals',
      'Bad Timing - Call Me Back Later'
    )
  );
