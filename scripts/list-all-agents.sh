#!/bin/bash

# Extract all unique agent names from migrations
echo "Extracting agent names from migrations..."

# Extract from INSERT statements
grep -h "INSERT INTO agents" lib/supabase/migrations/*.sql | \
  grep -o "'[^']*'" | \
  grep -v "placeholder" | \
  grep -v "agent_" | \
  sort -u > /tmp/agent_names_insert.txt

# Extract from WHERE name = statements  
grep -h "WHERE name = '" lib/supabase/migrations/*.sql | \
  sed "s/.*WHERE name = '\([^']*\)'.*/\1/" | \
  sort -u > /tmp/agent_names_where.txt

# Extract from VALUES statements
grep -h "VALUES (" lib/supabase/migrations/*.sql | \
  grep -A 5 "INSERT INTO agents" | \
  grep -o "'[^']*'" | \
  head -100 | \
  sort -u > /tmp/agent_names_values.txt

# Combine and get unique count
cat /tmp/agent_names_insert.txt /tmp/agent_names_where.txt /tmp/agent_names_values.txt | \
  sort -u | \
  grep -v "^'" | \
  grep -v "^$" > /tmp/all_agent_names.txt

echo ""
echo "Total unique agent names found:"
wc -l < /tmp/all_agent_names.txt

echo ""
echo "Agent names:"
cat /tmp/all_agent_names.txt
