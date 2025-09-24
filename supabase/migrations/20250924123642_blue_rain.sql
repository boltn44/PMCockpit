/*
  # Add Email Logging Table

  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key)
      - `recipient_email` (text)
      - `email_type` (text) - welcome, password_reset, notification
      - `subject` (text)
      - `status` (text) - sent, failed, pending
      - `message_id` (text) - external email service message ID
      - `error_message` (text) - error details if failed
      - `sent_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `email_logs` table
    - Add policy for authenticated users to read email logs
*/

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('welcome', 'password_reset', 'notification')),
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to manage email logs"
  ON email_logs
  FOR ALL
  TO service_role
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS email_logs_recipient_email_idx ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS email_logs_status_idx ON email_logs(status);