#!/bin/bash

# This script helps set up your local environment

echo "🚀 DoorIQ Environment Setup"
echo "=========================="

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    echo "Do you want to overwrite it? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Copy the example file
cp env.local.example .env.local

echo "✅ Created .env.local from env.local.example"
echo ""
echo "📝 Next steps:"
echo "1. Open .env.local in your editor"
echo "2. Fill in your actual API keys:"
echo "   - OpenAI API key"
echo "   - ElevenLabs API key (already provided)"
echo "   - Supabase credentials (already provided)"
echo ""
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "🔒 Remember: .env.local is gitignored and won't be committed"
