#!/bin/bash

# Script to apply the streamline migration to live_sessions table
# This removes duplicate/unnecessary columns to improve grading performance

echo "🚀 DoorIQ Live Sessions Streamline Migration"
echo "==========================================="
echo ""
echo "This migration will remove duplicate and unnecessary columns from live_sessions table"
echo "to reduce the JSON payload size sent to OpenAI for grading."
echo ""
echo "Columns to be removed:"
echo "- Duplicate score/reason columns (data preserved in analytics.feedback)"
echo "- Unused conversation metadata"
echo "- Redundant deduction columns"
echo "- Duplicate transcript/sentiment fields"
echo ""
echo "⚠️  IMPORTANT: Make sure you have a database backup before proceeding!"
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Migration cancelled."
    exit 1
fi

echo ""
echo "📋
