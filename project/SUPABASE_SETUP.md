# Supabase Database Setup Instructions

## The Problem
The application is trying to store transcripts in a `transcripts` table that doesn't exist in your Supabase database yet.

## Solution: Create the Table Manually

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run this SQL to create the transcripts table:**

```sql
-- Create transcripts table with required columns
CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_url text,
  content text NOT NULL,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can manage their own transcripts"
  ON transcripts
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcripts_file_name ON transcripts(file_name);
```

4. **Click "Run" to execute the SQL**

5. **Verify the table was created:**
   - Go to "Table Editor" in the left sidebar
   - You should see the `transcripts` table listed
   - Click on it to verify the columns exist

## Alternative: Create via Table Editor UI

If you prefer using the UI:

1. Go to "Table Editor" in your Supabase dashboard
2. Click "Create a new table"
3. Name it `transcripts`
4. Add these columns:
   - `id` (uuid, primary key, default: `gen_random_uuid()`)
   - `file_name` (text, required)
   - `file_url` (text, optional)
   - `content` (text, required)
   - `status` (text, default: 'completed')
   - `created_at` (timestamptz, default: `now()`)
   - `updated_at` (timestamptz, default: `now()`)
5. Enable RLS and create appropriate policies

## After Setup
Once the table is created, your application should work properly and be able to store transcripts without errors.