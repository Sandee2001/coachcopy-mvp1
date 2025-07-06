/*
  # Update transcripts table RLS policy for public access

  1. Security Changes
    - Drop existing policy that restricts to authenticated users only
    - Create new policy that allows public access to transcripts table
    - This enables the application to work without requiring user authentication

  2. Notes
    - This change allows anonymous users to create and manage transcripts
    - If you later add authentication, you may want to restrict this policy
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can manage their own transcripts" ON transcripts;

-- Create new policy allowing public access
CREATE POLICY "Public users can manage transcripts"
  ON transcripts
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);