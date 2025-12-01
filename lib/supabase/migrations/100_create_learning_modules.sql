-- Create Learning Module System tables
-- This migration creates tables for learning modules, objections, and user progress tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Learning Modules table
CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('approach', 'pitch', 'overcome', 'close', 'objections')),
  display_order INTEGER NOT NULL,
  estimated_minutes INTEGER DEFAULT 5,
  content TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Learning Objections table
CREATE TABLE IF NOT EXISTS learning_objections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  scripts JSONB DEFAULT '[]'::JSONB,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User Module Progress table
CREATE TABLE IF NOT EXISTS user_module_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, module_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_learning_modules_category ON learning_modules(category);
CREATE INDEX IF NOT EXISTS idx_learning_modules_published ON learning_modules(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_learning_modules_slug ON learning_modules(slug);
CREATE INDEX IF NOT EXISTS idx_user_module_progress_user_id ON user_module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_progress_module_id ON user_module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_learning_objections_slug ON learning_objections(slug);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_learning_modules_updated_at ON learning_modules;
CREATE TRIGGER update_learning_modules_updated_at
  BEFORE UPDATE ON learning_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_objections_updated_at ON learning_objections;
CREATE TRIGGER update_learning_objections_updated_at
  BEFORE UPDATE ON learning_objections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_module_progress_updated_at ON user_module_progress;
CREATE TRIGGER update_user_module_progress_updated_at
  BEFORE UPDATE ON user_module_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_modules
-- Anyone can read published modules
CREATE POLICY "Anyone can read published modules"
  ON learning_modules FOR SELECT
  USING (is_published = true);

-- Authenticated users can read their own progress
CREATE POLICY "Users can read their own module progress"
  ON user_module_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own module progress"
  ON user_module_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own module progress"
  ON user_module_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all modules
CREATE POLICY "Admins can manage all modules"
  ON learning_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can manage all objections
CREATE POLICY "Admins can manage all objections"
  ON learning_objections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Anyone can read published objections
CREATE POLICY "Anyone can read published objections"
  ON learning_objections FOR SELECT
  USING (true);

