/*
  # Update security policies and user handling
  
  1. Changes
    - Safely update RLS policies
    - Improve user profile creation handling
    
  2. Security
    - Enable RLS on profiles table
    - Update policies for better access control
*/

-- Enable RLS on profiles table if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Remove existing policies safely
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
  DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
  DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;
  DROP POLICY IF EXISTS "Sistema pode criar novos perfis" ON public.profiles;
  DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
END $$;

-- Create comprehensive access policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Usuários podem ver seu próprio perfil'
  ) THEN
    CREATE POLICY "Usuários podem ver seu próprio perfil"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Admins podem ver todos os perfis'
  ) THEN
    CREATE POLICY "Admins podem ver todos os perfis"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 
          FROM public.profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Sistema pode criar novos perfis'
  ) THEN
    CREATE POLICY "Sistema pode criar novos perfis"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Usuários podem atualizar seu próprio perfil'
  ) THEN
    CREATE POLICY "Usuários podem atualizar seu próprio perfil"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating user profile: %', SQLERRM;
    RETURN new;
END;
$$;

-- Update the trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();