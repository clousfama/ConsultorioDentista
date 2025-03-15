/*
  # Fix Authentication Users Migration

  1. Changes
    - Safely remove existing test users and their related data
    - Create new test users with proper credentials
    - Ensure profiles are properly linked

  2. Security
    - Maintains existing RLS policies
    - Uses secure password hashing
*/

-- Clean up existing test users safely
DO $$
BEGIN
  -- Remove records from dependent tables first
  DELETE FROM public.notifications
  WHERE user_id IN (
    SELECT id FROM public.profiles
    WHERE email IN ('admin@dentclinic.com', 'user@dentclinic.com')
  );

  DELETE FROM public.appointments
  WHERE patient_id IN (
    SELECT id FROM public.profiles
    WHERE email IN ('admin@dentclinic.com', 'user@dentclinic.com')
  );

  DELETE FROM public.financial_records
  WHERE created_by IN (
    SELECT id FROM public.profiles
    WHERE email IN ('admin@dentclinic.com', 'user@dentclinic.com')
  );

  -- Remove profiles
  DELETE FROM public.profiles
  WHERE email IN ('admin@dentclinic.com', 'user@dentclinic.com');

  -- Finally remove users
  DELETE FROM auth.users 
  WHERE email IN ('admin@dentclinic.com', 'user@dentclinic.com');
END $$;

-- Create test users with proper credentials
DO $$
DECLARE
  v_admin_id uuid := gen_random_uuid();
  v_user_id uuid := gen_random_uuid();
BEGIN
  -- Create admin user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    aud,
    role,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@dentclinic.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Create admin profile
  INSERT INTO public.profiles (id, email, role)
  VALUES (v_admin_id, 'admin@dentclinic.com', 'admin');

  -- Create regular user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    aud,
    role,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'user@dentclinic.com',
    crypt('user123', gen_salt('bf')),
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Create user profile
  INSERT INTO public.profiles (id, email, role)
  VALUES (v_user_id, 'user@dentclinic.com', 'user');

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error creating users: %', SQLERRM;
  RAISE;
END $$;