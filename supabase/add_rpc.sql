-- Run in Supabase SQL Editor after add_auth.sql

-- RPC to safely increment analyses_used for a user
CREATE OR REPLACE FUNCTION increment_analyses_used(user_id_input uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET analyses_used = analyses_used + 1
  WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
