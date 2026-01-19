/*
  # Create entries management table

  1. New Tables
    - `entries`
      - `id` (uuid, primary key) - Unique identifier for each entry
      - `number` (text) - Entry number/ID
      - `name` (text) - Person's name
      - `address` (text) - Person's address
      - `entry_time` (timestamptz) - When the person entered
      - `exit_time` (timestamptz, nullable) - When the person exited
      - `status` (text) - Current status: 'entered' or 'exited'
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `entries` table
    - Add policy for public read access (for QR scanning)
    - Add policy for public insert/update access (for entry/exit operations)
    
  3. Indexes
    - Add index on number for faster lookups
    - Add index on status for filtering
*/

CREATE TABLE IF NOT EXISTS entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  entry_time timestamptz DEFAULT now(),
  exit_time timestamptz,
  status text DEFAULT 'entered' CHECK (status IN ('entered', 'exited')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON entries FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access"
  ON entries FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON entries FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_entries_number ON entries(number);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);