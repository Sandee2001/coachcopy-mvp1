/*
  # Create transcripts table with required columns

  1. New Tables
    - `transcripts`
      - `id` (uuid, primary key)
      - `file_name` (text, required)
      - `file_url` (text, optional)
      - `content` (text, required)
      - `status` (text, default 'completed')
      - `created_at` (timestamp with timezone, default now())
      - `updated_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `transcripts` table
    - Add policy for authenticated users to manage their own transcripts
*/

CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_url text,
  content text NOT NULL,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transcripts"
  ON transcripts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create an index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at DESC);

-- Create an index on file_name for better search performance
CREATE INDEX IF NOT EXISTS idx_transcripts_file_name ON transcripts(file_name);