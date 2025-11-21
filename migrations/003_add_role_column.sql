-- Migration 003: Add role column to profiles table (v1.0.2)
-- Adds company/job role field for profile display in user menu
ALTER TABLE profiles ADD COLUMN role TEXT;
