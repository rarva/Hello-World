-- Migration: 002_extend_profiles.sql
-- Purpose: Add new columns to profiles table for user information collection
-- Date: 2025-11-19
-- Version: v1.0.1+

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN first_name TEXT;
ALTER TABLE profiles ADD COLUMN last_name TEXT;
ALTER TABLE profiles ADD COLUMN reports_to_email TEXT;
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN company TEXT;
ALTER TABLE profiles ADD COLUMN department TEXT;
ALTER TABLE profiles ADD COLUMN phone TEXT;
ALTER TABLE profiles ADD COLUMN bio TEXT;
ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Create index on updated_at for sorting/filtering
CREATE INDEX idx_profiles_updated_at ON profiles(updated_at);
