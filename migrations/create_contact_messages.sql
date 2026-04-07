-- =====================================================
-- Contact Messages Table Migration
-- Purpose: Store customer contact form submissions
-- Created: April 6, 2026
-- =====================================================

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied', 'archived')),
  ip_address INET,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created ON contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_email ON contact_messages(email);
CREATE INDEX idx_contact_messages_user_id ON contact_messages(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public contact form)
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own messages (if authenticated)
CREATE POLICY "Users can view their own contact messages"
  ON contact_messages
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'account_type' = 'admin'
    )
  );

-- Policy: Admins can view all messages
CREATE POLICY "Admins can view all contact messages"
  ON contact_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'account_type' = 'admin'
    )
  );

-- =====================================================
-- RPC Function: Submit contact message with rate limiting
-- =====================================================

CREATE OR REPLACE FUNCTION submit_contact_message(
  p_name TEXT,
  p_email TEXT,
  p_subject TEXT,
  p_message TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_submissions INT;
  v_message_id UUID;
BEGIN
  -- Rate limiting: max 5 submissions per email per hour
  SELECT COUNT(*)
  INTO v_recent_submissions
  FROM contact_messages
  WHERE email = p_email
  AND created_at > NOW() - INTERVAL '1 hour';

  IF v_recent_submissions >= 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rate limit exceeded. Please wait before submitting another message.'
    );
  END IF;

  -- Validate message length
  IF LENGTH(p_message) < 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Message must be at least 10 characters long.'
    );
  END IF;

  IF LENGTH(p_message) > 5000 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Message must be less than 5000 characters.'
    );
  END IF;

  -- Insert the message
  INSERT INTO contact_messages (name, email, subject, message, user_id)
  VALUES (p_name, p_email, p_subject, p_message, p_user_id)
  RETURNING id INTO v_message_id;

  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'message', 'Your message has been submitted successfully. We will respond within 24 hours.'
  );
END;
$$;

-- =====================================================
-- Admin: Mark message as replied
-- =====================================================

CREATE OR REPLACE FUNCTION admin_reply_to_message(
  p_message_id UUID,
  p_reply TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'account_type' = 'admin'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin privileges required');
  END IF;

  UPDATE contact_messages
  SET 
    status = 'replied',
    admin_reply = p_reply,
    admin_notes = COALESCE(p_notes, admin_notes),
    replied_at = NOW(),
    replied_by = auth.uid()
  WHERE id = p_message_id;

  RETURN jsonb_build_object('success', true, 'message', 'Reply sent successfully');
END;
$$;

-- =====================================================
-- Grants
-- =====================================================

-- Allow authenticated users to use RPC functions
GRANT EXECUTE ON FUNCTION submit_contact_message TO authenticated, anon;
GRANT EXECUTE ON FUNCTION admin_reply_to_message TO authenticated;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE contact_messages IS 'Customer contact form submissions';
COMMENT ON COLUMN contact_messages.status IS 'pending, read, replied, archived';
COMMENT ON COLUMN contact_messages.ip_address IS 'Client IP for spam detection';
COMMENT ON COLUMN contact_messages.admin_reply IS 'Admin response to customer';
